import { describe, expect, it } from 'vitest';
import { isRecoveryCallbackUrl } from './AuthCallbackPage';

describe('isRecoveryCallbackUrl', () => {
  it('returns true when recovery type is in query string', () => {
    expect(isRecoveryCallbackUrl('https://app.test/auth/callback?type=recovery')).toBe(true);
  });

  it('returns true when recovery type is in hash params', () => {
    expect(isRecoveryCallbackUrl('https://app.test/auth/callback#type=recovery&access_token=abc')).toBe(true);
  });

  it('returns false for non-recovery callback types', () => {
    expect(isRecoveryCallbackUrl('https://app.test/auth/callback?type=signup')).toBe(false);
  });

  it('returns false when type param is missing', () => {
    expect(isRecoveryCallbackUrl('https://app.test/auth/callback')).toBe(false);
  });
});
