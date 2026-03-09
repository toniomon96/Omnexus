import type { ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  right?: ReactNode;
  /** Show profile avatar + theme toggle on the right (default true when no back + no right) */
  showProfile?: boolean;
}

export function TopBar({ title, showBack, backTo, right, showProfile }: TopBarProps) {
  const navigate = useNavigate();
  const { state } = useApp();

  // Show profile + theme toggle by default on non-detail pages (no back button, no custom right slot)
  const displayProfile = showProfile ?? (!showBack && !right);

  function handleBackToTarget(target: string) {
    navigate(target, { replace: true });

    window.setTimeout(() => {
      if (window.location.pathname !== target) {
        window.location.assign(target);
      }
    }, 0);
  }

  function handleBack() {
    navigate(-1);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/95 pt-safe">
      <div className="flex h-14 items-center gap-3 px-4">
        {showBack && (backTo ? (
          <a
            href={backTo}
            onClick={(event) => {
              event.preventDefault();
              handleBackToTarget(backTo);
            }}
            data-testid="topbar-back"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back"
            title="Back"
            role="button"
          >
            <ChevronLeft size={22} />
          </a>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            data-testid="topbar-back"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back"
            title="Back"
          >
            <ChevronLeft size={22} />
          </button>
        ))}
        {title && (
          <h1 className="flex-1 text-base font-semibold text-slate-900 dark:text-white truncate">
            {title}
          </h1>
        )}
        {/* Custom right slot — caller controls everything */}
        {right && <div className="ml-auto flex items-center gap-1">{right}</div>}
        {/* Default right: theme toggle + profile avatar */}
        {!right && displayProfile && (
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link
              to="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Profile"
            >
              <Avatar
                url={state.user?.avatarUrl ?? null}
                name={state.user?.name}
                size="sm"
              />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
