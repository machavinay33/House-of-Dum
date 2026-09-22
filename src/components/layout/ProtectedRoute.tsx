import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageSpinner } from '@/components/ui/Spinner';

/** Only signed-in users listed in public.admins can see the admin area. */
export function ProtectedRoute() {
  const { session, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
