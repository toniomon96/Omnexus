import type { Course, Exercise, MuscleGroup, WorkoutHistory } from '../types';

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

function createEmptyWeeklyVolume(): Record<MuscleGroup, number[]> {
  return {
    chest: [],
    back: [],
    shoulders: [],
    biceps: [],
    triceps: [],
    quads: [],
    hamstrings: [],
    glutes: [],
    calves: [],
    core: [],
    cardio: [],
  };
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

export async function getWeeklyVolumeByMuscleMap(
  history: WorkoutHistory,
  weeks = 4,
): Promise<Record<MuscleGroup, number[]>> {
  const result = createEmptyWeeklyVolume();
  const ids = Array.from(
    new Set(history.sessions.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseId))),
  );
  const summaries = await getExerciseSummaryMap(ids);

  const now = new Date();
  for (let weekIndex = weeks - 1; weekIndex >= 0; weekIndex -= 1) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (weekIndex + 1) * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekSessions = history.sessions.filter((session) => {
      const startedAt = new Date(session.startedAt).getTime();
      return startedAt >= weekStart.getTime() && startedAt < weekEnd.getTime();
    });

    const muscleVolume: Partial<Record<MuscleGroup, number>> = {};
    weekSessions.forEach((session) => {
      session.exercises.forEach((loggedExercise) => {
        const summary = summaries[loggedExercise.exerciseId];
        if (!summary) return;

        const volume = loggedExercise.sets.reduce(
          (total, set) => total + (set.completed ? set.weight * set.reps : 0),
          0,
        );

        summary.primaryMuscles.forEach((muscle) => {
          muscleVolume[muscle] = (muscleVolume[muscle] ?? 0) + volume;
        });
      });
    });

    (Object.keys(result) as MuscleGroup[]).forEach((muscle) => {
      result[muscle].push(muscleVolume[muscle] ?? 0);
    });
  }

  return result;
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