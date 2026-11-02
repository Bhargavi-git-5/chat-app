import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Options {
  /** Changes when the user switches conversation: jump to bottom instantly. */
  resetKey: string | null;
  /** Changes whenever new content is appended (messages, typing indicator). */
  contentVersion: number;
  /** Force scrolling when the newest message was sent by the current user. */
  forceScroll: boolean;
}

/**
 * Keeps a scroll container pinned to the latest message, but only when the user
 * is already near the bottom (or just sent a message). Exposes state for a
 * "jump to latest" button.
 */
export function useAutoScroll<T extends HTMLElement>({ resetKey, contentVersion, forceScroll }: Options) {
  const ref = useRef<T>(null);
  const nearBottom = useRef(true);
  const [atBottom, setAtBottom] = useState(true);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    else el.scrollTop = el.scrollHeight;
  }, []);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    nearBottom.current = near;
    setAtBottom(near);
  }, []);

  useLayoutEffect(() => {
    scrollToBottom(false);
    nearBottom.current = true;
    setAtBottom(true);
  }, [resetKey, scrollToBottom]);

  useEffect(() => {
    if (nearBottom.current || forceScroll) scrollToBottom(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentVersion]);

  return { ref, atBottom, onScroll, scrollToBottom };
}
