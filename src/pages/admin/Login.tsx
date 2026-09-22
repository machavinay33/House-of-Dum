import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSeo } from '@/lib/seo';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toMessage } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';

export default function AdminLogin() {
  const { session, isAdmin, loading, signIn } = useAuth();
  const { settings, logoUrl } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useSeo({ title: `Admin login | ${settings.name}`, description: 'Restaurant staff sign in.', noindex: true });

  if (!loading && session && isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith('/admin') ? from : '/admin', { replace: true });
    } catch (err) {
      const raw = (err as { message?: string })?.message ?? '';
      setError(
        /invalid login credentials/i.test(raw)
          ? 'That email or password is not correct.'
          : toMessage(err, 'Could not sign in. Please try again.', true),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-jali px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <div className="text-center">
          <img src={logoUrl} alt={`${settings.name} logo`} width={96} height={96} className="mx-auto h-24 w-24 rounded-full" />
          <h1 className="gold-text mt-5 text-4xl font-bold">Admin sign in</h1>
          <p className="mt-2 text-sm text-mute">For restaurant staff only.</p>
        </div>

        <form onSubmit={submit} noValidate className="panel mt-8 space-y-5 p-6 sm:p-8">
          {!isSupabaseConfigured && (
            <p className="rounded-xl border border-red-400/40 bg-red-950/30 p-3 text-sm text-red-200" role="alert">
              Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README).
            </p>
          )}
          <TextField id="login-email" label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField id="login-password" label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && (
            <p className="rounded-xl border border-red-400/40 bg-red-950/30 p-3 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" loading={busy} className="w-full" disabled={!isSupabaseConfigured}>
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-mute transition hover:text-gold-300">
            Back to the website
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
