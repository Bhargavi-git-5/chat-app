'use client';
import { useEffect } from 'react';
import { saveSnapshot } from './services/chatService';
import { useChatStore } from './store/chatStore';
import { simulatorApi } from './store/chatStore';
import { startBackgroundTraffic, stopSimulation } from './services/simulator';
import { startChatWebSocket } from './services/websocket';
import { useTheme } from './hooks/useTheme';
import { ChatWindow } from './components/ChatWindow';
import { Sidebar } from './components/Sidebar';
import { cn } from './utils/cn';

export function ChatApp() {
  const init = useChatStore((s) => s.init);
  const status = useChatStore((s) => s.status);
  const activeId = useChatStore((s) => s.activeId);
  useTheme();

  // Persist domain data (not ephemeral UI state) after every store update.
  useEffect(() => {
    if (status !== 'ready') return;
    const persist = () => {
      if (new URLSearchParams(window.location.search).has('stress')) return;
      const state = useChatStore.getState();
      saveSnapshot({ users: state.users, conversations: state.conversations, messages: state.messages });
    };
    const unsubscribe = useChatStore.subscribe(persist);
    return unsubscribe;
  }, [status]);

  // Offline messages remain queued as optimistic `sending` messages; retry their delivery on reconnect.
  useEffect(() => {
    const retry = () => {
      const state = useChatStore.getState();
      Object.entries(state.messages).forEach(([conversationId, messages]) => messages.filter((m) => m.senderId === 'me' && m.status === 'sending').forEach((m) => {
        state.updateStatus(conversationId, m.id, 'sent');
        window.setTimeout(() => state.updateStatus(conversationId, m.id, 'delivered'), 500);
        window.setTimeout(() => state.updateStatus(conversationId, m.id, 'read'), 1500);
      }));
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  useEffect(() => {
    void init();
  }, [init]);

  // Optional local WebSocket transport. If the mock server is not running, the client
  // reconnects with backoff and the in-process simulator remains the offline fallback.
  useEffect(() => {
    if (status !== 'ready') return;
    return startChatWebSocket(simulatorApi, (conversationId, messageId, messageStatus) =>
      useChatStore.getState().updateStatus(conversationId, messageId, messageStatus),
    );
  }, [status]);

  // Start simulated incoming traffic once data is loaded; always clean up timers.
  useEffect(() => {
    if (status !== 'ready') return;
    const stop = startBackgroundTraffic(
      () => useChatStore.getState().conversations,
      () => Object.keys(useChatStore.getState().users),
      simulatorApi,
    );
    return () => {
      stop();
      stopSimulation();
    };
  }, [status]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <aside
        aria-label="Sidebar"
        className={cn(
          'h-full w-full shrink-0 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:w-80 lg:w-96',
          activeId ? 'hidden md:block' : 'block',
        )}
      >
        <Sidebar />
      </aside>
      <main className={cn('h-full min-w-0 flex-1', activeId ? 'block' : 'hidden md:block')}>
        <ChatWindow />
      </main>
    </div>
  );
}
