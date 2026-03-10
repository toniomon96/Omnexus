import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useToast } from '../contexts/ToastContext';
import type { FriendProfile, FriendshipWithProfile } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { CommunityTabs } from '../components/community/CommunityTabs';
import { FriendCard } from '../components/community/FriendCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, UserPlus, UserCircle } from 'lucide-react';

async function loadFriendships(userId: string) {
  const { getFriendships } = await import('../lib/db');
  return getFriendships(userId);
}

async function findProfiles(query: string, userId: string) {
  const { searchProfiles } = await import('../lib/db');
  return searchProfiles(query, userId);
}

async function createFriendRequest(userId: string, addresseeId: string) {
  const { sendFriendRequest } = await import('../lib/db');
  return sendFriendRequest(userId, addresseeId);
}

async function updateFriendRequest(id: string, status: 'accepted' | 'blocked') {
  const { respondFriendRequest } = await import('../lib/db');
  return respondFriendRequest(id, status);
}

async function deleteFriendship(id: string) {
  const { removeFriendship } = await import('../lib/db');
  return removeFriendship(id);
}

export function FriendsPage() {
  const { state } = useApp();
  const { toast } = useToast();
  const userId = state.user?.id ?? '';

  const [friendships, setFriendships] = useState<FriendshipWithProfile[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingSend, setPendingSend] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFriendships(userId).then((data) => {
      setFriendships(data);
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await findProfiles(query, userId);
      // Filter out existing friends/pending
      const knownIds = new Set(friendships.map((f) => f.friend.id));
      setSearchResults(results.filter((r) => !knownIds.has(r.id)));
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, userId, friendships]);

  async function handleSendRequest(addresseeId: string) {
    setPendingSend((s) => new Set(s).add(addresseeId));
    try {
      await createFriendRequest(userId, addresseeId);
      const updated = await loadFriendships(userId);
      setFriendships(updated);
      setSearchResults((prev) => prev.filter((r) => r.id !== addresseeId));
      toast('Friend request sent', 'success');
    } catch {
      toast('Failed to send request', 'error');
      setPendingSend((s) => { const n = new Set(s); n.delete(addresseeId); return n; });
    }
  }

  async function handleAccept(id: string) {
    try {
      await updateFriendRequest(id, 'accepted');
      setFriendships((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'accepted' } : f)),
      );
      toast('Friend request accepted', 'success');
    } catch {
      toast('Failed to accept request', 'error');
    }
  }

  async function handleRemove(id: string) {
    try {
      await deleteFriendship(id);
      setFriendships((prev) => prev.filter((f) => f.id !== id));
      toast('Friend removed', 'success');
    } catch {
      toast('Failed to remove friend', 'error');
    }
  }

  const received = friendships.filter((f) => f.status === 'pending' && f.direction === 'received');
  const sent = friendships.filter((f) => f.status === 'pending' && f.direction === 'sent');
  const accepted = friendships.filter((f) => f.status === 'accepted');

  return (
    <AppShell>
      <TopBar title="Community" />
      <CommunityTabs />

      <div className="px-4 pb-6 mt-4 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search people by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Search results */}
        {(searchResults.length > 0 || searching) && (
          <Card>
            {searching && (
              <p className="text-xs text-slate-400 text-center py-2">Searching…</p>
            )}
            {!searching && searchResults.length === 0 && query.trim() && (
              <p className="text-xs text-slate-400 text-center py-2">No results found</p>
            )}
            {searchResults.map((profile) => (
              <div key={profile.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                  <UserCircle size={18} className="text-slate-400" />
                </div>
                <p className="flex-1 text-sm font-medium text-slate-900 dark:text-white">{profile.name}</p>
                <Button
                  size="sm"
                  disabled={pendingSend.has(profile.id)}
                  onClick={() => handleSendRequest(profile.id)}
                >
                  <UserPlus size={13} />
                  {pendingSend.has(profile.id) ? 'Sent' : 'Add'}
                </Button>
              </div>
            ))}
          </Card>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
          </div>
        )}

        {/* Pending received requests */}
        {received.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Requests ({received.length})
            </p>
            <Card>
              {received.map((f) => (
                <FriendCard
                  key={f.id}
                  friendship={f}
                  onAccept={handleAccept}
                  onDecline={handleRemove}
                />
              ))}
            </Card>
          </div>
        )}

        {/* Accepted friends */}
        {accepted.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Friends ({accepted.length})
            </p>
            <Card>
              {accepted.map((f) => (
                <FriendCard key={f.id} friendship={f} onRemove={handleRemove} />
              ))}
            </Card>
          </div>
        )}

        {/* Sent pending */}
        {sent.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Sent ({sent.length})
            </p>
            <Card>
              {sent.map((f) => (
                <FriendCard key={f.id} friendship={f} onRemove={handleRemove} />
              ))}
            </Card>
          </div>
        )}

        {!loading && friendships.length === 0 && !query && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <UserPlus size={32} className="text-slate-500" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Search for people by name to connect with them.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
