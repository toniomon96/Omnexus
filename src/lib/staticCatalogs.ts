import type { Course, Exercise } from '../types';

export interface NextLessonSummary {
  course: Pick<Course, 'id' | 'title'>;
  module: { id: string };
  lesson: { id: string; title: string; estimatedMinutes: number };
}

export interface ExerciseSummary {
  id: string;
  name: string;
  primaryMuscles: Exercise['primaryMuscles'];
  secondaryMuscles: Exercise['secondaryMuscles'];
}

let exercisesPromise: Promise<Exercise[]> | null = null;
let coursesPromise: Promise<Course[]> | null = null;

async function loadExercises(): Promise<Exercise[]> {
  if (!exercisesPromise) {
    exercisesPromise = import('../data/exercises').then((module) => module.exercises);
  }
  return exercisesPromise;
}

async function loadCourses(): Promise<Course[]> {
  if (!coursesPromise) {
    coursesPromise = import('../data/courses').then((module) => module.courses);
  }
  return coursesPromise;
}

export async function getExerciseNameMap(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};

  const exercises = await loadExercises();
  const wanted = new Set(ids);
  const names: Record<string, string> = {};

  exercises.forEach((exercise) => {
    if (wanted.has(exercise.id)) {
      names[exercise.id] = exercise.name;
    }
  });

  return names;
}

export async function getExerciseSummaryMap(ids: string[]): Promise<Record<string, ExerciseSummary>> {
  if (ids.length === 0) return {};

  const exercises = await loadExercises();
  const wanted = new Set(ids);
  const summaries: Record<string, ExerciseSummary> = {};

  exercises.forEach((exercise) => {
    if (wanted.has(exercise.id)) {
      summaries[exercise.id] = {
        id: exercise.id,
        name: exercise.name,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
      };
    }
  });

  return summaries;
}

export async function findNextLessonSummary(
  completedLessons: string[],
  completedCourses: string[],
): Promise<NextLessonSummary | null> {
  const courses = await loadCourses();

  for (const course of courses) {
    if (completedCourses.includes(course.id)) continue;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (!completedLessons.includes(lesson.id)) {
          return {
            course: { id: course.id, title: course.title },
            module: { id: module.id },
            lesson: {
              id: lesson.id,
              title: lesson.title,
              estimatedMinutes: lesson.estimatedMinutes,
            },
          };
        }
      }
    }
  }

  return null;
}