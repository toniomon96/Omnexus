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

  it('captures weekly progress module analytics events', async () => {
    const { trackWeeklyProgressModuleEvent } = await import('./analytics');

    trackWeeklyProgressModuleEvent({
      action: 'clicked',
      sessionsThisWeek: 2,
      weeklyGoal: 3,
      hasMetGoal: false,
      destination: '/train',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      event: 'weekly_progress_module_event',
      properties: {
        action: 'clicked',
        sessionsThisWeek: 2,
        weeklyGoal: 3,
        hasMetGoal: false,
        destination: '/train',
      },
    });
  });

  it('captures workout completion next-step analytics events', async () => {
    const { trackWorkoutCompletionNextStepEvent } = await import('./analytics');

    trackWorkoutCompletionNextStepEvent({
      action: 'clicked',
      target: 'next_session',
      hasAdaptation: true,
      isQuickSession: false,
      hasPersonalRecords: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      event: 'workout_completion_next_step_event',
      properties: {
        action: 'clicked',
        target: 'next_session',
        hasAdaptation: true,
        isQuickSession: false,
        hasPersonalRecords: true,
      },
    });
  });

  it('captures insights recommendation analytics events', async () => {
    const { trackInsightRecommendationEvent } = await import('./analytics');

    trackInsightRecommendationEvent({
      action: 'shown',
      destination: '/train',
      hasHistory: true,
      hasInsight: false,
      isGuest: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      event: 'insight_recommendation_event',
      properties: {
        action: 'shown',
        destination: '/train',
        hasHistory: true,
        hasInsight: false,
        isGuest: false,
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

  it('captures AI degraded-state analytics events', async () => {
    const { trackAiDegradedStateEvent } = await import('./analytics');

    trackAiDegradedStateEvent({
      surface: 'insights',
      action: 'retry_clicked',
      errorKind: 'network',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      event: 'ai_degraded_state_event',
      properties: {
        surface: 'insights',
        action: 'retry_clicked',
        errorKind: 'network',
      },
    });
  });
});