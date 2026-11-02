import { create } from 'zustand';
import {
  ME_ID,
  type Conversation,
  type ConversationFilter,
  type LoadStatus,
  type Message,
  type MessageStatus,
  type Theme,
  type User,
} from '../types';
import { chatService, loadOlderMessages } from '../services/chatService';
import { scheduleReply, type SimulatorApi } from '../services/simulator';
import { publishOutgoingMessage } from '../services/websocket';
import { uid } from '../utils/cn';

const STATUS_RANK: Record<MessageStatus, number> = { failed: 0, sending: 1, sent: 2, delivered: 3, read: 4 };

export interface ChatState {
  // data
  users: Record<string, User>;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  typing: Record<string, string[]>;
  // ui
  status: LoadStatus;
  error: string | null;
  activeId: string | null;
  unreadMarkerId: string | null;
  filter: ConversationFilter;
  search: string;
  messageQuery: string;
  replyingTo: Message | null;
  editing: Message | null;
  theme: Theme;

  // actions
  init: () => Promise<void>;
  selectConversation: (id: string) => void;
  closeConversation: () => void;
  setFilter: (filter: ConversationFilter) => void;
  setSearch: (value: string) => void;
  setMessageQuery: (value: string) => void;
  sendMessage: (text: string) => void;
  receiveMessage: (message: Message) => void;
  updateStatus: (conversationId: string, messageId: string, status: MessageStatus) => void;
  editMessage: (conversationId: string, messageId: string, text: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  toggleReaction: (conversationId: string, messageId: string, emoji: string) => void;
  setReplyingTo: (message: Message | null) => void;
  startEdit: (message: Message) => void;
  cancelEdit: () => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setOnline: (userId: string, online: boolean) => void;
  addMember: (conversationId: string, userId: string) => void;
  removeMember: (conversationId: string, userId: string) => void;
  setTheme: (theme: Theme) => void;
  loadOlder: (conversationId: string) => Promise<void>;
  sendAttachment: (attachment: import('../types').MessageAttachment) => void;
}

type Set = (fn: (s: ChatState) => Partial<ChatState>) => void;

/** Immutable update of a single message. */
function patchMessage(
  set: Set,
  conversationId: string,
  messageId: string,
  patch: (m: Message) => Message,
) {
  set((s) => {
    const list = s.messages[conversationId];
    if (!list) return {};
    return {
      messages: {
        ...s.messages,
        [conversationId]: list.map((m) => (m.id === messageId ? patch(m) : m)),
      },
    };
  });
}

export const useChatStore = create<ChatState>()((set, get) => ({
  users: {},
  conversations: [],
  messages: {},
  typing: {},
  status: 'idle',
  error: null,
  activeId: null,
  unreadMarkerId: null,
  filter: 'all',
  search: '',
  messageQuery: '',
  replyingTo: null,
  editing: null,
  theme: 'light',

  init: async () => {
    set(() => ({ status: 'loading', error: null }));
    try {
      const data = await chatService.loadInitialData();
      set(() => ({ ...data, status: 'ready' }));
    } catch (e) {
      set(() => ({ status: 'error', error: e instanceof Error ? e.message : 'Something went wrong.' }));
    }
  },

  selectConversation: (id) =>
    set((s) => {
      const conv = s.conversations.find((c) => c.id === id);
      if (!conv) return {};
      const list = s.messages[id] ?? [];
      const unread = conv.unreadCount;
      return {
        activeId: id,
        unreadMarkerId: unread > 0 && list.length >= unread ? list[list.length - unread].id : null,
        conversations: s.conversations.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
        replyingTo: null,
        editing: null,
        messageQuery: '',
      };
    }),

  closeConversation: () => set(() => ({ activeId: null, replyingTo: null, editing: null, unreadMarkerId: null })),

  setFilter: (filter) => set(() => ({ filter })),
  setSearch: (search) => set(() => ({ search })),
  setMessageQuery: (messageQuery) => set(() => ({ messageQuery })),

  // Optimistic send: the message appears immediately as "sending" and the service advances its status.
  sendMessage: (text) => {
    const { activeId, replyingTo, conversations } = get();
    const trimmed = text.trim();
    if (!activeId || !trimmed) return;

    const message: Message = {
      id: uid('msg'),
      conversationId: activeId,
      senderId: ME_ID,
      text: trimmed,
      createdAt: Date.now(),
      status: 'sending',
      reactions: [],
      replyToId: replyingTo?.id,
    };
    set((s) => ({
      messages: { ...s.messages, [activeId]: [...(s.messages[activeId] ?? []), message] },
      replyingTo: null,
    }));

    if (!publishOutgoingMessage(message)) {
      chatService.sendMessage(message, (status) => get().updateStatus(activeId, message.id, status));
    }

    const conversation = conversations.find((c) => c.id === activeId);
    if (conversation) scheduleReply(activeId, conversation.memberIds, simulatorApi);
  },

  receiveMessage: (message) =>
    set((s) => {
      const viewing =
        s.activeId === message.conversationId && !(typeof document !== 'undefined' && document.hidden);
      return {
        messages: {
          ...s.messages,
          [message.conversationId]: [...(s.messages[message.conversationId] ?? []), message],
        },
        conversations: viewing
          ? s.conversations
          : s.conversations.map((c) =>
              c.id === message.conversationId ? { ...c, unreadCount: c.unreadCount + 1 } : c,
            ),
      };
    }),

  updateStatus: (conversationId, messageId, status) =>
    patchMessage(set, conversationId, messageId, (m) =>
      STATUS_RANK[status] > STATUS_RANK[m.status] ? { ...m, status } : m,
    ),

  editMessage: (conversationId, messageId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    patchMessage(set, conversationId, messageId, (m) =>
      m.text === trimmed ? m : { ...m, text: trimmed, edited: true },
    );
    set(() => ({ editing: null }));
  },

  deleteMessage: (conversationId, messageId) => {
    patchMessage(set, conversationId, messageId, (m) => ({ ...m, deleted: true, text: '', reactions: [] }));
    set((s) => ({
      replyingTo: s.replyingTo?.id === messageId ? null : s.replyingTo,
      editing: s.editing?.id === messageId ? null : s.editing,
    }));
  },

  toggleReaction: (conversationId, messageId, emoji) =>
    patchMessage(set, conversationId, messageId, (m) => {
      const existing = m.reactions.find((r) => r.emoji === emoji);
      let reactions;
      if (!existing) reactions = [...m.reactions, { emoji, userIds: [ME_ID] }];
      else if (existing.userIds.includes(ME_ID)) {
        const userIds = existing.userIds.filter((id) => id !== ME_ID);
        reactions = userIds.length
          ? m.reactions.map((r) => (r.emoji === emoji ? { ...r, userIds } : r))
          : m.reactions.filter((r) => r.emoji !== emoji);
      } else {
        reactions = m.reactions.map((r) => (r.emoji === emoji ? { ...r, userIds: [...r.userIds, ME_ID] } : r));
      }
      return { ...m, reactions };
    }),

  setReplyingTo: (message) => set(() => ({ replyingTo: message, editing: null })),
  startEdit: (message) => set(() => ({ editing: message, replyingTo: null })),
  cancelEdit: () => set(() => ({ editing: null })),

  setTyping: (conversationId, userId, isTyping) =>
    set((s) => {
      const current = s.typing[conversationId] ?? [];
      const next = isTyping
        ? current.includes(userId)
          ? current
          : [...current, userId]
        : current.filter((id) => id !== userId);
      return next === current ? {} : { typing: { ...s.typing, [conversationId]: next } };
    }),

  setOnline: (userId, online) =>
    set((s) => (s.users[userId] ? { users: { ...s.users, [userId]: { ...s.users[userId], online } } } : {})),

  addMember: (conversationId, userId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId && c.type === 'group' && !c.memberIds.includes(userId)
          ? { ...c, memberIds: [...c.memberIds, userId] }
          : c,
      ),
    })),

