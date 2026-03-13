import type { WorkoutSession, NutritionLog, EarnedAchievement } from '../types';
import { ACHIEVEMENTS } from '../data/achievements';

const STORAGE_KEY = 'omnexus_achievements';

// ─── Load / Save ─────────────────────────────────────────────────────────────

export function loadEarnedAchievements(): EarnedAchievement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EarnedAchievement[]) : [];
  } catch {
    return [];
  }
}

export function saveEarnedAchievements(earned: EarnedAchievement[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(earned));
}

// ─── Core evaluator ──────────────────────────────────────────────────────────

export interface AchievementCheckContext {
  sessions: WorkoutSession[];
  nutritionLogs: NutritionLog[];
  completedLessonIds: string[];
  completedCourseIds: string[];
  perfectQuizIds: string[];
  hasActiveProgramId: boolean;
  hasAiProgram: boolean;
  currentStreak: number;
}

/**
 * Returns the list of newly-earned achievement IDs, and persists them.
 */
export function evaluateAchievements(ctx: AchievementCheckContext): string[] {
  const earned = loadEarnedAchievements();
  const earnedIds = new Set(earned.map(e => e.id));
  const newlyEarned: string[] = [];

  function check(id: string, condition: boolean) {
    if (condition && !earnedIds.has(id)) {
      newlyEarned.push(id);
      earned.push({ id, earnedAt: new Date().toISOString() });
      earnedIds.add(id);
    }
  }

  const totalWorkouts = ctx.sessions.length;
  const totalPRs = ctx.sessions.reduce((acc, s) => {
    return acc + s.exercises.reduce((a2, ex) => {
      return a2 + ex.sets.filter(set => set.isPersonalRecord).length;
    }, 0);
  }, 0);

  // Workout achievements
  check('first-workout', totalWorkouts >= 1);
  check('workout-5', totalWorkouts >= 5);
  check('workout-25', totalWorkouts >= 25);
  check('workout-100', totalWorkouts >= 100);
  check('first-pr', totalPRs >= 1);
  check('pr-10', totalPRs >= 10);

  // Program achievements
  check('first-program', ctx.hasActiveProgramId);
  check('ai-program', ctx.hasAiProgram);

  // Learning achievements
  check('first-lesson', ctx.completedLessonIds.length >= 1);
  check('lessons-10', ctx.completedLessonIds.length >= 10);
  check('course-complete', ctx.completedCourseIds.length >= 1);
  check('quiz-perfect', ctx.perfectQuizIds.length >= 1);

  // Streak achievements
  check('streak-3', ctx.currentStreak >= 3);
  check('streak-7', ctx.currentStreak >= 7);
  check('streak-30', ctx.currentStreak >= 30);

  // Nutrition achievements
  check('log-meal', ctx.nutritionLogs.length >= 1);
  check('log-7-days', hasSevenDayNutritionStreak(ctx.nutritionLogs));

  if (newlyEarned.length > 0) {
    saveEarnedAchievements(earned);
  }

  return newlyEarned;
}

// ─── Progress helper ─────────────────────────────────────────────────────────

export function getAchievementProgress(
  id: string,
  ctx: AchievementCheckContext
): number {
  const totalWorkouts = ctx.sessions.length;
  const totalPRs = ctx.sessions.reduce((acc, s) => {
    return acc + s.exercises.reduce((a2, ex) => {
      return a2 + ex.sets.filter(set => set.isPersonalRecord).length;
    }, 0);
  }, 0);

  switch (id) {
    case 'first-workout':
    case 'workout-5':
    case 'workout-25':
    case 'workout-100':
      return totalWorkouts;
    case 'first-pr':
    case 'pr-10':
      return totalPRs;
    case 'first-lesson':
    case 'lessons-10':
      return ctx.completedLessonIds.length;
    case 'course-complete':
      return ctx.completedCourseIds.length;
    case 'quiz-perfect':
      return ctx.perfectQuizIds.length;
    case 'first-program':
      return ctx.hasActiveProgramId ? 1 : 0;
    case 'ai-program':
      return ctx.hasAiProgram ? 1 : 0;
    case 'streak-3':
    case 'streak-7':
    case 'streak-30':
      return ctx.currentStreak;
    case 'log-meal':
      return ctx.nutritionLogs.length > 0 ? 1 : 0;
    case 'log-7-days':
      return Math.min(countNutritionStreak(ctx.nutritionLogs), 7);
    default:
      return 0;
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function hasSevenDayNutritionStreak(logs: NutritionLog[]): boolean {
  return countNutritionStreak(logs) >= 7;
}

function countNutritionStreak(logs: NutritionLog[]): number {
  if (logs.length === 0) return 0;
  const days = new Set(logs.map(l => l.loggedAt.slice(0, 10)));
  const sorted = Array.from(days).sort().reverse();
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86_400_000;
    if (Math.round(diff) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Achievement metadata lookup ─────────────────────────────────────────────

export { ACHIEVEMENTS };
