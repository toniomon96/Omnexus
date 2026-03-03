import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiBase } from '../lib/api';
import type { SubscriptionStatus } from '../types';

interface UseSubscriptionResult {
  status: SubscriptionStatus | null;
  loading: boolean;
  refresh: () => void;
}

export function useSubscription(): UseSubscriptionResult {
  const { session } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!session) {
      setStatus(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${apiBase}/api/subscription-status`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data: SubscriptionStatus) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [session, tick]);

  return { status, loading, refresh };
}
