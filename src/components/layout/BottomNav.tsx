import { NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Users, GraduationCap, Sparkles } from 'lucide-react';

// All routes that belong to the Community section — keeps the tab highlighted
// when the user navigates into a community sub-page from the hub.
const COMMUNITY_PATHS = ['/community', '/feed', '/friends', '/leaderboard', '/challenges'];

export function BottomNav() {
  const location = useLocation();

  const isCommunityActive = COMMUNITY_PATHS.some(
    p => location.pathname === p || location.pathname.startsWith(p + '/'),
  );

  const links = [
    { to: '/',          icon: Home,          label: 'Home',      end: true,  forceActive: undefined as boolean | undefined },
    { to: '/train',     icon: Dumbbell,      label: 'Train',     end: false, forceActive: undefined as boolean | undefined },
    { to: '/community', icon: Users,         label: 'Community', end: false, forceActive: isCommunityActive },
    { to: '/learn',     icon: GraduationCap, label: 'Learn',     end: false, forceActive: undefined as boolean | undefined },
    { to: '/insights',  icon: Sparkles,      label: 'Insights',  end: false, forceActive: undefined as boolean | undefined },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 pb-safe">
      <div className="flex w-full">
        {links.map(({ to, icon: Icon, label, end, forceActive }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => {
              const active = forceActive !== undefined ? forceActive : isActive;
              return [
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[10px] font-medium transition-colors min-w-0',
                active
                  ? 'text-brand-500'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
              ].join(' ');
            }}
          >
            <Icon size={21} strokeWidth={1.8} />
            <span className="truncate w-full text-center leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
