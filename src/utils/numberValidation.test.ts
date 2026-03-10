import { describe, expect, it } from 'vitest';
import { isStrictDecimal, parseStrictDecimal, sanitizeDecimalInput } from './numberValidation';

describe('numberValidation', () => {
  it('accepts valid decimal formats', () => {
    expect(isStrictDecimal('135')).toBe(true);
    expect(isStrictDecimal('135.5')).toBe(true);
    expect(isStrictDecimal('0.25')).toBe(true);
  });

  it('rejects invalid decimal formats', () => {
    expect(isStrictDecimal('.')).toBe(false);
    expect(isStrictDecimal('1..5')).toBe(false);
    expect(isStrictDecimal('abc')).toBe(false);
    expect(isStrictDecimal('')).toBe(false);
  });

  it('sanitizes invalid characters and multiple decimals', () => {
    expect(sanitizeDecimalInput('13a5')).toBe('135');
    expect(sanitizeDecimalInput('1..5')).toBe('1.5');
    expect(sanitizeDecimalInput('.')).toBe('');
  });

  it('parses only strict decimals', () => {
    expect(parseStrictDecimal('140')).toBe(140);
    expect(parseStrictDecimal('140.5')).toBe(140.5);
    expect(parseStrictDecimal('1..5')).toBeNull();
    expect(parseStrictDecimal('.')).toBeNull();
  });
});
