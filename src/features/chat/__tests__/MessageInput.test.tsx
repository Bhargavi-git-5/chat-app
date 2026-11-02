import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../components/MessageInput';
import { useChatStore } from '../store/chatStore';
import { resetStore } from './testUtils';

describe('<MessageInput />', () => {
  beforeEach(() => resetStore('c2'));
  afterEach(() => resetStore());

  it('disables send until there is text', () => {
    render(<MessageInput />);
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
  });

  it('sends on Enter and clears the field', async () => {
    const user = userEvent.setup();
    render(<MessageInput />);
    const box = screen.getByLabelText('Message');
    await user.type(box, 'Hello there{Enter}');
    expect(useChatStore.getState().messages.c2.at(-1)?.text).toBe('Hello there');
    expect(box).toHaveValue('');
  });

  it('inserts a newline on Shift+Enter instead of sending', async () => {
    const user = userEvent.setup();
    render(<MessageInput />);
    const before = useChatStore.getState().messages.c2.length;
    await user.type(screen.getByLabelText('Message'), 'line1{Shift>}{Enter}{/Shift}line2');
    expect(useChatStore.getState().messages.c2).toHaveLength(before);
    expect(screen.getByLabelText('Message')).toHaveValue('line1\nline2');
  });

  it('shows the reply banner and cancels it with Escape', async () => {
    const user = userEvent.setup();
    render(<MessageInput />);
    act(() => useChatStore.getState().setReplyingTo(useChatStore.getState().messages.c2[0]));
    expect(await screen.findByText(/Replying to Rohan Mehta/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Message'), 'x{Escape}');
    expect(useChatStore.getState().replyingTo).toBeNull();
  });

  it('edits an existing message', async () => {
    const user = userEvent.setup();
    render(<MessageInput />);
    const mine = useChatStore.getState().messages.c2.find((m) => m.senderId === 'me')!;
    act(() => useChatStore.getState().startEdit(mine));
    const box = screen.getByLabelText('Message');
    await user.clear(box);
    await user.type(box, 'updated{Enter}');
    expect(useChatStore.getState().messages.c2.find((m) => m.id === mine.id)).toMatchObject({ text: 'updated', edited: true });
  });
});
