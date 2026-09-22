import { motion } from 'framer-motion';
import type { OrderStatus } from '@/types';
import { EASE_OUT, STATUS_FLOW, STATUS_META } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';

interface Props {
  status: OrderStatus;
  timeline?: Partial<Record<OrderStatus, string | null>>;
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Vertical progress tracker. Completed steps fill in gold; the current step pulses. */
export function OrderStatusTracker({ status, timeline = {} }: Props) {
  if (status === 'cancelled') {
    return (
      <div className="rounded-2xl border border-red-400/40 bg-red-950/25 p-6" role="status">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-red-400/60 text-red-300">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </span>
          <div>
            <p className="font-display text-2xl text-red-200">{STATUS_META.cancelled.label}</p>
            <p className="text-sm text-red-200/70">{STATUS_META.cancelled.hint}</p>
            {timeline.cancelled && <p className="mt-1 text-xs text-red-200/60">{formatDateTime(timeline.cancelled)}</p>}
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(status);
  const finished = status === 'delivered';

  return (
    <ol className="relative" aria-label="Order progress">
      {STATUS_FLOW.map((step, i) => {
        const done = i < currentIndex || (finished && i === currentIndex);
        const current = i === currentIndex && !finished;
        const isLast = i === STATUS_FLOW.length - 1;
        const time = timeline[step];

        return (
          <li key={step} className={`relative pl-16 ${isLast ? '' : 'pb-9'}`} aria-current={current ? 'step' : undefined}>
            {!isLast && (
              <span className="absolute bottom-0 left-[19px] top-11 w-[2px] rounded bg-gold-500/15">
                <motion.span
                  className="block h-full w-full origin-top rounded bg-gold-400"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: i < currentIndex ? 1 : 0 }}
                  transition={{ duration: 0.7, delay: 0.25 * i + 0.2, ease: EASE_OUT }}
                />
              </span>
            )}

            <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center">
              {current && (
                <motion.span
                  className="absolute inset-0 rounded-full border border-gold-400"
                  animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25 * i, duration: 0.45, ease: EASE_OUT }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  done
                    ? 'border-gold-400 bg-gold-400 text-ink'
                    : current
                      ? 'border-gold-400 bg-gold-500/15 text-gold-300'
                      : 'border-gold-500/25 text-mute/60'
                }`}
              >
                {done ? <Check /> : <span className={`h-2.5 w-2.5 rounded-full ${current ? 'bg-gold-400' : 'bg-gold-500/25'}`} />}
              </motion.span>
            </span>

            <div className="pt-1.5">
              <p className={`font-display text-2xl leading-tight ${done || current ? 'text-cream' : 'text-mute/70'}`}>
                {STATUS_META[step].label}
              </p>
              {current && <p className="mt-1 text-sm text-gold-300/90">{STATUS_META[step].hint}</p>}
              {time && (done || current) && <p className="mt-0.5 text-xs text-mute">{formatDateTime(time)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
