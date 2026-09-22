import { supabase } from '@/lib/supabase';
import type { MenuCategory, MenuItem, MenuVariant } from '@/types';

export interface MenuData {
  categories: MenuCategory[];
  items: MenuItem[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toVariant(raw: any): MenuVariant {
  return {
    id: raw.id,
    item_id: raw.item_id,
    label: raw.label,
    price: Number(raw.price),
    sort_order: raw.sort_order ?? 0,
    is_available: raw.is_available !== false,
  };
}

function toItem(raw: any): MenuItem {
  const variants: MenuVariant[] = (raw.variants ?? [])
    .map(toVariant)
    .sort((a: MenuVariant, b: MenuVariant) => a.sort_order - b.sort_order);
  return {
    id: raw.id,
    category_id: raw.category_id,
    name: raw.name,
    description: raw.description ?? null,
    price: Number(raw.price),
    image_url: raw.image_url ?? null,
    is_veg: raw.is_veg ?? null,
    is_available: raw.is_available !== false,
    is_featured: Boolean(raw.is_featured),
    sort_order: raw.sort_order ?? 0,
    variants,
  };
}

const CACHE_MS = 60_000;
let cache: { at: number; data: MenuData } | null = null;
let inflight: Promise<MenuData> | null = null;

export function invalidateMenuCache() {
  cache = null;
}

/** Loads categories, items and variants in two efficient queries. */
export async function fetchMenu(options: { fresh?: boolean } = {}): Promise<MenuData> {
  if (!options.fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  if (!options.fresh && inflight) return inflight;

  const load = (async (): Promise<MenuData> => {
    const [cats, items] = await Promise.all([
      supabase.from('menu_categories').select('id,name,description,sort_order').order('sort_order').order('name'),
      supabase
        .from('menu_items')
        .select('*, variants:menu_item_variants(*)')
        .order('sort_order')
        .order('name'),
    ]);
    if (cats.error) throw cats.error;
    if (items.error) throw items.error;
    const data: MenuData = {
      categories: (cats.data ?? []) as MenuCategory[],
      items: (items.data ?? []).map(toItem),
    };
    cache = { at: Date.now(), data };
    return data;
  })();

  if (!options.fresh) {
    inflight = load;
    load.then(
      () => {
        inflight = null;
      },
      () => {
        inflight = null;
      },
    );
  }
  return load;
}

/** Lowest price a customer can pay for an item (variant-aware). */
export function itemFromPrice(item: MenuItem): number {
  const available = item.variants.filter((v) => v.is_available);
  const pool = available.length ? available : item.variants;
  return pool.length ? Math.min(...pool.map((v) => v.price)) : item.price;
}