  removeMember: (conversationId, userId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId && c.type === 'group' && userId !== ME_ID
          ? { ...c, memberIds: c.memberIds.filter((id) => id !== userId) }
          : c,
      ),
    })),

  setTheme: (theme) => set(() => ({ theme })),

  loadOlder: async (conversationId) => {
    const current = get().messages[conversationId] ?? [];
    if (!current.length) return;
    const older = await loadOlderMessages(conversationId, current[0].createdAt);
    set((s) => ({ messages: { ...s.messages, [conversationId]: [...older, ...(s.messages[conversationId] ?? [])] } }));
  },

  sendAttachment: (attachment) => {
    const { activeId, replyingTo } = get();
    if (!activeId) return;
    const message: Message = { id: uid('msg'), conversationId: activeId, senderId: ME_ID, text: '', createdAt: Date.now(), status: 'sending', reactions: [], replyToId: replyingTo?.id, attachments: [attachment] };
    set((s) => ({ messages: { ...s.messages, [activeId]: [...(s.messages[activeId] ?? []), message] }, replyingTo: null }));
    if (!publishOutgoingMessage(message)) {
      chatService.sendMessage(message, (status) => get().updateStatus(activeId, message.id, status));
    }
  },
}));

/** Bridge handed to the simulator so it never imports the store directly. */
const simulatorApi: SimulatorApi = {
  setTyping: (c, u, t) => useChatStore.getState().setTyping(c, u, t),
  receive: (m) => useChatStore.getState().receiveMessage(m),
  setOnline: (u, o) => useChatStore.getState().setOnline(u, o),
};

export { simulatorApi };
