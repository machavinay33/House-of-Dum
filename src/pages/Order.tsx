import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { CheckoutErrors, CheckoutValues, PlacedOrder } from '@/types';
import { useSeo } from '@/lib/seo';
import { useSettings } from '@/hooks/useSettings';
import { useCart } from '@/hooks/useCart';
import { toMessage } from '@/lib/errors';
import { formatPrice } from '@/lib/format';
import { LAST_CODE_KEY, LAST_ORDER_KEY } from '@/lib/constants';
import { validateCheckout } from '@/utils/validation';
import { placeOrder } from '@/services/orders';
import { validateCartAgainstMenu } from '@/services/cart';
import { Button, LinkButton } from '@/components/ui/Button';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { StateMessage } from '@/components/ui/StateMessage';
import { TextArea, TextField } from '@/components/ui/Field';
import { OrderConfirmation } from '@/components/order/OrderConfirmation';

const emptyValues: CheckoutValues = { fullName: '', phone: '', address: '', landmark: '', instructions: '' };
const fieldOrder: (keyof CheckoutValues)[] = ['fullName', 'phone', 'address', 'landmark', 'instructions'];

function loadLastOrder(): PlacedOrder | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as PlacedOrder) : null;
  } catch {
    return null;
  }
}

export default function OrderPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { lines, subtotal, count, setQuantity, removeLine, clear, replaceLines } = useCart();

  const [confirmed, setConfirmed] = useState<PlacedOrder | null>(loadLastOrder);
  const [values, setValues] = useState<CheckoutValues>(emptyValues);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notices, setNotices] = useState<string[]>([]);

  useSeo({
    title: `Your order | ${settings.name}`,
    description: `Review your cart and place your ${settings.name} order online.`,
    path: '/order',
    noindex: true,
  });

  // On arrival, compare the saved cart with the live menu (availability and prices).
  const checkedOnce = useRef(false);
  useEffect(() => {
    if (checkedOnce.current || confirmed || lines.length === 0) return;
    checkedOnce.current = true;
    validateCartAgainstMenu(lines)
      .then((result) => {
        if (result.changed) {
          replaceLines(result.lines);
          setNotices(result.notices);
        }
      })
      .catch(() => {
        /* offline: the server re-validates when the order is placed */
      });
  }, [lines, confirmed, replaceLines]);

  const update = (field: keyof CheckoutValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);

    if (lines.length === 0) {
      setSubmitError('Your cart is empty. Add something from the menu first.');
      return;
    }
    const found = validateCheckout(values);
    setErrors(found);
    const firstInvalid = fieldOrder.find((f) => found[f]);
    if (firstInvalid) {
      document.getElementById(`co-${firstInvalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const check = await validateCartAgainstMenu(lines);
      if (check.changed) {
        replaceLines(check.lines);
        setNotices(check.notices);
        setSubmitError('Some items or prices changed while you were browsing. Please review your updated cart and place the order again.');
        return;
      }
      const order = await placeOrder(values, lines);
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
        localStorage.setItem(LAST_CODE_KEY, order.order_code);
      } catch {
        /* storage blocked: confirmation still shows below */
      }
      clear();
      setNotices([]);
      setConfirmed(order);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(toMessage(err, 'We could not place your order. Please try again, or call the restaurant.'));
    } finally {
      setSubmitting(false);
    }
  };

  const startNewOrder = () => {
    try {
      sessionStorage.removeItem(LAST_ORDER_KEY);
    } catch {
      /* ignore */
    }
    setConfirmed(null);
    setValues(emptyValues);
    navigate('/menu');
  };

  if (confirmed && lines.length === 0) {
    return <OrderConfirmation order={confirmed} onNewOrder={startNewOrder} />;
  }

  if (lines.length === 0) {
    return (
      <div className="px-4 pb-8 pt-36">
        <StateMessage
          title="Your cart is empty"
          message="Add biryani, kababs or starters from the menu and they will show up here."
          action={<LinkButton to="/menu">Browse the menu</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-28 sm:px-6">
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="gold-text text-5xl font-bold sm:text-6xl">
        Your order
      </motion.h1>

      <form onSubmit={handleSubmit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="space-y-10">
          {notices.length > 0 && (
            <div className="rounded-2xl border border-gold-500/40 bg-gold-500/10 p-4 text-sm text-gold-200" role="status">
              <p className="font-medium">Your cart was updated</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                {notices.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          <section aria-labelledby="cart-heading">
            <h2 id="cart-heading" className="text-3xl">
              Cart
            </h2>
            <ul className="mt-4 divide-y divide-gold-500/15 border-y border-gold-500/15">
              <AnimatePresence initial={false}>
                {lines.map((line) => (
                  <motion.li
                    key={line.key}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-5">
                      <div className="min-w-0 flex-1 basis-56">
                        <p className="text-xl leading-snug text-cream">{line.name}</p>
                        {line.variantLabel && <p className="text-sm text-mute">{line.variantLabel}</p>}
                        <p className="mt-0.5 text-sm text-mute">{formatPrice(line.unitPrice)} each</p>
                      </div>
                      <QuantityStepper
                        quantity={line.quantity}
                        label={line.variantLabel ? `${line.name} (${line.variantLabel})` : line.name}
                        onChange={(n) => setQuantity(line.key, n)}
                      />
                      <p className="w-24 text-right font-display text-2xl text-gold-300">{formatPrice(line.unitPrice * line.quantity)}</p>
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        aria-label={`Remove ${line.name}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-mute transition hover:bg-red-500/10 hover:text-red-300"
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
                        </svg>
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="mt-4 flex justify-between">
              <LinkButton to="/menu" variant="ghost" size="sm">
                Add more items
              </LinkButton>
              <Button type="button" variant="ghost" size="sm" onClick={clear}>
                Empty cart
              </Button>
            </div>
          </section>

          <section aria-labelledby="details-heading">
            <h2 id="details-heading" className="text-3xl">
              Delivery details
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <TextField
                id="co-fullName"
                label="Full name"
                autoComplete="name"
                value={values.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                error={errors.fullName}
                maxLength={100}
              />
              <TextField
                id="co-phone"
                label="Phone number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                hint="10-digit mobile number. We may call to confirm."
                value={values.phone}
                onChange={(e) => update('phone', e.target.value)}
                error={errors.phone}
                maxLength={16}
              />
              <div className="sm:col-span-2">
                <TextArea
                  id="co-address"
                  label="Delivery address"
                  autoComplete="street-address"
                  rows={3}
                  value={values.address}
                  onChange={(e) => update('address', e.target.value)}
                  error={errors.address}
                  maxLength={500}
                />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  id="co-landmark"
                  label="Landmark"
                  placeholder="Near a shop, temple, school..."
                  value={values.landmark}
                  onChange={(e) => update('landmark', e.target.value)}
                  error={errors.landmark}
                  maxLength={150}
                />
              </div>
              <div className="sm:col-span-2">
                <TextArea
                  id="co-instructions"
                  label="Delivery instructions"
                  optional
                  rows={2}
                  placeholder="Gate code, floor, spice level..."
                  value={values.instructions}
                  onChange={(e) => update('instructions', e.target.value)}
                  error={errors.instructions}
                  maxLength={300}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="panel p-6 lg:sticky lg:top-24" aria-label="Order summary">
          <h2 className="text-3xl">Summary</h2>
          <dl className="mt-5 space-y-3 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-mute">Items</dt>
              <dd>{count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-mute">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-gold-500/25 pt-4">
              <dt className="text-lg">Total</dt>
              <dd className="gold-text font-display text-4xl font-bold">
                <motion.span key={subtotal} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className="inline-block">
                  {formatPrice(subtotal)}
                </motion.span>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-mute">
            No online payment on this website. Final prices are confirmed when you place the order.
          </p>

          {submitError && (
            <p className="mt-4 rounded-xl border border-red-400/40 bg-red-950/30 p-3 text-sm text-red-200" role="alert">
              {submitError}
            </p>
          )}

          <Button type="submit" size="lg" loading={submitting} className="mt-5 w-full">
            {submitting ? 'Placing order...' : 'Place order'}
          </Button>
        </aside>
      </form>
    </div>
  );
}
