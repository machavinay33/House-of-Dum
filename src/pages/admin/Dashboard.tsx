import { useSearchParams } from 'react-router-dom';
import { useSeo } from '@/lib/seo';
import { useSettings } from '@/hooks/useSettings';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { AdminGallery } from '@/components/admin/AdminGallery';
import { AdminSettings } from '@/components/admin/AdminSettings';

const tabs = [
  { id: 'orders', label: 'Orders' },
  { id: 'menu', label: 'Menu' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'settings', label: 'Settings' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function AdminDashboard() {
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: TabId = tabs.some((t) => t.id === requested) ? (requested as TabId) : 'orders';

  useSeo({ title: `Admin | ${settings.name}`, description: 'Restaurant admin dashboard.', noindex: true });

  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-gold-500/15 px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Admin sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === 'orders' ? {} : { tab: t.id }, { replace: true })}
            className={`relative min-h-[48px] shrink-0 px-5 text-[15px] transition ${tab === t.id ? 'text-gold-300' : 'text-cream/70 hover:text-cream'}`}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded bg-gold-400" />}
          </button>
        ))}
      </div>

      <div className="pt-8" role="tabpanel">
        {tab === 'orders' && <AdminOrders />}
        {tab === 'menu' && <AdminMenu />}
        {tab === 'gallery' && <AdminGallery />}
        {tab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}
