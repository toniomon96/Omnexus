import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShareCardModal } from '../components/ui/ShareCardModal';
import { getCourseById } from '../data/courses';
import { useLearningProgress } from '../hooks/useLearningProgress';
import { generateCourseCompletionCard } from '../utils/shareCard';
import { CheckCircle, Circle, ChevronRight, Clock, BookOpen, Share2 } from 'lucide-react';

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isLessonComplete, isModuleComplete, isCourseComplete, completeCourse, progress } = useLearningProgress();
  const [showShareModal, setShowShareModal] = useState(false);

  const course = courseId ? getCourseById(courseId) : undefined;

  const allLessonIds = course?.modules.flatMap((m) => m.lessons.map((l) => l.id)) ?? [];
  const completedCount = allLessonIds.filter((id) => isLessonComplete(id)).length;
  const totalCount = allLessonIds.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = pct === 100 && totalCount > 0;

  // Auto-record course completion when all lessons are done
  useEffect(() => {
    if (isComplete && courseId && !isCourseComplete(courseId)) {
      completeCourse(courseId);
    }
  }, [isComplete, courseId, isCourseComplete, completeCourse]);

  if (!course) {
    return (
      <AppShell>
        <TopBar title="Course" showBack />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-slate-400 text-sm">Course not found.</p>
        </div>
      </AppShell>
    );
  }

  // Find the first module that isn't fully complete
  const nextModule = course.modules.find((m) => !isModuleComplete(m.id));

  function moduleStatus(moduleId: string, lessonIds: string[]) {
    if (isModuleComplete(moduleId)) return 'complete';
    const done = lessonIds.filter((id) => isLessonComplete(id)).length;
    if (done > 0) return 'in-progress';
    return 'not-started';
  }

  return (
    <AppShell>
      <TopBar title={course.title} showBack />
      <div className="px-4 pb-8 pt-4 space-y-6">

        {/* Course hero */}
        <div className="text-center py-2">
          <span className="text-5xl">{course.coverEmoji}</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-3 leading-snug">
            {course.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {course.description}
          </p>
          <div className="flex items-center justify-center gap-5 mt-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock size={13} />
              <span>{course.estimatedMinutes} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen size={13} />
              <span>{totalCount} lessons</span>
            </div>
          </div>
        </div>

        {/* Progress bar (once started) */}
        {completedCount > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>{completedCount}/{totalCount} lessons complete</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Course completion certificate banner */}
        {isComplete && (
          <div className="rounded-2xl bg-gradient-to-br from-brand-600/20 to-violet-600/10 border border-brand-500/30 p-5 text-center space-y-3">
            <p className="text-3xl">🎓</p>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Course Complete!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                You finished all {totalCount} lessons in {course.title}.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-2"
            >
              <Share2 size={15} />
              Share certificate
            </Button>
          </div>
        )}

        {/* Primary CTA */}
        {nextModule && (
          <Button
            fullWidth
            onClick={() => navigate(`/learn/${course.id}/${nextModule.id}`)}
          >
            {completedCount === 0 ? 'Start Course' : 'Continue'}
          </Button>
        )}

        {/* Modules list */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Modules
          </p>
          <div className="space-y-3">
            {course.modules.map((mod, i) => {
              const lessonIds = mod.lessons.map((l) => l.id);
              const status = moduleStatus(mod.id, lessonIds);
              const completedLessons = lessonIds.filter((id) =>
                isLessonComplete(id),
              ).length;
              const quizScore = mod.quiz
                ? progress.quizScores[mod.quiz.id]
                : undefined;

              return (
                <Card
                  key={mod.id}
                  hover
                  onClick={() => navigate(`/learn/${course.id}/${mod.id}`)}
                >
                  <div className="flex items-center gap-3">
                    {/* Status icon */}
                    {status === 'complete' ? (
                      <CheckCircle
                        size={20}
                        className="text-green-500 shrink-0"
                      />
                    ) : status === 'in-progress' ? (
                      <div className="h-5 w-5 rounded-full border-2 border-brand-500 flex items-center justify-center shrink-0">
                        <div className="h-2 w-2 rounded-full bg-brand-500" />
                      </div>
                    ) : (
                      <Circle
                        size={20}
                        className="text-slate-300 dark:text-slate-600 shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 mb-0.5">
                        Module {i + 1}
                      </p>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">
                        {mod.title}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-slate-400">
                          {completedLessons}/{mod.lessons.length} lessons
                          {mod.quiz ? ' · Quiz' : ''}
                        </p>
                        {quizScore && (
                          <p className="text-xs font-medium text-green-600 dark:text-green-400">
                            Quiz: {quizScore.score}%
                          </p>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      size={16}
                      className="text-slate-400 shrink-0"
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed px-2">
          All content is for educational purposes only and cites peer-reviewed
          research. It does not constitute medical advice.
        </p>

      </div>

      {/* Course completion share modal */}
      <ShareCardModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        generate={() => generateCourseCompletionCard({
          courseTitle: course.title,
          courseEmoji: course.coverEmoji,
          lessonCount: totalCount,
          date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        })}
        filename={`omnexus-course-${course.id}.png`}
        title="Share your certificate"
      />
    </AppShell>
  );
}


