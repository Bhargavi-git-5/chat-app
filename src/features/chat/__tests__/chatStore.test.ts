import { act } from '@testing-library/react';
import { useChatStore } from '../store/chatStore';
import { ME_ID } from '../types';
import { resetStore } from './testUtils';

const state = () => useChatStore.getState();

describe('chat store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore('c1');
  });
  afterEach(() => {
    resetStore();
    vi.useRealTimers();
  });

  it('clears unread count and records a "new messages" marker when selecting', () => {
    act(() => state().selectConversation('c3'));
    expect(state().conversations.find((c) => c.id === 'c3')?.unreadCount).toBe(0);
    expect(state().unreadMarkerId).not.toBeNull();
  });

  it('sends optimistically and advances delivery status', () => {
    act(() => state().sendMessage('  hello  '));
    const sent = state().messages.c1.at(-1)!;
    expect(sent.text).toBe('hello');
    expect(sent.senderId).toBe(ME_ID);
    expect(sent.status).toBe('sending');

    // Look the message up by id: a simulated reply may arrive in between.
    const status = () => state().messages.c1.find((m) => m.id === sent.id)!.status;
    act(() => void vi.advanceTimersByTime(600));
    expect(status()).toBe('sent');
    act(() => void vi.advanceTimersByTime(800));
    expect(status()).toBe('delivered');
    act(() => void vi.advanceTimersByTime(2000));
    expect(status()).toBe('read');
  });

  it('ignores empty messages', () => {
    const before = state().messages.c1.length;
    act(() => state().sendMessage('   '));
    expect(state().messages.c1).toHaveLength(before);
  });

  it('links replies to the original message', () => {
    const target = state().messages.c1[1];
    act(() => {
      state().setReplyingTo(target);
      state().sendMessage('replying');
    });
    expect(state().messages.c1.at(-1)!.replyToId).toBe(target.id);
    expect(state().replyingTo).toBeNull();
  });

  it('simulates a typing indicator followed by an incoming reply', () => {
    const before = state().messages.c1.length;
    act(() => state().sendMessage('ping'));
    act(() => void vi.advanceTimersByTime(1000));
    expect(state().typing.c1).toHaveLength(1);
    act(() => void vi.advanceTimersByTime(4000));
    expect(state().typing.c1 ?? []).toHaveLength(0);
    expect(state().messages.c1.length).toBe(before + 2);
  });

  it('edits and deletes messages', () => {
    const mine = state().messages.c1.find((m) => m.senderId === ME_ID)!;
    act(() => state().editMessage('c1', mine.id, 'edited text'));
    expect(state().messages.c1.find((m) => m.id === mine.id)).toMatchObject({ text: 'edited text', edited: true });
    act(() => state().deleteMessage('c1', mine.id));
    expect(state().messages.c1.find((m) => m.id === mine.id)).toMatchObject({ deleted: true, text: '' });
  });

  it('toggles reactions on and off', () => {
    const id = state().messages.c1[0].id;
    act(() => state().toggleReaction('c1', id, '🎉'));
    expect(state().messages.c1[0].reactions).toEqual([{ emoji: '🎉', userIds: [ME_ID] }]);
    act(() => state().toggleReaction('c1', id, '🎉'));
    expect(state().messages.c1[0].reactions).toEqual([]);
  });

  it('increments unread for messages arriving in other conversations', () => {
    const before = state().conversations.find((c) => c.id === 'c2')!.unreadCount;
    act(() =>
      state().receiveMessage({
        id: 'x', conversationId: 'c2', senderId: 'u2', text: 'hi', createdAt: Date.now(), status: 'delivered', reactions: [],
      }),
    );
    expect(state().conversations.find((c) => c.id === 'c2')!.unreadCount).toBe(before + 1);
  });

  it('adds and removes group members but never removes yourself', () => {
    act(() => state().addMember('c3', 'u7'));
    expect(state().conversations.find((c) => c.id === 'c3')!.memberIds).toContain('u7');
    act(() => state().removeMember('c3', 'u7'));
    act(() => state().removeMember('c3', ME_ID));
    const members = state().conversations.find((c) => c.id === 'c3')!.memberIds;
    expect(members).not.toContain('u7');
    expect(members).toContain(ME_ID);
  });
});
