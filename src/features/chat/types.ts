export const ME_ID = 'me';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ConversationType = 'direct' | 'group';
export type ConversationFilter = 'all' | 'unread' | 'groups';
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: number;
  status: MessageStatus;
  replyToId?: string;
  reactions: Reaction[];
  attachments?: MessageAttachment[];
  edited?: boolean;
  deleted?: boolean;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  /** Display name for groups. Direct chats derive the title from the other member. */
  name: string;
  memberIds: string[];
  unreadCount: number;
}

export interface ChatSnapshot {
  users: Record<string, User>;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
}

export interface ConversationListItem {
  conversation: Conversation;
  title: string;
  isGroup: boolean;
  online: boolean;
  avatar?: string;
  lastMessage?: Message;
  preview: string;
  typingText?: string;
}
