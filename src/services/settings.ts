import { supabase } from '@/lib/supabase';
import type { RestaurantSettings } from '@/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
function toSettings(row: any): RestaurantSettings {
  return {
    id: row.id,
    name: row.name ?? '',
    tagline: row.tagline ?? '',
    logo_url: row.logo_url ?? null,
    hero_image_url: row.hero_image_url ?? null,
    phone: row.phone ?? '',
    whatsapp: row.whatsapp ?? '',
    address: row.address ?? '',
    instagram: row.instagram ?? '',
    opening_hours: row.opening_hours ?? '',
    description: row.description ?? '',
    branches: row.branches ?? '',
  };
}

export async function fetchSettings(): Promise<RestaurantSettings | null> {
  const { data, error } = await supabase.from('restaurant_settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data ? toSettings(data) : null;
}

export async function saveSettings(settings: RestaurantSettings): Promise<RestaurantSettings> {
  const payload = {
    name: settings.name.trim(),
    tagline: settings.tagline.trim(),
    logo_url: settings.logo_url,
    hero_image_url: settings.hero_image_url,
    phone: settings.phone.trim(),
    whatsapp: settings.whatsapp.trim(),
    address: settings.address.trim(),
    instagram: settings.instagram.trim(),
    opening_hours: settings.opening_hours.trim(),
    description: settings.description.trim(),
    branches: settings.branches.trim(),
  };
  if (settings.id) {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .update(payload)
      .eq('id', settings.id)
      .select('*')
      .single();
    if (error) throw error;
    return toSettings(data);
  }
  const { data, error } = await supabase.from('restaurant_settings').insert(payload).select('*').single();
  if (error) throw error;
  return toSettings(data);
}
