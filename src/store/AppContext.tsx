import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { identify } from '../lib/analytics';
import type { User, WorkoutSession, WorkoutHistory, LearningProgress, QuizAttempt, XpProfile, GamificationData, PendingCelebration, CelebrationKind } from '../types';
import {
  getUser,
  getHistory,
  getActiveSession,
  getTheme,
  setTheme as persistTheme,
  getLearningProgress,
  setLearningProgress,
  clearUser,
  clearActiveSession,
  getGamificationData,
  setGamificationData,
} from '../utils/localStorage';
import { buildXpProfile, createXpEvent } from '../lib/xpEngine';
import { evaluateAchievements } from '../data/achievements';
import { currentMondayUTC } from '../utils/streakUtils';
import type { XpEventType } from '../types';

async function syncLearningProgress(progress: LearningProgress, userId: string) {
  const { upsertLearningProgress } = await import('../lib/db');
  return upsertLearningProgress(progress, userId);
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface AppState {
  user: User | null;
  history: WorkoutHistory;
  activeSession: WorkoutSession | null;
  theme: 'dark' | 'light';
  learningProgress: LearningProgress;
  xpProfile: XpProfile | null;
  streak: number;
  sparks: number;
  unlockedAchievementIds: string[];
  pendingCelebrations: PendingCelebration[];
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_ACTIVE_SESSION'; payload: WorkoutSession }
  | { type: 'UPDATE_ACTIVE_SESSION'; payload: WorkoutSession }
  | { type: 'CLEAR_ACTIVE_SESSION' }
  | { type: 'APPEND_SESSION'; payload: WorkoutSession }
  | { type: 'UPDATE_SESSION'; payload: WorkoutSession }
  | { type: 'SET_HISTORY'; payload: WorkoutHistory }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_THEME'; payload: 'dark' | 'light' }
  | { type: 'SET_LEARNING_PROGRESS'; payload: LearningProgress }
  | { type: 'COMPLETE_LESSON'; payload: string }
  | { type: 'COMPLETE_MODULE'; payload: string }
  | { type: 'COMPLETE_COURSE'; payload: string }
  | { type: 'RECORD_QUIZ_ATTEMPT'; payload: { moduleId: string; attempt: QuizAttempt } }
  | { type: 'AWARD_XP'; payload: { eventType: XpEventType; referenceId?: string; amountOverride?: number } }
  | { type: 'SET_GAMIFICATION'; payload: GamificationData }
  | { type: 'SET_STREAK'; payload: number }
  | { type: 'AWARD_SPARKS'; payload: number }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'QUEUE_CELEBRATION'; payload: PendingCelebration }
  | { type: 'DEQUEUE_CELEBRATION'; payload: string };

// ─── Reducer ──────────────────────────────────────────────────────────────────

/** @internal Exported for unit testing */
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER': {
      const gamification = getGamificationData();
      return {
        ...state,
        user: action.payload,
        xpProfile: buildXpProfile(action.payload.id, gamification.totalXp),
      };
    }
    case 'CLEAR_USER': {
      clearUser();
      clearActiveSession();
      return { ...state, user: null, activeSession: null, history: { sessions: [], personalRecords: [] } };
    }
    case 'SET_ACTIVE_SESSION':
    case 'UPDATE_ACTIVE_SESSION':
      return { ...state, activeSession: action.payload };
    case 'CLEAR_ACTIVE_SESSION':
      return { ...state, activeSession: null };
    case 'APPEND_SESSION':
      return {
        ...state,
        history: {
          ...state.history,
          sessions: [...state.history.sessions, action.payload],
        },
      };
    case 'UPDATE_SESSION':
      return {
        ...state,
        history: {
          ...state.history,
          sessions: state.history.sessions.map((s) =>
            s.id === action.payload.id ? action.payload : s,
          ),
        },
      };
    case 'SET_HISTORY':
      return { ...state, history: action.payload };
    case 'TOGGLE_THEME': {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      persistTheme(next);
      return { ...state, theme: next };
    }
    case 'SET_THEME':
      persistTheme(action.payload);
      return { ...state, theme: action.payload };
    case 'SET_LEARNING_PROGRESS':
      setLearningProgress(action.payload);
      return { ...state, learningProgress: action.payload };
    case 'COMPLETE_LESSON': {
      const lessonId = action.payload;
      if (state.learningProgress.completedLessons.includes(lessonId)) return state;
      const updated: LearningProgress = {
        ...state.learningProgress,
        completedLessons: [...state.learningProgress.completedLessons, lessonId],
        lastActivityAt: new Date().toISOString(),
      };
      setLearningProgress(updated);
      return { ...state, learningProgress: updated };
    }
    case 'COMPLETE_MODULE': {
      const moduleId = action.payload;
      if (state.learningProgress.completedModules.includes(moduleId)) return state;
      const updated: LearningProgress = {
        ...state.learningProgress,
        completedModules: [...state.learningProgress.completedModules, moduleId],
        lastActivityAt: new Date().toISOString(),
      };
      setLearningProgress(updated);
      return { ...state, learningProgress: updated };
    }
    case 'COMPLETE_COURSE': {
      const courseId = action.payload;
      if (state.learningProgress.completedCourses.includes(courseId)) return state;
      const updated: LearningProgress = {
        ...state.learningProgress,
        completedCourses: [...state.learningProgress.completedCourses, courseId],
        lastActivityAt: new Date().toISOString(),
      };
      setLearningProgress(updated);
      return { ...state, learningProgress: updated };
    }
    case 'RECORD_QUIZ_ATTEMPT': {
      const { moduleId, attempt } = action.payload;
      const existing = state.learningProgress.quizScores[moduleId];
      // Only persist if it's a new best score
      if (existing && existing.score >= attempt.score) return state;
      const updated: LearningProgress = {
        ...state.learningProgress,
        quizScores: { ...state.learningProgress.quizScores, [moduleId]: attempt },
        lastActivityAt: new Date().toISOString(),
      };
      setLearningProgress(updated);
      return { ...state, learningProgress: updated };
    }
    case 'AWARD_XP': {
      if (!state.user) return state;
      const { eventType, referenceId, amountOverride } = action.payload;
      const event = createXpEvent({ userId: state.user.id, type: eventType, referenceId, amountOverride });
      const newTotal = (state.xpProfile?.totalXp ?? 0) + event.amount;
      const newProfile = buildXpProfile(state.user.id, newTotal);

      // Achievement check
      const newUnlocks = evaluateAchievements({
        totalXp: newTotal,
        streak: state.streak,
        workoutCount: state.history.sessions.length,
        prCount: state.history.personalRecords.length,
        completedLessons: state.learningProgress.completedLessons.length,
        completedCourses: state.learningProgress.completedCourses.length,
        alreadyUnlocked: state.unlockedAchievementIds,
      });
      const newAchievementIds = [
        ...state.unlockedAchievementIds,
        ...newUnlocks.map((a) => a.id),
      ];
      // Stack XP bonus from any unlocked achievements
      const achievementXp = newUnlocks.reduce((sum, a) => sum + a.xpReward, 0);
      const finalTotal = newTotal + achievementXp;
      const finalProfile = achievementXp > 0 ? buildXpProfile(state.user.id, finalTotal) : newProfile;

      // Weekly XP tracking — reset each Monday UTC
      const thisMonday = currentMondayUTC();
      const prevGamification = getGamificationData();
      const weeklyBase = prevGamification.weeklyXpResetDate === thisMonday
        ? (prevGamification.weeklyXp ?? 0)
        : 0;
      const newWeeklyXp = weeklyBase + event.amount + achievementXp;

      const gamification: GamificationData = {
        totalXp: finalTotal,
        streak: state.streak,
        streakUpdatedDate: prevGamification.streakUpdatedDate,
        sparks: state.sparks,
        unlockedAchievementIds: newAchievementIds,
        weeklyXp: newWeeklyXp,
        weeklyXpResetDate: thisMonday,
      };
      setGamificationData(gamification);

      // Fire-and-forget sync to Supabase
      if (!state.user.isGuest) {
        void import('../lib/db')
          .then(({ recordXpEvent }) => recordXpEvent(state.user!.id, event))
          .catch((err) => { if (import.meta.env.DEV) console.error('[AppContext] recordXpEvent failed:', err); });
      }

      const prevRankLabel = state.xpProfile?.rankLabel ?? '';
      const rankUpCelebrations: PendingCelebration[] = prevRankLabel !== '' && prevRankLabel !== finalProfile.rankLabel
        ? [{ id: uuidv4(), kind: 'rank_up' as CelebrationKind, payload: finalProfile.rankLabel, queuedAt: new Date().toISOString() }]
        : [];
      const achievementCelebrations: PendingCelebration[] = newUnlocks.map((a) => ({
        id: uuidv4(),
        kind: 'achievement' as CelebrationKind,
        payload: a.id,
        queuedAt: new Date().toISOString(),
      }));

      return {
        ...state,
        xpProfile: finalProfile,
        unlockedAchievementIds: newAchievementIds,
        pendingCelebrations: [...state.pendingCelebrations, ...rankUpCelebrations, ...achievementCelebrations],
      };
    }
    case 'SET_GAMIFICATION': {
      const { totalXp, streak, sparks, unlockedAchievementIds } = action.payload;
      const profile = state.user ? buildXpProfile(state.user.id, totalXp) : null;
      return { ...state, xpProfile: profile, streak, sparks, unlockedAchievementIds };
    }
    case 'SET_STREAK': {
      const today = new Date().toISOString().split('T')[0];
      const existing = getGamificationData();
      const updated: GamificationData = { ...existing, streak: action.payload, streakUpdatedDate: today };
      setGamificationData(updated);
      const milestoneArr: PendingCelebration[] = [7, 30, 100, 365].includes(action.payload)
        ? [{ id: uuidv4(), kind: 'streak_milestone' as CelebrationKind, payload: String(action.payload), queuedAt: new Date().toISOString() }]
        : [];
      return { ...state, streak: action.payload, pendingCelebrations: [...state.pendingCelebrations, ...milestoneArr] };
    }
    case 'AWARD_SPARKS': {
      const newSparks = state.sparks + action.payload;
      const existing = getGamificationData();
      setGamificationData({ ...existing, sparks: newSparks });
      return { ...state, sparks: newSparks };
    }
    case 'UNLOCK_ACHIEVEMENT': {
      if (state.unlockedAchievementIds.includes(action.payload)) return state;
      const newIds = [...state.unlockedAchievementIds, action.payload];
      const existing = getGamificationData();
      setGamificationData({ ...existing, unlockedAchievementIds: newIds });
      return { ...state, unlockedAchievementIds: newIds };
    }
    case 'QUEUE_CELEBRATION':
      return { ...state, pendingCelebrations: [...state.pendingCelebrations, action.payload] };
    case 'DEQUEUE_CELEBRATION':
      return { ...state, pendingCelebrations: state.pendingCelebrations.filter((c) => c.id !== action.payload) };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

