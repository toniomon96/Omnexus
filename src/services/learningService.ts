import { apiBase } from '../lib/api';
import type { ContentRecommendation, DynamicLesson } from '../types';

async function getAccessToken() {
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ─── Request / Response types ─────────────────────────────────────────────────

export interface RecommendRequest {
  query: string;
  completedLessons?: string[];
  goals?: string[];
  experienceLevel?: string;
  limit?: number;
}

export interface RecommendResponse {
  recommendations: ContentRecommendation[];
  hasContentGap: boolean;
  gapTopic?: string;
}

export interface GenerateLessonRequest {
  topic: string;
  userGoal?: string;
  experienceLevel?: string;
  relatedExerciseIds?: string[];
}

export interface GenerateLessonResponse {
  lesson: DynamicLesson;
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

export function getContentRecommendations(body: RecommendRequest): Promise<RecommendResponse> {
  return post<RecommendResponse>('/api/recommend-content', body);
}

export function generateMicroLesson(body: GenerateLessonRequest): Promise<GenerateLessonResponse> {
  return post<GenerateLessonResponse>('/api/generate-lesson', body);
}
