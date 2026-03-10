/**
 * One-time migration: copies existing localStorage data into Supabase.
 * Runs on the first login after Phase 3 is deployed. Idempotent — safe to retry.
 */

import {
  upsertCustomProgram,
  upsertLearningProgress,
  upsertPersonalRecords,
  upsertSession,
} from './dbHydration';
import {
  getHistory,
  getLearningProgress,
  getCustomPrograms,
} from '../utils/localStorage';

const MIGRATION_KEY = 'omnexus_migrated_v1';

export async function runMigrationIfNeeded(userId: string): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const history = getHistory();
  const learningProgress = getLearningProgress();
  const customPrograms = getCustomPrograms();

  const hasSessions = history.sessions.length > 0;
  const hasPRs = history.personalRecords.length > 0;
  const hasLearning =
    learningProgress.completedLessons.length > 0 ||
    learningProgress.completedModules.length > 0 ||
    learningProgress.completedCourses.length > 0;
  const hasCustomPrograms = customPrograms.length > 0;

  if (!hasSessions && !hasPRs && !hasLearning && !hasCustomPrograms) {
    localStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  try {
    await Promise.all([
      hasSessions &&
        Promise.all(history.sessions.map((s) => upsertSession(s, userId))),
      hasPRs && upsertPersonalRecords(history.personalRecords, userId),
      hasLearning && upsertLearningProgress(learningProgress, userId),
      hasCustomPrograms &&
        Promise.all(
          customPrograms.map((p) => upsertCustomProgram(p, userId)),
        ),
    ]);

    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch (err) {
    console.error('[dataMigration] Migration failed — will retry next login:', err);
  }
}
