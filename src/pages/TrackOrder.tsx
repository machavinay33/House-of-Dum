import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import type { TrackedOrder } from '@/types';
import { useSeo } from '@/lib/seo';
import { useSettings } from '@/hooks/useSettings';
import { toMessage } from '@/lib/errors';
import { LAST_CODE_KEY, STATUS_META } from '@/lib/constants';
import { formatDateTime, formatPrice, telHref } from '@/lib/format';
import { isValidOrderCode, normalizeOrderCode } from '@/utils/validation';
import { trackOrder } from '@/services/orders';
import { OrderStatusTracker } from '@/components/order/OrderStatusTracker';
import { AnchorButton, Button, LinkButton } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';

type ViewState = 'idle' | 'loading' | 'ready' | 'notfound' | 'error';

function rememberedCode(): string {
  try {
    return localStorage.getItem(LAST_CODE_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function TrackOrderPage() {
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();
  const urlCode = normalizeOrderCode(params.get('code') ?? '');

  const [input, setInput] = useState(urlCode || rememberedCode());
  const [inputError, setInputError] = useState<string | undefined>();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [view, setView] = useState<ViewState>('idle');
  const [error, setError] = useState<string | null>(null);

  useSeo({
    title: `Track your order | ${settings.name}`,
    description: `Enter your order code to follow your ${settings.name} order from received to delivered.`,
    path: '/track-order',
    noindex: true,
  });

  const load = useCallback(async (code: string, silent = false) => {
    if (!silent) {
      setView('loading');
      setError(null);
    }
    try {
      const result = await trackOrder(code);
      if (!result) {
        if (!silent) {
          setOrder(null);
          setView('notfound');
        }
        return;
      }
      setOrder(result);
      setView('ready');
    } catch (err) {
      if (!silent) {
        setError(toMessage(err, 'We could not check your order right now. Please try again.'));
        setView('error');
      }
    }
  }, []);

  useEffect(() => {
    if (isValidOrderCode(urlCode)) void load(urlCode);
    else {
      setView('idle');
      setOrder(null);
    }
  }, [urlCode, load]);

  // Status changes made by the restaurant show up here without a page reload.
  const status = order?.status;
  const activeCode = order?.order_code;
  useEffect(() => {
    if (!activeCode || status === 'delivered' || status === 'cancelled') return;
    const timer = window.setInterval(() => void load(activeCode, true), 8000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load(activeCode, true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [activeCode, status, load]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const code = normalizeOrderCode(input);
    if (!isValidOrderCode(code)) {
      setInputError('Enter your order code, for example HOD-7K4P92.');
      return;
    }
    setInputError(undefined);
    setInput(code);
    if (code === urlCode) void load(code);
    else setParams({ code }, { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-28 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="gold-text text-5xl font-bold sm:text-6xl">Track your order</h1>
        <p className="mt-3 text-mute">Enter the code you received when you placed the order. No account needed.</p>
      </motion.header>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <TextField
            id="track-code"
            label="Order code"
            placeholder="HOD-7K4P92"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            error={inputError}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={12}
            className="font-display text-xl tracking-widest"
          />
        </div>
        <Button type="submit" size="lg" className="sm:mt-[29px]" loading={view === 'loading'}>
          Track order
        </Button>
      </form>

      <div className="mt-10">
        {view === 'loading' && !order && (
          <div className="flex justify-center py-10 text-gold-400">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {view === 'notfound' && (
          <div className="rounded-2xl border border-gold-500/25 bg-coal/70 p-6 text-center" role="alert">
            <h2 className="text-2xl">We could not find that order</h2>
            <p className="mt-2 text-sm text-mute">
              Check the code for typos. It starts with HOD- followed by 6 letters or numbers.
              {settings.phone && ' You can also call us and we will look it up.'}
            </p>
            {settings.phone && (
              <AnchorButton href={telHref(settings.phone)} variant="outline" size="sm" className="mt-4">
                Call {settings.phone}
              </AnchorButton>
            )}
          </div>
        )}

        {view === 'error' && (
          <div className="rounded-2xl border border-red-400/30 bg-red-950/20 p-6 text-center" role="alert">
            <h2 className="text-2xl">Tracking is not available right now</h2>
            <p className="mt-2 text-sm text-mute">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => urlCode && void load(urlCode)}>
              Try again
            </Button>
          </div>
        )}

        {view === 'ready' && order && (
          <motion.article
            key={order.order_code}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="panel p-6 sm:p-8"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-mute">
                  {order.customer_first_name ? `Hi ${order.customer_first_name}, here is order` : 'Order'}
                </p>
                <p className="gold-text font-display text-4xl font-bold tracking-wider">{order.order_code}</p>
                <p className="mt-1 text-xs text-mute">Placed {formatDateTime(order.created_at)}</p>
              </div>
              <span className={`rounded-full border px-3.5 py-1.5 text-sm ${STATUS_META[order.status].tone}`}>
                {STATUS_META[order.status].label}
              </span>
            </div>

            <div className="mt-8">
              <OrderStatusTracker status={order.status} timeline={order.timeline} />
            </div>

            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <p className="mt-6 flex items-center gap-2 text-xs text-mute">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                This page updates automatically.
              </p>
            )}

            <div className="mt-8 border-t border-gold-500/15 pt-6">
              <h2 className="text-2xl">Items</h2>
              <ul className="mt-3 divide-y divide-gold-500/10">
                {order.items.map((line, i) => (
                  <li key={i} className="flex justify-between gap-4 py-2.5 text-[15px]">
                    <span>
                      {line.quantity} &times; {line.name}
                      {line.variant_label && <span className="text-mute"> ({line.variant_label})</span>}
                    </span>
                    <span className="shrink-0 text-gold-300">{formatPrice(line.line_total)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-gold-500/25 pt-4">
                <span className="text-lg">Total</span>
                <span className="gold-text font-display text-3xl font-bold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </motion.article>
        )}

        {view === 'idle' && (
          <div className="text-center">
            <LinkButton to="/menu" variant="ghost">
              Hungry? Browse the menu
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}
