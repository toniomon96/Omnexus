import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { identify } from '../lib/analytics';
import type { User, WorkoutSession, WorkoutHistory, LearningProgress, QuizAttempt } from '../types';
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
} from '../utils/localStorage';

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
  | { type: 'RECORD_QUIZ_ATTEMPT'; payload: { moduleId: string; attempt: QuizAttempt } };

// ─── Reducer ──────────────────────────────────────────────────────────────────

/** @internal Exported for unit testing */
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
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
  return {
    user: getUser(),
    history: getHistory(),
    activeSession: getActiveSession(),
    theme: getTheme(),
    learningProgress: getLearningProgress(),
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
