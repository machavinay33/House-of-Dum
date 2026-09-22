import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { GalleryImage, MenuItem } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { LinkButton, AnchorButton } from '@/components/ui/Button';
import { GoldDivider } from '@/components/ui/Ornament';
import { Reveal, staggerParent, staggerChild } from '@/components/ui/Reveal';
import { FeaturedCard } from '@/components/menu/FeaturedCard';
import { ItemOrderRows } from '@/components/menu/ItemOrderRows';
import { VegBadge } from '@/components/ui/VegBadge';
import { mapsHref, telHref } from '@/lib/format';
import { FoodImage } from '@/components/ui/FoodImage';

export function SectionHeading({ title, intro, align = 'center' }: { title: string; intro?: string; align?: 'center' | 'left' }) {
  return (
    <Reveal className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <h2 className="text-4xl leading-tight text-cream sm:text-5xl">{title}</h2>
      {intro && <p className="mt-4 text-base leading-relaxed text-mute sm:text-lg">{intro}</p>}
      {align === 'center' && <GoldDivider className="mt-6" />}
    </Reveal>
  );
}

/* ---------------------------------- About --------------------------------- */
export function AboutSection() {
  const { settings, logoUrl } = useSettings();
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <h2 className="text-4xl leading-tight text-cream sm:text-5xl">Hyderabadi flavour, made for sharing</h2>
            <p className="mt-6 max-w-xl text-lg leading-[1.75] text-cream/75">
              {settings.description ||
                'Dum biryani, tandoori tikkas and kababs, ready for you to order online.'}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex flex-col gap-2 text-[15px] text-mute">
            {settings.address && (
              <a href={mapsHref(settings.address)} target="_blank" rel="noreferrer" className="max-w-md transition hover:text-gold-300">
                {settings.address}
              </a>
            )}
            {settings.phone && (
              <a href={telHref(settings.phone)} className="font-display text-2xl text-gold-300">
                {settings.phone}
              </a>
            )}
          </Reveal>
          <Reveal delay={0.18} className="mt-9 flex flex-wrap gap-3">
            <LinkButton to="/about" variant="outline">
              Our story
            </LinkButton>
            <LinkButton to="/menu">Browse the menu</LinkButton>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mx-auto w-full max-w-sm">
          <div className="arch relative aspect-[3/4] overflow-hidden border border-gold-500/30 bg-coal bg-jali">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(248,197,62,0.2),transparent_65%)]" />
            <div className="absolute inset-0 flex items-center justify-center p-10">
              <img src={logoUrl} alt="" loading="lazy" className="w-full rounded-full shadow-gold" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- Signature ------------------------------ */
