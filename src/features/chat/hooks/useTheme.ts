import { useCallback, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import type { Theme } from '../types';

const KEY = 'chat-theme';

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** Syncs the theme store value with <html class="dark"> and localStorage. */
export function useTheme() {
  const theme = useChatStore((s) => s.theme);
  const setTheme = useChatStore((s) => s.setTheme);

  useEffect(() => {
    let initial: Theme = 'light';
    try {
      const saved = localStorage.getItem(KEY);
      initial = saved === 'dark' || saved === 'light' ? saved : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      /* storage unavailable: fall back to light */
    }
    setTheme(initial);
    apply(initial);
  }, [setTheme]);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, [theme, setTheme]);

  return { theme, toggle };
}
