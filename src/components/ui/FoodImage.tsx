import { useState } from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT } from '@/lib/constants';
import { DiamondMark } from '@/components/ui/Ornament';

interface Props {
  src: string | null | undefined;
  alt: string;
  className?: string;
  arch?: boolean;
  priority?: boolean;
}

/**
 * Food photo with a reveal animation. When no photo has been uploaded yet it shows
 * an ornamental placeholder instead of a broken image.
 */
export function FoodImage({ src, alt, className = '', arch = false, priority = false }: Props) {
  const [failed, setFailed] = useState(false);
  const shape = arch ? 'arch' : 'rounded-xl';

  if (!src || failed) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden border border-gold-500/20 bg-gradient-to-b from-umber to-coal bg-jali ${shape} ${className}`}
        role="img"
        aria-label={`${alt} (photo coming soon)`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(248,197,62,0.14),transparent_65%)]" />
        <DiamondMark className="relative h-7 w-14 text-gold-500/70" />
      </div>
    );
  }

  return (
    <motion.div
      className={`relative overflow-hidden bg-umber ${shape} ${className}`}
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
        initial={{ scale: 1.15 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.3, ease: EASE_OUT }}
      />
    </motion.div>
  );
}
