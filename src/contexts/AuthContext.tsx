import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

async function getAuthSession() {
  const { supabase } = await import('../lib/supabase');
  return supabase.auth.getSession();
}

async function subscribeToAuthStateChange(
  onChange: (event: string, session: Session | null) => void,
) {
  const { supabase } = await import('../lib/supabase');
  return supabase.auth.onAuthStateChange(onChange);
}

async function signOutAuthSession() {
  const { supabase } = await import('../lib/supabase');
  return supabase.auth.signOut();
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    void getAuthSession().then(({ data: { session } }) => {
      if (!active) return;
      setSession(session);
      setLoading(false);
    });

    void subscribeToAuthStateChange((_event, session) => {
      if (!active) return;
      setSession(session);
      setLoading(false);
    }).then(({ data: { subscription } }) => {
      if (!active) {
        subscription.unsubscribe();
        return;
      }
      unsubscribe = () => {
        subscription.unsubscribe();
      };
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function signOut() {
    await signOutAuthSession();
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
