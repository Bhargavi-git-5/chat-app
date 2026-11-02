'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useConversationList } from '../hooks/useConversationList';
import type { ConversationFilter } from '../types';
import { cn } from '../utils/cn';
import { ConversationItem } from './ConversationItem';
import { ConversationSkeleton, EmptyState, ErrorState, NoResults } from './States';
import { ThemeToggle } from './ThemeToggle';

const FILTERS: Array<{ id: ConversationFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'groups', label: 'Groups' },
];

export function Sidebar() {
  const status = useChatStore((s) => s.status);
  const error = useChatStore((s) => s.error);
  const init = useChatStore((s) => s.init);
  const activeId = useChatStore((s) => s.activeId);
  const filter = useChatStore((s) => s.filter);
  const search = useChatStore((s) => s.search);
  const setFilter = useChatStore((s) => s.setFilter);
  const setSearch = useChatStore((s) => s.setSearch);
  const select = useChatStore((s) => s.selectConversation);
  const conversations = useChatStore((s) => s.conversations);
  const items = useConversationList();
  const searchRef = useRef<HTMLInputElement>(null);

  const unreadTotal = useMemo(() => conversations.filter((c) => c.unreadCount > 0).length, [conversations]);

  // Ctrl/Cmd + K focuses the conversation search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-4 pb-2 pt-4">
        <h1 className="text-xl font-semibold">Chats</h1>
        <ThemeToggle />
      </header>

      <div className="px-4 pb-2">
        <label className="relative block">
          <span className="sr-only">Search conversations</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats (Ctrl+K)"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </div>

      <div role="tablist" aria-label="Filter conversations" className="flex gap-2 px-4 pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            type="button"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600',
              filter === f.id
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            {f.label}
            {f.id === 'unread' && unreadTotal > 0 && <span className="ml-1.5 text-xs opacity-80">{unreadTotal}</span>}
          </button>
        ))}
      </div>

      <nav aria-label="Conversations" className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {status === 'error' ? (
          <ErrorState message={error ?? 'Something went wrong.'} onRetry={init} />
        ) : status !== 'ready' ? (
          <ConversationSkeleton />
        ) : items.length === 0 ? (
          search || filter !== 'all' ? (
            <NoResults hint="Try a different search or switch the filter." />
          ) : (
            <EmptyState title="No conversations yet" hint="New chats will show up here." />
          )
        ) : (
          <ul className="space-y-0.5">
            {items.map((item) => (
              <ConversationItem key={item.conversation.id} item={item} active={item.conversation.id === activeId} onSelect={select} />
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
}
