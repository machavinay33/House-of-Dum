import { useEffect } from 'react';
import { SITE_URL } from '@/lib/supabase';

interface SeoOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | null;
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Sets title, description, Open Graph tags, canonical URL and optional JSON-LD for the current page. */
export function useSeo({ title, description, path, image, noindex, jsonLd }: SeoOptions) {
  const jsonKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    document.title = title;
    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    const img = image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : `${SITE_URL}/og-image.png`;

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:image"]', 'property', 'og:image', img);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    document.getElementById('page-jsonld')?.remove();
    if (jsonKey) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'page-jsonld';
      script.text = jsonKey;
      document.head.appendChild(script);
    }
    return () => {
      document.getElementById('page-jsonld')?.remove();
    };
  }, [title, description, path, image, noindex, jsonKey]);
}
