import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { TermHelpChips } from '../components/ui/TermHelpChips';
import { GraduationCap, Sparkles, Search, BookOpen, Dumbbell, Loader2, Zap } from 'lucide-react';
import { courses } from '../data/courses';
import { CourseCard } from '../components/learn/CourseCard';
import { MicroLessonModal } from '../components/learn/MicroLessonModal';
import { useLearningProgress } from '../hooks/useLearningProgress';
import { getContentRecommendations } from '../services/learningService';
import type { ContentRecommendation } from '../types';
import { getExperienceMode } from '../utils/localStorage';

const DIFFICULTY_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

function typeIcon(type: ContentRecommendation['type']) {
  if (type === 'exercise') return <Dumbbell size={12} />;
  if (type === 'course') return <GraduationCap size={12} />;
  return <BookOpen size={12} />;
}

function typeLabel(type: ContentRecommendation['type']) {
  if (type === 'exercise') return 'Exercise';
  if (type === 'course') return 'Course';
  return 'Lesson';
}

export function LearnPage() {
  const { state } = useApp();
  const { progress } = useLearningProgress();
  const navigate = useNavigate();
  const hasActivity = progress.lastActivityAt !== '';

  const goal = state.user?.goal;
  const level = state.user?.experienceLevel;
  const isGuidedMode = state.user ? getExperienceMode(state.user.id) === 'guided' : true;

  // ── Recommended (rule-based, unchanged) ──────────────────────────────────
  const recommended = goal
    ? courses
        .filter((c) => c.relatedGoals.includes(goal))
        .sort((a, b) => {
          const aDiff = Math.abs((DIFFICULTY_ORDER[a.difficulty] ?? 1) - (DIFFICULTY_ORDER[level ?? 'beginner'] ?? 0));
          const bDiff = Math.abs((DIFFICULTY_ORDER[b.difficulty] ?? 1) - (DIFFICULTY_ORDER[level ?? 'beginner'] ?? 0));
          return aDiff - bDiff;
        })
        .slice(0, 3)
    : [];

  const allCourses = courses;

  // ── Semantic search state ─────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentRecommendation[] | null>(null);
  const [hasContentGap, setHasContentGap] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showMicroLesson, setShowMicroLesson] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestGenRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults(null);
      setHasContentGap(false);
      return;
    }

    const generation = ++requestGenRef.current;

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await getContentRecommendations({
          query: searchQuery.trim(),
          completedLessons: progress.completedLessons,
          goals: goal ? [goal] : undefined,
          experienceLevel: level,
          limit: 6,
        });
        if (generation !== requestGenRef.current) return; // stale response
        setSearchResults(res.recommendations);
        setHasContentGap(res.hasContentGap);
      } catch {
        if (generation !== requestGenRef.current) return;
        setSearchResults([]);
        setHasContentGap(false);
      } finally {
        if (generation === requestGenRef.current) setSearchLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  function handleResultClick(rec: ContentRecommendation) {
    if (rec.type === 'exercise') {
      navigate(`/library/${rec.id}`);
    } else if (rec.type === 'course') {
      navigate(`/learn/${rec.id}`);
    } else if (rec.type === 'lesson' && rec.courseId) {
      // Find the module containing this lesson
      const course = courses.find((c) => c.id === rec.courseId);
      const module = course?.modules.find((m) => m.lessons.some((l) => l.id === rec.id));
      if (course && module) {
        navigate(`/learn/${course.id}/${module.id}`);
      }
    }
  }

  return (
    <AppShell>
      <TopBar title="Learn" />
      <div className="px-4 pb-8 pt-4 space-y-6">

        {/* Hero */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 shrink-0">
            <GraduationCap size={24} className="text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              Evidence-Based Learning
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hasActivity
                ? `${progress.completedLessons.length} lesson${progress.completedLessons.length !== 1 ? 's' : ''} complete`
                : 'Science-backed courses, lessons & quizzes'}
            </p>
          </div>
        </div>

        {/* Semantic search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, exercises, lessons…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          {searchLoading && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-500" />
          )}
        </div>

        {isGuidedMode && (
          <TermHelpChips
            title="Learning terms explained"
            terms={[
              {
                key: 'lesson',
                label: 'Lesson',
                description: 'A short learning module focused on one topic.',
              },
              {
                key: 'course',
                label: 'Course',
                description: 'A bundle of lessons grouped into a structured path.',
              },
              {
                key: 'micro-lesson',
                label: 'Micro-lesson',
                description: 'A quick AI-generated explainer when a built-in lesson is not available.',
              },
            ]}
          />
        )}

        {/* Search results */}
        {searchQuery.trim() && searchResults !== null && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Search Results
            </p>

            {searchResults.length === 0 && !hasContentGap && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  No matching lessons yet
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Try a broader topic, a specific exercise name, or explore the recommended courses below.
                </p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => handleResultClick(rec)}
                    className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-4 py-3 hover:border-brand-400 dark:hover:border-brand-500 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                        {rec.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        {typeIcon(rec.type)}
                        <span>{typeLabel(rec.type)}</span>
                      </div>
                    </div>
                    {rec.category && (
                      <p className="text-xs text-slate-400 mt-0.5 capitalize">
                        {rec.category.replace('-', ' ')}
                      </p>
                    )}
                    {/* Relevance bar */}
                    <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${Math.round(rec.relevanceScore * 100)}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Content gap CTA */}
            {hasContentGap && searchQuery.trim() && (
              <div className="mt-3 rounded-xl border border-dashed border-brand-400 dark:border-brand-600 bg-brand-50 dark:bg-brand-900/20 p-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                  We do not have a built-in lesson for <span className="font-medium">"{searchQuery.trim()}"</span> yet.
                  Generate a personalized AI micro-lesson on this topic?
                </p>
                <button
                  onClick={() => setShowMicroLesson(true)}
                  className="flex items-center gap-2 rounded-lg bg-brand-500 text-white text-sm font-semibold px-4 py-2 hover:bg-brand-600 transition-colors"
                >
                  <Zap size={14} />
                  Generate AI lesson
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recommended for you */}
        {!searchQuery.trim() && recommended.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={13} className="text-brand-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recommended for You
              </p>
            </div>
            <div className="space-y-3">
              {recommended.map((course) => (
                <div key={course.id} className="relative">
                  <div className="absolute -top-1 -right-1 z-10 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    Recommended
                  </div>
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Courses */}
        {!searchQuery.trim() && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              {recommended.length > 0 ? 'All Courses' : 'Courses'}
            </p>
            <div className="space-y-3">
              {allCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed px-2">
          All content cites peer-reviewed research. It is for educational
          purposes only and does not constitute medical advice.
        </p>

      </div>

      {/* Micro-lesson modal */}
      {showMicroLesson && (
        <MicroLessonModal
          topic={searchQuery.trim()}
          onClose={() => setShowMicroLesson(false)}
        />
      )}
    </AppShell>
  );
}