function getInitialState(): AppState {
  const user = getUser();
  const gamification = getGamificationData();
  return {
    user,
    history: getHistory(),
    activeSession: getActiveSession(),
    theme: getTheme(),
    learningProgress: getLearningProgress(),
    xpProfile: user ? buildXpProfile(user.id, gamification.totalXp) : null,
    streak: gamification.streak,
    sparks: gamification.sparks,
    unlockedAchievementIds: gamification.unlockedAchievementIds,
    pendingCelebrations: [],
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  // Apply dark/light class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  // Identify user for analytics on sign-in / sign-out
  useEffect(() => {
    identify(state.user ? state.user.id : 'guest');
  }, [state.user?.id]);

  // Sync learning progress to Supabase — debounced 2s to avoid per-answer writes
  const learningInitRef = useRef(false);
  const learningSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!learningInitRef.current) {
      learningInitRef.current = true;
      return;
    }
    if (!state.user || !state.learningProgress.lastActivityAt) return;
    if (learningSyncTimer.current) clearTimeout(learningSyncTimer.current);
    learningSyncTimer.current = setTimeout(() => {
      syncLearningProgress(state.learningProgress, state.user!.id).catch(
        (err) => console.error('[AppContext] Learning progress sync failed:', err),
      );
    }, 2000);
    return () => {
      if (learningSyncTimer.current) clearTimeout(learningSyncTimer.current);
    };
  }, [state.learningProgress, state.user]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
