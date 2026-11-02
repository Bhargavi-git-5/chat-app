import type { Message } from '../types';

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function dayDiff(ts: number, now: number): number {
  return Math.round((startOfDay(new Date(now)) - startOfDay(new Date(ts))) / DAY);
}

/** Label used for date separators in the message list. */
export function dateLabel(ts: number, now = Date.now()): string {
  const diff = dayDiff(ts, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const sameYear = new Date(ts).getFullYear() === new Date(now).getFullYear();
  return new Date(ts).toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  });
}

/** Compact timestamp for the conversation list. */
export function formatListTime(ts: number, now = Date.now()): string {
  const diff = dayDiff(ts, now);
  if (diff === 0) return formatTime(ts);
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return new Date(ts).toLocaleDateString([], { weekday: 'short' });
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export interface MessageGroup {
  key: string;
  label: string;
  messages: Message[];
}

/** Groups an ordered message array into consecutive calendar-day buckets. */
export function groupByDate(messages: Message[], now = Date.now()): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const message of messages) {
    const d = new Date(message.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.messages.push(message);
    else groups.push({ key, label: dateLabel(message.createdAt, now), messages: [message] });
  }
  return groups;
}
