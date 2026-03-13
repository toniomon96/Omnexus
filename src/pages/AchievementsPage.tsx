import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useApp } from '../store/AppContext';
import { ACHIEVEMENTS } from '../data/achievements';
import { loadEarnedAchievements, getAchievementProgress } from '../utils/achievementUtils';
import { deriveExerciseMastery, MASTERY_LABELS, MASTERY_ICONS, MASTERY_COLORS } from '../utils/masteryUtils';
import { exercises as exerciseList } from '../data/exercises';
import { getCustomPrograms } from '../utils/localStorage';
import { calculateStreak } from '../utils/dateUtils';
import type { AchievementCategory } from '../types';
import type { AchievementCheckContext } from '../utils/achievementUtils';

const CATEGORIES: { value: AchievementCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'workout', label: '💪 Workout' },
  { value: 'program', label: '📋 Program' },
  { value: 'learning', label: '📖 Learning' },
  { value: 'streak', label: '🔥 Streak' },
  { value: 'nutrition', label: '🥗 Nutrition' },
];

export function AchievementsPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

  const earned = useMemo(() => loadEarnedAchievements(), []);
  const earnedSet = useMemo(() => new Set(earned.map(e => e.id)), [earned]);

  const ctx = useMemo((): AchievementCheckContext => {
    const sessions = state.history.sessions ?? [];
    const lp = state.learningProgress;

    const perfectQuizIds = Object.entries(lp.quizScores ?? {})
      .filter(([, attempt]) => attempt.score === 100)
      .map(([id]) => id);

    const customPrograms = getCustomPrograms();
    const currentStreak = calculateStreak(sessions.map(s => s.startedAt));

    return {
      sessions,
      nutritionLogs: [],
      completedLessonIds: lp.completedLessons ?? [],
      completedCourseIds: lp.completedCourses ?? [],
      perfectQuizIds,
      hasActiveProgramId: !!state.user?.activeProgramId,
      hasAiProgram: customPrograms.some(p => p.isAiGenerated),
      currentStreak,
    };
  }, [state]);

  const exerciseMastery = useMemo(
    () => deriveExerciseMastery(state.history.sessions ?? []),
    [state.history.sessions]
  );

  const filtered = activeCategory === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter(a => a.category === activeCategory);

  const earnedCount = ACHIEVEMENTS.filter(a => earnedSet.has(a.id)).length;

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
            aria-label="Go back"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Achievements</h1>
            <p className="text-sm text-zinc-400">
              {earnedCount} / {ACHIEVEMENTS.length} earned
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-zinc-800 rounded-full h-2 mb-6" role="progressbar" aria-valuenow={earnedCount} aria-valuemax={ACHIEVEMENTS.length}>
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: `${(earnedCount / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Achievement grid */}
        <div className="grid grid-cols-1 gap-3 mb-8">
          {filtered.map(achievement => {
            const isEarned = earnedSet.has(achievement.id);
            const earnedDate = earned.find(e => e.id === achievement.id)?.earnedAt;
            const progress = getAchievementProgress(achievement.id, ctx);
            const target = achievement.progressTarget ?? 1;
            const pct = Math.min(progress / target, 1);

            return (
              <div
                key={achievement.id}
                className={`rounded-xl p-4 border transition-all ${
                  isEarned
                    ? 'bg-zinc-800 border-emerald-700'
                    : 'bg-zinc-900 border-zinc-800 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`text-3xl leading-none ${isEarned ? '' : 'grayscale opacity-50'}`}
                    aria-hidden="true"
                  >
                    {achievement.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm ${isEarned ? 'text-white' : 'text-zinc-400'}`}>
                        {achievement.title}
                      </p>
                      {isEarned && (
                        <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded-full">
                          Earned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{achievement.description}</p>
                    {earnedDate && (
                      <p className="text-xs text-zinc-600 mt-1">
                        {new Date(earnedDate).toLocaleDateString()}
                      </p>
                    )}
                    {!isEarned && achievement.progressTarget && achievement.progressTarget > 1 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-zinc-600 mb-1">
                          <span>{progress} / {target}</span>
                          <span>{Math.round(pct * 100)}%</span>
                        </div>
                        <div className="bg-zinc-700 rounded-full h-1.5">
                          <div
                            className="bg-zinc-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Exercise Mastery section */}
        {exerciseMastery.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-white mb-3">Exercise Mastery</h2>
            <div className="space-y-2">
              {exerciseMastery.map(em => {
                const ex = exerciseList.find(e => e.id === em.exerciseId);
                if (!ex) return null;
                return (
                  <div
                    key={em.exerciseId}
                    className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{ex.name}</p>
                      <p className="text-xs text-zinc-500">{em.sessionsCount} sessions · {em.totalSets} sets</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{MASTERY_ICONS[em.masteryLevel]}</span>
                      <span className={`text-xs font-medium ${MASTERY_COLORS[em.masteryLevel]}`}>
                        {MASTERY_LABELS[em.masteryLevel]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {exerciseMastery.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            <p className="text-2xl mb-2">🏋️</p>
            <p>Complete workouts to track exercise mastery.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
