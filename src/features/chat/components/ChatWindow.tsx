'use client';
import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { ChatHeader } from './ChatHeader';
import { GroupInfoPanel } from './GroupInfoPanel';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { EmptyState } from './States';

export function ChatWindow() {
  const activeId = useChatStore((s) => s.activeId);
  const setMessageQuery = useChatStore((s) => s.setMessageQuery);
  const [infoOpen, setInfoOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Reset panel state when switching conversations.
  useEffect(() => {
    setInfoOpen(false);
    setSearchOpen(false);
  }, [activeId]);

  if (!activeId) {
    return (
      <div className="hidden h-full bg-slate-50 dark:bg-slate-950 md:block">
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="Select a conversation"
          hint="Choose a chat from the list to start messaging."
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
      <ChatHeader
        searchOpen={searchOpen}
        onToggleSearch={() => {
          if (searchOpen) setMessageQuery('');
          setSearchOpen((v) => !v);
        }}
        onOpenInfo={() => setInfoOpen(true)}
      />
      <MessageList />
      <MessageInput key={activeId} />
      {infoOpen && <GroupInfoPanel conversationId={activeId} onClose={() => setInfoOpen(false)} />}
    </div>
  );
}
