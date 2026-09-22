import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { toMessage } from '@/lib/errors';

export function AdminLayout() {
  const { email, signOut } = useAuth();
  const { settings, logoUrl } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/admin/login', { replace: true });
    } catch (err) {
      toast.error(toMessage(err, 'Could not sign out.', true));
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-40 border-b border-gold-500/15 bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/admin" className="flex items-center gap-3">
            <img src={logoUrl} alt="" className="h-10 w-10 rounded-full" width={40} height={40} />
            <span className="leading-tight">
              <span className="gold-text block font-display text-xl">{settings.name}</span>
              <span className="block text-xs text-mute">Admin dashboard</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {email && <span className="hidden text-sm text-mute md:inline">{email}</span>}
            <Link to="/" className="btn btn-ghost btn-sm">
              View site
            </Link>
            <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
