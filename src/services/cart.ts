import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import type { CartLine } from '@/types';

export interface CartValidation {
  lines: CartLine[];
  notices: string[];
  changed: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Compares the cart with the live menu in Supabase: removes unavailable items and
 * refreshes prices. The final order is always re-priced on the server as well.
 */
export async function validateCartAgainstMenu(lines: CartLine[]): Promise<CartValidation> {
  if (lines.length === 0) return { lines, notices: [], changed: false };

  const ids = Array.from(new Set(lines.map((l) => l.itemId)));
  const { data, error } = await supabase
    .from('menu_items')
    .select('id,name,price,is_available, variants:menu_item_variants(id,label,price,is_available)')
    .in('id', ids);
  if (error) throw error;

  const map = new Map<string, any>((data ?? []).map((row: any) => [row.id, row]));
  const notices: string[] = [];
  const next: CartLine[] = [];

  for (const line of lines) {
    const item = map.get(line.itemId);
    if (!item) {
      notices.push(`${line.name} is no longer on the menu and was removed.`);
      continue;
    }
    if (!item.is_available) {
      notices.push(`${item.name} is currently unavailable and was removed.`);
      continue;
    }

    const variants: any[] = item.variants ?? [];
    let price = Number(item.price);
    let label: string | null = null;

    if (variants.length > 0) {
      const variant = variants.find((v) => v.id === line.variantId);
      if (!variant) {
        notices.push(`The option you chose for ${item.name} is no longer offered, so it was removed.`);
        continue;
      }
      if (!variant.is_available) {
        notices.push(`${item.name} (${variant.label}) is currently unavailable and was removed.`);
        continue;
      }
      price = Number(variant.price);
      label = variant.label;
    } else if (line.variantId) {
      notices.push(`${item.name} changed on the menu, so it was removed. Please add it again.`);
      continue;
    }

    if (Math.abs(price - line.unitPrice) > 0.001) {
      notices.push(`Price of ${item.name} is now ${formatPrice(price)} (was ${formatPrice(line.unitPrice)}).`);
    }
    next.push({ ...line, name: item.name, variantLabel: label, unitPrice: price });
  }

  return { lines: next, notices, changed: notices.length > 0 };
}
