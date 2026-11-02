import { useMemo } from 'react';
import { useChatStore } from '../store/chatStore';
import { buildConversationList } from '../utils/conversations';
import { useDebounce } from './useDebounce';

/** Filtered, searched (debounced) and sorted list of conversations for the sidebar. */
export function useConversationList() {
  const conversations = useChatStore((s) => s.conversations);
  const messages = useChatStore((s) => s.messages);
  const users = useChatStore((s) => s.users);
  const typing = useChatStore((s) => s.typing);
  const filter = useChatStore((s) => s.filter);
  const search = useChatStore((s) => s.search);
  const debouncedSearch = useDebounce(search, 250);

  return useMemo(
    () => buildConversationList({ conversations, messages, users, typing }, filter, debouncedSearch),
    [conversations, messages, users, typing, filter, debouncedSearch],
  );
}
