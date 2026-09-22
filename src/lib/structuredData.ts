import type { RestaurantSettings } from '@/types';
import { SITE_URL } from '@/lib/supabase';
import { DEFAULT_LOGO } from '@/lib/constants';

/** schema.org Restaurant markup built from the live restaurant settings. */
export function buildRestaurantJsonLd(s: RestaurantSettings): Record<string, unknown> {
  const logo = s.logo_url || `${SITE_URL}${DEFAULT_LOGO}`;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: s.name,
    description: s.description || s.tagline,
    url: SITE_URL,
    logo,
    image: s.hero_image_url || logo,
    servesCuisine: ['Hyderabadi', 'Indian', 'Biryani', 'Kebab'],
    hasMenu: `${SITE_URL}/menu`,
    acceptsReservations: false,
  };
  if (s.phone) data.telephone = s.phone;
  if (s.address) data.address = { '@type': 'PostalAddress', streetAddress: s.address, addressCountry: 'IN' };
  if (s.opening_hours) data.openingHours = s.opening_hours;
  if (s.instagram) data.sameAs = [/^https?:\/\//i.test(s.instagram) ? s.instagram : `https://instagram.com/${s.instagram.replace(/^@/, '')}`];
  return data;
}
