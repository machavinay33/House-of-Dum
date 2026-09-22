import { motion, AnimatePresence } from 'framer-motion';
import { MAX_QTY } from '@/lib/constants';

interface Props {
  quantity: number;
  onChange: (next: number) => void;
  label: string;
  compact?: boolean;
}

export function QuantityStepper({ quantity, onChange, label, compact = false }: Props) {
  const size = compact ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <div
      className="inline-flex items-center rounded-full border border-gold-500/50 bg-ink/60"
      role="group"
      aria-label={`Quantity for ${label}`}
    >
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={`Decrease ${label}`}
        className={`${size} flex items-center justify-center rounded-full text-lg text-gold-300 transition hover:bg-gold-500/15 active:scale-90`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span className="relative inline-flex h-6 w-7 items-center justify-center overflow-hidden text-center text-[15px] font-medium tabular-nums">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={quantity}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute"
          >
            {quantity}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= MAX_QTY}
        aria-label={`Increase ${label}`}
        className={`${size} flex items-center justify-center rounded-full text-gold-300 transition hover:bg-gold-500/15 active:scale-90 disabled:opacity-40`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
