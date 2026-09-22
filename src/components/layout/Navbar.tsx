import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { NAV_LINKS, EASE_OUT } from '@/lib/constants';
import { useSettings } from '@/hooks/useSettings';
import { useCart } from '@/hooks/useCart';
import { LinkButton } from '@/components/ui/Button';

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

export function Navbar() {
  const { settings, logoUrl } = useSettings();
  const { count, pulse } = useCart();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  // Close the mobile menu after navigating.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    if (open) setOpen(false);
  }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled || open ? 'border-b border-gold-500/15 bg-ink/85 backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label={`${settings.name} home`}>
            <img src={logoUrl} alt="" width={44} height={44} className="h-11 w-11 rounded-full" />
            <span className="gold-text font-display text-2xl leading-none">{settings.name}</span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `relative py-2 text-[15px] tracking-wide transition-colors ${
                    isActive ? 'text-gold-300' : 'text-cream/75 hover:text-cream'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-0 -bottom-0.5 h-px bg-gold-400"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/order"
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-cream/85 transition hover:bg-white/5 hover:text-gold-300"
            >
              <CartIcon />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={pulse}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: [1.5, 1] }}
                    transition={{ duration: 0.35 }}
                    className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold-400 px-1 text-xs font-semibold text-ink"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <LinkButton to="/menu" size="sm" className="hidden sm:inline-flex">
              ORDER NOW
            </LinkButton>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="flex h-11 w-11 items-center justify-center rounded-full text-cream lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-ink/95 bg-jali pt-[68px] backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <nav className="flex h-full flex-col justify-center gap-1 px-8 pb-24" aria-label="Mobile">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.05, duration: 0.5, ease: EASE_OUT }}
                >
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `block border-b border-gold-500/10 py-4 font-display text-4xl ${isActive ? 'gold-text' : 'text-cream/90'}`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
              <LinkButton to="/menu" size="lg" className="mt-8">
                ORDER NOW
              </LinkButton>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
