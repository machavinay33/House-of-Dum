import { motion } from 'framer-motion';
import type { MenuItem } from '@/types';
import { staggerChild } from '@/components/ui/Reveal';
import { FoodImage } from '@/components/ui/FoodImage';
import { VegBadge } from '@/components/ui/VegBadge';
import { ItemOrderRows } from '@/components/menu/ItemOrderRows';

export function MenuItemRow({ item }: { item: MenuItem }) {
  return (
    <motion.article
      variants={staggerChild}
      className={`border-b border-gold-500/15 py-6 ${item.is_available ? '' : 'opacity-60'}`}
    >
      <div className="flex gap-4 sm:gap-5">
        {item.image_url && (
          <FoodImage arch src={item.image_url} alt={item.name} className="h-28 w-24 shrink-0 sm:h-32 sm:w-28" />
        )}
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[1fr_minmax(15rem,17rem)] sm:items-start sm:gap-8">
          <div className="min-w-0">
            <div className="flex items-start gap-2.5">
              <VegBadge isVeg={item.is_veg} />
              <h3 className="text-[1.35rem] leading-snug text-cream">{item.name}</h3>
            </div>
            {item.description && <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-mute">{item.description}</p>}
            {!item.is_available && (
              <p className="mt-2 inline-block rounded-full border border-red-400/40 px-3 py-0.5 text-xs text-red-300">
                Currently unavailable
              </p>
            )}
          </div>
          <div>
            <ItemOrderRows item={item} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}
