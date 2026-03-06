import type { ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, UserCircle } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Avatar } from '../ui/Avatar';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  right?: ReactNode;
  /** Show profile avatar button on the right (default true when no back + no right) */
  showProfile?: boolean;
}

export function TopBar({ title, showBack, backTo, right, showProfile }: TopBarProps) {
  const navigate = useNavigate();
  const { state } = useApp();

  // Show profile button by default on non-detail pages (no back button, no custom right slot)
  const displayProfile = showProfile ?? (!showBack && !right);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 pt-safe">
      <div className="flex h-14 items-center gap-3 px-4">
        {showBack && (
          <button
            type="button"
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {title && (
          <h1 className="flex-1 text-base font-semibold text-slate-900 dark:text-white truncate">
            {title}
          </h1>
        )}
        {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
        {!right && displayProfile && (
          <Link
            to="/profile"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Profile"
          >
            {state.user ? (
              <Avatar
                url={state.user.avatarUrl ?? null}
                name={state.user.name}
                size="sm"
              />
            ) : (
              <UserCircle size={22} className="text-slate-400" />
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
