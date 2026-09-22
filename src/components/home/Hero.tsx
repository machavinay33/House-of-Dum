import { motion, useScroll, useTransform } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';
import { useCart } from '@/hooks/useCart';
import { EASE_OUT } from '@/lib/constants';
import { LinkButton } from '@/components/ui/Button';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.25 } },
};
const rise = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } },
};
const logoIn = {
  hidden: { opacity: 0, scale: 0.86 },
  show: { opacity: 1, scale: 1, transition: { duration: 1.3, ease: EASE_OUT } },
};

/** Rising steam: the "dum" seal opening. Pure CSS animation, hidden for reduced-motion users. */
function Steam() {
  const wisps = [
    { left: '30%', delay: '0s', w: 'w-20' },
    { left: '44%', delay: '2.6s', w: 'w-28' },
    { left: '58%', delay: '5.1s', w: 'w-24' },
    { left: '70%', delay: '1.4s', w: 'w-16' },
  ];
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] motion-reduce:hidden" aria-hidden="true">
      {wisps.map((w, i) => (
        <span
          key={i}
          className={`absolute bottom-0 h-72 ${w.w} animate-steam rounded-full bg-gradient-to-t from-gold-300/25 via-cream/10 to-transparent opacity-0 blur-3xl`}
          style={{ left: w.left, animationDelay: w.delay }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  const { settings, logoUrl } = useSettings();
  const { count } = useCart();
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 800], [0, 180]);
  const contentY = useTransform(scrollY, [0, 700], [0, 90]);
  const contentOpacity = useTransform(scrollY, [0, 520], [1, 0.15]);

  return (
    <section className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden px-4 pb-24 pt-28 text-center">
      <motion.div style={{ y: bgY }} className="absolute inset-x-0 -top-10 bottom-[-20%] -z-10" aria-hidden="true">
        {settings.hero_image_url && (
          <img src={settings.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" fetchPriority="high" />
        )}
        <div className="absolute inset-0 bg-jali" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(248,197,62,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/30 to-ink" />
      </motion.div>

      <Steam />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative flex flex-col items-center"
      >
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center">
          <motion.div variants={logoIn} className="relative h-56 w-56 p-5 sm:h-72 sm:w-72 sm:p-6">
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-spinslow motion-reduce:animate-none" aria-hidden="true">
              <circle cx="100" cy="100" r="97" fill="none" stroke="#f8c53e" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="1.5 7" strokeLinecap="round" />
            </svg>
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <circle cx="100" cy="100" r="93" fill="none" stroke="#f8c53e" strokeOpacity="0.25" strokeWidth="0.6" />
            </svg>
            <img
              src={logoUrl}
              alt={`${settings.name} logo`}
              width={288}
              height={288}
              fetchPriority="high"
              className="h-full w-full rounded-full shadow-[0_0_80px_-10px_rgba(248,197,62,0.35)]"
            />
          </motion.div>

          <motion.h1 variants={rise} className="gold-text mt-9 font-display text-[3.4rem] font-bold leading-none sm:text-7xl md:text-8xl">
            {settings.name}
          </motion.h1>
          <motion.p variants={rise} className="mt-4 max-w-xl font-display text-xl italic text-cream/80 sm:text-2xl">
            {settings.tagline}
          </motion.p>
          <motion.div variants={rise} className="mt-9 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <LinkButton to={count > 0 ? '/order' : '/menu'} size="lg">
              ORDER NOW
            </LinkButton>
            <LinkButton to="/menu" variant="outline" size="lg">
              VIEW MENU
            </LinkButton>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        aria-hidden="true"
      >
        <motion.span
          className="block h-10 w-px bg-gradient-to-b from-gold-400 to-transparent"
          animate={{ scaleY: [0.4, 1, 0.4], originY: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
