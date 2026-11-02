export function TypingIndicator({ names }: { names: string[] }) {
  if (!names.length) return null;
  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" role="status">
      <span className="flex items-center gap-1 rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-slate-800" aria-hidden>
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span>{names.join(', ')} {names.length > 1 ? 'are' : 'is'} typing…</span>
    </div>
  );
}
