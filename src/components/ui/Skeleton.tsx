interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'rect';
}

export function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  const base = 'bg-slate-200 dark:bg-slate-700/60 animate-pulse rounded';
  const variants: Record<string, string> = {
    text:   'h-4 rounded-md',
    card:   'h-24 rounded-2xl',
    avatar: 'h-11 w-11 rounded-xl',
    rect:   '',
  };

  return (
    <div
      className={[base, variants[variant], className].join(' ')}
      aria-hidden="true"
    />
  );
}
