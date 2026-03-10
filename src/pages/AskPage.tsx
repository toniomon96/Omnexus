import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MarkdownText } from '../components/ui/MarkdownText';
import { useApp } from '../store/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { askOmnexusStream, ApiError } from '../services/claudeService';
import type { ConversationMessage, Citation } from '../services/claudeService';
import {
  appendInsightSession,
  getInsightSessions,
} from '../utils/localStorage';
import type { InsightSession } from '../types';
import { trackAskSubmitted } from '../lib/analytics';
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
} from 'lucide-react';

const SUGGESTED = [
  'How much protein do I need per day?',
  'Should I train if I\'m still sore?',
  'What rep range builds the most muscle?',
  'How does sleep affect muscle recovery?',
  'Is creatine safe and effective?',
];

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

  const answerRef = useRef<HTMLDivElement>(null);
  const CONVO_KEY = 'omnexus_ask_conversation';

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
      // BUG-23: Use HTTP status code (403) rather than string matching to detect upgrade prompts.
      if (err instanceof ApiError && err.status === 403) {
        setUpgradeRequired(true);
      } else if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          setError('We could not reach the AI service right now. Check your connection and try again.');
        } else {
          setError(msg);
        }
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
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

  return (
    <AppShell>
      <TopBar title="Ask Omnexus" showBack />
      <div className="px-4 pb-8 pt-4 space-y-5">

        {/* Hero */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 shrink-0">
            <MessageCircle size={24} className="text-brand-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              Ask Anything
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Science-backed answers, with citations
            </p>
          </div>
          {session && status && status.tier === 'free' && (
            <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {status.askCount}/{status.askLimit} today
            </span>
          )}
        </div>

        {/* Input area */}
        <div className="space-y-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. How much protein do I need to build muscle?"
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
                Ask Omnexus
              </>
            )}
          </Button>
        </div>

        {/* Suggested questions (shown when idle) */}
        {!currentAnswer && !loading && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Try asking
            </p>
            <div className="space-y-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuestion(q)}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 transition-colors"
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
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </Card>
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
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
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
          <div ref={answerRef} className="space-y-3">
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
                  <div className="space-y-2">
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
                Context limited to last 4 exchanges ·{' '}
                <button type="button" onClick={resetConversation} className="underline hover:text-slate-400 transition-colors">
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
                      className="px-3 py-1.5 rounded-full text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
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
                      className="w-full text-left flex items-start justify-between gap-2"
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

        {/* Link to insights */}
        <button
          type="button"
          onClick={() => navigate('/insights')}
          className="w-full text-center text-xs text-brand-500 hover:underline"
        >
          View AI insights on your workouts →
        </button>

      </div>
    </AppShell>
  );
}
