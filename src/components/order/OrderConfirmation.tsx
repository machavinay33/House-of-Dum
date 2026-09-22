import { motion } from 'framer-motion';
import type { PlacedOrder } from '@/types';
import { EASE_OUT, STATUS_META } from '@/lib/constants';
import { formatDateTime, formatPrice, telHref } from '@/lib/format';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/useToast';
import { AnchorButton, Button, LinkButton } from '@/components/ui/Button';

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

function AnimatedCheck() {
  return (
    <div className="relative mx-auto h-28 w-28">
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full border border-gold-400"
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: 1.9, opacity: [0, 0.6, 0] }}
          transition={{ duration: 1.8, delay: 0.9 + i * 0.5, ease: 'easeOut' }}
        />
      ))}
      <svg viewBox="0 0 120 120" className="relative h-full w-full" aria-hidden="true">
        <motion.circle
          cx="60"
          cy="60"
          r="54"
          fill="rgba(248,197,62,0.08)"
          stroke="#f8c53e"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        />
        <motion.path
          d="M38 62l16 16 30-34"
          fill="none"
          stroke="#f8c53e"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.7, duration: 0.5, ease: EASE_OUT }}
        />
      </svg>
    </div>
  );
}

export function OrderConfirmation({ order, onNewOrder }: { order: PlacedOrder; onNewOrder: () => void }) {
  const { settings } = useSettings();
  const toast = useToast();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(order.order_code);
      toast.success('Order code copied');
    } catch {
      toast.error('Could not copy. Please note the code down.');
    }
  };

  return (
    <motion.div
      className="mx-auto max-w-2xl px-4 pb-8 pt-28 text-center"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.9 } } }}
    >
      <AnimatedCheck />
      <motion.h1 variants={item} className="gold-text mt-8 text-5xl font-bold sm:text-6xl">
        Order Confirmed!
      </motion.h1>
      <motion.p variants={item} className="mt-3 text-lg text-cream/85">
        Your order has been received.
      </motion.p>

      <motion.div variants={item} className="mx-auto mt-8 max-w-md rounded-2xl border border-gold-400/50 bg-gradient-to-b from-umber to-coal p-6 shadow-gold">
        <p className="text-sm text-mute">Order Code</p>
        <p className="gold-text mt-1 select-all font-display text-5xl font-bold tracking-wider" aria-label={`Order code ${order.order_code}`}>
          {order.order_code}
        </p>
        <p className="mt-3 text-sm text-mute">Keep this code. You need it to track your order.</p>
        <Button variant="outline" size="sm" onClick={copyCode} className="mt-4">
          Copy code
        </Button>
      </motion.div>

      <motion.p variants={item} className="mt-6 font-display text-2xl italic text-cream/85">
        Your order will arrive soon.
      </motion.p>

      <motion.div variants={item} className="panel mt-8 p-5 text-left sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl">Your order</h2>
          <span className={`rounded-full border px-3 py-1 text-sm ${STATUS_META[order.status].tone}`}>{STATUS_META[order.status].label}</span>
        </div>
        <ul className="mt-4 divide-y divide-gold-500/10">
          {order.items.map((line, i) => (
            <li key={i} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-cream">
                  {line.name}
                  {line.variant_label && <span className="text-mute"> ({line.variant_label})</span>}
                </p>
                <p className="text-sm text-mute">
                  {line.quantity} &times; {formatPrice(line.unit_price)}
                </p>
              </div>
              <p className="shrink-0 font-display text-xl text-gold-300">{formatPrice(line.line_total)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t border-gold-500/25 pt-4">
          <span className="text-lg">Total</span>
          <span className="gold-text font-display text-3xl font-bold">{formatPrice(order.total)}</span>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-gold-500/15 pt-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-mute">Name</dt>
            <dd className="mt-0.5 text-cream">{order.customer_name}</dd>
          </div>
          <div>
            <dt className="text-mute">Phone</dt>
            <dd className="mt-0.5 text-cream">{order.phone}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-mute">Delivery address</dt>
            <dd className="mt-0.5 text-cream">
              {order.address}
              {order.landmark && <span className="text-mute"> (Landmark: {order.landmark})</span>}
            </dd>
          </div>
          {order.instructions && (
            <div className="sm:col-span-2">
              <dt className="text-mute">Instructions</dt>
              <dd className="mt-0.5 text-cream">{order.instructions}</dd>
            </div>
          )}
          <div>
            <dt className="text-mute">Placed</dt>
            <dd className="mt-0.5 text-cream">{formatDateTime(order.created_at)}</dd>
          </div>
        </dl>
      </motion.div>

      <motion.div variants={item} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <LinkButton to={`/track-order?code=${encodeURIComponent(order.order_code)}`} size="lg">
          Track Order
        </LinkButton>
        <Button variant="outline" size="lg" onClick={onNewOrder}>
          Order more
        </Button>
        {settings.phone && (
          <AnchorButton href={telHref(settings.phone)} variant="ghost" size="lg">
            Call restaurant
          </AnchorButton>
        )}
      </motion.div>
    </motion.div>
  );
}
