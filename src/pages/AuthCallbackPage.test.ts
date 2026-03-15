import { describe, expect, it, vi, beforeEach } from 'vitest';
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

describe('migrateGuestData', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('uploads unsynced sessions and personal records for the given user', async () => {
    const mockUpsertSession = vi.fn().mockResolvedValue(undefined);
    const mockUpsertPersonalRecords = vi.fn().mockResolvedValue(undefined);

    vi.doMock('../utils/localStorage', () => ({
      getHistory: () => ({
        sessions: [
          { id: 's1', syncStatus: 'saved_on_device' },
          { id: 's2', syncStatus: 'synced' },
        ],
        personalRecords: [{ exerciseId: 'bench', weight: 100, reps: 5 }],
      }),
    }));

    vi.doMock('../lib/db', () => ({
      upsertSession: mockUpsertSession,
      upsertPersonalRecords: mockUpsertPersonalRecords,
    }));

    const { migrateGuestData: migrate } = await import('./AuthCallbackPage');
    await migrate('user-123');

    // Only the unsynced session should be uploaded
    expect(mockUpsertSession).toHaveBeenCalledTimes(1);
    expect(mockUpsertSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's1' }),
      'user-123',
    );

    expect(mockUpsertPersonalRecords).toHaveBeenCalledTimes(1);
    expect(mockUpsertPersonalRecords).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ exerciseId: 'bench' })]),
      'user-123',
    );
  });

  it('does not throw when there is no local history', async () => {
    vi.doMock('../utils/localStorage', () => ({
      getHistory: () => ({ sessions: [], personalRecords: [] }),
    }));
    vi.doMock('../lib/db', () => ({
      upsertSession: vi.fn(),
      upsertPersonalRecords: vi.fn(),
    }));

    const { migrateGuestData: migrate } = await import('./AuthCallbackPage');
    await expect(migrate('user-456')).resolves.toBeUndefined();
  });

  it('swallows errors and resolves cleanly', async () => {
    vi.doMock('../utils/localStorage', () => ({
      getHistory: () => {
        throw new Error('storage error');
      },
    }));

    const { migrateGuestData: migrate } = await import('./AuthCallbackPage');
    await expect(migrate('user-789')).resolves.toBeUndefined();
  });
});
