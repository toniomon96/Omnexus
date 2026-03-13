import { describe, expect, it } from 'vitest';
import { normalizeMissionProgress, normalizeMissions } from './_missionIntegrity.js';

describe('normalizeMissions', () => {
  it('falls back to default missions for non-array input', () => {
    const missions = normalizeMissions(null, 3);
    expect(missions.length).toBeGreaterThanOrEqual(3);
    expect(missions.some((m) => m.type === 'consistency')).toBe(true);
    expect(missions.every((m) => m.target.value >= 1)).toBe(true);
  });

  it('removes invalid/duplicate types and sanitizes target values', () => {
    const missions = normalizeMissions([
      { type: 'volume', description: '', target: { metric: '', value: 0, unit: '' } },
      { type: 'volume', description: 'dup', target: { metric: 'x', value: 100, unit: 'kg' } },
      { type: 'rpe', description: 'Keep quality', target: { metric: 'avg RPE', value: '8', unit: 'RPE' } },
      { type: 'unknown', description: 'bad', target: { metric: 'x', value: 1, unit: 'x' } },
    ], 4);

    const types = missions.map((m) => m.type);
    expect(types.filter((t) => t === 'volume')).toHaveLength(1);
    expect(missions.find((m) => m.type === 'volume')?.target.value).toBeGreaterThanOrEqual(1);
    expect(missions.find((m) => m.type === 'rpe')?.target.value).toBe(8);
    expect(missions.length).toBeGreaterThanOrEqual(3);
  });

  it('sanitizes malformed mission progress payloads', () => {
    const normalized = normalizeMissionProgress({
      current: Number.POSITIVE_INFINITY,
      history: [
        { date: '2026-03-01', value: 3 },
        { date: '', value: 2 },
        { date: ' 2026-03-02 ', value: Number.NaN },
        { date: '2026-03-03', value: -4 },
      ],
    });

    expect(normalized.current).toBe(0);
    expect(normalized.history).toEqual([
      { date: '2026-03-01', value: 3 },
      { date: '2026-03-02', value: 0 },
      { date: '2026-03-03', value: 0 },
    ]);
  });
});
