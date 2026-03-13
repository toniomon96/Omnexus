const ALLOWED_TYPES = ['pr', 'consistency', 'volume', 'rpe'] as const;
type MissionType = (typeof ALLOWED_TYPES)[number];

type MissionCandidate = {
  type?: unknown;
  description?: unknown;
  target?: {
    metric?: unknown;
    value?: unknown;
    unit?: unknown;
  };
};

export type NormalizedMission = {
  type: MissionType;
  description: string;
  target: { metric: string; value: number; unit: string };
};

export type NormalizedMissionProgress = {
  current: number;
  history: Array<{ date: string; value: number }>;
};

function isMissionType(value: unknown): value is MissionType {
  return typeof value === 'string' && (ALLOWED_TYPES as readonly string[]).includes(value);
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.round(parsed));
}

function buildFallbackMissions(daysPerWeek: number): NormalizedMission[] {
  return [
    {
      type: 'consistency',
      description: `Complete ${daysPerWeek * 4} sessions in the next 4 weeks`,
      target: { metric: 'sessions', value: daysPerWeek * 4, unit: 'sessions' },
    },
    {
      type: 'pr',
      description: 'Set a new personal record on your primary compound lift',
      target: { metric: 'new PR', value: 1, unit: 'PR' },
    },
    {
      type: 'volume',
      description: 'Hit a weekly volume of 10,000 kg',
      target: { metric: 'weekly volume', value: 10000, unit: 'kg' },
    },
  ];
}

export function normalizeMissionProgress(raw: unknown): NormalizedMissionProgress {
  const progress = (raw ?? {}) as {
    current?: unknown;
    history?: Array<{ date?: unknown; value?: unknown }>;
  };

  const currentParsed = Number(progress.current);
  const current = Number.isFinite(currentParsed) && currentParsed >= 0
    ? currentParsed
    : 0;

  const history = Array.isArray(progress.history)
    ? progress.history
      .filter((entry) => typeof entry?.date === 'string' && entry.date.trim().length > 0)
      .map((entry) => {
        const valueParsed = Number(entry.value);
        const date = typeof entry.date === 'string' ? entry.date.trim() : '';
        return {
          date,
          value: Number.isFinite(valueParsed) && valueParsed >= 0 ? valueParsed : 0,
        };
      })
      .slice(-60)
    : [];

  return { current, history };
}

export function normalizeMissions(raw: unknown, daysPerWeekInput: number): NormalizedMission[] {
  const safeDaysPerWeek = Math.min(Math.max(Math.round(daysPerWeekInput || 3), 2), 7);
  const fallbacks = buildFallbackMissions(safeDaysPerWeek);
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallbacks;
  }

  const normalized: NormalizedMission[] = [];
  const usedTypes = new Set<MissionType>();

  for (const candidate of raw as MissionCandidate[]) {
    if (normalized.length >= 5) break;
    if (!isMissionType(candidate?.type)) continue;
    if (usedTypes.has(candidate.type)) continue;

    const fallbackForType = fallbacks.find((m) => m.type === candidate.type) ?? fallbacks[0];
    const description =
      typeof candidate.description === 'string' && candidate.description.trim().length > 0
        ? candidate.description.trim().slice(0, 200)
        : fallbackForType.description;

    const metric =
      typeof candidate.target?.metric === 'string' && candidate.target.metric.trim().length > 0
        ? candidate.target.metric.trim().slice(0, 60)
        : fallbackForType.target.metric;

    const unit =
      typeof candidate.target?.unit === 'string' && candidate.target.unit.trim().length > 0
        ? candidate.target.unit.trim().slice(0, 20)
        : fallbackForType.target.unit;

    const value = toPositiveNumber(candidate.target?.value, fallbackForType.target.value);

    normalized.push({
      type: candidate.type,
      description,
      target: { metric, value, unit },
    });
    usedTypes.add(candidate.type);
  }

  for (const fallback of fallbacks) {
    if (normalized.length >= 4) break;
    if (usedTypes.has(fallback.type)) continue;
    normalized.push(fallback);
    usedTypes.add(fallback.type);
  }

  return normalized.length > 0 ? normalized : fallbacks;
}
