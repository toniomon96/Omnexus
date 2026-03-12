/**
 * Omnexus Analytics — PostHog capture wrapper.
 *
 * Uses PostHog's HTTP capture API directly (no npm package required).
 * All calls are fire-and-forget and silently no-op when VITE_POSTHOG_KEY is absent.
 *
 * SETUP:
 *   1. Create a PostHog project at https://app.posthog.com
 *   2. Add to Vercel / .env.local:
 *        VITE_POSTHOG_KEY=phc_xxxxxxxxxxxx
 *        VITE_POSTHOG_HOST=https://app.posthog.com   # or your EU endpoint
 *   3. (Optional) To enable A/B feature flags, install posthog-js and replace
 *      the fetch calls below with the full SDK.
 *
 * Privacy:
 *   - No names, emails, or free-text content is tracked.
 *   - Only anonymized user IDs (Supabase UUID) and action metadata.
 *   - Guests are tracked as 'guest'.
 */

const POSTHOG_KEY: string | undefined = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST: string = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let _distinctId: string = 'guest';

// ─── Identity ─────────────────────────────────────────────────────────────────

/**
 * Associate subsequent events with a user ID.
 * Call when the user signs in or is hydrated from session.
 * Call with 'guest' on sign-out or guest mode.
 */
export function identify(userId: string | 'guest') {
  _distinctId = userId;
  if (!POSTHOG_KEY) return;
  // Alias guest → real account on first sign-in (PostHog $identify)
  capture('$identify', { $anon_distinct_id: _distinctId });
}

// ─── Core capture ─────────────────────────────────────────────────────────────

function capture(event: string, properties: Record<string, unknown> = {}) {
  if (!POSTHOG_KEY) return;
  const payload = {
    api_key: POSTHOG_KEY,
    event,
    properties: {
      distinct_id: _distinctId,
      $lib: 'omnexus-web',
      ...properties,
    },
    timestamp: new Date().toISOString(),
  };
  fetch(`${POSTHOG_HOST}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {/* silently ignore */});
}

// ─── Typed event helpers ───────────────────────────────────────────────────────

export function trackWorkoutCompleted(props: {
  durationSeconds: number;
  totalVolumeKg: number;
  exerciseCount: number;
  setCount: number;
  programId?: string;
  isGuest: boolean;
}) {
  capture('workout_completed', props);
}

export function trackLessonCompleted(props: {
  courseId: string;
  moduleId: string;
  lessonId: string;
}) {
  capture('lesson_completed', props);
}

export function trackChallengeJoined(props: {
  challengeId: string;
  challengeType: string;
  isCooperative: boolean;
  isViaInvitation: boolean;
}) {
  capture('challenge_joined', props);
}

export function trackChallengeCreated(props: {
  challengeType: string;
  isCooperative: boolean;
  hasTarget: boolean;
}) {
  capture('challenge_created', props);
}

export function trackAskSubmitted(props: {
  hasRagContext: boolean;
  isFollowUp: boolean;
}) {
  capture('ask_submitted', props);
}

export function trackProgramActivated(props: {
  programId: string;
  isAiGenerated: boolean;
  isCustom: boolean;
}) {
  capture('program_activated', props);
}

export function trackInvitationResponded(props: {
  response: 'accepted' | 'declined';
}) {
  capture('invitation_responded', props);
}

export function trackInvitationSent() {
  capture('invitation_sent', {});
}

export function trackPageView(path: string) {
  capture('$pageview', { $current_url: path });
}

export function trackFeatureEntry(props: {
  source: string;
  destination: string;
  label?: string;
}) {
  capture('feature_entry_clicked', props);
}

export function trackReleaseModalEvent(props: {
  action: 'shown' | 'dismissed' | 'cta';
  release: string;
  ctaTarget?: string;
}) {
  capture('release_modal_event', props);
}

export function trackGuestMigrationEvent(props: {
  action: 'shown' | 'dismissed' | 'started' | 'completed' | 'failed';
  source: 'modal' | 'profile';
  sessionCount: number;
  personalRecordCount: number;
  learningItemCount: number;
  customProgramCount: number;
}) {
  capture('guest_migration_event', props);
}

export function trackHydrationRecoveryEvent(props: {
  guard: 'guest_or_auth' | 'auth_only';
  state: 'profile_missing' | 'hydration_failed';
  action: 'shown' | 'continue_onboarding' | 'retry' | 'refresh';
  path: string;
}) {
  capture('hydration_recovery_event', props);
}

export function trackPrimaryTrainingActionEvent(props: {
  surface: 'dashboard' | 'train';
  action: 'shown' | 'clicked';
  state: 'active_session' | 'program_ready' | 'no_program';
  target: 'resume_workout' | 'start_workout' | 'browse_programs';
  isGuidedMode: boolean;
}) {
  capture('primary_training_action_event', props);
}
