import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { isSupabaseConfigured } from '@/lib/supabase';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ConfigMissing } from '@/components/layout/ConfigMissing';
import { PageSpinner } from '@/components/ui/Spinner';
import Home from '@/pages/Home';

// Everything except the home page is code-split so the first load stays small.
const MenuPage = lazy(() => import('@/pages/Menu'));
const OrderPage = lazy(() => import('@/pages/Order'));
const TrackOrderPage = lazy(() => import('@/pages/TrackOrder'));
const AboutPage = lazy(() => import('@/pages/About'));
const GalleryPage = lazy(() => import('@/pages/Gallery'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const AdminLogin = lazy(() => import('@/pages/admin/Login'));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));

export default function App() {
  if (!isSupabaseConfigured) return <ConfigMissing />;

  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="order" element={<OrderPage />} />
            <Route path="track-order" element={<TrackOrderPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </MotionConfig>
  );
}
