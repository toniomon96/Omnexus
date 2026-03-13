import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { LessonReader } from '../components/learn/LessonReader';
import { QuizBlock } from '../components/learn/QuizBlock';
import { getCourseById, getModuleById } from '../data/courses';
import { useLearningProgress } from '../hooks/useLearningProgress';
import type { QuizAttempt } from '../types';

import { xpAmountFor } from '../lib/xpEngine';

// ─── Combo multiplier ──────────────────────────────────────────────────────────

function quizComboMultiplier(maxCorrectStreak: number): number {
  if (maxCorrectStreak >= 10) return 2.0;
  if (maxCorrectStreak >= 5) return 1.5;
  if (maxCorrectStreak >= 3) return 1.25;
  return 1.0;
}

export function LessonPage() {
  const { courseId, moduleId } = useParams<{
    courseId: string;
    moduleId: string;
  }>();
  const navigate = useNavigate();
  const {
    completeLesson,
    completeModule,
    completeCourse,
    recordQuizAttempt,
    isLessonComplete,
    isModuleComplete,
  } = useLearningProgress();

  const course = courseId ? getCourseById(courseId) : undefined;
  const mod = courseId && moduleId ? getModuleById(courseId, moduleId) : undefined;

  // Determine the initial step: first incomplete lesson, or quiz if all lessons done
  const [stepIndex, setStepIndex] = useState(() => {
    if (!mod) return 0;
    const firstIncomplete = mod.lessons.findIndex(
      (l) => !isLessonComplete(l.id),
    );
    if (firstIncomplete !== -1) return firstIncomplete;
    // All lessons complete — go to quiz step (lessons.length) if quiz exists
    return mod.quiz ? mod.lessons.length : 0;
  });

  if (!course || !mod) {
    return (
      <AppShell>
        <TopBar title="Lesson" showBack />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-slate-400 text-sm">Content not found.</p>
        </div>
      </AppShell>
    );
  }

  const totalSteps = mod.lessons.length + (mod.quiz ? 1 : 0);
  const isOnLesson = stepIndex < mod.lessons.length;
  const currentLesson = isOnLesson ? mod.lessons[stepIndex] : null;
  const isOnQuiz = !isOnLesson && !!mod.quiz;

  function handleLessonContinue() {
    if (currentLesson) {
      completeLesson(currentLesson.id);
    }
    const nextStep = stepIndex + 1;
    if (nextStep < totalSteps) {
      setStepIndex(nextStep);
    } else {
      // No quiz — module is done
      finishModule();
    }
  }

  function handleQuizComplete(attempt: QuizAttempt) {
    // Compute combo XP multiplier based on max consecutive correct streak
    const multiplier = quizComboMultiplier(attempt.maxCorrectStreak ?? 0);
    const baseXp = xpAmountFor('quiz_passed');
    const amountOverride = multiplier > 1.0 ? Math.round(baseXp * multiplier) : undefined;

    if (mod!.quiz) {
      recordQuizAttempt(mod!.quiz.id, attempt, amountOverride);
    }
    // Mark all lessons in this module as complete (in case user jumped to quiz)
    mod!.lessons.forEach((l) => completeLesson(l.id));
    finishModule();
  }

  function finishModule() {
    completeModule(mod!.id);
    // Check if all modules in the course are now complete
    const allDone = course!.modules.every(
      (m) => m.id === mod!.id || isModuleComplete(m.id),
    );
    if (allDone) {
      completeCourse(course!.id);
    }
  }

  return (
    <AppShell>
      <TopBar title={mod.title} showBack />
      <div className="px-4 pb-8 pt-4 space-y-6">

        {/* Step progress bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>
              {isOnQuiz ? 'Quiz' : `Lesson ${stepIndex + 1} of ${mod.lessons.length}`}
            </span>
            <span>
              {stepIndex + 1}/{totalSteps}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < stepIndex
                    ? 'bg-brand-500'
                    : i === stepIndex
                      ? 'bg-brand-300'
                      : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Lesson content */}
        {isOnLesson && currentLesson && (
          <div className="space-y-6">
            <LessonReader lesson={currentLesson} />
            <Button fullWidth onClick={handleLessonContinue}>
              {stepIndex + 1 < totalSteps
                ? 'Mark Complete & Continue'
                : 'Complete Lesson'}
            </Button>
          </div>
        )}

        {/* Quiz */}
        {isOnQuiz && mod.quiz && (
          <QuizBlock
            quiz={mod.quiz}
            onComplete={handleQuizComplete}
            onContinue={() => navigate(`/learn/${course.id}`)}
          />
        )}

      </div>
    </AppShell>
  );
}
