import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { RestaurantSettings } from '@/types';
import { DEFAULT_LOGO, FALLBACK_SETTINGS } from '@/lib/constants';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchSettings } from '@/services/settings';

interface SettingsApi {
  settings: RestaurantSettings;
  logoUrl: string;
  loading: boolean;
  refresh: () => Promise<void>;
  setSettings: (s: RestaurantSettings) => void;
}

const SettingsContext = createContext<SettingsApi | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RestaurantSettings>(FALLBACK_SETTINGS);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const refresh = useCallback(async () => {
    try {
      const s = await fetchSettings();
      if (s) setSettings(s);
    } catch (err) {
      console.error('Could not load restaurant settings', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) void refresh();
  }, [refresh]);

  const value = useMemo<SettingsApi>(
    () => ({ settings, logoUrl: settings.logo_url || DEFAULT_LOGO, loading, refresh, setSettings }),
    [settings, loading, refresh],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsApi {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
