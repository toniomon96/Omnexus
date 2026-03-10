import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useToast } from '../contexts/ToastContext';
import type { FeedSession, FeedReaction, ReactionEmoji } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { CommunityTabs } from '../components/community/CommunityTabs';
import { ActivityItem } from '../components/community/ActivityItem';
import { Skeleton } from '../components/ui/Skeleton';
import { Users } from 'lucide-react';

async function loadFriendFeed(userId: string) {
  const { getFriendFeed } = await import('../lib/db');
  return getFriendFeed(userId);
}

async function loadSessionReactions(sessionIds: string[]) {
  const { getSessionReactions } = await import('../lib/db');
  return getSessionReactions(sessionIds);
}

async function addSessionReaction(sessionId: string, userId: string, emoji: ReactionEmoji) {
  const { addReaction } = await import('../lib/db');
  return addReaction(sessionId, userId, emoji);
}

async function removeSessionReaction(sessionId: string, userId: string) {
  const { removeReaction } = await import('../lib/db');
  return removeReaction(sessionId, userId);
}

async function createFeedRealtimeChannel(userId: string, onSessionInserted: () => void) {
  const { supabase } = await import('../lib/supabase');
  return supabase
    .channel('feed_realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'workout_sessions',
      },
      () => {
        if (userId) onSessionInserted();
      },
    )
    .subscribe();
}

export function ActivityFeedPage() {
  const { state } = useApp();
  const { toast } = useToast();
  const userId = state.user?.id ?? '';

  const [feed, setFeed] = useState<FeedSession[]>([]);
  const [reactions, setReactions] = useState<FeedReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const channelRef = useRef<{ unsubscribe: () => Promise<unknown> | void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFeedError(null);
      try {
        const data = await loadFriendFeed(userId);
        if (!cancelled) {
          setFeed(data);
          if (data.length > 0) {
            const rxns = await loadSessionReactions(data.map((s) => s.sessionId));
            if (!cancelled) setReactions(rxns);
          } else {
            setReactions([]);
          }
        }
      } catch {
        if (!cancelled) setFeedError('Failed to load feed. Tap to retry.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    void createFeedRealtimeChannel(userId, () => {
      void load();
    }).then((channel) => {
      if (cancelled) {
        void channel.unsubscribe();
        return;
      }
      channelRef.current = channel;
    });

    return () => {
      cancelled = true;
      void channelRef.current?.unsubscribe();
    };
  }, [userId]);

  async function handleReact(sessionId: string, emoji: ReactionEmoji) {
    if (!userId) return;
    const snapshot = reactions;
    // Optimistic: remove any existing reaction from this user for this session, then add
    setReactions((prev) => [
      ...prev.filter((r) => !(r.sessionId === sessionId && r.userId === userId)),
      { id: `${sessionId}-${userId}`, sessionId, userId, emoji, createdAt: new Date().toISOString() },
    ]);
    try {
      await addSessionReaction(sessionId, userId, emoji);
    } catch {
      setReactions(snapshot);
      toast('Could not add reaction — try again', 'error');
    }
  }

  async function handleUnreact(sessionId: string) {
    if (!userId) return;
    const snapshot = reactions;
    setReactions((prev) => prev.filter((r) => !(r.sessionId === sessionId && r.userId === userId)));
    try {
      await removeSessionReaction(sessionId, userId);
    } catch {
      setReactions(snapshot);
      toast('Could not remove reaction — try again', 'error');
    }
  }

  return (
    <AppShell>
      <TopBar title="Community" />
      <CommunityTabs />

      <div className="px-4 pb-6 mt-2">
        {loading && (
          <div className="space-y-3 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-700/60 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton variant="avatar" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="w-32" />
                    <Skeleton variant="text" className="w-20" />
                  </div>
                </div>
                <Skeleton variant="text" className="w-full" />
                <Skeleton variant="text" className="w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!loading && feedError && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-red-400 text-sm">{feedError}</p>
            <button
              onClick={() => { setFeedError(null); setLoading(true); }}
              className="text-brand-400 text-sm underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !feedError && feed.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Users size={26} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
              No activity yet. Add friends to see their workouts here in real time.
            </p>
          </div>
        )}

        {!loading && !feedError && feed.length > 0 && (
          <div className="mt-2">
            {feed.map((item) => (
              <ActivityItem
                key={item.sessionId}
                item={item}
                reactions={reactions.filter((r) => r.sessionId === item.sessionId)}
                currentUserId={userId}
                onReact={handleReact}
                onUnreact={handleUnreact}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
