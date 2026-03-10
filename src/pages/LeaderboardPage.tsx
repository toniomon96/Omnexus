import { useEffect, useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import type { LeaderboardEntry } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { CommunityTabs } from '../components/community/CommunityTabs';
import { LeaderboardRow } from '../components/community/LeaderboardRow';
import { Trophy } from 'lucide-react';

async function loadWeeklyLeaderboard(userId: string) {
  const { getWeeklyLeaderboard } = await import('../lib/db');
  return getWeeklyLeaderboard(userId);
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function LeaderboardList({ entries }: { entries: LeaderboardEntry[] }) {
  const rows = useMemo(
    () => entries.map((entry, i) => <LeaderboardRow key={entry.userId} rank={i + 1} entry={entry} />),
    [entries],
  );
  return <div className="space-y-2">{rows}</div>;
}

export function LeaderboardPage() {
  const { state } = useApp();
  const userId = state.user?.id ?? '';

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyLeaderboard(userId).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [userId]);

  return (
    <AppShell>
      <TopBar title="Community" />
      <CommunityTabs />

      <div className="px-4 pb-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Weekly Volume
            </h2>
            <p className="text-xs text-slate-400">{getWeekRange()}</p>
          </div>
          <Trophy size={20} className="text-yellow-400" />
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Trophy size={32} className="text-slate-500" />
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
              Add friends to compete on the weekly volume leaderboard.
            </p>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <LeaderboardList entries={entries} />
        )}
      </div>
    </AppShell>
  );
}
