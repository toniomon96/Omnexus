import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { TermHelpChips } from '../components/ui/TermHelpChips';
import { Activity, Trophy, Target, Users, ChevronRight } from 'lucide-react';
import { getExperienceMode } from '../utils/localStorage';

const SECTIONS = [
  {
    to: '/feed',
    icon: Activity,
    label: 'Activity Feed',
    description: "See what your friends are training",
    color: 'bg-blue-500/10 text-blue-500',
    badge: undefined as string | undefined,
  },
  {
    to: '/leaderboard',
    icon: Trophy,
    label: 'Leaderboard',
    description: 'Weekly rankings by workout volume',
    color: 'bg-yellow-500/10 text-yellow-500',
    badge: undefined as string | undefined,
  },
  {
    to: '/challenges',
    icon: Target,
    label: 'Challenges',
    description: 'Compete solo or with a team',
    color: 'bg-brand-500/10 text-brand-500',
    badge: undefined as string | undefined,
  },
  {
    to: '/friends',
    icon: Users,
    label: 'Friends',
    description: 'Find and connect with athletes',
    color: 'bg-green-500/10 text-green-500',
    badge: undefined as string | undefined,
  },
] as const;

export function CommunityPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const isGuidedMode = state.user ? getExperienceMode(state.user.id) === 'guided' : true;

  return (
    <AppShell>
      <TopBar title="Community" />
      <div className="px-4 pb-6 pt-4 space-y-3">

        {/* Hero blurb */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Train alongside others, climb the leaderboard, and take on team challenges.
        </p>

        {isGuidedMode && (
          <TermHelpChips
            title="Community terms explained"
            terms={[
              {
                key: 'feed',
                label: 'Activity feed',
                description: 'A timeline of your friends’ workouts and progress updates.',
              },
              {
                key: 'leaderboard',
                label: 'Leaderboard',
                description: 'Weekly ranking based on training output metrics.',
              },
              {
                key: 'challenge',
                label: 'Challenge',
                description: 'A goal-based competition you can join solo or with a team.',
              },
            ]}
          />
        )}

        {/* Section cards */}
        {SECTIONS.map(({ to, icon: Icon, label, description, color }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="w-full text-left"
          >
            <Card>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 shrink-0" />
              </div>
            </Card>
          </button>
        ))}

      </div>
    </AppShell>
  );
}
