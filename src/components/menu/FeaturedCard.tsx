import { motion } from 'framer-motion';
import type { MenuItem } from '@/types';
import { staggerChild } from '@/components/ui/Reveal';
import { FoodImage } from '@/components/ui/FoodImage';
import { VegBadge } from '@/components/ui/VegBadge';
import { ItemOrderRows } from '@/components/menu/ItemOrderRows';

/** Large arch-framed card for signature dishes on the home page. */
export function FeaturedCard({ item }: { item: MenuItem }) {
  return (
    <motion.article variants={staggerChild} className="group flex flex-col">
      <div className="relative">
        <FoodImage
          arch
          src={item.image_url}
          alt={item.name}
          className="aspect-[4/5] w-full transition duration-700 group-hover:brightness-110"
        />
        <span className="pointer-events-none absolute inset-0 arch ring-1 ring-inset ring-gold-400/30" />
      </div>
      <div className="mt-5 px-1">
        <div className="flex items-start gap-2.5">
          <VegBadge isVeg={item.is_veg} />
          <h3 className="text-2xl leading-snug text-cream">{item.name}</h3>
        </div>
        {item.description && <p className="mt-1.5 text-sm leading-relaxed text-mute">{item.description}</p>}
        <div className="mt-3">
          <ItemOrderRows item={item} />
        </div>
      </div>
    </motion.article>
  );
}
