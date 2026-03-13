import type {
  User,
  WorkoutHistory,
  WorkoutSession,
  PersonalRecord,
  Measurement,
  MeasurementMetric,
  LearningProgress,
  InsightSession,
  ArticleCache,
  Program,
  WorkoutTemplate,
  HealthArticle,
  WeightUnit,
  WorkoutFeedback,
  GamificationData,
} from '../types';

const KEYS = {
  // Legacy fitness tracking keys (unchanged — preserve existing data)
  USER: 'fit_user',
  HISTORY: 'fit_history',
  ACTIVE_SESSION: 'fit_active_session',
  THEME: 'fit_theme',
  PROGRAM_WEEK_CURSOR: 'fit_program_week_cursor',
  PROGRAM_DAY_CURSOR: 'fit_program_day_cursor',
  // Omnexus platform keys
  LEARNING_PROGRESS: 'omnexus_learning_progress',
  INSIGHT_SESSIONS: 'omnexus_insight_sessions',
  ARTICLE_CACHE: 'omnexus_article_cache',
  CUSTOM_PROGRAMS: 'omnexus_custom_programs',
  WORKOUT_TEMPLATES: 'omnexus_workout_templates',
  DAILY_SNIPPET_CACHE: 'omnexus_daily_snippet',
  GUEST_PROFILE: 'omnexus_guest',
  MEASUREMENTS: 'omnexus_measurements',
  WEIGHT_UNIT: 'omnexus_weight_unit',
  EXPERIENCE_MODE: 'omnexus_experience_mode',
  WORKOUT_FEEDBACK: 'omnexus_workout_feedback',
  GAMIFICATION: 'omnexus_gamification',
  DAILY_CHALLENGE: 'omnexus_daily_challenge',
} as const;

export const WEIGHT_UNIT_CHANGED_EVENT = 'omnexus:weight-unit-changed';

export type ExperienceMode = 'guided' | 'advanced';

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      // Free up space by pruning the largest non-critical caches
      localStorage.removeItem('omnexus_article_cache');
      localStorage.removeItem('omnexus_insight_sessions');
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        console.error(`[localStorage] Quota exceeded — could not save "${key}"`);
      }
    }
  }
}

// ─── User ─────────────────────────────────────────────────────────────────────

export function getUser(): User | null {
  return safeRead<User | null>(KEYS.USER, null);
}

export function setUser(user: User): void {
  safeWrite(KEYS.USER, user);
}

export function clearUser(): void {
  localStorage.removeItem(KEYS.USER);
}

// ─── History ──────────────────────────────────────────────────────────────────

function createEmptyHistory(): WorkoutHistory {
  return { sessions: [], personalRecords: [] };
}

export function getHistory(): WorkoutHistory {
  return safeRead<WorkoutHistory>(KEYS.HISTORY, createEmptyHistory());
}

export function appendSession(session: WorkoutSession): void {
  const history = getHistory();
  history.sessions.push(session);
  safeWrite(KEYS.HISTORY, history);
}

export function updateSession(updated: WorkoutSession): void {
  const history = getHistory();
  history.sessions = history.sessions.map((s) =>
    s.id === updated.id ? updated : s,
  );
  safeWrite(KEYS.HISTORY, history);
}

export function updateSessionSyncStatus(
  sessionId: string,
  syncStatus: WorkoutSession['syncStatus'],
  syncStatusUpdatedAt = new Date().toISOString(),
): WorkoutSession | null {
  const history = getHistory();
  const existing = history.sessions.find((session) => session.id === sessionId);
  if (!existing) return null;

  const updatedSession: WorkoutSession = {
    ...existing,
    syncStatus,
    syncStatusUpdatedAt,
  };

  history.sessions = history.sessions.map((session) =>
    session.id === sessionId ? updatedSession : session,
  );
  safeWrite(KEYS.HISTORY, history);
  return updatedSession;
}

