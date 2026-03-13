/**
 * Daily Challenge
 *
 * Picks one lesson per UTC day deterministically so every user sees the same
 * challenge. The selection is seeded by the date string so it rotates at UTC
 * midnight with no server involvement.
 */

import { courses } from '../data/courses';
import { getDailyChallengeState, setDailyChallengeState } from './localStorage';
import type { DailyChallengeState } from './localStorage';
import { todayUTC } from './streakUtils';

interface LessonRef {
  courseId: string;
  moduleId: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
}

function hashDate(date: string): number {
  let h = 0;
  for (const c of date) {
    h = ((h * 31) + c.charCodeAt(0)) & 0x7fffffff;
  }
  return h;
}

function buildLessonPool(): LessonRef[] {
  return courses.flatMap((course) =>
    course.modules.flatMap((mod) =>
      mod.lessons.map((lesson) => ({
        courseId: course.id,
        moduleId: mod.id,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        courseTitle: course.title,
      })),
    ),
  );
}

/**
 * Returns today's daily challenge, loading from the localStorage cache when
 * the date matches, or recomputing and persisting when it's a new day.
 *
 * Returns `null` when no lesson content exists yet.
 */
export function getTodaysDailyChallenge(): DailyChallengeState | null {
  const today = todayUTC();

  const cached = getDailyChallengeState();
  if (cached && cached.date === today) return cached;

  const pool = buildLessonPool();
  if (!pool.length) return null;

  const ref = pool[hashDate(today) % pool.length];
  const state: DailyChallengeState = {
    date: today,
    courseId: ref.courseId,
    moduleId: ref.moduleId,
    lessonId: ref.lessonId,
    lessonTitle: ref.lessonTitle,
    courseTitle: ref.courseTitle,
    completed: false,
  };
  setDailyChallengeState(state);
  return state;
}
