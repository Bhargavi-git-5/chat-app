'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Message } from '../types';
import { dateLabel } from '../utils/date';
import { MessageBubble } from './MessageBubble';

const ESTIMATED_MESSAGE_HEIGHT = 88;
const OVERSCAN = 8;

type Row = { message: Message; showDate: boolean };

interface Props {
  messages: Message[];
  allMessages: Message[];
  isGroup: boolean;
  unreadMarkerId: string | null;
  query: string;
  nameOf: (id: string) => string;
  scrollElement: HTMLDivElement | null;
}

/** Variable-height, measured windowing. Only the visible range + overscan is mounted. */
export function VirtualMessageList({ messages, allMessages, isGroup, unreadMarkerId, query, nameOf, scrollElement }: Props) {
  const [viewport, setViewport] = useState({ top: 0, height: 600 });
  const [revision, setRevision] = useState(0);
  const heights = useRef(new Map<string, number>());
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const byId = useMemo(() => new Map(allMessages.map((message) => [message.id, message])), [allMessages]);

  const rows = useMemo<Row[]>(() => {
    let previousDate = '';
    return messages.map((message) => {
      const date = new Date(message.createdAt);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const showDate = dateKey !== previousDate;
      previousDate = dateKey;
      return { message, showDate };
    });
  }, [messages]);

  const offsets = useMemo(() => {
    const values: number[] = [];
    let total = 0;
    rows.forEach((row) => {
      values.push(total);
      total += heights.current.get(row.message.id) ?? ESTIMATED_MESSAGE_HEIGHT;
    });
    return { values, total };
  // revision invalidates offsets when ResizeObserver measures a row.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, revision]);

  useEffect(() => {
    if (!scrollElement) return;
    const update = () => setViewport({ top: scrollElement.scrollTop, height: scrollElement.clientHeight });
    update();
    scrollElement.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(scrollElement);
    return () => { scrollElement.removeEventListener('scroll', update); observer?.disconnect(); };
  }, [scrollElement]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    resizeObserver.current = new ResizeObserver((entries) => {
      let changed = false;
      entries.forEach((entry) => {
        const id = (entry.target as HTMLElement).dataset.messageId;
        if (!id) return;
        const next = Math.ceil(entry.contentRect.height);
        if (next > 0 && heights.current.get(id) !== next) { heights.current.set(id, next); changed = true; }
      });
      if (changed) setRevision((value) => value + 1);
    });
    nodes.current.forEach((node) => resizeObserver.current?.observe(node));
    return () => resizeObserver.current?.disconnect();
  }, []);

  const setRowNode = useCallback((id: string, node: HTMLDivElement | null) => {
    const previous = nodes.current.get(id);
    if (previous) resizeObserver.current?.unobserve(previous);
    if (node) {
      nodes.current.set(id, node);
      resizeObserver.current?.observe(node);
    } else nodes.current.delete(id);
  }, []);

  const findIndex = (position: number) => {
    let low = 0; let high = offsets.values.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (offsets.values[mid] < position) low = mid + 1; else high = mid - 1;
    }
    return Math.max(0, Math.min(rows.length, low - 1));
  };
  const start = rows.length ? Math.max(0, findIndex(viewport.top) - OVERSCAN) : 0;
  const end = Math.min(rows.length, findIndex(viewport.top + viewport.height) + OVERSCAN + 1);

  return (
    <div className="relative w-full" style={{ height: offsets.total }}>
      {rows.slice(start, end).map((row, visibleIndex) => {
        const index = start + visibleIndex;
        const message = row.message;
        const previous = index > 0 ? rows[index - 1].message : undefined;
        const replied = message.replyToId ? byId.get(message.replyToId) : undefined;
        const top = offsets.values[index];
        return (
          <div
            key={message.id}
            ref={(node) => setRowNode(message.id, node)}
            data-message-id={message.id}
            className="absolute left-0 top-0 w-full px-1"
            style={{ transform: `translateY(${top}px)` }}
          >
            {row.showDate && (
              <div className="sticky top-1 z-10 my-3 flex h-4 justify-center">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:bg-slate-800/90 dark:text-slate-300">
                  {dateLabel(message.createdAt)}
                </span>
              </div>
            )}
            {message.id === unreadMarkerId && !query && (
              <div className="my-3 flex items-center gap-3 text-xs font-medium text-teal-700 dark:text-teal-400">
                <span className="h-px flex-1 bg-teal-600/40" />New messages<span className="h-px flex-1 bg-teal-600/40" />
              </div>
            )}
            <MessageBubble
              message={message}
              isOwn={message.senderId === 'me'}
              senderName={isGroup && previous?.senderId !== message.senderId ? nameOf(message.senderId) : undefined}
              repliedTo={replied}
              repliedToName={replied ? nameOf(replied.senderId) : undefined}
              query={query}
            />
          </div>
        );
      })}
    </div>
  );
}