export function updatePersonalRecords(prs: PersonalRecord[]): void {
  const history = getHistory();
  // Merge: for each PR, replace existing record for that exercise if new one is better
  for (const pr of prs) {
    const idx = history.personalRecords.findIndex(
      (r) => r.exerciseId === pr.exerciseId,
    );
    if (idx >= 0) {
      history.personalRecords[idx] = pr;
    } else {
      history.personalRecords.push(pr);
    }
  }
  safeWrite(KEYS.HISTORY, history);
}

// ─── Active Session ───────────────────────────────────────────────────────────

export function getActiveSession(): WorkoutSession | null {
  return safeRead<WorkoutSession | null>(KEYS.ACTIVE_SESSION, null);
}

export function setActiveSession(session: WorkoutSession): void {
  safeWrite(KEYS.ACTIVE_SESSION, session);
}

export function clearActiveSession(): void {
  localStorage.removeItem(KEYS.ACTIVE_SESSION);
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export function getTheme(): 'dark' | 'light' {
  const stored = safeRead<'dark' | 'light' | null>(KEYS.THEME, null);
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function setTheme(theme: 'dark' | 'light'): void {
  safeWrite(KEYS.THEME, theme);
}

export function getWeightUnit(): WeightUnit {
  const stored = safeRead<WeightUnit | null>(KEYS.WEIGHT_UNIT, null);
  return stored === 'kg' ? 'kg' : 'lbs';
}

export function setWeightUnit(unit: WeightUnit): void {
  safeWrite(KEYS.WEIGHT_UNIT, unit);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(WEIGHT_UNIT_CHANGED_EVENT, { detail: unit }));
  }
}

export function getExperienceMode(userId?: string): ExperienceMode {
  const allModes = safeRead<Record<string, ExperienceMode>>(
    KEYS.EXPERIENCE_MODE,
    {},
  );
  if (!userId) return 'guided';
  return allModes[userId] ?? 'guided';
}

export function setExperienceMode(userId: string, mode: ExperienceMode): void {
  const allModes = safeRead<Record<string, ExperienceMode>>(
    KEYS.EXPERIENCE_MODE,
    {},
  );
  allModes[userId] = mode;
  safeWrite(KEYS.EXPERIENCE_MODE, allModes);
}

// ─── Program Cursors ──────────────────────────────────────────────────────────

export function getProgramWeekCursor(programId: string): number {
  const cursors = safeRead<Record<string, number>>(
    KEYS.PROGRAM_WEEK_CURSOR,
    {},
  );
  return cursors[programId] ?? 1;
}

export function setProgramWeekCursor(programId: string, week: number): void {
  const cursors = safeRead<Record<string, number>>(
    KEYS.PROGRAM_WEEK_CURSOR,
    {},
  );
  cursors[programId] = week;
  safeWrite(KEYS.PROGRAM_WEEK_CURSOR, cursors);
}

export function getProgramDayCursor(programId: string): number {
  const cursors = safeRead<Record<string, number>>(KEYS.PROGRAM_DAY_CURSOR, {});
  return cursors[programId] ?? 0;
}

export function setProgramDayCursor(programId: string, dayIdx: number): void {
  const cursors = safeRead<Record<string, number>>(KEYS.PROGRAM_DAY_CURSOR, {});
  cursors[programId] = dayIdx;
  safeWrite(KEYS.PROGRAM_DAY_CURSOR, cursors);
}

export function resetProgramCursors(programId: string): void {
  setProgramWeekCursor(programId, 1);
  setProgramDayCursor(programId, 0);
}

// ─── Learning Progress ────────────────────────────────────────────────────────

const EMPTY_LEARNING_PROGRESS: LearningProgress = {
  completedLessons: [],
  completedModules: [],
  completedCourses: [],
  quizScores: {},
  lastActivityAt: '',
};

