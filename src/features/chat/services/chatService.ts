import type { ChatSnapshot, Message, MessageStatus } from '../types';
import { createMockData } from './mockData';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const STORAGE_KEY = 'chat-app-snapshot-v1';

function persist(snapshot: ChatSnapshot) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* quota/private mode: app remains usable */ }
}

export function saveSnapshot(snapshot: ChatSnapshot) {
  if (typeof window !== 'undefined') persist(snapshot);
}

/**
 * Mock API layer. Swap the bodies with real fetch/WebSocket calls later;
 * the store and UI only depend on this interface.
 *
 * Tip: open the app with `?error=1` to see the error state.
 */
export const chatService = {
  async loadInitialData(): Promise<ChatSnapshot> {
    await wait(700);
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('error') === '1') {
      throw new Error('We could not load your conversations. Check your connection and try again.');
    }
    let snapshot: ChatSnapshot | null = null;
    const stressCount = typeof window !== 'undefined'
      ? Math.min(50_000, Math.max(0, Number(new URLSearchParams(window.location.search).get('stress')) || 0))
      : 0;
    if (!stressCount) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ChatSnapshot;
          if (parsed && parsed.users && Array.isArray(parsed.conversations) && parsed.messages) snapshot = parsed;
        }
      } catch { /* ignore corrupt or unavailable persisted state */ }
    }
    snapshot ??= createMockData();
    // Stress route for verifying the virtualizer with 10k+ rows: open /?stress=10000.
    if (stressCount > 0) {
      const seed = snapshot.messages.c3 ?? [];
      const base = seed[0]?.createdAt ?? Date.now() - stressCount * 1000;
      snapshot.messages.c3 = Array.from({ length: stressCount }, (_, index) => ({
        id: `stress-${index}`, conversationId: 'c3', senderId: ['u1', 'u2', 'u3', 'u4', 'me'][index % 5],
        text: `Virtualization performance test message #${index + 1}. This row is generated locally.`,
        createdAt: base + index * 1000, status: 'read' as const, reactions: [],
      }));
    }
    return snapshot;
  },

  /**
   * Simulates delivery of an outgoing message: sending -> sent -> delivered -> read.
   * Returns a cancel function.
   */
  sendMessage(_message: Message, onStatus: (status: MessageStatus) => void): () => void {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return () => undefined;
    const steps: Array<[MessageStatus, number]> = [
      ['sent', 500],
      ['delivered', 1300],
      ['read', 3000],
    ];
    const timers = steps.map(([status, ms]) => setTimeout(() => onStatus(status), ms));
    return () => timers.forEach(clearTimeout);
  },
};

/** Generate a page of older mock messages for the infinite-scroll demo. */
export async function loadOlderMessages(conversationId: string, before: number, count = 30): Promise<Message[]> {
  await wait(350);
  const phrases = ['Earlier update: work is progressing.', 'Sharing the notes from the previous sync.', 'I will take a look at this.', 'Thanks for the context!', 'Let us follow up tomorrow.'];
  return Array.from({ length: count }, (_, index) => ({
    id: `older-${conversationId}-${before}-${index}`, conversationId, senderId: ['u1', 'u2', 'u3'][index % 3],
    text: phrases[index % phrases.length], createdAt: before - (count - index) * 60_000, status: 'read' as const, reactions: [],
  }));
}
