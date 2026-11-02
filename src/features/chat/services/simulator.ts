import { ME_ID, type Message } from '../types';
import { uid } from '../utils/cn';

/** The only surface the simulator needs from the app. Keeps it decoupled from the store. */
export interface SimulatorApi {
  setTyping(conversationId: string, userId: string, isTyping: boolean): void;
  receive(message: Message): void;
  setOnline(userId: string, online: boolean): void;
}

const REPLIES = [
  'Sounds good!',
  'Got it, thanks.',
  'Let me check and get back to you.',
  'Haha, nice 😄',
  'Can we discuss this in the next sync?',
  'Perfect, I will update the ticket.',
  'Agreed 👍',
  'Interesting, tell me more.',
];

const timers = new Set<ReturnType<typeof setTimeout>>();
const intervals = new Set<ReturnType<typeof setInterval>>();

const later = (fn: () => void, ms: number) => {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
};

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

function incoming(conversationId: string, senderId: string): Message {
  return {
    id: uid('msg'),
    conversationId,
    senderId,
    text: pick(REPLIES),
    createdAt: Date.now(),
    status: 'delivered',
    reactions: [],
  };
}

/** Someone starts typing, then replies after a short random delay. */
export function scheduleReply(conversationId: string, responderIds: string[], api: SimulatorApi): void {
  const candidates = responderIds.filter((id) => id !== ME_ID);
  if (!candidates.length) return;
  const responder = pick(candidates);
  const typingFor = 1400 + Math.random() * 1600;
  later(() => api.setTyping(conversationId, responder, true), 900);
  later(() => {
    api.setTyping(conversationId, responder, false);
    api.receive(incoming(conversationId, responder));
  }, 900 + typingFor);
}

/** Random background activity: unsolicited messages and presence changes. */
export function startBackgroundTraffic(
  getTargets: () => Array<{ id: string; memberIds: string[] }>,
  getUserIds: () => string[],
  api: SimulatorApi,
  intervalMs = 20_000,
): () => void {
  const tick = () => {
    const targets = getTargets();
    if (targets.length) {
      const target = pick(targets);
      const sender = pick(target.memberIds.filter((id) => id !== ME_ID));
      if (sender) {
        api.setTyping(target.id, sender, true);
        later(() => {
          api.setTyping(target.id, sender, false);
          api.receive(incoming(target.id, sender));
        }, 1800);
      }
    }
    const ids = getUserIds().filter((id) => id !== ME_ID);
    if (ids.length) api.setOnline(pick(ids), Math.random() > 0.5);
  };
  const interval = setInterval(tick, intervalMs);
  intervals.add(interval);
  return () => {
    clearInterval(interval);
    intervals.delete(interval);
  };
}

export function stopSimulation(): void {
  timers.forEach(clearTimeout);
  timers.clear();
  intervals.forEach(clearInterval);
  intervals.clear();
}
