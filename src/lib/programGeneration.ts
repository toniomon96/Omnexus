/**
 * Program generation singleton.
 *
 * Tracks a single async program-generation job across component mounts/unmounts.
 * Uses localStorage to persist status across page refreshes, and a simple
 * pub/sub listener list to notify components within the same session.
 */

import type { UserTrainingProfile, Program } from '../types';
import { saveCustomProgram, getMostRecentFeedbackNote } from '../utils/localStorage';
import { upsertCustomProgram } from './dbHydration';
import { apiBase } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GenerationStatus = 'generating' | 'ready' | 'error';

export interface GenerationState {
  status: GenerationStatus;
  userId: string;
  programId: string;    // assigned at start so dashboard can optimistically reference it
  profile: UserTrainingProfile; // stored so generation can be resumed after a page reload
  startedAt: string;
  activateOnReady: boolean;
  countAgainstQuota: boolean;
}

interface StartGenerationOptions {
  activateOnReady?: boolean;
  countAgainstQuota?: boolean;
}

// ─── localStorage ─────────────────────────────────────────────────────────────

const LS_KEY = 'omnexus_program_generation';

function normalizeGenerationState(state: GenerationState | null): GenerationState | null {
  if (!state) return null;

  return {
    ...state,
    activateOnReady: state.activateOnReady ?? true,
    countAgainstQuota: state.countAgainstQuota ?? false,
  };
}

export function getGenerationState(): GenerationState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? normalizeGenerationState(JSON.parse(raw) as GenerationState) : null;
  } catch {
    return null;
  }
}

function saveState(data: GenerationState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(normalizeGenerationState(data)));
  } catch { /* quota */ }
}

export function clearGenerationState() {
  localStorage.removeItem(LS_KEY);
  _running = false;
}

// ─── In-session pub/sub ───────────────────────────────────────────────────────

type Listener = (state: GenerationState) => void;
let _listeners: Listener[] = [];
let _running = false;

export function subscribeToGeneration(fn: Listener): () => void {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

function notify(state: GenerationState) {
  _listeners.forEach(l => l(state));
}

async function getGenerationHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  try {
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // In tests or non-auth contexts, generation can still proceed without a token.
  }

  return headers;
}

// ─── Core generation logic ────────────────────────────────────────────────────

/**
 * Fire-and-forget: starts program generation in the background.
 * Safe to call multiple times — a guard prevents double-runs in the same session.
 */
export async function startGeneration(
  userId: string,
  profile: UserTrainingProfile,
  options: StartGenerationOptions = {},
): Promise<void> {
  if (_running) return;
  _running = true;

  const activateOnReady = options.activateOnReady ?? true;
  const countAgainstQuota = options.countAgainstQuota ?? false;

  const programId = crypto.randomUUID();
  const state: GenerationState = {
    status: 'generating',
    userId,
    programId,
    profile,
    startedAt: new Date().toISOString(),
    activateOnReady,
    countAgainstQuota,
  };
  saveState(state);
  notify(state);

  // Enrich with most recent feedback so the AI can adapt the program.
  // Defined before try/catch so the fallback engine also gets the enriched profile.
  const recentFeedback = profile.recentFeedback ?? getMostRecentFeedbackNote();
  const enrichedProfile: UserTrainingProfile = recentFeedback
    ? { ...profile, recentFeedback }
    : profile;

  try {
    const headers = countAgainstQuota
      ? await getGenerationHeaders()
      : { 'Content-Type': 'application/json' };

    const res = await fetch(`${apiBase}/api/generate-program`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...enrichedProfile, countAgainstQuota }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(data.error ?? `HTTP ${res.status}`);
    }

    const data = await res.json() as { program: Program };
    const program: Program = {
      ...data.program,
      id: programId,
      isCustom: true,
      isAiGenerated: true,
      aiLifecycleStatus: 'draft',
      createdAt: new Date().toISOString(),
    };

    saveCustomProgram(program);
    // Await the Supabase write before marking 'ready' — this prevents a race where
    // GuestOrAuthGuard hydration runs setCustomPrograms([]) between the local save
    // and the Supabase write, causing "No program found" when the user clicks "View".
    await upsertCustomProgram(program, userId).catch(() => { /* synced on next login */ });

    const ready: GenerationState = { ...state, status: 'ready' };
    saveState(ready);
    notify(ready);
  } catch (err) {
    console.warn('[programGeneration] AI generation failed, falling back to deterministic engine:', err);
    try {
      const { generateProgram } = await import('./workoutEngine');
      const fallback: Program = {
        ...generateProgram(enrichedProfile),
        id: programId,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      saveCustomProgram(fallback);
      await upsertCustomProgram(fallback, userId).catch(() => { /* synced on next login */ });
      const ready: GenerationState = { ...state, status: 'ready' };
      saveState(ready);
      notify(ready);
    } catch (fallbackErr) {
      console.error('[programGeneration] Deterministic fallback also failed:', fallbackErr);
      const error: GenerationState = { ...state, status: 'error' };
      saveState(error);
      notify(error);
    }
  } finally {
    _running = false;
  }
}

/**
 * Called after login/hydration: if localStorage shows a pending generation
 * for this user that never completed, restart it.
 * The profile is already stored inside the GenerationState, so no extra arg needed.
 */
export async function resumeIfNeeded(userId: string): Promise<void> {
  const stored = getGenerationState();
  if (!stored) return;
  if (stored.userId !== userId) return;
  if (stored.status !== 'generating') return;
  if (_running) return;

  await startGeneration(userId, stored.profile, {
    activateOnReady: stored.activateOnReady,
    countAgainstQuota: stored.countAgainstQuota,
  });
}