export function getLearningProgress(): LearningProgress {
  return safeRead<LearningProgress>(KEYS.LEARNING_PROGRESS, EMPTY_LEARNING_PROGRESS);
}

export function setLearningProgress(progress: LearningProgress): void {
  safeWrite(KEYS.LEARNING_PROGRESS, progress);
}

// ─── Insight Sessions ─────────────────────────────────────────────────────────

export function getInsightSessions(): InsightSession[] {
  return safeRead<InsightSession[]>(KEYS.INSIGHT_SESSIONS, []);
}

export function appendInsightSession(session: InsightSession): void {
  const sessions = getInsightSessions();
  // Keep the 50 most recent sessions to avoid unbounded growth
  const trimmed = [session, ...sessions].slice(0, 50);
  safeWrite(KEYS.INSIGHT_SESSIONS, trimmed);
}

export function clearInsightSessions(): void {
  localStorage.removeItem(KEYS.INSIGHT_SESSIONS);
}

// ─── Article Cache ────────────────────────────────────────────────────────────

const EMPTY_ARTICLE_CACHE: ArticleCache = {
  articles: [],
  lastFetchedAt: {},
};

export function getArticleCache(): ArticleCache {
  return safeRead<ArticleCache>(KEYS.ARTICLE_CACHE, EMPTY_ARTICLE_CACHE);
}

export function setArticleCache(cache: ArticleCache): void {
  safeWrite(KEYS.ARTICLE_CACHE, cache);
}

// ─── Custom Programs ──────────────────────────────────────────────────────────

export function getCustomPrograms(): Program[] {
  return safeRead<Program[]>(KEYS.CUSTOM_PROGRAMS, []);
}

export function setCustomPrograms(programs: Program[]): void {
  safeWrite(KEYS.CUSTOM_PROGRAMS, programs);
}

export function saveCustomProgram(program: Program): void {
  const existing = getCustomPrograms();
  const idx = existing.findIndex((p) => p.id === program.id);
  if (idx >= 0) {
    existing[idx] = program;
  } else {
    existing.push(program);
  }
  safeWrite(KEYS.CUSTOM_PROGRAMS, existing);
}

export function deleteCustomProgram(id: string): void {
  const existing = getCustomPrograms().filter((p) => p.id !== id);
  safeWrite(KEYS.CUSTOM_PROGRAMS, existing);
}

// ─── Workout Templates ────────────────────────────────────────────────────────

export function getWorkoutTemplates(): WorkoutTemplate[] {
  return safeRead<WorkoutTemplate[]>(KEYS.WORKOUT_TEMPLATES, []);
}

export function setWorkoutTemplates(templates: WorkoutTemplate[]): void {
  safeWrite(KEYS.WORKOUT_TEMPLATES, templates);
}

export function saveWorkoutTemplate(template: WorkoutTemplate): void {
  const existing = getWorkoutTemplates();
  const idx = existing.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    existing[idx] = template;
  } else {
    existing.push(template);
  }
  safeWrite(KEYS.WORKOUT_TEMPLATES, existing);
}

export function deleteWorkoutTemplate(id: string): void {
  const existing = getWorkoutTemplates().filter((t) => t.id !== id);
  safeWrite(KEYS.WORKOUT_TEMPLATES, existing);
}

// ─── Daily Snippet Cache ──────────────────────────────────────────────────────

export function getDailySnippetCache(): { date: string; article: HealthArticle } | null {
  return safeRead<{ date: string; article: HealthArticle } | null>(KEYS.DAILY_SNIPPET_CACHE, null);
}

export function setDailySnippetCache(data: { date: string; article: HealthArticle }): void {
  safeWrite(KEYS.DAILY_SNIPPET_CACHE, data);
}

// ─── Measurements ────────────────────────────────────────────────────────────

export function getMeasurements(userId: string, metric?: MeasurementMetric): Measurement[] {
  const all = safeRead<Measurement[]>(KEYS.MEASUREMENTS, []);
  return all.filter((entry) => entry.userId === userId && (!metric || entry.metric === metric));
}

