import { describe, expect, it } from 'vitest';
import { formatMass, formatWeightValue, toDisplayWeight, toStoredWeight } from './weightUnits';

describe('weightUnits', () => {
  it('converts stored kg values to lbs for display', () => {
    expect(toDisplayWeight(100, 'lbs')).toBeCloseTo(220.46226218, 5);
  });

  it('converts lbs input back to stored kg value', () => {
    expect(toStoredWeight(220.46226218, 'lbs')).toBeCloseTo(100, 5);
  });

  it('formats weight values with a compact decimal', () => {
    expect(formatWeightValue(100, 'kg')).toBe('100');
    expect(formatWeightValue(100, 'lbs')).toBe('220.5');
  });

  it('formats mass labels with selected unit', () => {
    expect(formatMass(500, 'kg')).toBe('500 kg');
    expect(formatMass(500, 'lbs')).toBe('1,102 lbs');
  });
});
