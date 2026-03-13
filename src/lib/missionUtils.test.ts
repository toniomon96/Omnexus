import { describe, expect, it } from 'vitest';
import {
  getMissionProgressLabel,
  getMissionProgressPercent,
  getSafeMissionCurrentValue,
  getSafeMissionTargetValue,
} from './missionUtils';

describe('missionUtils', () => {
  it('normalizes malformed mission values safely', () => {
    const mission = {
      target: { metric: 'sessions', value: 0, unit: 'sessions' },
      progress: { current: -3, history: [] },
    };

    expect(getSafeMissionTargetValue(mission)).toBe(1);
    expect(getSafeMissionCurrentValue(mission)).toBe(0);
    expect(getMissionProgressPercent(mission)).toBe(0);
  });

  it('formats progress label and caps percent at 100', () => {
    const mission = {
      target: { metric: 'volume', value: 10, unit: 'kg' },
      progress: { current: 16, history: [] },
    };

    expect(getMissionProgressLabel(mission)).toBe('16/10 kg');
    expect(getMissionProgressPercent(mission)).toBe(100);
  });

  it('falls back safely for non-finite values', () => {
    const mission = {
      target: { metric: 'volume', value: Number.POSITIVE_INFINITY as number, unit: 'kg' },
      progress: { current: Number.NaN as number, history: [] },
    };

    expect(getSafeMissionTargetValue(mission)).toBe(1);
    expect(getSafeMissionCurrentValue(mission)).toBe(0);
    expect(getMissionProgressPercent(mission)).toBe(0);
    expect(getMissionProgressLabel(mission)).toBe('0/1 kg');
  });
});
