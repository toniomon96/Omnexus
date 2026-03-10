export interface SessionRow {
  user_id: string;
  started_at: string;
  total_volume_kg: number | null;
}

const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);

function toUtcDayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function calculateCurrentStreak(sortedAsc: SessionRow[]): number {
  const uniqueDays = new Set(sortedAsc.map((s) => toUtcDayKey(s.started_at)));
  const date = new Date();

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const key = date.toISOString().slice(0, 10);
    if (uniqueDays.has(key)) {
      streak++;
    } else {
      if (i === 0) {
        date.setUTCDate(date.getUTCDate() - 1);
        continue;
      }
      break;
    }
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return streak;
}

export function pickProgressMessages(
  userSessions: SessionRow[],
  recentSessions: SessionRow[],
  nowMs: number,
): Array<{ title: string; body: string; url: string; tag: string }> {
  const messages: Array<{ title: string; body: string; url: string; tag: string }> = [];
  if (userSessions.length === 0 || recentSessions.length === 0) return messages;

  const totalSessions = userSessions.length;
  const totalVolume = userSessions.reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0);
  const recentVolume = recentSessions.reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0);
  const previousVolume = Math.max(0, totalVolume - recentVolume);

  if (totalSessions % 10 === 0) {
    messages.push({
      title: 'Milestone Unlocked',
      body: `You just hit ${totalSessions} completed sessions. Keep building momentum.`,
      url: '/history',
      tag: 'milestone-sessions',
    });
  }

  const prevVolumeTier = Math.floor(previousVolume / 10_000);
  const currentVolumeTier = Math.floor(totalVolume / 10_000);
  if (currentVolumeTier > prevVolumeTier && currentVolumeTier > 0) {
    const tonnage = currentVolumeTier * 10_000;
    messages.push({
      title: 'Volume Milestone',
      body: `You crossed ${tonnage.toLocaleString()} kg of total logged volume.`,
      url: '/insights',
      tag: 'milestone-volume',
    });
  }

  const currentStreak = calculateCurrentStreak(userSessions);
  const trainedInLastDay = recentSessions.some((s) => nowMs - new Date(s.started_at).getTime() <= 86_400_000);
  if (trainedInLastDay && STREAK_MILESTONES.has(currentStreak)) {
    messages.push({
      title: 'Streak Milestone',
      body: `${currentStreak}-day training streak. You are on a roll.`,
      url: '/dashboard',
      tag: 'milestone-streak',
    });
  }

  return messages;
}
