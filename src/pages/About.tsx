import { motion } from 'framer-motion';
import { useSeo } from '@/lib/seo';
import { buildRestaurantJsonLd } from '@/lib/structuredData';
import { useSettings } from '@/hooks/useSettings';
import { instagramHref, mapsHref, splitList, telHref, whatsappHref } from '@/lib/format';
import { AnchorButton, LinkButton } from '@/components/ui/Button';
import { DiamondMark, GoldDivider } from '@/components/ui/Ornament';
import { Reveal } from '@/components/ui/Reveal';

export default function AboutPage() {
  const { settings, logoUrl } = useSettings();
  const branches = splitList(settings.branches);

  useSeo({
    title: `About | ${settings.name}`,
    description: `${settings.name}: ${settings.tagline}. Find our address, phone number and branches.`,
    path: '/about',
    jsonLd: buildRestaurantJsonLd(settings),
  });

  return (
    <div className="pt-28">
      <header className="mx-auto max-w-3xl px-4 text-center">
        <motion.img
          src={logoUrl}
          alt={`${settings.name} logo`}
          width={128}
          height={128}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9 }}
          className="mx-auto h-32 w-32 rounded-full"
        />
        <h1 className="gold-text mt-6 text-5xl font-bold sm:text-7xl">About us</h1>
        <p className="mt-3 font-display text-xl italic text-cream/75">{settings.tagline}</p>
        <GoldDivider className="mt-6" />
      </header>

      <section className="mx-auto mt-14 max-w-3xl px-4 text-center">
        <Reveal>
          <p className="text-xl leading-[1.8] text-cream/85">
            {settings.description || `${settings.name} serves Hyderabadi dum biryani, tandoori tikkas and kababs.`}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 text-lg leading-[1.8] text-mute">
            Our biryani is cooked dum style: layered, sealed and slow-cooked in its own steam. Alongside it you will find
            tandoori chicken, tikkas and kababs, crisp fried chicken and fries, Chinese-style starters and combos made
            for sharing.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto mt-20 grid max-w-5xl gap-px overflow-hidden rounded-3xl border border-gold-500/20 bg-gold-500/15 px-0 sm:grid-cols-2">
        <Reveal className="bg-coal p-8">
          <h2 className="text-3xl text-gold-300">Find us</h2>
          {settings.address ? (
            <p className="mt-4 leading-relaxed text-cream/85">{settings.address}</p>
          ) : (
            <p className="mt-4 text-mute">Address coming soon.</p>
          )}
          {branches.length > 0 && (
            <div className="mt-5">
              <p className="text-sm text-mute">Other branches</p>
              <ul className="mt-1.5 space-y-1 text-cream/85">
                {branches.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <DiamondMark className="h-3 w-6 text-gold-500" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {settings.address && (
            <AnchorButton href={mapsHref(settings.address)} target="_blank" rel="noreferrer" variant="outline" size="sm" className="mt-6">
              Open in Maps
            </AnchorButton>
          )}
        </Reveal>

        <Reveal delay={0.08} className="bg-coal p-8">
          <h2 className="text-3xl text-gold-300">Order and contact</h2>
          {settings.phone ? (
            <a href={telHref(settings.phone)} className="mt-4 block font-display text-3xl text-cream">
              {settings.phone}
            </a>
          ) : (
            <p className="mt-4 text-mute">Phone number coming soon.</p>
          )}
          {settings.opening_hours && (
            <div className="mt-5">
              <p className="text-sm text-mute">Opening hours</p>
              <p className="mt-1 whitespace-pre-line text-cream/85">{settings.opening_hours}</p>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {settings.phone && (
              <AnchorButton href={telHref(settings.phone)} size="sm">
                Call now
              </AnchorButton>
            )}
            {settings.whatsapp && (
              <AnchorButton href={whatsappHref(settings.whatsapp, `Hi ${settings.name}, I would like to place an order.`)} target="_blank" rel="noreferrer" variant="outline" size="sm">
                WhatsApp
              </AnchorButton>
            )}
            {settings.instagram && (
              <AnchorButton href={instagramHref(settings.instagram)} target="_blank" rel="noreferrer" variant="outline" size="sm">
                Instagram
              </AnchorButton>
            )}
          </div>
        </Reveal>
      </section>

      <section className="px-4 py-20 text-center">
        <Reveal>
          <h2 className="text-4xl sm:text-5xl">Ready when you are</h2>
          <div className="mt-8 flex justify-center gap-3">
            <LinkButton to="/menu" size="lg">
              ORDER NOW
            </LinkButton>
            <LinkButton to="/gallery" variant="outline" size="lg">
              See the gallery
            </LinkButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
