import { describe, expect, it } from 'vitest';
import { sanitizeMissionProgressHistory } from './useWorkoutSession';

describe('sanitizeMissionProgressHistory', () => {
  it('drops malformed dates and clamps invalid values to zero', () => {
    const history = [
      { date: '2026-03-01', value: 12 },
      { date: '', value: 5 },
      { date: '2026-03-02', value: Number.NaN as number },
      { date: '2026-03-03', value: Number.POSITIVE_INFINITY as number },
      { date: '2026-03-04', value: -4 },
    ];

    const result = sanitizeMissionProgressHistory(history);

    expect(result).toEqual([
      { date: '2026-03-01', value: 12 },
      { date: '2026-03-02', value: 0 },
      { date: '2026-03-03', value: 0 },
      { date: '2026-03-04', value: 0 },
    ]);
  });

  it('keeps only the most recent entries up to maxEntries', () => {
    const history = Array.from({ length: 65 }, (_, idx) => ({
      date: `2026-03-${String(idx + 1).padStart(2, '0')}`,
      value: idx + 1,
    }));

    const result = sanitizeMissionProgressHistory(history, 60);

    expect(result).toHaveLength(60);
    expect(result[0].date).toBe('2026-03-06');
    expect(result[59].date).toBe('2026-03-65');
  });
});
