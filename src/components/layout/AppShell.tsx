import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-slate-50 dark:bg-slate-950">
      <main className={`flex-1 ${hideNav ? '' : 'pb-20'}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
