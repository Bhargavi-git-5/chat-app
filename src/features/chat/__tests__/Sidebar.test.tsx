import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../components/Sidebar';
import { useChatStore } from '../store/chatStore';
import { resetStore } from './testUtils';

describe('<Sidebar />', () => {
  beforeEach(() => resetStore());
  afterEach(() => resetStore());

  it('lists conversations with unread badges', () => {
    render(<Sidebar />);
    const list = screen.getByRole('navigation', { name: 'Conversations' });
    expect(within(list).getByText('Frontend Team')).toBeInTheDocument();
    expect(within(list).getByLabelText('3 unread messages')).toBeInTheDocument();
  });

  it('filters by Groups', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole('tab', { name: 'Groups' }));
    const list = screen.getByRole('navigation', { name: 'Conversations' });
    expect(within(list).queryByText('Aisha Khan')).not.toBeInTheDocument();
    expect(within(list).getByText('Weekend Hike')).toBeInTheDocument();
  });

  it('searches conversations (debounced) and shows an empty state', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.type(screen.getByLabelText('Search conversations'), 'zzzz');
    expect(await screen.findByText('No matches')).toBeInTheDocument();
  });

  it('selects a conversation on click', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole('button', { name: /Aisha Khan/ }));
    expect(useChatStore.getState().activeId).toBe('c1');
  });

  it('renders the error state with retry', () => {
    useChatStore.setState({ status: 'error', error: 'Boom' });
    render(<Sidebar />);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
