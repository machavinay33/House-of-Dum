import { useMemo } from 'react';
import { useSeo } from '@/lib/seo';
import { buildRestaurantJsonLd } from '@/lib/structuredData';
import { useSettings } from '@/hooks/useSettings';
import { useMenu } from '@/hooks/useMenu';
import { useGallery } from '@/hooks/useGallery';
import { Hero } from '@/components/home/Hero';
import {
  AboutSection,
  GalleryStrip,
  OrderCta,
  PopularSection,
  SectionHeading,
  SignatureSection,
  StorySection,
  WhySection,
} from '@/components/home/Sections';
import { StateMessage } from '@/components/ui/StateMessage';

export default function Home() {
  const { settings } = useSettings();
  const { items, loading, error, reload } = useMenu();
  const { images } = useGallery();

  useSeo({
    title: `${settings.name} | ${settings.tagline}`,
    description:
      settings.description ||
      `${settings.name} serves Hyderabadi dum biryani, tandoori tikkas and kababs. Browse the menu and order online.`,
    path: '/',
    jsonLd: buildRestaurantJsonLd(settings),
  });

  const { signature, popular } = useMemo(() => {
    const available = items.filter((i) => i.is_available);
    const featured = available.filter((i) => i.is_featured);
    const pool = featured.length > 0 ? featured : available.slice(0, 3);
    return { signature: pool.slice(0, 3), popular: featured.slice(3, 11) };
  }, [items]);

  return (
    <>
      <Hero />
      <AboutSection />

      {loading && (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8" aria-busy="true">
          <SectionHeading title="Signature dishes" />
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse arch bg-umber/70" />
            ))}
          </div>
        </section>
      )}
      {error && (
        <section className="px-4 py-16">
          <StateMessage tone="error" title="The menu did not load" message={error} onRetry={reload} />
        </section>
      )}
      {!loading && !error && (
        <>
          <SignatureSection items={signature} />
          <PopularSection items={popular} />
        </>
      )}

      <StorySection />
      <GalleryStrip images={images} />
      <WhySection />
      <OrderCta />
    </>
  );
}
