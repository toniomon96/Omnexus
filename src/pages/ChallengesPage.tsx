import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import {
  getChallenges,
  joinChallenge,
  createChallenge,
  getAiChallenges,
  getFriendships,
  getPendingInvitations,
  respondChallengeInvitation,
} from '../lib/db';
import type { Challenge, AiChallenge, FriendshipWithProfile, ChallengeInvitation } from '../types';
import { PersonalChallengeCard } from '../components/challenges/PersonalChallengeCard';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { CommunityTabs } from '../components/community/CommunityTabs';
import { ChallengeCard } from '../components/community/ChallengeCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Trophy, Plus, X, ChevronDown, Sparkles, Mail } from 'lucide-react';
import { trackChallengeJoined, trackChallengeCreated, trackInvitationResponded } from '../lib/analytics';

interface CreateForm {
  name: string;
  description: string;
  type: Challenge['type'];
  targetValue: string;
  startDate: string;
  endDate: string;
  isCooperative: boolean;
}

const today = () => new Date().toISOString().split('T')[0];
const nextMonth = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

export function ChallengesPage() {
  const { state } = useApp();
  const { toast } = useToast();
  const userId = state.user?.id ?? '';
  const user = state.user;

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sharedChallenge, setSharedChallenge] = useState<AiChallenge | null>(null);
  const [acceptedFriends, setAcceptedFriends] = useState<FriendshipWithProfile[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<ChallengeInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateForm>({
    name: '',
    description: '',
    type: 'volume',
    targetValue: '',
    startDate: today(),
    endDate: nextMonth(),
    isCooperative: false,
  });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    const [data, aiData, friendships, invitations] = await Promise.all([
      getChallenges(userId),
      userId ? getAiChallenges(userId) : Promise.resolve([]),
      userId ? getFriendships(userId) : Promise.resolve([]),
      userId ? getPendingInvitations(userId) : Promise.resolve([]),
    ]);
    setChallenges(data);
    setAcceptedFriends(friendships.filter((f) => f.status === 'accepted'));
    setPendingInvitations(invitations);
    const todayStr = new Date().toISOString().split('T')[0];
    const shared = aiData.find(
      (c) => c.type === 'shared' && c.startDate <= todayStr && c.endDate >= todayStr,
    );
    setSharedChallenge(shared ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();

    channelRef.current = supabase
      .channel('challenges_rt')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'challenge_participants' },
        () => { load(); },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'challenge_invitations', filter: `to_user_id=eq.${userId}` },
        () => { load(); },
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [load, userId]);

  async function handleJoin(id: string) {
    await joinChallenge(id, userId);
    const c = challenges.find((ch) => ch.id === id);
    if (c) {
      trackChallengeJoined({ challengeId: id, challengeType: c.type, isCooperative: c.isCooperative, isViaInvitation: false });
    }
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isJoined: true, participantCount: c.participantCount + 1, userProgress: 0 } : c,
      ),
    );
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await createChallenge(
        {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          type: form.type,
          targetValue: form.targetValue ? Number(form.targetValue) : undefined,
          startDate: form.startDate,
          endDate: form.endDate,
          isCooperative: form.isCooperative,
        },
        userId,
      );
      trackChallengeCreated({ challengeType: form.type, isCooperative: form.isCooperative, hasTarget: !!form.targetValue });
      setShowCreate(false);
      setForm({ name: '', description: '', type: 'volume', targetValue: '', startDate: today(), endDate: nextMonth(), isCooperative: false });
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function handleAcceptInvitation(invitationId: string, challengeId: string) {
    try {
      await respondChallengeInvitation(invitationId, 'accepted');
      await joinChallenge(challengeId, userId);
      trackInvitationResponded({ response: 'accepted' });
      const c = challenges.find((ch) => ch.id === challengeId);
      if (c) trackChallengeJoined({ challengeId, challengeType: c.type, isCooperative: c.isCooperative, isViaInvitation: true });
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      await load();
      toast('Joined challenge!', 'success');
    } catch {
      toast('Failed to accept invitation', 'error');
    }
  }

  async function handleDeclineInvitation(invitationId: string) {
    try {
      await respondChallengeInvitation(invitationId, 'declined');
      trackInvitationResponded({ response: 'declined' });
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch {
      toast('Failed to decline invitation', 'error');
    }
  }

  const mine = challenges.filter((c) => c.isJoined);
  const browse = challenges.filter((c) => !c.isJoined);

  return (
    <AppShell>
      <TopBar title="Community" />
      <CommunityTabs />

      <div className="px-4 pb-6 mt-4 space-y-5">

        {/* AI Personal Challenge */}
        {user && !user.isGuest && (
          <PersonalChallengeCard
            userId={userId}
            goal={user.goal}
            experienceLevel={user.experienceLevel}
            weeklyVolumeKg={0}
            sessionsLast30Days={0}
            avgRpe={0}
          />
        )}

        {/* Shared AI Challenge */}
        {sharedChallenge && (
          <div className="rounded-xl border border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-brand-500" />
              <span className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                This Week's Community Challenge
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{sharedChallenge.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{sharedChallenge.description}</p>
            <p className="text-xs text-slate-400">
              Target: {sharedChallenge.target} {sharedChallenge.unit} · Ends {sharedChallenge.endDate}
            </p>
          </div>
        )}

        {/* Pending invitations banner */}
        {pendingInvitations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail size={12} />
              Invitations ({pendingInvitations.length})
            </p>
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="rounded-xl border border-brand-700/40 bg-brand-900/20 p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{inv.challengeName}</p>
                  <p className="text-xs text-slate-400">From {inv.fromUserName}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => handleAcceptInvitation(inv.id, inv.challengeId)}>
                    Join
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeclineInvitation(inv.id)}>
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button onClick={() => setShowCreate((v) => !v)} fullWidth variant="ghost">
          {showCreate ? <X size={16} /> : <Plus size={16} />}
          {showCreate ? 'Cancel' : 'Create Challenge'}
        </Button>

        {/* Create form */}
        {showCreate && (
          <Card className="space-y-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">New Challenge</p>

            <Input
              label="Challenge name"
              placeholder="e.g. March Volume Beast"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />

            <Input
              label="Description (optional)"
              placeholder="What's this challenge about?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
              <div className="relative">
                <select
                  aria-label="Challenge type"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Challenge['type'] }))}
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none pr-8"
                >
                  <option value="volume">Total Volume (kg)</option>
                  <option value="sessions">Workout Count</option>
                  <option value="streak">Training Streak (days)</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <Input
              label="Target (optional)"
              type="number"
              placeholder={form.type === 'volume' ? 'e.g. 10000' : form.type === 'sessions' ? 'e.g. 12' : 'e.g. 30'}
              value={form.targetValue}
              onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start date"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
              <Input
                label="End date"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>

            {/* Team mode toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-slate-300">Team mode</p>
                <p className="text-xs text-slate-500">Pool everyone's progress toward a shared goal</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-label="Team mode"
                aria-checked={form.isCooperative ? 'true' : 'false'}
                onClick={() => setForm((f) => ({ ...f, isCooperative: !f.isCooperative }))}
                className={[
                  'relative w-10 h-5 rounded-full transition-colors shrink-0',
                  form.isCooperative ? 'bg-purple-500' : 'bg-slate-600',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    form.isCooperative ? 'translate-x-5' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </button>
            </div>

            <Button
              onClick={handleCreate}
              fullWidth
              disabled={!form.name.trim() || creating}
            >
              {creating ? 'Creating…' : 'Create & Join'}
            </Button>
          </Card>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
          </div>
        )}

        {/* Active (joined) challenges */}
        {mine.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Your Challenges
            </p>
            <div className="space-y-3">
              {mine.map((c) => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  currentUserId={userId}
                  onJoin={handleJoin}
                  acceptedFriends={c.createdBy === userId ? acceptedFriends : undefined}
                  isCreatedByMe={c.createdBy === userId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Browse public */}
        {browse.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Browse
            </p>
            <div className="space-y-3">
              {browse.map((c) => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  currentUserId={userId}
                  onJoin={handleJoin}
                  acceptedFriends={c.createdBy === userId ? acceptedFriends : undefined}
                  isCreatedByMe={c.createdBy === userId}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && challenges.length === 0 && !showCreate && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Trophy size={32} className="text-slate-500" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No challenges yet. Be the first to create one!
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
