import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSeo } from '@/lib/seo';
import { useSettings } from '@/hooks/useSettings';
import { useMenu } from '@/hooks/useMenu';
import { useCart } from '@/hooks/useCart';
import { MenuItemRow } from '@/components/menu/MenuItemRow';
import { GoldDivider } from '@/components/ui/Ornament';
import { staggerParent } from '@/components/ui/Reveal';
import { StateMessage } from '@/components/ui/StateMessage';
import { Button, LinkButton } from '@/components/ui/Button';

type Diet = 'all' | 'veg' | 'nonveg';

const dietOptions: { value: Diet; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'veg', label: 'Veg' },
  { value: 'nonveg', label: 'Non-veg' },
];

export default function MenuPage() {
  const { settings } = useSettings();
  const { categories, items, loading, error, reload } = useMenu();
  const { count } = useCart();
  const [query, setQuery] = useState('');
  const [diet, setDiet] = useState<Diet>('all');
  const [active, setActive] = useState<string | null>(null);
  const chipBarRef = useRef<HTMLDivElement>(null);

  useSeo({
    title: `Menu | ${settings.name}`,
    description: `Full menu of ${settings.name}: Hyderabadi dum biryani, tandoori tikkas, kababs, starters and combos. Add to cart and order online.`,
    path: '/menu',
  });

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (diet === 'veg' && item.is_veg !== true) return false;
      if (diet === 'nonveg' && item.is_veg !== false) return false;
      if (q && !`${item.name} ${item.description ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return categories
      .map((category) => ({ category, items: filtered.filter((i) => i.category_id === category.id) }))
      .filter((s) => s.items.length > 0);
  }, [categories, items, query, diet]);

  const sectionKey = sections.map((s) => s.category.id).join(',');

  // Highlight the category currently in view.
  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(`cat-${s.category.id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id.replace('cat-', ''));
      },
      { rootMargin: '-150px 0px -60% 0px' },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  // Keep the active chip centred in the horizontal bar.
  useEffect(() => {
    const bar = chipBarRef.current;
    const chip = active ? document.getElementById(`chip-${active}`) : null;
    if (bar && chip) {
      bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' });
    }
  }, [active]);

  const jumpTo = (id: string) => {
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="pb-8 pt-28">
      <header className="mx-auto max-w-3xl px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="gold-text text-5xl font-bold sm:text-7xl"
        >
          The Menu
        </motion.h1>
        <p className="mt-3 font-display text-xl italic text-cream/75">{settings.tagline}</p>
        <GoldDivider className="mt-6" />
      </header>

      <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the menu"
            aria-label="Search the menu"
            className="field pl-11"
          />
        </div>
        <div className="inline-flex self-start rounded-full border border-gold-500/30 p-1" role="group" aria-label="Filter by diet">
          {dietOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setDiet(o.value)}
              aria-pressed={diet === o.value}
              className={`min-h-[40px] rounded-full px-5 text-sm transition ${
                diet === o.value ? 'bg-gold-400 font-medium text-ink' : 'text-cream/80 hover:text-gold-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {sections.length > 0 && (
        <div className="sticky top-[68px] z-30 mt-6 border-y border-gold-500/15 bg-ink/90 backdrop-blur-xl">
          <div ref={chipBarRef} className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6" role="tablist" aria-label="Menu categories">
            {sections.map(({ category }) => (
              <button
                key={category.id}
                id={`chip-${category.id}`}
                type="button"
                role="tab"
                aria-selected={active === category.id}
                onClick={() => jumpTo(category.id)}
                className={`relative min-h-[40px] shrink-0 rounded-full px-4 text-[15px] transition ${
                  active === category.id ? 'text-ink' : 'text-cream/80 hover:text-gold-300'
                }`}
              >
                {active === category.id && (
                  <motion.span layoutId="chip-active" className="absolute inset-0 rounded-full bg-gold-400" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                )}
                <span className="relative">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {loading && (
          <div className="mt-10 space-y-6" aria-busy="true" aria-label="Loading the menu">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-umber/60" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="mt-12">
            <StateMessage tone="error" title="The menu did not load" message={error} onRetry={reload} />
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-12">
            <StateMessage title="The menu is being updated" message="Please check back in a few minutes or call the restaurant to order." />
          </div>
        )}

        {!loading && !error && items.length > 0 && sections.length === 0 && (
          <div className="mt-12">
            <StateMessage
              title="No dishes match your search"
              message="Try a different word, or clear the filters to see everything."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setDiet('all');
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          </div>
        )}

        {sections.map(({ category, items: catItems }) => (
          <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-40 pt-14" aria-labelledby={`h-${category.id}`}>
            <h2 id={`h-${category.id}`} className="gold-text text-4xl sm:text-5xl">
              {category.name}
            </h2>
            {category.description && <p className="mt-2 text-mute">{category.description}</p>}
            <motion.div
              key={`${category.id}-${query}-${diet}`}
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.05 }}
              className="mt-4 border-t border-gold-500/15"
            >
              {catItems.map((item) => (
                <MenuItemRow key={item.id} item={item} />
              ))}
            </motion.div>
          </section>
        ))}

        {count > 0 && (
          <div className="mt-14 hidden justify-center md:flex">
            <LinkButton to="/order" size="lg">
              Go to cart ({count})
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}
