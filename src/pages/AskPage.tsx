import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AiDegradedStateCard } from '../components/ui/AiDegradedStateCard';
import { MarkdownText } from '../components/ui/MarkdownText';
import { useApp } from '../store/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { askOmnexusStream, submitCheckin } from '../services/claudeService';
import type { ConversationMessage, Citation } from '../services/claudeService';
import { normalizeAiError } from '../lib/aiErrorHandling';
import {
  appendInsightSession,
  getInsightSessions,
  saveDailyCheckinLocal,
  getTodayCheckin,
} from '../utils/localStorage';
import type { InsightSession, OmniMode } from '../types';
import { trackAiDegradedStateEvent, trackAskSubmitted, trackFeatureEntry } from '../lib/analytics';
import { v4 as uuidv4 } from 'uuid';
import {
  MessageCircle,
  Send,
  Loader,
  Shield,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Dumbbell,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { programs } from '../data/programs';
import { getCustomPrograms } from '../utils/localStorage';

const SUGGESTED = [
  'How much protein do I need per day?',
  'Should I train if I\'m still sore?',
  'What rep range builds the most muscle?',
  'How does sleep affect muscle recovery?',
  'Is creatine safe and effective?',
];

interface AskNextStepRecommendation {
  label: string;
  description: string;
  destination: '/insights' | '/train' | '/onboarding';
}

// Topic keyword → follow-up chips
const FOLLOW_UP_MAP: Record<string, string[]> = {
  protein:  ['How do I hit my protein goal daily?', 'What are the best protein sources?', 'Is plant protein as good as whey?'],
  muscle:   ['How long does it take to build muscle?', 'What\'s the best training split for hypertrophy?', 'Does cardio hurt muscle gains?'],
  sleep:    ['How many hours of sleep do I need?', 'What\'s the best pre-sleep routine?', 'Does napping help recovery?'],
  creatine: ['When should I take creatine?', 'Do I need to load creatine?', 'Are there creatine side effects?'],
  sore:     ['What causes DOMS?', 'Should I stretch to reduce soreness?', 'Does cold therapy help recovery?'],
  fat:      ['What\'s the best diet for fat loss?', 'Does cardio burn more fat than lifting?', 'How much of a calorie deficit is safe?'],
  default:  ['What should I eat post-workout?', 'How important is rest day nutrition?', 'How do I track progress effectively?'],
};

function getFollowUps(question: string): string[] {
  const lower = question.toLowerCase();
  for (const [key, chips] of Object.entries(FOLLOW_UP_MAP)) {
    if (key !== 'default' && lower.includes(key)) return chips;
  }
  return FOLLOW_UP_MAP.default;
}

export function AskPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { status } = useSubscription();
  const prefill = (location.state as { prefill?: string } | null)?.prefill ?? '';

  // ── Omni mode state ─────────────────────────────────────────────────────────
  const [omniMode, setOmniMode] = useState<OmniMode>('science');

  // ── Ask (science / coach) state ─────────────────────────────────────────────
  const [question, setQuestion] = useState(prefill);
  const [loading, setLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [sessions, setSessions] = useState<InsightSession[]>(() =>
    getInsightSessions().slice(0, 5),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [currentCitations, setCurrentCitations] = useState<Citation[]>([]);
  const lastDegradedErrorKindRef = useRef<'auth' | 'upgrade' | 'network' | 'rate_limit' | 'server' | 'unknown' | null>(null);

  // ── Check-In state ──────────────────────────────────────────────────────────
  const [checkinStep, setCheckinStep] = useState<'form' | 'submitting' | 'done'>('form');
  const [checkinEnergy, setCheckinEnergy] = useState(7);
  const [checkinSleep, setCheckinSleep] = useState(7);
  const [checkinSoreness, setCheckinSoreness] = useState(2);
  const [checkinPain, setCheckinPain] = useState(false);
  const [checkinPainLocation, setCheckinPainLocation] = useState('');
  const [checkinNotes, setCheckinNotes] = useState('');
  const [checkinResult, setCheckinResult] = useState<{
    omniResponse: string;
    reduceIntensity: boolean;
    flaggedExercises: string[];
  } | null>(() => {
    const saved = getTodayCheckin();
    if (!saved) return null;
    return {
      omniResponse: saved.omniResponse ?? '',
      reduceIntensity: saved.energyLevel < 5 || saved.sleepQuality < 5,
      flaggedExercises: saved.painFlag && saved.painLocation ? [`Avoid heavy loading of ${saved.painLocation}`] : [],
    };
  });
  const [checkinError, setCheckinError] = useState<string | null>(null);

  const answerRef = useRef<HTMLDivElement>(null);
  const CONVO_KEY = 'omnexus_ask_conversation';

  // ── Derive active program for Coach Mode context ─────────────────────────────
  const activeProgram = (() => {
    if (!state.user?.activeProgramId) return null;
    const custom = getCustomPrograms().find((p) => p.id === state.user!.activeProgramId);
    if (custom) return custom;
    return programs.find((p) => p.id === state.user!.activeProgramId) ?? null;
  })();

  const currentWeek = (() => {
    if (!activeProgram) return undefined;
    const sessions = state.history.sessions.filter((s) => s.programId === activeProgram.id);
    const daysPerWeek = activeProgram.daysPerWeek || 3;
    return Math.min(Math.floor(sessions.length / daysPerWeek) + 1, 8);
  })();

  const coachContext = {
    firstName: state.user?.name?.split(' ')[0],
    goal: state.user?.goal,
    experienceLevel: state.user?.experienceLevel,
    programName: activeProgram?.name,
    currentWeek,
    rankLabel: state.xpProfile?.rankLabel,
    streak: state.streak,
    recentPRs: state.history.personalRecords.slice(-3).map((pr) => `${pr.exerciseId} ${pr.weight}kg×${pr.reps}`),
    currentWeekNote: activeProgram?.weeklyProgressionNotes?.[Math.max(0, (currentWeek ?? 1) - 1)],
    checkInSummary: checkinResult
      ? `Energy ${checkinEnergy}/10, Sleep ${checkinSleep}/10, Soreness ${checkinSoreness}/5${checkinPain ? ', pain flag' : ''}`
      : undefined,
  };

  const recommendation: AskNextStepRecommendation = state.user?.isGuest
    ? {
        label: 'Create an account to save Ask answers',
        description: 'Keep your Ask history and AI guidance synced across devices.',
        destination: '/onboarding',
      }
    : currentAnswer
    ? {
        label: 'Apply this in your next workout',
        description: 'Use Train to turn this guidance into a concrete session plan.',
        destination: '/train',
      }
    : {
        label: 'Review your insight trends',
        description: 'Use Insights to connect this guidance with your recent workout patterns.',
        destination: '/insights',
      };

  // Restore persisted conversation on mount (only when no prefill is driving a new context)
  useEffect(() => {
    if (prefill) return; // prefill starts a fresh context
    try {
      const raw = sessionStorage.getItem(CONVO_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        currentAnswer: string;
        currentQuestion: string;
        conversationHistory: ConversationMessage[];
        followUps: string[];
        currentCitations: Citation[];
      };
      if (saved.currentAnswer) {
        setCurrentAnswer(saved.currentAnswer);
        setCurrentQuestion(saved.currentQuestion);
        setConversationHistory(saved.conversationHistory ?? []);
        setFollowUps(saved.followUps ?? []);
        setCurrentCitations(saved.currentCitations ?? []);
      }
    } catch { /* ignore */ }
  }, []); // intentionally run once on mount to restore persisted conversation

  // Persist conversation to sessionStorage whenever it updates
  useEffect(() => {
    if (!currentAnswer) return;
    try {
      sessionStorage.setItem(CONVO_KEY, JSON.stringify({
        currentAnswer,
        currentQuestion,
        conversationHistory,
        followUps,
        currentCitations,
      }));
    } catch { /* ignore */ }
  }, [currentAnswer, currentQuestion, conversationHistory, followUps, currentCitations]);

  useEffect(() => {
    if (currentAnswer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentAnswer]);

  async function handleSubmit(overrideQuestion?: string) {
    const q = (overrideQuestion ?? question).trim();
    if (!q || loading) return;

    setLoading(true);
    setCurrentAnswer('');
    setCurrentQuestion(q);
    setError(null);
    setUpgradeRequired(false);
    setFollowUps([]);
    setCurrentCitations([]);

    try {
      const { answer, citations } = await askOmnexusStream({
        question: q,
        userContext: state.user
          ? { goal: state.user.goal, experienceLevel: state.user.experienceLevel }
          : undefined,
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
        mode: omniMode === 'check-in' ? 'science' : omniMode,
        coachContext: omniMode === 'coach' ? coachContext : undefined,
      }, {
        onMeta: ({ citations: nextCitations }) => {
          setCurrentCitations(nextCitations ?? []);
        },
        onChunk: ({ text }) => {
          setCurrentAnswer((prev) => (prev ?? '') + text);
        },
      });

      setCurrentAnswer(answer);
      setCurrentCitations(citations ?? []);
      if (lastDegradedErrorKindRef.current) {
        trackAiDegradedStateEvent({
          surface: 'ask',
          action: 'recovered',
          errorKind: lastDegradedErrorKindRef.current,
        });
        lastDegradedErrorKindRef.current = null;
      }
      trackAskSubmitted({ hasRagContext: (citations?.length ?? 0) > 0, isFollowUp: conversationHistory.length > 0 });

      const newHistory: ConversationMessage[] = [
        ...conversationHistory,
        { role: 'user', content: q },
        { role: 'assistant', content: answer },
      ];
      setConversationHistory(newHistory);
      setFollowUps(getFollowUps(q));

      const session: InsightSession = {
        id: uuidv4(),
        category: 'ask-anything',
        messages: [
          { id: uuidv4(), role: 'user', content: q, timestamp: new Date().toISOString() },
          { id: uuidv4(), role: 'assistant', content: answer, timestamp: new Date().toISOString() },
        ],
        createdAt: new Date().toISOString(),
      };
      appendInsightSession(session);
      setSessions(getInsightSessions().slice(0, 5));
      setQuestion('');
    } catch (err) {
      const normalized = normalizeAiError(err, { surface: 'ask' });
      if (normalized.kind === 'upgrade') {
        setUpgradeRequired(true);
      } else {
        setError(normalized.message);
        lastDegradedErrorKindRef.current = normalized.kind;
        trackAiDegradedStateEvent({
          surface: 'ask',
          action: 'shown',
          errorKind: normalized.kind,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckinSubmit() {
    setCheckinStep('submitting');
    setCheckinError(null);
    try {
      const result = await submitCheckin({
        energyLevel: checkinEnergy,
        sleepQuality: checkinSleep,
        sorenessLevel: checkinSoreness,
        painFlag: checkinPain,
        painLocation: checkinPain && checkinPainLocation.trim() ? checkinPainLocation.trim() : undefined,
        notes: checkinNotes.trim() || undefined,
      });
      // Save locally for adaptation banner in ActiveWorkout
      saveDailyCheckinLocal({
        id: result.checkinId,
        checkinDate: new Date().toISOString().split('T')[0],
        energyLevel: checkinEnergy,
        sleepQuality: checkinSleep,
        sorenessLevel: checkinSoreness,
        painFlag: checkinPain,
        painLocation: checkinPain && checkinPainLocation.trim() ? checkinPainLocation.trim() : undefined,
        notes: checkinNotes.trim() || undefined,
        omniResponse: result.omniResponse,
        createdAt: new Date().toISOString(),
      });
      setCheckinResult(result);
      setCheckinStep('done');
    } catch {
      setCheckinError('Check-in could not be saved. Please try again.');
      setCheckinStep('form');
    }
  }

  function resetCheckin() {
    setCheckinStep('form');
    setCheckinEnergy(7);
    setCheckinSleep(7);
    setCheckinSoreness(2);
    setCheckinPain(false);
    setCheckinPainLocation('');
    setCheckinNotes('');
    setCheckinResult(null);
    setCheckinError(null);
  }

  function handleFollowUp(chip: string) {
    setQuestion(chip);
    handleSubmit(chip);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function resetConversation() {
    setCurrentAnswer(null);
    setCurrentQuestion(null);
    setConversationHistory([]);
    setFollowUps([]);
    setCurrentCitations([]);
    setUpgradeRequired(false);
    try { sessionStorage.removeItem(CONVO_KEY); } catch { /* ignore */ }
  }

  function retryAsk() {
    if (lastDegradedErrorKindRef.current) {
      trackAiDegradedStateEvent({
        surface: 'ask',
        action: 'retry_clicked',
        errorKind: lastDegradedErrorKindRef.current,
      });
    }
    if (currentQuestion) {
      void handleSubmit(currentQuestion);
      return;
    }
    void handleSubmit();
  }

  function handleRecommendationAction() {
    trackFeatureEntry({
      source: 'ask_recommendation',
      destination: recommendation.destination,
      label: 'ai_next_step_continue',
    });
    navigate(recommendation.destination);
  }

  // ── Mode config ─────────────────────────────────────────────────────────────
  const MODES: { id: OmniMode; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'coach',
      label: 'Coach',
      icon: <Dumbbell size={14} />,
      description: 'Personalised advice using your program and history',
    },
    {
      id: 'science',
      label: 'Science',
      icon: <FlaskConical size={14} />,
      description: 'Evidence-based answers with source citations',
    },
    {
      id: 'check-in',
      label: 'Check-In',
      icon: <CheckCircle2 size={14} />,
      description: 'Daily readiness check — Omni adapts your session',
    },
  ];

  const activeMode = MODES.find((m) => m.id === omniMode) ?? MODES[1];

  return (
    <AppShell>
      <TopBar title="Ask Omni" showBack />
      <div className="px-4 pb-8 pt-4 space-y-5">

        {/* Hero */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 shrink-0">
            <MessageCircle size={24} className="text-brand-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              Ask Omni
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {activeMode.description}
            </p>
          </div>
          {session && status && status.tier === 'free' && omniMode !== 'check-in' && (
            <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {status.askCount}/{status.askLimit} today
            </span>
          )}
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2" role="tablist" aria-label="Omni operating mode">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={omniMode === mode.id}
              onClick={() => { setOmniMode(mode.id); resetConversation(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                omniMode === mode.id
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-400 dark:hover:border-brand-600'
              }`}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>

        {/* ── Check-In Mode ───────────────────────────────────────────────────── */}
        {omniMode === 'check-in' && (
          <>
            {checkinStep === 'done' && checkinResult ? (
              <div className="space-y-4">
                <Card className={checkinResult.reduceIntensity
                  ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                }>
                  <div className="flex items-start gap-3">
                    {checkinResult.reduceIntensity
                      ? <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      : <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Omni's recommendation
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        {checkinResult.omniResponse || 'Check-in saved.'}
                      </p>
                      {checkinResult.flaggedExercises.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {checkinResult.flaggedExercises.map((flag) => (
                            <li key={flag} className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                              <AlertTriangle size={12} />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </Card>
                <Button variant="secondary" fullWidth onClick={resetCheckin}>
                  <RotateCcw size={14} />
                  Update today's check-in
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {checkinError && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {checkinError}
                  </div>
                )}

                {/* Energy */}
                <Card>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    Energy level: <span className="text-brand-500">{checkinEnergy}/10</span>
                  </p>
                  <input
                    type="range" min={1} max={10} value={checkinEnergy}
                    onChange={(e) => setCheckinEnergy(Number(e.target.value))}
                    aria-label="Energy level"
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Exhausted</span><span>Energised</span>
                  </div>
                </Card>

                {/* Sleep */}
                <Card>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    Sleep quality: <span className="text-brand-500">{checkinSleep}/10</span>
                  </p>
                  <input
                    type="range" min={1} max={10} value={checkinSleep}
                    onChange={(e) => setCheckinSleep(Number(e.target.value))}
                    aria-label="Sleep quality"
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Terrible</span><span>Excellent</span>
                  </div>
                </Card>

                {/* Soreness */}
                <Card>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    Muscle soreness: <span className="text-brand-500">{checkinSoreness}/5</span>
                  </p>
                  <input
                    type="range" min={1} max={5} value={checkinSoreness}
                    onChange={(e) => setCheckinSoreness(Number(e.target.value))}
                    aria-label="Muscle soreness"
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>None</span><span>Very sore</span>
                  </div>
                </Card>

                {/* Pain flag */}
                <Card>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkinPain}
                      onChange={(e) => setCheckinPain(e.target.checked)}
                      className="h-4 w-4 rounded accent-brand-500"
                    />
                    <span className="text-sm text-slate-800 dark:text-slate-200">
                      I have pain (not just soreness)
                    </span>
                  </label>
                  {checkinPain && (
                    <input
                      type="text"
                      value={checkinPainLocation}
                      onChange={(e) => setCheckinPainLocation(e.target.value)}
                      placeholder="Where? (e.g. left knee, lower back)"
                      aria-label="Pain location"
                      maxLength={100}
                      className="mt-3 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  )}
                </Card>

                {/* Optional notes */}
                <div>
                  <label htmlFor="checkin-notes" className="sr-only">Optional notes</label>
                  <textarea
                    id="checkin-notes"
                    value={checkinNotes}
                    onChange={(e) => setCheckinNotes(e.target.value)}
                    placeholder="Anything else Omni should know? (optional)"
                    rows={2}
                    maxLength={300}
                    className="w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <Button fullWidth onClick={() => void handleCheckinSubmit()} disabled={checkinStep === 'submitting'}>
                  {checkinStep === 'submitting' ? (
                    <><Loader size={16} className="animate-spin" /> Saving…</>
                  ) : (
                    <><CheckCircle2 size={16} /> Complete check-in</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── Coach / Science Mode ─────────────────────────────────────────────── */}
        {omniMode !== 'check-in' && (
          <>
        {/* Input area */}
        <div className="space-y-3">
          <label htmlFor="ask-question" className="sr-only">
            Ask your fitness question
          </label>
          <textarea
            id="ask-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={omniMode === 'coach'
              ? 'e.g. Should I push hard today or deload?'
              : 'e.g. How much protein do I need to build muscle?'
            }
            rows={3}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors disabled:opacity-50"
          />
          <Button
            fullWidth
            onClick={() => handleSubmit()}
            disabled={!question.trim() || loading}
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Thinking…
              </>
            ) : (
              <>
                <Send size={16} />
                Ask Omni
              </>
            )}
          </Button>
        </div>

        {/* Suggested questions (shown when idle) */}
        {!currentAnswer && !loading && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Try one of these
            </p>
            <div className="space-y-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuestion(q)}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
                >
                  <MessageCircle size={14} className="text-brand-500 shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <AiDegradedStateCard
            title="Ask is temporarily unavailable"
            message={error}
            onRetry={retryAsk}
            retryDisabled={loading}
            testId="ask-degraded-state"
          />
        )}

        {/* Upgrade prompt when daily limit reached */}
        {upgradeRequired && (
          <Card className="border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10">
                <Zap size={18} className="text-brand-500" fill="currentColor" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Daily limit reached
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Free users get 5 AI questions per day. Upgrade to Premium for unlimited access.
                </p>
                <Link
                  to="/subscription"
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
                >
                  <Zap size={12} fill="currentColor" />
                  Upgrade to Premium
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Current answer */}
        {(currentAnswer !== null || loading) && (
          <div ref={answerRef} className="space-y-3" aria-live="polite">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-1">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  You asked
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {currentQuestion}
                </p>
              </div>
              <div className="px-3 py-3">
                {currentAnswer ? (
                  <MarkdownText text={currentAnswer} />
                ) : (
                  <div className="space-y-2" role="status" aria-label="Generating answer">
                    <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="h-3 w-3/5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
            {/* Sources used */}
            {currentCitations.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Sources used
                </p>
                <div className="flex flex-col gap-1.5">
                  {currentCitations.map((c) => (
                    <div
                      key={c.title}
                      className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2"
                    >
                      <span className="text-[10px] font-medium text-brand-400 uppercase tracking-wide shrink-0">
                        {c.type}
                      </span>
                      <span className="text-xs text-slate-300 truncate flex-1">{c.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context limit indicator */}
            {conversationHistory.length >= 4 && !loading && (
              <p className="text-[10px] text-slate-500 text-center mt-1">
                Showing the last 4 exchanges for context ·{' '}
                <button type="button" onClick={resetConversation} className="underline hover:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors">
                  Start fresh
                </button>
              </p>
            )}

            {/* Follow-up suggestions */}
            {followUps.length > 0 && !loading && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Follow up</p>
                <div className="flex flex-wrap gap-2">
                  {followUps.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleFollowUp(chip)}
                      className="px-3 py-1.5 rounded-full text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="secondary"
              fullWidth
              onClick={resetConversation}
            >
              <RotateCcw size={14} />
              New conversation
            </Button>
          </div>
        )}

        {/* Recent Q&A history */}
        {sessions.length > 0 && !currentAnswer && !loading && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Recent Questions
            </p>
            <div className="space-y-2">
              {sessions.map((session) => {
                const userMsg = session.messages.find((m) => m.role === 'user');
                const aiMsg = session.messages.find((m) => m.role === 'assistant');
                const isExpanded = expandedId === session.id;
                if (!userMsg || !aiMsg) return null;

                return (
                  <Card key={session.id} padding="sm">
                    <button
                      type="button"
                      className="w-full text-left flex items-start justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-lg"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : session.id)
                      }
                    >
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                        {userMsg.content}
                      </p>
                      {isExpanded ? (
                        <ChevronUp size={16} className="shrink-0 mt-0.5 text-slate-400" />
                      ) : (
                        <ChevronDown size={16} className="shrink-0 mt-0.5 text-slate-400" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <MarkdownText text={aiMsg.content} />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

          </>
        )}

        {/* Safety notice */}
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              Omnexus provides <strong>educational information only</strong>, not
              medical advice. Always consult a qualified healthcare professional
              for personal health concerns.
            </p>
          </div>
        </Card>

        <Card className="border-brand-200 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-900/20" data-testid="ask-next-step-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Recommended next step</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{recommendation.label}</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{recommendation.description}</p>
          <Button
            size="sm"
            className="mt-3"
            onClick={handleRecommendationAction}
            data-testid="ask-next-step-action"
          >
            Continue
          </Button>
        </Card>

      </div>
    </AppShell>
  );
}
