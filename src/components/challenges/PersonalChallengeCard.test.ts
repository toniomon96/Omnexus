import { describe, expect, it } from 'vitest';
import { getPersonalChallengeTargetDisplay } from './PersonalChallengeCard';

describe('getPersonalChallengeTargetDisplay', () => {
  it('converts mass-based targets to lbs when user preference is lbs', () => {
    const result = getPersonalChallengeTargetDisplay(
      {
        metric: 'total_volume',
        target: 100,
        unit: 'kg',
      },
      'lbs',
    );

    expect(result.targetText).toBe('220.5');
    expect(result.unitText).toBe('lbs');
  });

  it('keeps non-mass targets unchanged', () => {
    const result = getPersonalChallengeTargetDisplay(
      {
        metric: 'sessions_count',
        target: 4,
        unit: 'sessions',
      },
      'lbs',
    );

    expect(result.targetText).toBe('4');
    expect(result.unitText).toBe('sessions');
  });

  it('normalizes lb-style units as mass targets', () => {
    const result = getPersonalChallengeTargetDisplay(
      {
        metric: 'consistency',
        target: 50,
        unit: 'pounds',
      },
      'kg',
    );

    expect(result.targetText).toBe('50');
    expect(result.unitText).toBe('kg');
  });
});
