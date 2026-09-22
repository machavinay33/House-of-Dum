import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSeo } from '@/lib/seo';
import { useSettings } from '@/hooks/useSettings';
import { useGallery } from '@/hooks/useGallery';
import { GoldDivider } from '@/components/ui/Ornament';
import { FoodImage } from '@/components/ui/FoodImage';
import { StateMessage } from '@/components/ui/StateMessage';
import { LinkButton } from '@/components/ui/Button';
import { staggerChild, staggerParent } from '@/components/ui/Reveal';

export default function GalleryPage() {
  const { settings } = useSettings();
  const { images, loading, error, reload } = useGallery();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useSeo({
    title: `Gallery | ${settings.name}`,
    description: `Photos of the food and the place at ${settings.name}.`,
    path: '/gallery',
  });

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null || images.length === 0 ? null : (i + delta + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [openIndex, close, step]);

  const current = openIndex !== null ? images[openIndex] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-28 sm:px-6 lg:px-8">
      <header className="text-center">
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="gold-text text-5xl font-bold sm:text-7xl">
          Gallery
        </motion.h1>
        <p className="mt-3 text-mute">A look at the food and the place.</p>
        <GoldDivider className="mt-6" />
      </header>

      <div className="mt-12">
        {loading && (
          <div className="columns-2 gap-3 md:columns-3 md:gap-4" aria-busy="true">
            {[60, 44, 52, 40, 56, 48].map((h, i) => (
              <div key={i} className="mb-3 animate-pulse rounded-xl bg-umber/60 md:mb-4" style={{ height: `${h * 4}px` }} />
            ))}
          </div>
        )}
        {error && <StateMessage tone="error" title="The gallery did not load" message={error} onRetry={reload} />}
        {!loading && !error && images.length === 0 && (
          <StateMessage
            title="Photos are coming soon"
            message="We are adding pictures of our food. In the meantime, the full menu is ready."
            action={<LinkButton to="/menu">View the menu</LinkButton>}
          />
        )}

        {images.length > 0 && (
          <motion.div
            variants={staggerParent}
            initial="hidden"
            animate="show"
            className="columns-2 gap-3 md:columns-3 md:gap-4 xl:columns-4"
          >
            {images.map((img, i) => (
              <motion.button
                key={img.id}
                type="button"
                variants={staggerChild}
                onClick={() => setOpenIndex(i)}
                className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl md:mb-4"
                aria-label={`Open photo${img.caption ? `: ${img.caption}` : ''}`}
              >
                <FoodImage src={img.image_url} alt={img.caption || 'House of Dum food and restaurant photo'} className="w-full [&_img]:h-auto [&_img]:transition [&_img]:duration-700 group-hover:[&_img]:scale-105" />
                {img.caption && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-left text-sm text-cream opacity-0 transition group-hover:opacity-100">
                    {img.caption}
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
          >
            <motion.figure
              key={current.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative max-h-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={current.image_url} alt={current.caption || 'House of Dum photo'} className="max-h-[82svh] w-auto max-w-full rounded-xl object-contain" />
              {current.caption && <figcaption className="mt-3 text-center text-cream/85">{current.caption}</figcaption>}
            </motion.figure>
            <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-cream hover:bg-white/20">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            {images.length > 1 && (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous photo" className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-cream hover:bg-white/20">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next photo" className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-cream hover:bg-white/20">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
