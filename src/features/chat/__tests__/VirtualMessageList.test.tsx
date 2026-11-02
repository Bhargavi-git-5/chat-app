import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualMessageList } from '../components/VirtualMessageList';
import type { Message } from '../types';

function makeMessages(count: number): Message[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `virtual-${index}`, conversationId: 'c3', senderId: 'u1',
    text: `Message ${index}`, createdAt: 1_700_000_000_000 + index * 1000,
    status: 'read', reactions: [],
  }));
}

describe('VirtualMessageList', () => {
  it('mounts only a small viewport window for 10,000 messages', () => {
    const messages = makeMessages(10_000);
    const { container } = render(
      <VirtualMessageList
        messages={messages}
        allMessages={messages}
        isGroup={false}
        unreadMarkerId={null}
        query=""
        nameOf={(id) => id}
        scrollElement={null}
      />,
    );
    expect(screen.getByText('Message 0')).toBeTruthy();
    expect(container.querySelectorAll('article').length).toBeLessThan(40);
  });
});
