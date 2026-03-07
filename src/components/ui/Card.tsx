import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  gradient?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  hover,
  gradient,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={[
        'rounded-2xl border',
        gradient
          ? 'border-slate-200 bg-gradient-to-br from-slate-100 to-slate-50 dark:border-slate-700/60 dark:from-slate-800/80 dark:to-slate-900/60'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60',
        paddingClasses[padding],
        hover
          ? 'transition-all duration-150 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-600 cursor-pointer'
          : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
