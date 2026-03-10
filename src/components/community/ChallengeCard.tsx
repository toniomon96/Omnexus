import { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, ChevronDown, ChevronUp, UserPlus, Loader2 } from 'lucide-react';
import type { Challenge, ChallengeParticipant, FriendshipWithProfile } from '../../types';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useWeightUnit } from '../../hooks/useWeightUnit';
import { toDisplayWeight } from '../../utils/weightUnits';

async function loadChallengeLeaderboard(challengeId: string, currentUserId: string) {
  const { getChallengeLeaderboard } = await import('../../lib/db');
  return getChallengeLeaderboard(challengeId, currentUserId);
}

async function loadCooperativeTotal(challengeId: string) {
  const { getCooperativeTotal } = await import('../../lib/db');
  return getCooperativeTotal(challengeId);
}

async function inviteFriendToChallenge(challengeId: string, fromUserId: string, toUserId: string) {
  const { sendChallengeInvitation } = await import('../../lib/db');
  return sendChallengeInvitation(challengeId, fromUserId, toUserId);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<Challenge['type'], string> = {
  volume: 'Total Volume',
  streak: 'Training Streak',
  sessions: 'Workout Count',
};

const TYPE_UNIT: Record<Challenge['type'], string> = {
  volume: 'kg',
  streak: 'days',
  sessions: 'sessions',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const RANK_COLORS: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-slate-300',
  3: 'text-amber-600',
};

// ─── ChallengeLeaderboard (inline, lazy-loaded) ───────────────────────────────

function ChallengeLeaderboard({
  challengeId,
  currentUserId,
}: {
  challengeId: string;
  currentUserId: string;
}) {
  const [participants, setParticipants] = useState<ChallengeParticipant[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadChallengeLeaderboard(challengeId, currentUserId)
      .then((data) => { if (!cancelled) setParticipants(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [challengeId, currentUserId]);

  if (loading) {
    return (
      <div className="space-y-1.5 pt-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
      </div>
    );
  }
  if (error) {
    return <p className="text-xs text-red-400 pt-2">Failed to load rankings.</p>;
  }
  if (!participants || participants.length === 0) {
    return <p className="text-xs text-slate-400 pt-2">No participants yet.</p>;
  }

  return (
    <div className="space-y-1 pt-2">
      {participants.map((p, i) => (
        <div
          key={p.userId}
          className={[
            'flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg',
            p.isCurrentUser ? 'bg-brand-500/10 text-brand-300' : 'text-slate-400',
          ].join(' ')}
        >
          <span className={['w-5 text-center font-bold shrink-0', RANK_COLORS[i + 1] ?? 'text-slate-500'].join(' ')}>
            {i + 1}
          </span>
          <span className="flex-1 truncate font-medium">
            {p.name}{p.isCurrentUser ? ' (you)' : ''}
          </span>
          <span className="shrink-0 tabular-nums">{p.progress.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── FriendPicker (inline, for invitations) ───────────────────────────────────

function FriendPicker({
  challengeId,
  fromUserId,
  friends,
}: {
  challengeId: string;
  fromUserId: string;
  friends: FriendshipWithProfile[];
}) {
  const [sending, setSending] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState<Set<string>>(new Set());

  async function handleInvite(toUserId: string) {
    setSending((s) => new Set(s).add(toUserId));
    try {
      await inviteFriendToChallenge(challengeId, fromUserId, toUserId);
      setSent((s) => new Set(s).add(toUserId));
    } catch {
      // duplicate silently ignored in db helper
    } finally {
      setSending((s) => { const n = new Set(s); n.delete(toUserId); return n; });
    }
  }

  const accepted = friends.filter((f) => f.status === 'accepted');

  if (accepted.length === 0) {
    return <p className="text-xs text-slate-400 pt-2">No friends to invite yet.</p>;
  }

  return (
    <div className="space-y-1.5 pt-2">
      {accepted.map((f) => (
        <div key={f.friend.id} className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-300 truncate">{f.friend.name}</span>
          <Button
            size="sm"
            variant={sent.has(f.friend.id) ? 'ghost' : 'secondary'}
            disabled={sent.has(f.friend.id) || sending.has(f.friend.id)}
            onClick={() => handleInvite(f.friend.id)}
          >
            {sending.has(f.friend.id) ? (
              <Loader2 size={11} className="animate-spin" />
            ) : sent.has(f.friend.id) ? (
              'Invited'
            ) : (
              <><UserPlus size={11} /> Invite</>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}

// ─── ChallengeCard ────────────────────────────────────────────────────────────

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  onJoin: (id: string) => void;
  acceptedFriends?: FriendshipWithProfile[];
  isCreatedByMe?: boolean;
}

export function ChallengeCard({
  challenge,
  currentUserId,
  onJoin,
  acceptedFriends,
  isCreatedByMe,
}: ChallengeCardProps) {
  const weightUnit = useWeightUnit();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [coopTotal, setCoopTotal] = useState<number | null>(null);

  // Lazy-load cooperative total when leaderboard section is first opened
  useEffect(() => {
    if (!showLeaderboard || !challenge.isCooperative || coopTotal !== null) return;
    let cancelled = false;
    loadCooperativeTotal(challenge.id)
      .then((total) => { if (!cancelled) setCoopTotal(total); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [showLeaderboard, challenge.isCooperative, challenge.id, coopTotal]);

  const progressPct =
    challenge.isJoined && challenge.targetValue && (challenge.userProgress ?? 0) > 0
      ? Math.min(100, Math.round(((challenge.userProgress ?? 0) / challenge.targetValue) * 100))
      : 0;

  const coopPct =
    challenge.isCooperative && challenge.targetValue && coopTotal !== null && coopTotal > 0
      ? Math.min(100, Math.round((coopTotal / challenge.targetValue) * 100))
      : 0;

  const isActive = new Date(challenge.endDate) >= new Date();
  const typeUnit = challenge.type === 'volume' ? weightUnit : TYPE_UNIT[challenge.type];

  function formatProgressValue(value: number): string {
    if (challenge.type !== 'volume') return value.toLocaleString();
    return Math.round(toDisplayWeight(value, weightUnit)).toLocaleString();
  }

  function toggleLeaderboard() {
    setShowLeaderboard((v) => !v);
    setShowInvite(false);
  }

  function toggleInvite() {
    setShowInvite((v) => !v);
    setShowLeaderboard(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4 space-y-3">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Trophy size={16} className="text-brand-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">
              {challenge.name}
            </p>
            {challenge.isCooperative && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-400 bg-purple-900/20 border border-purple-800/40 px-1.5 py-0.5 rounded-full mt-0.5">
                <Users size={9} /> Team
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isActive && !challenge.isJoined && (
            <Button size="sm" onClick={() => onJoin(challenge.id)}>
              {challenge.isCooperative ? 'Join Team' : 'Join'}
            </Button>
          )}
          {challenge.isJoined && (
            <span className="text-xs font-medium text-green-400 bg-green-900/20 border border-green-800/40 px-2 py-0.5 rounded-full">
              Joined
            </span>
          )}
          {isCreatedByMe && acceptedFriends && acceptedFriends.length > 0 && (
            <button
              onClick={toggleInvite}
              title="Invite friends"
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-700 transition-colors"
            >
              <UserPlus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {challenge.description && (
        <p className="text-xs text-slate-400 leading-relaxed">{challenge.description}</p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Trophy size={12} />
          {TYPE_LABELS[challenge.type]}
          {challenge.targetValue && ` · ${formatProgressValue(challenge.targetValue)} ${typeUnit}`}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {formatDate(challenge.startDate)} – {formatDate(challenge.endDate)}
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          {challenge.participantCount} joined
        </span>
      </div>

      {/* Individual progress bar (competitive only) */}
      {challenge.isJoined && challenge.targetValue !== null && !challenge.isCooperative && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Progress</span>
            <span>
              {formatProgressValue(challenge.userProgress ?? 0)} / {formatProgressValue(challenge.targetValue)} {typeUnit}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Cooperative team progress bar */}
      {challenge.isCooperative && challenge.targetValue !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Team progress</span>
            <span>
              {coopTotal !== null ? formatProgressValue(coopTotal) : '…'} / {formatProgressValue(challenge.targetValue)} {typeUnit}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${coopPct}%` }} />
          </div>
          {challenge.isJoined && challenge.userProgress !== null && (
            <p className="text-[10px] text-slate-500">
              Your contribution: {formatProgressValue(challenge.userProgress ?? 0)} {typeUnit}
            </p>
          )}
        </div>
      )}

      {/* Invite panel */}
      {showInvite && isCreatedByMe && acceptedFriends && (
        <div className="border-t border-slate-700 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Invite Friends</p>
          <FriendPicker
            challengeId={challenge.id}
            fromUserId={currentUserId}
            friends={acceptedFriends}
          />
        </div>
      )}

      {/* Leaderboard expand toggle */}
      {challenge.participantCount > 0 && (
        <button
          onClick={toggleLeaderboard}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-400 transition-colors w-full pt-1"
        >
          {showLeaderboard ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showLeaderboard ? 'Hide' : 'Show'} rankings
        </button>
      )}

      {/* Per-challenge leaderboard (lazy-loaded on mount) */}
      {showLeaderboard && (
        <div className="border-t border-slate-700 pt-1">
          <ChallengeLeaderboard challengeId={challenge.id} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}
