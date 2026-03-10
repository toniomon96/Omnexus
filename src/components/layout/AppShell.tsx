import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-slate-50 dark:bg-slate-950">
      <main className={`flex-1 mx-auto w-full max-w-3xl lg:max-w-5xl ${hideNav ? '' : 'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]'}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
