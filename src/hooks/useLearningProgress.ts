import { useApp } from '../store/AppContext';
import type { QuizAttempt } from '../types';
import { computeNewStreak } from '../utils/streakUtils';
import { getGamificationData, getDailyChallengeState, setDailyChallengeState } from '../utils/localStorage';
import { todayUTC } from '../utils/streakUtils';

export function useLearningProgress() {
  const { state, dispatch } = useApp();
  const progress = state.learningProgress;

  function triggerStreakUpdate() {
    const { streak, streakUpdatedDate } = getGamificationData();
    const { newStreak, isNewDay, hitMilestone } = computeNewStreak(streak, streakUpdatedDate);
    if (!isNewDay) return;
    dispatch({ type: 'SET_STREAK', payload: newStreak });
    if (hitMilestone) {
      dispatch({ type: 'AWARD_XP', payload: { eventType: 'streak_milestone' } });
      dispatch({ type: 'AWARD_SPARKS', payload: 10 });
    }
  }

  function completeLesson(lessonId: string) {
    dispatch({ type: 'COMPLETE_LESSON', payload: lessonId });
    // Award XP for each newly completed lesson (guard against double-counting)
    if (!progress.completedLessons.includes(lessonId)) {
      dispatch({ type: 'AWARD_XP', payload: { eventType: 'lesson_completed', referenceId: lessonId } });
      // Check daily challenge
      const today = todayUTC();
      const challenge = getDailyChallengeState();
      if (challenge && challenge.date === today && challenge.lessonId === lessonId && !challenge.completed) {
        setDailyChallengeState({ ...challenge, completed: true });
        // Bonus for completing the daily challenge
        dispatch({ type: 'AWARD_XP', payload: { eventType: 'daily_checkin' } });
      }
    }
    triggerStreakUpdate();
  }

  function completeModule(moduleId: string) {
    dispatch({ type: 'COMPLETE_MODULE', payload: moduleId });
  }

  function completeCourse(courseId: string) {
    dispatch({ type: 'COMPLETE_COURSE', payload: courseId });
    if (!progress.completedCourses.includes(courseId)) {
      dispatch({ type: 'AWARD_SPARKS', payload: 25 });
    }
  }

  function recordQuizAttempt(moduleId: string, attempt: QuizAttempt, amountOverride?: number) {
    dispatch({ type: 'RECORD_QUIZ_ATTEMPT', payload: { moduleId, attempt } });
    // Award XP for passing a quiz (score >= 60%)
    if (attempt.score >= 60) {
      dispatch({ type: 'AWARD_XP', payload: { eventType: 'quiz_passed', referenceId: moduleId, amountOverride } });
    }
  }

  function isLessonComplete(lessonId: string): boolean {
    return progress.completedLessons.includes(lessonId);
  }

  function isModuleComplete(moduleId: string): boolean {
    return progress.completedModules.includes(moduleId);
  }

  function isCourseComplete(courseId: string): boolean {
    return progress.completedCourses.includes(courseId);
  }

  /** Returns count of completed lessons out of the given lesson ID list. */
  function countCompletedLessons(lessonIds: string[]): number {
    return lessonIds.filter((id) => progress.completedLessons.includes(id)).length;
  }

  return {
    progress,
    completeLesson,
    completeModule,
    completeCourse,
    recordQuizAttempt,
    isLessonComplete,
    isModuleComplete,
    isCourseComplete,
    countCompletedLessons,
  };
}
