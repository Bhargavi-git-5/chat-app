'use client';
import { useCallback, useMemo, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { ME_ID, type Message } from '../types';
import { useChatStore } from '../store/chatStore';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { EmptyState, NoResults } from './States';
import { VirtualMessageList } from './VirtualMessageList';
import { TypingIndicator } from './TypingIndicator';

const NO_MESSAGES: Message[] = [];
const NO_IDS: string[] = [];

export function MessageList() {
  const activeId = useChatStore((s) => s.activeId);
  const all = useChatStore((s) => (s.activeId ? s.messages[s.activeId] ?? NO_MESSAGES : NO_MESSAGES));
  const typingIds = useChatStore((s) => (s.activeId ? s.typing[s.activeId] ?? NO_IDS : NO_IDS));
  const users = useChatStore((s) => s.users);
  const isGroup = useChatStore((s) => s.conversations.find((c) => c.id === s.activeId)?.type === 'group');
  const query = useChatStore((s) => s.messageQuery);
  const unreadMarkerId = useChatStore((s) => s.unreadMarkerId);
  const loadOlder = useChatStore((s) => s.loadOlder);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((m) => !m.deleted && m.text.toLowerCase().includes(q)) : all;
  }, [all, query]);


  const last = all[all.length - 1];
  const { ref, atBottom, onScroll, scrollToBottom } = useAutoScroll<HTMLDivElement>({
    resetKey: activeId,
    contentVersion: all.length * 10 + typingIds.length,
    forceScroll: last?.senderId === ME_ID,
  });

  const setScrollRef = useCallback((node: HTMLDivElement | null) => { ref.current = node; setScrollElement(node); }, [ref]);

  const typingNames = typingIds.map((id) => users[id]?.name.split(' ')[0]).filter(Boolean) as string[];
  const nameOf = (id: string) => (id === ME_ID ? 'You' : users[id]?.name ?? 'Unknown');

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={setScrollRef}
        onScroll={(event) => { onScroll(); if (event.currentTarget.scrollTop < 48 && !loadingOlder && all.length > 0) { setLoadingOlder(true); void loadOlder(activeId!).finally(() => setLoadingOlder(false)); } }}
        role="log"
        aria-live="polite"
        aria-label="Messages"
        className="h-full overflow-y-auto px-3 py-2 sm:px-6"
      >
        {loadingOlder && <div className="py-2 text-center text-xs text-slate-500">Loading older messages…</div>}
        {all.length === 0 ? (
          <EmptyState title="No messages yet" hint="Say hello to start the conversation." />
        ) : visible.length === 0 ? (
          <NoResults hint={`Nothing in this chat matches “${query}”.`} />
        ) : (
          <VirtualMessageList
            messages={visible}
            allMessages={all}
            isGroup={isGroup}
            unreadMarkerId={unreadMarkerId}
            query={query}
            nameOf={nameOf}
            scrollElement={scrollElement}
          />
        )}
        <TypingIndicator names={typingNames} />
      </div>

      {!atBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          aria-label="Jump to latest message"
          className="absolute bottom-3 right-4 rounded-full bg-white p-2 shadow-lg ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