export function saveMeasurement(
  data: Omit<Measurement, 'id' | 'createdAt'>,
): Measurement {
  const all = safeRead<Measurement[]>(KEYS.MEASUREMENTS, []);
  const entry: Measurement = {
    ...data,
    id: `measurement_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  safeWrite(KEYS.MEASUREMENTS, [...all, entry]);
  return entry;
}

export function removeMeasurement(id: string, userId: string): void {
  const all = safeRead<Measurement[]>(KEYS.MEASUREMENTS, []);
  safeWrite(
    KEYS.MEASUREMENTS,
    all.filter((entry) => !(entry.id === id && entry.userId === userId)),
  );
}

// ─── Guest Profile ────────────────────────────────────────────────────────────

export function getGuestProfile(): User | null {
  return safeRead<User | null>(KEYS.GUEST_PROFILE, null);
}

export function setGuestProfile(profile: User): void {
  safeWrite(KEYS.GUEST_PROFILE, profile);
  // Also write to fit_user so existing code that reads the user sees it
  safeWrite(KEYS.USER, profile);
}

export function clearGuestProfile(): void {
  localStorage.removeItem(KEYS.GUEST_PROFILE);
}

/** Remove all app-owned keys without touching third-party entries (e.g. cookie consent). */
export function clearAppStorage(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

// ─── Workout Feedback ─────────────────────────────────────────────────────────

/** Save feedback for a completed workout. Keeps the 20 most recent entries. */
export function saveWorkoutFeedback(feedback: WorkoutFeedback): void {
  const existing = safeRead<WorkoutFeedback[]>(KEYS.WORKOUT_FEEDBACK, []);
  // Deduplicate by sessionId — replace if already exists
  const filtered = existing.filter((f) => f.sessionId !== feedback.sessionId);
  const updated = [feedback, ...filtered].slice(0, 20);
  safeWrite(KEYS.WORKOUT_FEEDBACK, updated);
}

/** Return the most recent feedback note as a plain string, or undefined if none. */
export function getMostRecentFeedbackNote(): string | undefined {
  const all = safeRead<WorkoutFeedback[]>(KEYS.WORKOUT_FEEDBACK, []);
  if (!all.length) return undefined;
  const latest = all[0];
  const parts: string[] = [];
  if (latest.rating <= 2) parts.push('Last workout felt very hard / unsatisfying');
  else if (latest.rating === 3) parts.push('Last workout felt average');
  else if (latest.rating >= 4) parts.push('Last workout felt great');
  if (latest.notes?.trim()) parts.push(latest.notes.trim());
  return parts.join('. ') || undefined;
}

// ─── Gamification ─────────────────────────────────────────────────────────────

const EMPTY_GAMIFICATION: GamificationData = {
  totalXp: 0,
  streak: 0,
  streakUpdatedDate: '',
  sparks: 0,
  unlockedAchievementIds: [],
  weeklyXp: 0,
  weeklyXpResetDate: '',
};

export function getGamificationData(): GamificationData {
  return safeRead<GamificationData>(KEYS.GAMIFICATION, EMPTY_GAMIFICATION);
}

export function setGamificationData(data: GamificationData): void {
  safeWrite(KEYS.GAMIFICATION, data);
}

// ─── Daily Challenge ──────────────────────────────────────────────────────────

export interface DailyChallengeState {
  /** YYYY-MM-DD UTC — the day this challenge applies to */
  date: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  completed: boolean;
}

export function getDailyChallengeState(): DailyChallengeState | null {
  return safeRead<DailyChallengeState | null>(KEYS.DAILY_CHALLENGE, null);
}

export function setDailyChallengeState(state: DailyChallengeState): void {
  safeWrite(KEYS.DAILY_CHALLENGE, state);
}
