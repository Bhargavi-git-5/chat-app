'use client';
import { useMemo } from 'react';
import { UserMinus, UserPlus, X } from 'lucide-react';
import { ME_ID } from '../types';
import { useChatStore } from '../store/chatStore';
import { Avatar } from './Avatar';

export function GroupInfoPanel({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const conversation = useChatStore((s) => s.conversations.find((c) => c.id === conversationId));
  const users = useChatStore((s) => s.users);
  const addMember = useChatStore((s) => s.addMember);
  const removeMember = useChatStore((s) => s.removeMember);

  const candidates = useMemo(
    () => Object.values(users).filter((u) => u.id !== ME_ID && !conversation?.memberIds.includes(u.id)),
    [users, conversation],
  );

  if (!conversation || conversation.type !== 'group') return null;
  const members = conversation.memberIds.map((id) => users[id]).filter(Boolean);
  const onlineCount = members.filter((m) => m.online).length;

  return (
    <aside
      aria-label="Group information"
      className="absolute inset-y-0 right-0 z-30 flex w-full flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:w-80"
    >
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h2 className="font-semibold">Group info</h2>
        <button type="button" onClick={onClose} aria-label="Close group info" className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          <Avatar name={conversation.name} group size="lg" />
          <p className="text-lg font-semibold">{conversation.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {members.length} members · {onlineCount} online
          </p>
        </div>

        <section aria-label="Members" className="px-2">
          <h3 className="px-2 pb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Members</h3>
          <ul>
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                {/* <Avatar name={m.name} online={m.online} size="sm" /> */}

                <Avatar
  name={m.name}
  avatar={m.avatar}
  online={m.online}
  size="sm"
/>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.id === ME_ID ? 'You' : m.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{m.online ? 'Online' : 'Offline'}</p>
                </div>
                {m.id !== ME_ID && (
                  <button
                    type="button"
                    onClick={() => removeMember(conversation.id, m.id)}
                    aria-label={`Remove ${m.name}`}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Add members" className="mt-4 px-2 pb-4">
          <h3 className="px-2 pb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Add members</h3>
          {candidates.length === 0 ? (
            <p className="px-2 text-sm text-slate-500 dark:text-slate-400">Everyone is already in this group.</p>
          ) : (
            <ul>
              {candidates.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  {/* <Avatar name={u.name} online={u.online} size="sm" /> */}
                  <Avatar
  name={u.name}
  avatar={u.avatar}
  online={u.online}
  size="sm"
/>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{u.name}</p>
                  <button
                    type="button"
                    onClick={() => addMember(conversation.id, u.id)}
                    aria-label={`Add ${u.name}`}
                    className="rounded-full p-1.5 text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
}
