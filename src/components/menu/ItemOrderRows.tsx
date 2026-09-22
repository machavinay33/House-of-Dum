import type { MenuItem } from '@/types';
import { formatPrice } from '@/lib/format';
import { AddControl } from '@/components/menu/AddControl';

/** Price + add control for a single-price item, or one row per variant (e.g. 4 / 8 pieces). */
export function ItemOrderRows({ item }: { item: MenuItem }) {
  if (item.variants.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-2xl text-gold-300">{formatPrice(item.price)}</span>
        <AddControl item={item} />
      </div>
    );
  }
  return (
    <ul className="space-y-1">
      {item.variants.map((variant) => (
        <li key={variant.id} className="flex items-center gap-3 py-1">
          <span className="text-sm text-cream/85">{variant.label}</span>
          <span className="leader" aria-hidden="true" />
          <span className="font-display text-xl text-gold-300">{formatPrice(variant.price)}</span>
          <AddControl item={item} variant={variant} />
        </li>
      ))}
    </ul>
  );
}
