'use client';
import { memo } from 'react';
import type { ConversationListItem } from '../types';
import { formatListTime } from '../utils/date';
import { cn } from '../utils/cn';
import { Avatar } from './Avatar';

interface Props {
  item: ConversationListItem;
  active: boolean;
  onSelect: (id: string) => void;
}

function ConversationItemBase({ item, active, onSelect }: Props) {
  const { conversation, title, isGroup, online, lastMessage, preview, typingText } = item;
  const unread = conversation.unreadCount;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600',
          active ? 'bg-teal-50 dark:bg-teal-950/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60',
        )}
      >
      <Avatar
  name={title}
  avatar={item.avatar}
  online={online}
  group={isGroup}
/>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn('truncate', unread ? 'font-semibold' : 'font-medium')}>{title}</span>
            {lastMessage && (
              <time className={cn('shrink-0 text-xs', unread ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400')}>
                {formatListTime(lastMessage.createdAt)}
              </time>
            )}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p
              className={cn(
                'truncate text-sm',
                typingText ? 'italic text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {typingText ?? preview}
            </p>
            {unread > 0 && (
              <span
                aria-label={`${unread} unread messages`}
                className="min-w-[1.25rem] shrink-0 rounded-full bg-teal-700 px-1.5 py-0.5 text-center text-xs font-semibold text-white"
              >
                {unread}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

export const ConversationItem = memo(ConversationItemBase);
