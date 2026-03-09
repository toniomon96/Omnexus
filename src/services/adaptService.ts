// ─── Request / Response types ─────────────────────────────────────────────────

import type { AdaptationResult, BlockMission, AiChallenge } from '../types';
import { apiBase } from '../lib/api';

export interface AdaptRequest {
  sessionId?: string;
  userId: string;
  exerciseSets: {
    exerciseId: string;
    exerciseName: string;
    sets: {
      setNumber: number;
      weight: number;
      reps: number;
      completed: boolean;
      rpe?: number;
      timestamp: string;
    }[];
  }[];
}

export interface GenerateMissionsRequest {
  userId: string;
  programId: string;
  programName: string;
  goal: string;
  experienceLevel: string;
  daysPerWeek: number;
  durationWeeks: number;
}

export interface PersonalChallengeRequest {
  userId: string;
  goal: string;
  experienceLevel: string;
  recentStats: {
    weeklyVolume: number;
    sessionsLast30Days: number;
    avgRpe: number;
  };
}

export interface PeerInsightsRequest {
  userId: string;
  goal: string;
  experienceLevel: string;
}

export interface PeerInsightsResponse {
  narrative: string;
  peerCount: number;
  hasEnoughPeers: boolean;
}

async function getAccessToken() {
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const accessToken = await getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const res = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getAdaptation(body: AdaptRequest): Promise<AdaptationResult> {
  return post<AdaptationResult>('/api/adapt', body);
}

export function generateMissions(body: GenerateMissionsRequest): Promise<{ missions: BlockMission[] }> {
  return post<{ missions: BlockMission[] }>('/api/generate-missions', body);
}

export function generatePersonalChallenge(body: PersonalChallengeRequest): Promise<{ challenge: AiChallenge }> {
  return post<{ challenge: AiChallenge }>('/api/generate-personal-challenge', body);
}

export function getPeerInsights(body: PeerInsightsRequest): Promise<PeerInsightsResponse> {
  return post<PeerInsightsResponse>('/api/peer-insights', body);
}