export function SignatureSection({ items }: { items: MenuItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="relative border-y border-gold-500/10 bg-coal/60 bg-jali-faint py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Signature dishes" intro="The biryanis and kababs our guests come back for." />
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <FeaturedCard key={item.id} item={item} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------- Popular ------------------------------- */
export function PopularSection({ items }: { items: MenuItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <h2 className="text-4xl text-cream sm:text-5xl">Popular right now</h2>
          </Reveal>
          <Link to="/menu" className="text-gold-300 underline decoration-gold-500/40 underline-offset-4 transition hover:decoration-gold-300">
            See the full menu
          </Link>
        </div>
      </div>
      <motion.div
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-6 lg:mx-auto lg:max-w-7xl lg:px-8"
      >
        {items.map((item) => (
          <motion.article
            key={item.id}
            variants={staggerChild}
            className="flex w-[17.5rem] shrink-0 snap-start flex-col justify-between border-l-2 border-gold-500/50 bg-coal/70 p-5 sm:w-80"
          >
            <div className="flex items-start gap-2.5">
              <VegBadge isVeg={item.is_veg} />
              <h3 className="text-xl leading-snug text-cream">{item.name}</h3>
            </div>
            <div className="mt-6">
              <ItemOrderRows item={item} />
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

/* ----------------------------------- Story -------------------------------- */
export function StorySection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section ref={ref} className="relative isolate overflow-hidden py-28">
      <motion.div style={{ y }} className="absolute inset-x-0 -inset-y-[10%] -z-10 bg-jali" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink via-transparent to-ink" aria-hidden="true" />
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <h2 className="text-4xl leading-tight sm:text-6xl">
            <span className="gold-text">Dum</span> is patience, sealed in a pot
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 text-lg leading-[1.8] text-cream/80 sm:text-xl">
            In Hyderabadi cooking, dum means slow cooking under seal. Marinated meat or vegetables and partly cooked rice are
            layered in a heavy pot, the lid is closed tight, and everything finishes in its own steam. Nothing escapes, so
            the rice carries the aroma of the spices and the layers beneath it.
          </p>
          <p className="mt-6 text-lg leading-[1.8] text-cream/80 sm:text-xl">
            That is the idea behind House of Dum: dum biryani first, then tandoori tikkas, kababs and crisp starters to
            go alongside.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- Gallery strip -------------------------- */
export function GalleryStrip({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null;
  const shown = images.slice(0, 6);
  const spans = ['row-span-2', '', '', 'row-span-2', '', ''];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <SectionHeading title="From our kitchen" intro="A look at the food and the place." />
      <motion.div
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="mt-14 grid auto-rows-[9rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] md:grid-cols-3 md:gap-4"
      >
        {shown.map((img, i) => (
          <motion.div key={img.id} variants={staggerChild} className={spans[i] ?? ''}>
            <FoodImage src={img.image_url} alt={img.caption || 'House of Dum food and restaurant photo'} className="h-full w-full" />
          </motion.div>
        ))}
      </motion.div>
      <div className="mt-10 text-center">
        <LinkButton to="/gallery" variant="outline">
          Open the gallery
        </LinkButton>
      </div>
    </section>
  );
}

/* ------------------------------------ Why --------------------------------- */
const reasons = [
  {
    title: 'Dum-cooked biryani',
    text: 'Chicken, mutton, egg, paneer and vegetable biryani, sealed and steamed the Hyderabadi way.',
    icon: <path d="M4 12h16M6 12a6 6 0 0 0 12 0M9 8c0-1.5 1-2 1-3.5M13 8c0-1.5 1-2 1-3.5" />,
  },
  {
    title: 'Tandoor and kababs',
    text: 'Chicken and paneer tikkas, plus tandoori chicken in 4 or 8 pieces.',
    icon: <path d="M12 3c2 3 5 4.5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 1.5.8 2 1.5 2C11 7 11 5 12 3z" />,
  },
  {
    title: 'Order without an account',
    text: 'Add to cart, enter your address and place the order. No sign-up and no online payment.',
    icon: <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8zM9 8V6.5a3 3 0 0 1 6 0V8" />,
  },
  {
    title: 'Track every step',
    text: 'Use your order code to follow the order from received to delivered.',
    icon: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />,
  },
];

export function WhySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <SectionHeading title="Why order from House of Dum" />
      <motion.div
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="mt-16 grid divide-y divide-gold-500/15 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
      >
        {reasons.map((r) => (
          <motion.div key={r.title} variants={staggerChild} className="px-2 py-8 sm:px-8 lg:py-4">
            <svg viewBox="0 0 24 24" className="h-9 w-9 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {r.icon}
            </svg>
            <h3 className="mt-5 text-2xl text-cream">{r.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-mute">{r.text}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ------------------------------------ CTA --------------------------------- */
export function OrderCta() {
  const { settings } = useSettings();
  return (
    <section className="px-4 pb-8 sm:px-6 lg:px-8">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-gold-500/30 bg-gradient-to-br from-umber via-coal to-ink px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="absolute inset-0 bg-jali opacity-70" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(248,197,62,0.22),transparent_60%)]" aria-hidden="true" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-4xl leading-tight text-cream sm:text-6xl">Hungry? Your biryani is a few taps away.</h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-mute">Pick your dishes, enter your address and place the order. No account needed.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton to="/menu" size="lg">
              ORDER NOW
            </LinkButton>
            {settings.phone && (
              <AnchorButton href={telHref(settings.phone)} variant="outline" size="lg">
                Call {settings.phone}
              </AnchorButton>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
