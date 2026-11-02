'use client';
import { ArrowLeft, Info, Search, X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { getOtherUser, getTitle } from '../utils/conversations';
import { ME_ID } from '../types';
import { Avatar } from './Avatar';

interface Props {
  searchOpen: boolean;
  onToggleSearch: () => void;
  onOpenInfo: () => void;
}

export function ChatHeader({ searchOpen, onToggleSearch, onOpenInfo }: Props) {
  const conversation = useChatStore((s) => s.conversations.find((c) => c.id === s.activeId));
  const users = useChatStore((s) => s.users);
  const typingIds = useChatStore((s) => (s.activeId ? s.typing[s.activeId] : undefined));
  const close = useChatStore((s) => s.closeConversation);
  const query = useChatStore((s) => s.messageQuery);
  const setQuery = useChatStore((s) => s.setMessageQuery);

  if (!conversation) return null;
  const isGroup = conversation.type === 'group';
  const title = getTitle(conversation, users);
  const other = getOtherUser(conversation, users);
  const onlineCount = conversation.memberIds.filter((id) => id !== ME_ID && users[id]?.online).length;

  const subtitle = typingIds?.length
    ? 'typing…'
    : isGroup
      ? `${conversation.memberIds.length} members, ${onlineCount} online`
      : other?.online
        ? 'Online'
        : 'Offline';

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={close}
          aria-label="Back to conversations"
          className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {/* <Avatar name={title} group={isGroup} online={isGroup ? undefined : other?.online} /> */}

        <Avatar
  name={title}
  avatar={other?.avatar}
  group={isGroup}
  online={isGroup ? undefined : other?.online}
/>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{title}</h2>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onToggleSearch}
          aria-label={searchOpen ? 'Close message search' : 'Search messages'}
          aria-pressed={searchOpen}
          className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
        {isGroup && (
          <button type="button" onClick={onOpenInfo} aria-label="Group info" className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Info className="h-5 w-5" />
          </button>
        )}
      </div>
      {searchOpen && (
        <div className="px-3 pb-2.5">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search messages"
            placeholder="Search in this conversation"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      )}
    </header>
  );
}
