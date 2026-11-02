import { dateLabel, formatListTime, groupByDate } from '../utils/date';
import type { Message } from '../types';

const NOW = new Date(2025, 5, 15, 12, 0).getTime();
const at = (daysAgo: number, hour = 10) => new Date(2025, 5, 15 - daysAgo, hour).getTime();
const msg = (id: string, createdAt: number): Message => ({
  id, conversationId: 'c', senderId: 'u1', text: id, createdAt, status: 'read', reactions: [],
});

describe('date utils', () => {
  it('labels today and yesterday', () => {
    expect(dateLabel(at(0), NOW)).toBe('Today');
    expect(dateLabel(at(1), NOW)).toBe('Yesterday');
    expect(dateLabel(at(5), NOW)).not.toMatch(/Today|Yesterday/);
  });

  it('uses weekday for recent days in the list and a date for older ones', () => {
    expect(formatListTime(at(1), NOW)).toBe('Yesterday');
    expect(formatListTime(at(30), NOW)).toMatch(/\w/);
  });

  it('groups messages into consecutive day buckets', () => {
    const groups = groupByDate([msg('a', at(2)), msg('b', at(2, 15)), msg('c', at(1)), msg('d', at(0))], NOW);
    expect(groups.map((g) => g.label)).toEqual([dateLabel(at(2), NOW), 'Yesterday', 'Today']);
    expect(groups[0].messages.map((m) => m.id)).toEqual(['a', 'b']);
  });
});
