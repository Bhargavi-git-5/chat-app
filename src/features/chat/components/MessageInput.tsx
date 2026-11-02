'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Paperclip, Pencil, Reply, SendHorizontal, X } from 'lucide-react';
import { ME_ID } from '../types';
import { useChatStore } from '../store/chatStore';

interface FormValues {
  text: string;
}

/**
 * Composer. Enter sends, Shift+Enter inserts a newline, Esc cancels reply/edit.
 * Rendered with `key={conversationId}` so the draft resets per conversation.
 */
export function MessageInput() {
  const { register, handleSubmit, reset, setValue, watch, setFocus } = useForm<FormValues>({ defaultValues: { text: '' } });
  const activeId = useChatStore((s) => s.activeId);
  const replyingTo = useChatStore((s) => s.replyingTo);
  const editing = useChatStore((s) => s.editing);
  const users = useChatStore((s) => s.users);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const editMessage = useChatStore((s) => s.editMessage);
  const setReplyingTo = useChatStore((s) => s.setReplyingTo);
  const cancelEdit = useChatStore((s) => s.cancelEdit);
  const sendAttachment = useChatStore((s) => s.sendAttachment);
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<{ file: File; url: string } | null>(null);

  const text = watch('text');
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const { ref: formRef, ...field } = register('text');

  useEffect(() => {
    if (editing) {
      setValue('text', editing.text);
      setFocus('text');
    }
  }, [editing, setValue, setFocus]);

  useEffect(() => {
    if (replyingTo) setFocus('text');
  }, [replyingTo, setFocus]);

  // Auto-grow up to 160px.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const onSubmit = ({ text }: FormValues) => {
    if ((!text.trim() && !attachmentPreview) || !activeId) return;
    if (attachmentPreview && !editing) {
      const { file, url } = attachmentPreview;
      sendAttachment({ id: `${Date.now()}-${file.name}`, name: file.name, type: file.type, size: file.size, dataUrl: url });
      setAttachmentPreview(null);
      if (!text.trim()) { reset({ text: '' }); return; }
    }
    if (editing) editMessage(editing.conversationId, editing.id, text);
    else sendMessage(text);
    reset({ text: '' });
  };

  const dismiss = () => {
    if (editing) {
      cancelEdit();
      reset({ text: '' });
    } else setReplyingTo(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void handleSubmit(onSubmit)();
    } else if (e.key === 'Escape' && (editing || replyingTo)) {
      dismiss();
    }
  };

  const banner = editing ? (
    <>
      <Pencil className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Editing message</p>
        <p className="truncate opacity-80">{editing.text}</p>
      </div>
    </>
  ) : replyingTo ? (
    <>
      <Reply className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Replying to {replyingTo.senderId === ME_ID ? 'yourself' : users[replyingTo.senderId]?.name}</p>
        <p className="truncate opacity-80">{replyingTo.text}</p>
      </div>
    </>
  ) : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
    >
      {banner && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-4 border-teal-600 bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800">
          {banner}
          <button type="button" onClick={dismiss} aria-label="Cancel" className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {attachmentPreview && (
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-100 p-2 text-xs dark:bg-slate-800">
          {attachmentPreview.file.type.startsWith('image/') ? <img src={attachmentPreview.url} alt="Attachment preview" className="h-14 w-14 rounded object-cover" /> : <span className="max-w-[65%] truncate">{attachmentPreview.file.name}</span>}
          <span className="text-slate-500">{Math.max(1, Math.round(attachmentPreview.file.size / 1024))} KB</span>
          <button type="button" onClick={() => setAttachmentPreview(null)} aria-label="Remove attachment" className="ml-auto rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"><X className="h-4 w-4" /></button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.txt,.doc,.docx" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { window.alert('Please choose a file smaller than 5 MB.'); e.currentTarget.value = ''; return; } const reader = new FileReader(); reader.onload = () => setAttachmentPreview({ file, url: String(reader.result) }); reader.readAsDataURL(file); e.currentTarget.value = ''; }} />
        <button type="button" disabled={!!editing} onClick={() => fileRef.current?.click()} aria-label="Attach file" className="rounded-full p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Paperclip className="h-5 w-5" /></button>
        <textarea
          {...field}
          ref={(el) => {
            formRef(el);
            areaRef.current = el;
          }}
          rows={1}
          onKeyDown={onKeyDown}
          aria-label="Message"
          placeholder="Type a message — Enter to send, Shift+Enter for a new line"
          className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="submit"
          disabled={!text?.trim() && !attachmentPreview}
          aria-label={editing ? 'Save edit' : 'Send message'}
          className="rounded-full bg-teal-700 p-2.5 text-white transition-colors hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}
