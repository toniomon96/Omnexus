import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useApp } from '../store/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSubscription } from '../hooks/useSubscription';
import { useProgramGeneration } from '../hooks/useProgramGeneration';
import { fetchTrainingProfile } from '../lib/db';
import { clearGenerationState, startGeneration } from '../lib/programGeneration';
import { getCustomPrograms } from '../utils/localStorage';
import type { Program, UserTrainingProfile } from '../types';
import { Loader2, Sparkles, Calendar, Clock3, Target, Layers, AlertCircle } from 'lucide-react';
import { programs as builtInPrograms } from '../data/programs';

function inferProfile(userGoal: Program['goal'], experienceLevel: Program['experienceLevel'], activeProgram: Program | null): UserTrainingProfile {
  return {
    goals: [userGoal],
    trainingAgeYears: experienceLevel === 'beginner' ? 0 : experienceLevel === 'intermediate' ? 2 : 5,
    daysPerWeek: activeProgram?.daysPerWeek ?? 4,
    sessionDurationMinutes: 60,
    equipment: [],
    injuries: [],
    aiSummary: 'Regenerated from your current Omnexus profile and active training context.',
    programStyle: 'any',
    includeCardio: false,
  };
}

export function AiProgramGenerationPage() {
  const { state } = useApp();
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { status: subscriptionStatus, loading: subscriptionLoading, refresh } = useSubscription();
  const { generationState, status: generationStatus, programId } = useProgramGeneration();

  const [profile, setProfile] = useState<UserTrainingProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const user = state.user;
  const allPrograms = [...builtInPrograms, ...getCustomPrograms()];
  const activeProgram = allPrograms.find((program) => program.id === user?.activeProgramId) ?? null;

  useEffect(() => {
    if (!user || !session || user.isGuest) {
      setLoadingProfile(false);
      return;
    }

    const currentUser = user;

    let cancelled = false;

    async function loadProfile() {
      setLoadingProfile(true);
      setError(null);
      try {
        const stored = await fetchTrainingProfile(currentUser.id);
        if (cancelled) return;
        setProfile(stored ?? inferProfile(currentUser.goal, currentUser.experienceLevel, activeProgram));
      } catch (err) {
        if (cancelled) return;
        console.error('[AiProgramGenerationPage] Failed to load training profile:', err);
        setProfile(inferProfile(currentUser.goal, currentUser.experienceLevel, activeProgram));
        setError('We could not load your saved training profile, so we will regenerate from your current account context.');
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    void loadProfile();
    return () => { cancelled = true; };
  }, [user?.id, user?.goal, user?.experienceLevel, session?.access_token, activeProgram]);

  useEffect(() => {
    if (!user || !generationState || generationState.userId !== user.id) return;
    if (generationStatus !== 'ready' || generationState.activateOnReady) return;

    clearGenerationState();
    navigate(`/programs/${programId}`, { replace: true });
  }, [generationStatus, generationState, navigate, programId, user?.id]);

  if (!user || user.isGuest) {
    return (
      <AppShell>
        <TopBar title="AI Program" showBack />
        <div className="px-4 pt-4">
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI program generation is available for signed-in accounts only.
            </p>
          </Card>
        </div>
      </AppShell>
    );
  }

  const monthlyLimitReached = !!subscriptionStatus && subscriptionStatus.programGenCount >= subscriptionStatus.programGenLimit;

  async function handleGenerate() {
    if (!profile || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      await startGeneration(user.id, profile, {
        activateOnReady: false,
        countAgainstQuota: true,
      });
      refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate a new AI program.';
      setError(message);
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <TopBar title="New AI Program" showBack />
      <div className="px-4 pb-8 pt-4 space-y-4">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10">
              <Sparkles size={18} className="text-brand-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Generate a draft first</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your current program stays active until you explicitly start the new AI-generated draft.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Quota</p>
          {subscriptionLoading || !subscriptionStatus ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 size={15} className="animate-spin" />
              Loading plan limits…
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {subscriptionStatus.programGenCount}/{subscriptionStatus.programGenLimit} AI programs used this month.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Free users get 1 per month. Premium users get 5 per month.
              </p>
            </>
          )}
        </Card>

        {activeProgram && (
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Current Active Program</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{activeProgram.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Generating a new draft will not interrupt this block until you choose to start the new plan.
            </p>
          </Card>
        )}

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Generation Context</p>
          {loadingProfile || !profile ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 size={15} className="animate-spin" />
              Loading your training profile…
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Target size={15} className="text-brand-500" />
                Goal: {profile.goals.join(', ')}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Calendar size={15} className="text-brand-500" />
                {profile.daysPerWeek} training days per week
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Clock3 size={15} className="text-brand-500" />
                {profile.sessionDurationMinutes} minute sessions
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Layers size={15} className="text-brand-500" />
                {profile.programStyle === 'any' || !profile.programStyle ? 'Best split chosen automatically' : profile.programStyle}
              </div>
            </div>
          )}
        </Card>

        {error && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
            </div>
          </Card>
        )}

        {generationStatus === 'generating' && generationState?.userId === user.id && !generationState.activateOnReady && (
          <Card>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Loader2 size={16} className="animate-spin text-brand-500" />
              Building your new AI training draft…
            </div>
          </Card>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={handleGenerate}
          disabled={loadingProfile || !profile || submitting || monthlyLimitReached || (generationStatus === 'generating' && generationState?.userId === user.id)}
        >
          {submitting || (generationStatus === 'generating' && generationState?.userId === user.id)
            ? 'Generating draft…'
            : monthlyLimitReached
              ? 'Monthly AI limit reached'
              : 'Generate New AI Draft'}
        </Button>
      </div>
    </AppShell>
  );
}