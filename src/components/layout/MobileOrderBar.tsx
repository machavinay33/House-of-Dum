import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/format';
import { EASE_OUT } from '@/lib/constants';

/** Sticky call-to-action on phones: "Order Now" or, once the cart has items, "View cart". */
export function MobileOrderBar() {
  const { count, subtotal } = useCart();
  const { pathname } = useLocation();
  if (pathname === '/order') return null;
  const hasItems = count > 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={hasItems ? 'cart' : 'order'}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="pointer-events-auto"
        >
          {hasItems ? (
            <Link
              to="/order"
              className="btn btn-gold btn-lg w-full justify-between shadow-deep"
              aria-label={`View cart, ${count} items, ${formatPrice(subtotal)}`}
            >
              <span>
                View cart ({count} item{count === 1 ? '' : 's'})
              </span>
              <span className="font-display text-xl font-bold">{formatPrice(subtotal)}</span>
            </Link>
          ) : (
            <Link to="/menu" className="btn btn-gold btn-lg w-full shadow-deep">
              ORDER NOW
            </Link>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
