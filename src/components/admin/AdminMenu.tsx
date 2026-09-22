import { useMemo, useState } from 'react';
import type { MenuItem } from '@/types';
import { toMessage } from '@/lib/errors';
import { formatPrice } from '@/lib/format';
import { deleteItem, patchItem, reorder } from '@/services/admin';
import { fetchMenu, itemFromPrice } from '@/services/menu';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StateMessage } from '@/components/ui/StateMessage';
import { VegBadge } from '@/components/ui/VegBadge';
import { ArrowButtons, Switch, moveId } from '@/components/admin/controls';
import { AdminItemForm } from '@/components/admin/AdminItemForm';
import { AdminCategories } from '@/components/admin/AdminCategories';

export function AdminMenu() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsyncData(() => fetchMenu({ fresh: true }), [], 'Could not load the menu.');
  const categories = data?.categories ?? [];
  const allItems = data?.items ?? [];

  const [selected, setSelected] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const activeCategory = categories.find((c) => c.id === selected) ?? null;
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '';

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = allItems.filter((i) => (selected === 'all' || i.category_id === selected) && (!q || i.name.toLowerCase().includes(q)));
    if (selected !== 'all') return list;
    // In "All" view keep category order, then item order.
    const rank = new Map(categories.map((c, idx) => [c.id, idx]));
    return [...list].sort((a, b) => (rank.get(a.category_id) ?? 0) - (rank.get(b.category_id) ?? 0) || a.sort_order - b.sort_order);
  }, [allItems, categories, selected, search]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setFormOpen(true);
  };

  const nextSort = (categoryId: string) =>
    allItems.filter((i) => i.category_id === categoryId).reduce((m, i) => Math.max(m, i.sort_order), 0) + 10;

  const toggle = async (item: MenuItem, field: 'is_available' | 'is_featured', value: boolean) => {
    const apply = (v: boolean) =>
      setData((prev) => (prev ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, [field]: v } : i)) } : prev));
    apply(value);
    try {
      await patchItem(item.id, { [field]: value });
    } catch (err) {
      apply(!value);
      toast.error(toMessage(err, 'Could not update the item.', true));
    }
  };

  const remove = async (item: MenuItem) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone. Past orders are not affected.`)) return;
    try {
      await deleteItem(item.id, item.image_url);
      toast.success('Item deleted');
      reload();
    } catch (err) {
      toast.error(toMessage(err, 'Could not delete the item.', true));
    }
  };

  const move = async (item: MenuItem, delta: -1 | 1) => {
    const siblings = allItems.filter((i) => i.category_id === item.category_id).sort((a, b) => a.sort_order - b.sort_order);
    const ids = moveId(siblings.map((i) => i.id), item.id, delta);
    const previous = data;
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) => {
              const idx = ids.indexOf(i.id);
              return idx >= 0 ? { ...i, sort_order: (idx + 1) * 10 } : i;
            }),
          }
        : prev,
    );
    try {
      await reorder('menu_items', ids);
    } catch (err) {
      setData(() => previous);
      toast.error(toMessage(err, 'Could not save the new order.', true));
    }
  };

  const siblingsOf = (item: MenuItem) => allItems.filter((i) => i.category_id === item.category_id).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl">Menu</h2>
          <p className="text-sm text-mute">Changes go live on the website straight away.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatOpen(true)}>
            Categories
          </Button>
          <Button onClick={openAdd} disabled={categories.length === 0}>
            Add item
          </Button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex justify-center py-16 text-gold-400">
          <Spinner className="h-8 w-8" />
        </div>
      )}
      {error && !data && <div className="mt-6"><StateMessage tone="error" title="Menu did not load" message={error} onRetry={reload} /></div>}

      {data && (
        <>
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Category">
              {[{ id: 'all', name: 'All' }, ...categories].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={selected === c.id}
                  onClick={() => setSelected(c.id)}
                  className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm transition ${
                    selected === c.id ? 'border-gold-400 bg-gold-400 font-medium text-ink' : 'border-gold-500/25 text-cream/80 hover:border-gold-400'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <input type="search" className="field lg:max-w-xs" placeholder="Search items" aria-label="Search items" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {categories.length === 0 && (
            <div className="mt-8">
              <StateMessage title="Add a category first" message="Items live inside categories, such as Biryani or Starters." action={<Button onClick={() => setCatOpen(true)}>Add category</Button>} />
            </div>
          )}

          {categories.length > 0 && visible.length === 0 && (
            <div className="mt-8">
              <StateMessage title="No items here" message={activeCategory ? `Add the first item to ${activeCategory.name}.` : 'Try a different search.'} action={<Button onClick={openAdd}>Add item</Button>} />
            </div>
          )}

          {visible.length > 0 && (
            <ul className="mt-5 divide-y divide-gold-500/10 overflow-hidden rounded-2xl border border-gold-500/15 bg-coal/70">
              {visible.map((item) => {
                const sibs = siblingsOf(item);
                const idx = sibs.findIndex((s) => s.id === item.id);
                return (
                  <li key={item.id} className={`flex flex-wrap items-center gap-x-4 gap-y-3 p-4 ${item.is_available ? '' : 'opacity-70'}`}>
                    {item.image_url ? (
                      <img src={item.image_url} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gold-500/20 text-[10px] text-mute">No photo</span>
                    )}
                    <div className="min-w-0 flex-1 basis-52">
                      <div className="flex items-start gap-2">
                        <VegBadge isVeg={item.is_veg} />
                        <p className="text-cream">{item.name}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-mute">
                        {selected === 'all' && `${catName(item.category_id)} · `}
                        {item.variants.length > 0
                          ? item.variants.map((v) => `${v.label} ${formatPrice(v.price)}`).join(' / ')
                          : formatPrice(itemFromPrice(item))}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <Switch label={`${item.name} available`} checked={item.is_available} onChange={(v) => void toggle(item, 'is_available', v)} />
                        <span className="text-[11px] text-mute">Available</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Switch label={`${item.name} featured`} checked={item.is_featured} onChange={(v) => void toggle(item, 'is_featured', v)} />
                        <span className="text-[11px] text-mute">Featured</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowButtons label={item.name} onUp={() => void move(item, -1)} onDown={() => void move(item, 1)} disableUp={idx <= 0} disableDown={idx === sibs.length - 1} />
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => void remove(item)}>
                        Delete
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <AdminItemForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        item={editing}
        categories={categories}
        defaultCategoryId={editing?.category_id ?? (selected !== 'all' ? selected : (categories[0]?.id ?? ''))}
        nextSortOrder={nextSort}
        onSaved={reload}
      />
      <AdminCategories open={catOpen} onClose={() => setCatOpen(false)} categories={categories} items={allItems} onChanged={reload} />
    </div>
  );
}
