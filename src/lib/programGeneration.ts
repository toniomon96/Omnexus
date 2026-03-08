/**
 * Program generation singleton.
 *
 * Tracks a single async program-generation job across component mounts/unmounts.
 * Uses localStorage to persist status across page refreshes, and a simple
 * pub/sub listener list to notify components within the same session.
 */

import type { UserTrainingProfile, Program } from '../types';
import { saveCustomProgram } from '../utils/localStorage';
import { upsertCustomProgram } from './db';
import { apiBase } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GenerationStatus = 'generating' | 'ready' | 'error';

export interface GenerationState {
  status: GenerationStatus;
  userId: string;
  programId: string;    // assigned at start so dashboard can optimistically reference it
  profile: UserTrainingProfile; // stored so generation can be resumed after a page reload
  startedAt: string;
}

// ─── localStorage ─────────────────────────────────────────────────────────────

const LS_KEY = 'omnexus_program_generation';

export function getGenerationState(): GenerationState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as GenerationState) : null;
  } catch {
    return null;
  }
}

function saveState(data: GenerationState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
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

// ─── Core generation logic ────────────────────────────────────────────────────

/**
 * Fire-and-forget: starts program generation in the background.
 * Safe to call multiple times — a guard prevents double-runs in the same session.
 */
export async function startGeneration(userId: string, profile: UserTrainingProfile): Promise<void> {
  if (_running) return;
  _running = true;

  const programId = crypto.randomUUID();
  const state: GenerationState = {
    status: 'generating',
    userId,
    programId,
    profile,
    startedAt: new Date().toISOString(),
  };
  saveState(state);
  notify(state);

  try {
    const res = await fetch(`${apiBase}/api/generate-program`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
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
    console.error('[programGeneration] Generation failed:', err);
    const error: GenerationState = { ...state, status: 'error' };
    saveState(error);
    notify(error);
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

  await startGeneration(userId, stored.profile);
}
