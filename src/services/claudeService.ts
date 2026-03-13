// ─── Request / Response types ─────────────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskRequest {
  question: string;
  userContext?: {
    goal: string;
    experienceLevel: string;
  };
  conversationHistory?: ConversationMessage[];
}

export interface Citation {
  title: string;
  url?: string;
  type: string;
}

export interface AskResponse {
  answer: string;
  citations?: Citation[];
}

interface AskStreamEventMeta {
  citations?: Citation[];
}

interface AskStreamEventChunk {
  text: string;
}

interface AskStreamEventDone {
  answer: string;
  citations?: Citation[];
}

interface AskStreamErrorEvent {
  code: 'malformed_sse_frame' | 'stream_ended_without_done';
  message: string;
  skippedFrames: number;
}

interface AskStreamHandlers {
  onMeta?: (meta: AskStreamEventMeta) => void;
  onChunk: (chunk: AskStreamEventChunk) => void;
  onDone?: (done: AskStreamEventDone) => void;
  onError?: (error: AskStreamErrorEvent) => void;
}

export interface InsightRequest {
  userGoal: string;
  userExperience: string;
  workoutSummary: string;
}

export interface InsightResponse {
  insight: string;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

import { apiBase } from '../lib/api';
import { cleanAiResponseText } from '../lib/aiResponse';

async function getAccessToken() {
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// BUG-23: Typed error that carries the HTTP status code so callers can distinguish
// 403 (upgrade required) from other errors without fragile string matching.
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

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
    throw new ApiError(data.error ?? `HTTP ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function askOmnexus(body: AskRequest): Promise<AskResponse> {
  const response = await post<AskResponse>('/api/ask', body);
  return {
    ...response,
    answer: cleanAiResponseText(response.answer),
  };
}

export async function askOmnexusStream(body: AskRequest, handlers: AskStreamHandlers): Promise<AskResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };

  const accessToken = await getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${apiBase}/api/ask`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
    throw new ApiError(data.error ?? `HTTP ${res.status}`, res.status);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream') || !res.body) {
    const raw = await res.text();
    const normalizedRaw = raw.replace(/\r\n/g, '\n').replace(/\\n/g, '\n');
    const looksLikeSse = normalizedRaw.includes('event:') && normalizedRaw.includes('data:');

    if (!looksLikeSse) {
      const data = JSON.parse(raw) as AskResponse;
      const cleanAnswer = cleanAiResponseText(data.answer);
      handlers.onChunk({ text: cleanAnswer });
      handlers.onDone?.({ answer: cleanAnswer, citations: data.citations });
      return { ...data, answer: cleanAnswer };
    }

    let answerFromSseText = '';
    let citationsFromSseText: Citation[] = [];
    let skippedFramesFromSseText = 0;

    const frames = normalizedRaw.split('\n\n');
    for (const frame of frames) {
      const eventLine = frame.split('\n').find((line) => line.startsWith('event:'));
      const dataLine = frame.split('\n').find((line) => line.startsWith('data:'));
      if (!eventLine || !dataLine) continue;

      const eventType = eventLine.slice(6).trim();
      const payloadText = dataLine.slice(5).trim();
      if (!payloadText) continue;

      let payload: { text?: string; answer?: string; citations?: Citation[] };
      try {
        payload = JSON.parse(payloadText) as { text?: string; answer?: string; citations?: Citation[] };
      } catch {
        skippedFramesFromSseText += 1;
        handlers.onError?.({
          code: 'malformed_sse_frame',
          message: 'Skipped malformed SSE frame payload',
          skippedFrames: skippedFramesFromSseText,
        });
        continue;
      }

      if (eventType === 'meta') {
        citationsFromSseText = payload.citations ?? citationsFromSseText;
        handlers.onMeta?.({ citations: citationsFromSseText });
      }

      if (eventType === 'chunk' && typeof payload.text === 'string') {
        answerFromSseText += payload.text;
        handlers.onChunk({ text: payload.text });
      }

      if (eventType === 'done') {
        answerFromSseText = cleanAiResponseText(payload.answer ?? answerFromSseText);
        citationsFromSseText = payload.citations ?? citationsFromSseText;
        handlers.onDone?.({ answer: answerFromSseText, citations: citationsFromSseText });
        return { answer: answerFromSseText, citations: citationsFromSseText };
      }
    }

    handlers.onError?.({
      code: 'stream_ended_without_done',
      message: 'SSE stream ended without a done event',
      skippedFrames: skippedFramesFromSseText,
    });
    const cleanFallbackAnswer = cleanAiResponseText(answerFromSseText);
    handlers.onDone?.({ answer: cleanFallbackAnswer, citations: citationsFromSseText });
    return { answer: cleanFallbackAnswer, citations: citationsFromSseText };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';
  let citations: Citation[] = [];
  let skippedFrames = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const eventLine = frame.split('\n').find((line) => line.startsWith('event:'));
      const dataLine = frame.split('\n').find((line) => line.startsWith('data:'));
      if (!eventLine || !dataLine) continue;

      const eventType = eventLine.slice(6).trim();
      const payloadText = dataLine.slice(5).trim();
      if (!payloadText) continue;

      let payload: {
        text?: string;
        citations?: Citation[];
        answer?: string;
      };

      try {
        payload = JSON.parse(payloadText) as {
          text?: string;
          citations?: Citation[];
          answer?: string;
        };
      } catch {
        skippedFrames += 1;
        handlers.onError?.({
          code: 'malformed_sse_frame',
          message: 'Skipped malformed SSE frame payload',
          skippedFrames,
        });
        continue;
      }

      if (eventType === 'meta') {
        citations = payload.citations ?? citations;
        handlers.onMeta?.({ citations });
      }

      if (eventType === 'chunk' && typeof payload.text === 'string') {
        answer += payload.text;
        handlers.onChunk({ text: payload.text });
      }

      if (eventType === 'done') {
        answer = cleanAiResponseText(payload.answer ?? answer);
        citations = payload.citations ?? citations;
        handlers.onDone?.({ answer, citations });
        return { answer, citations };
      }
    }
  }

  handlers.onError?.({
    code: 'stream_ended_without_done',
    message: 'SSE stream ended without a done event',
    skippedFrames,
  });

  const cleanAnswer = cleanAiResponseText(answer);
  handlers.onDone?.({ answer: cleanAnswer, citations });
  return { answer: cleanAnswer, citations };
}

export function getWorkoutInsights(body: InsightRequest): Promise<InsightResponse> {
  return post<InsightResponse>('/api/insights', body);
}

// ─── Pre-Workout Briefing ──────────────────────────────────────────────────────

export interface BriefingRequest {
  exerciseNames: string[];
  recentHistory: Array<{ name: string; recent: string[] }>;
  userContext: { goal: string; experienceLevel: string };
}

export interface BriefingResponse {
  briefing: string;
}

export function getPreWorkoutBriefing(body: BriefingRequest): Promise<BriefingResponse> {
  return post<BriefingResponse>('/api/briefing', body);
}

// ─── Meal Plan ────────────────────────────────────────────────────────────────

export interface MealPlanRequest {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  planType?: 'weight-loss' | 'weight-gain' | 'maintenance';
  preferences?: string;
}

export interface MealPlanApiResponse {
  plan: import('../types').MealPlan;
}

export function getMealPlan(body: MealPlanRequest): Promise<MealPlanApiResponse> {
  return post<MealPlanApiResponse>('/api/meal-plan', body);
}
