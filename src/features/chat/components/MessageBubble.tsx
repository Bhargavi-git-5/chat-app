'use client';
import { memo, useState } from 'react';
import { AlertCircle, Check, CheckCheck, Clock, Copy, Pencil, Reply, Smile, Trash2 } from 'lucide-react';
import { ME_ID, type Message, type MessageStatus } from '../types';
import { useChatStore } from '../store/chatStore';
import { formatTime } from '../utils/date';
import { cn } from '../utils/cn';
import { Highlight } from './Highlight';

export const EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '🙏'];

function StatusIcon({ status }: { status: MessageStatus }) {
  const common = 'h-3.5 w-3.5';
  switch (status) {
    case 'sending':
      return <Clock aria-label="Sending" className={common} />;
    case 'sent':
      return <Check aria-label="Sent" className={common} />;
    case 'delivered':
      return <CheckCheck aria-label="Delivered" className={common} />;
    case 'read':
      return <CheckCheck aria-label="Read" className={cn(common, 'text-sky-300')} />;
    case 'failed':
      return <AlertCircle aria-label="Failed to send" className={cn(common, 'text-red-300')} />;
  }
}

interface Props {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  repliedTo?: Message;
  repliedToName?: string;
  query?: string;
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-full p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
    >
      {children}
    </button>
  );
}

function MessageBubbleBase({ message, isOwn, senderName, repliedTo, repliedToName, query }: Props) {
  const toggleReaction = useChatStore((s) => s.toggleReaction);
  const setReplyingTo = useChatStore((s) => s.setReplyingTo);
  const startEdit = useChatStore((s) => s.startEdit);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const [picker, setPicker] = useState(false);
  const [open, setOpen] = useState(false); // tap-to-reveal toolbar for touch devices
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const react = (emoji: string) => {
    toggleReaction(message.conversationId, message.id, emoji);
    setPicker(false);
  };

  const jumpToOriginal = () => {
    if (!repliedTo) return;
    const el = document.getElementById(`msg-${repliedTo.id}`);
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  };

  const toolbar = !message.deleted && (
    <div
      className={cn(
        'relative flex shrink-0 items-center self-center rounded-full bg-white/90 shadow-sm transition-opacity dark:bg-slate-800/90',
        open || picker ? 'opacity-100' : 'opacity-0 focus-within:opacity-100 group-hover:opacity-100',
      )}
    >
      <ToolbarButton label="Add reaction" onClick={() => setPicker((v) => !v)}>
        <Smile className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Reply" onClick={() => setReplyingTo(message)}>
        <Reply className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label={copied ? 'Copied' : 'Copy message'} onClick={copy}>
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </ToolbarButton>
      {isOwn && (
        <>
          <ToolbarButton label="Edit message" onClick={() => startEdit(message)}>
            <Pencil className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Delete message" onClick={() => deleteMessage(message.conversationId, message.id)}>
            <Trash2 className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}
      {picker && (
        <div
          role="menu"
          aria-label="Choose reaction"
          className={cn(
            'absolute bottom-full z-20 mb-1 flex gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800',
            isOwn ? 'right-0' : 'left-0',
          )}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="menuitem"
              onClick={() => react(emoji)}
              className="rounded-full px-1.5 py-0.5 text-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <article id={`msg-${message.id}`} className={cn('group flex gap-1 py-0.5', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn('flex max-w-[82%] flex-col sm:max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        {senderName && !isOwn && (
          <span className="mb-0.5 px-1 text-xs font-medium text-teal-700 dark:text-teal-400">{senderName}</span>
        )}
        <div className={cn('flex items-end gap-1', isOwn && 'flex-row-reverse')}>
          <div
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'rounded-2xl px-3 py-2 text-sm shadow-sm',
              isOwn
                ? 'rounded-br-md bg-teal-700 text-white'
                : 'rounded-bl-md bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100',
              message.deleted && 'italic opacity-70',
            )}
          >
            {repliedTo && !message.deleted && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  jumpToOriginal();
                }}
                className={cn(
                  'mb-1.5 block w-full rounded-lg border-l-4 px-2 py-1 text-left text-xs',
                  isOwn ? 'border-teal-300 bg-teal-800/60' : 'border-teal-600 bg-slate-100 dark:bg-slate-700/60',
                )}
              >
                <span className="block font-semibold">{repliedToName}</span>
                <span className="line-clamp-2 opacity-80">{repliedTo.deleted ? 'Message deleted' : repliedTo.text}</span>
              </button>
            )}
            {(message.text || message.deleted) && <p className="whitespace-pre-wrap break-words">{message.deleted ? 'This message was deleted' : <Highlight text={message.text} query={query} />}</p>}
            {!message.deleted && message.attachments?.map((attachment) => (
              <a key={attachment.id} href={attachment.dataUrl} download={attachment.name} className="mt-2 block max-w-full">
                {attachment.type.startsWith('image/') ? <img src={attachment.dataUrl} alt={attachment.name} className="max-h-56 max-w-full rounded-lg object-contain" /> : <span className="block rounded-lg bg-black/10 px-3 py-2 underline">{attachment.name}</span>}
              </a>
            ))}
            <div className={cn('mt-1 flex items-center justify-end gap-1 text-[11px]', isOwn ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400')}>
              {message.edited && !message.deleted && <span>edited</span>}
              <time>{formatTime(message.createdAt)}</time>
              {isOwn && !message.deleted && <StatusIcon status={message.status} />}
            </div>
          </div>
          {toolbar}
        </div>

        {message.reactions.length > 0 && (
          <div className="-mt-1.5 flex flex-wrap gap-1 px-2">
            {message.reactions.map((r) => {
              const mine = r.userIds.includes(ME_ID);
              return (
                <button
                  key={r.emoji}
                  type="button"
                  aria-pressed={mine}
                  aria-label={`${r.emoji} ${r.userIds.length}`}
                  onClick={() => toggleReaction(message.conversationId, message.id, r.emoji)}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs shadow-sm',
                    mine
                      ? 'border-teal-600 bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-100'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                  )}
                >
                  <span>{r.emoji}</span>
                  <span>{r.userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

export const MessageBubble = memo(MessageBubbleBase);
