import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/feed', label: 'Feed' },
  { to: '/friends', label: 'Friends' },
  { to: '/leaderboard', label: 'Standings' },
  { to: '/challenges', label: 'Challenges' },
];

export function CommunityTabs() {
  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-20 flex overflow-x-auto border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 scrollbar-hide">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            [
              'flex-shrink-0 px-5 py-3 text-sm font-medium transition-colors border-b-2',
              isActive
                ? 'text-brand-500 border-brand-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300',
            ].join(' ')
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
