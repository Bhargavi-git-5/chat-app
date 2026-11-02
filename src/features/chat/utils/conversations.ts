import {
  ME_ID,
  type Conversation,
  type ConversationFilter,
  type ConversationListItem,
  type Message,
  type User,
} from '../types';

export function getOtherUser(conversation: Conversation, users: Record<string, User>): User | undefined {
  const otherId = conversation.memberIds.find((id) => id !== ME_ID);
  return otherId ? users[otherId] : undefined;
}

export function getTitle(conversation: Conversation, users: Record<string, User>): string {
  if (conversation.type === 'group') return conversation.name;
  return getOtherUser(conversation, users)?.name ?? 'Unknown user';
}

export function previewText(message: Message | undefined, users: Record<string, User>, isGroup: boolean): string {
  if (!message) return 'No messages yet';
  if (message.deleted) return 'Message deleted';
  if (message.senderId === ME_ID) return `You: ${message.text}`;
  if (isGroup) return `${users[message.senderId]?.name.split(' ')[0] ?? 'Someone'}: ${message.text}`;
  return message.text;
}

interface BuildInput {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  users: Record<string, User>;
  typing: Record<string, string[]>;
}

/** Pure selector: applies filter + search and sorts by latest activity. */
export function buildConversationList(
  { conversations, messages, users, typing }: BuildInput,
  filter: ConversationFilter,
  query: string,
): ConversationListItem[] {
  const q = query.trim().toLowerCase();

  const items = conversations.map<ConversationListItem>((conversation) => {
    const list = messages[conversation.id] ?? [];
    const lastMessage = list[list.length - 1];
    const isGroup = conversation.type === 'group';
    const typingIds = typing[conversation.id] ?? [];
    const typingNames = typingIds.map((id) => users[id]?.name.split(' ')[0]).filter(Boolean);
  const otherUser = getOtherUser(conversation, users);

return {
  conversation,
  title: getTitle(conversation, users),
  isGroup,
  online: !isGroup && !!otherUser?.online,
  avatar: !isGroup ? otherUser?.avatar : undefined,
      lastMessage,
      preview: previewText(lastMessage, users, isGroup),
      typingText: typingNames.length ? `${typingNames.join(', ')} typing…` : undefined,
    };
  });

  return items
    .filter((item) => {
      if (filter === 'unread' && item.conversation.unreadCount === 0) return false;
      if (filter === 'groups' && !item.isGroup) return false;
      if (!q) return true;
      return item.title.toLowerCase().includes(q) || item.preview.toLowerCase().includes(q);
    })
    .sort((a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0));
}
