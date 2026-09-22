import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { NAV_LINKS } from '@/lib/constants';
import { instagramHref, mapsHref, splitList, telHref, whatsappHref } from '@/lib/format';
import { GoldDivider } from '@/components/ui/Ornament';

export function Footer() {
  const { settings, logoUrl } = useSettings();
  const branches = splitList(settings.branches);

  return (
    <footer className="relative mt-24 border-t border-gold-500/15 bg-coal pb-28 pt-16 md:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1.2fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-4">
              <img src={logoUrl} alt={`${settings.name} logo`} width={72} height={72} loading="lazy" className="h-[72px] w-[72px] rounded-full" />
              <span>
                <span className="gold-text block font-display text-3xl leading-none">{settings.name}</span>
                <span className="mt-1.5 block text-sm text-mute">{settings.tagline}</span>
              </span>
            </Link>
            {settings.description && <p className="mt-5 max-w-sm text-sm leading-relaxed text-mute">{settings.description}</p>}
          </div>

          <nav aria-label="Footer">
            <h2 className="text-xl text-gold-300">Explore</h2>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-cream/75 transition hover:text-gold-300">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/order" className="text-cream/75 transition hover:text-gold-300">
                  Cart &amp; checkout
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-xl text-gold-300">Visit or call</h2>
            <address className="mt-4 space-y-3 text-[15px] not-italic text-cream/80">
              {settings.address && (
                <p>
                  <a href={mapsHref(settings.address)} target="_blank" rel="noreferrer" className="transition hover:text-gold-300">
                    {settings.address}
                  </a>
                </p>
              )}
              {branches.length > 0 && <p className="text-mute">Also at {branches.join(' and ')}</p>}
              {settings.phone && (
                <p>
                  <a href={telHref(settings.phone)} className="font-display text-2xl text-gold-300">
                    {settings.phone}
                  </a>
                </p>
              )}
              {settings.opening_hours && <p className="whitespace-pre-line text-mute">{settings.opening_hours}</p>}
              <p className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                {settings.whatsapp && (
                  <a href={whatsappHref(settings.whatsapp)} target="_blank" rel="noreferrer" className="text-cream/80 underline decoration-gold-500/40 underline-offset-4 hover:text-gold-300">
                    WhatsApp
                  </a>
                )}
                {settings.instagram && (
                  <a href={instagramHref(settings.instagram)} target="_blank" rel="noreferrer" className="text-cream/80 underline decoration-gold-500/40 underline-offset-4 hover:text-gold-300">
                    Instagram
                  </a>
                )}
              </p>
            </address>
          </div>
        </div>

        <GoldDivider className="mt-14" />
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm text-mute sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {settings.name}. All rights reserved.
          </p>
          <Link to="/admin/login" className="transition hover:text-gold-300">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
