import { describe, expect, it } from 'vitest';
import { ApiError } from '../services/claudeService';
import { normalizeAiError } from './aiErrorHandling';

describe('normalizeAiError', () => {
  it('maps Ask 403 responses to upgrade-required state', () => {
    const result = normalizeAiError(new ApiError('forbidden', 403), { surface: 'ask' });

    expect(result.kind).toBe('upgrade');
    expect(result.message).toMatch(/upgrade/i);
  });

  it('maps Insights auth errors to account-required guidance', () => {
    const result = normalizeAiError(new ApiError('forbidden', 403), { surface: 'insights' });

    expect(result.kind).toBe('auth');
    expect(result.message).toMatch(/require an account/i);
  });

  it('maps network failures to a connection recovery message', () => {
    const result = normalizeAiError(new Error('Failed to fetch'), { surface: 'program_generation' });

    expect(result.kind).toBe('network');
    expect(result.message).toMatch(/connection/i);
  });

  it('uses surface defaults for unknown non-error values', () => {
    const result = normalizeAiError({ unexpected: true }, { surface: 'program_generation' });

    expect(result.kind).toBe('unknown');
    expect(result.message).toBe('We could not generate a new AI program right now. Please try again.');
  });
});
