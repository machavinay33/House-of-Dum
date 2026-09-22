import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileOrderBar } from '@/components/layout/MobileOrderBar';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { EASE_OUT } from '@/lib/constants';

export function PublicLayout() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <Navbar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main"
          key={location.pathname}
          className="flex-1"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
      <Footer />
      <MobileOrderBar />
    </div>
  );
}
