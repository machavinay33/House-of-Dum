import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT } from '@/lib/constants';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

/** Scroll-reveal wrapper. Used for section intros only, so motion stays deliberate. */
export function Reveal({ children, className, delay = 0, y = 28 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerChild = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};
