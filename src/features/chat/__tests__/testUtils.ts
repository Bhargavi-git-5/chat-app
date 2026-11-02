import { act } from '@testing-library/react';
import { useChatStore } from '../store/chatStore';
import { createMockData } from '../services/mockData';
import { stopSimulation } from '../services/simulator';

export function resetStore(activeId: string | null = null) {
  stopSimulation();
  act(() => {
  useChatStore.setState({
    ...createMockData(),
    typing: {},
    status: 'ready',
    error: null,
    activeId,
    unreadMarkerId: null,
    filter: 'all',
    search: '',
    messageQuery: '',
    replyingTo: null,
    editing: null,
  });
  });
}
