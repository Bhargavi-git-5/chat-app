import { AlertTriangle, MessageSquare, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-slate-500 dark:text-slate-400">
      {icon ?? <MessageSquare className="h-10 w-10" />}
      <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {hint && <p className="max-w-xs text-sm">{hint}</p>}
    </div>
  );
}

export const NoResults = ({ hint }: { hint?: string }) => (
  <EmptyState icon={<SearchX className="h-10 w-10" />} title="No matches" hint={hint} />
);

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      >
        Try again
      </button>
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <ul aria-label="Loading conversations" className="animate-pulse space-y-1 p-2">
      {Array.from({ length: 7 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 p-3">
          <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </li>
      ))}
    </ul>
  );
}
