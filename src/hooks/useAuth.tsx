import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { checkIsAdmin, signInWithPassword, signOut as doSignOut } from '@/services/auth';

interface AuthApi {
  session: Session | null;
  email: string | null;
  isAdmin: boolean;
  loading: boolean;
  /** Signs in and verifies admin rights. Throws a readable Error if the account is not an admin. */
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(!isSupabaseConfigured);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!sessionReady) return;
    if (!userId) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    checkIsAdmin()
      .then((ok) => !cancelled && setIsAdmin(ok))
      .catch(() => !cancelled && setIsAdmin(false))
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [userId, sessionReady]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithPassword(email, password);
    const ok = await checkIsAdmin();
    if (!ok) {
      await doSignOut();
      throw new Error('This account does not have admin access.');
    }
    setIsAdmin(true);
  }, []);

  const signOut = useCallback(async () => {
    await doSignOut();
    setIsAdmin(false);
  }, []);

  const value = useMemo<AuthApi>(
    () => ({
      session,
      email: session?.user.email ?? null,
      isAdmin,
      loading: !sessionReady || checking,
      signIn,
      signOut,
    }),
    [session, isAdmin, sessionReady, checking, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
