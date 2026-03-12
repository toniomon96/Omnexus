import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn().mockResolvedValue({ ok: true });

vi.stubGlobal('fetch', fetchMock);

describe('analytics helpers', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    vi.resetModules();
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test_key');
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://app.posthog.com');
  });

  it('captures guest migration analytics events', async () => {
    const { trackGuestMigrationEvent } = await import('./analytics');

    trackGuestMigrationEvent({
      action: 'shown',
      source: 'modal',
      sessionCount: 2,
      personalRecordCount: 1,
      learningItemCount: 3,
      customProgramCount: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      event: 'guest_migration_event',
      properties: {
        action: 'shown',
        source: 'modal',
        sessionCount: 2,
        personalRecordCount: 1,
        learningItemCount: 3,
        customProgramCount: 1,
      },
    });
  });

  it('captures hydration recovery analytics events', async () => {
    const { trackHydrationRecoveryEvent } = await import('./analytics');

    trackHydrationRecoveryEvent({
      guard: 'guest_or_auth',
      state: 'hydration_failed',
      action: 'retry',
      path: '/history',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      event: 'hydration_recovery_event',
      properties: {
        guard: 'guest_or_auth',
        state: 'hydration_failed',
        action: 'retry',
        path: '/history',
      },
    });
  });

  it('captures primary training action analytics events', async () => {
    const { trackPrimaryTrainingActionEvent } = await import('./analytics');

    trackPrimaryTrainingActionEvent({
      surface: 'dashboard',
      action: 'shown',
      state: 'program_ready',
      target: 'start_workout',
      isGuidedMode: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      event: 'primary_training_action_event',
      properties: {
        surface: 'dashboard',
        action: 'shown',
        state: 'program_ready',
        target: 'start_workout',
        isGuidedMode: true,
      },
    });
  });
});