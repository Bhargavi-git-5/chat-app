import { createMockData } from '../services/mockData';
import { buildConversationList } from '../utils/conversations';

const data = { ...createMockData(), typing: {} as Record<string, string[]> };

describe('buildConversationList', () => {
  it('returns all conversations sorted by latest activity', () => {
    const list = buildConversationList(data, 'all', '');
    expect(list).toHaveLength(data.conversations.length);
    const times = list.map((i) => i.lastMessage?.createdAt ?? 0);
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('filters unread conversations', () => {
    const list = buildConversationList(data, 'unread', '');
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((i) => i.conversation.unreadCount > 0)).toBe(true);
  });

  it('filters groups', () => {
    const list = buildConversationList(data, 'groups', '');
    expect(list.every((i) => i.isGroup)).toBe(true);
  });

  it('searches by title, case-insensitively', () => {
    const list = buildConversationList(data, 'all', 'aISHA');
    expect(list.map((i) => i.title)).toEqual(['Aisha Khan']);
  });

  it('shows who is typing', () => {
    const list = buildConversationList({ ...data, typing: { c1: ['u1'] } }, 'all', 'aisha');
    expect(list[0].typingText).toBe('Aisha typing…');
  });
});
