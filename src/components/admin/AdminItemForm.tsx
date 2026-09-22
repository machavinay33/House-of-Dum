import { useEffect, useState, type FormEvent } from 'react';
import type { MenuCategory, MenuItem } from '@/types';
import { toMessage } from '@/lib/errors';
import { saveItem, type VariantInput } from '@/services/admin';
import { removeImageByUrl } from '@/services/storage';
import { useToast } from '@/hooks/useToast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextArea, TextField } from '@/components/ui/Field';
import { ImageUploader, Switch } from '@/components/admin/controls';

interface VariantForm {
  id?: string;
  label: string;
  price: string;
  is_available: boolean;
}

interface FormState {
  category_id: string;
  name: string;
  description: string;
  price: string;
  diet: 'veg' | 'nonveg' | 'na';
  is_available: boolean;
  is_featured: boolean;
  image_url: string | null;
  variants: VariantForm[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  item: MenuItem | null;
  categories: MenuCategory[];
  defaultCategoryId: string;
  nextSortOrder: (categoryId: string) => number;
  onSaved: () => void;
}

function initial(item: MenuItem | null, defaultCategoryId: string): FormState {
  if (!item) {
    return {
      category_id: defaultCategoryId,
      name: '',
      description: '',
      price: '',
      diet: 'na',
      is_available: true,
      is_featured: false,
      image_url: null,
      variants: [],
    };
  }
  return {
    category_id: item.category_id,
    name: item.name,
    description: item.description ?? '',
    price: String(item.price),
    diet: item.is_veg === true ? 'veg' : item.is_veg === false ? 'nonveg' : 'na',
    is_available: item.is_available,
    is_featured: item.is_featured,
    image_url: item.image_url,
    variants: item.variants.map((v) => ({ id: v.id, label: v.label, price: String(v.price), is_available: v.is_available })),
  };
}

export function AdminItemForm({ open, onClose, item, categories, defaultCategoryId, nextSortOrder, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => initial(item, defaultCategoryId));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const originalImage = item?.image_url ?? null;

  useEffect(() => {
    if (open) {
      setForm(initial(item, defaultCategoryId));
      setErrors([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setVariant = (index: number, patch: Partial<VariantForm>) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) }));

  const hasVariants = form.variants.length > 0;

  const cancel = async () => {
    // An image uploaded during this edit but never saved would be orphaned.
    if (form.image_url && form.image_url !== originalImage) await removeImageByUrl(form.image_url);
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: string[] = [];
    if (!form.name.trim()) found.push('Enter a name for the item.');
    if (!form.category_id) found.push('Choose a category.');

    const variants: VariantInput[] = [];
    if (hasVariants) {
      form.variants.forEach((v, i) => {
        const price = Number(v.price);
        if (!v.label.trim()) found.push(`Option ${i + 1} needs a label (for example "Half" or "4 Pieces").`);
        else if (!Number.isFinite(price) || price <= 0) found.push(`Option "${v.label}" needs a price above 0.`);
        else variants.push({ id: v.id, label: v.label.trim(), price, is_available: v.is_available });
      });
    } else {
      const price = Number(form.price);
      if (form.price.trim() === '' || !Number.isFinite(price) || price <= 0) found.push('Enter a price above 0, or add options with their own prices.');
    }
    setErrors(found);
    if (found.length > 0) return;

    setSaving(true);
    try {
      await saveItem(
        {
          id: item?.id,
          category_id: form.category_id,
          name: form.name,
          description: form.description,
          price: hasVariants ? 0 : Number(form.price),
          image_url: form.image_url,
          is_veg: form.diet === 'veg' ? true : form.diet === 'nonveg' ? false : null,
          is_available: form.is_available,
          is_featured: form.is_featured,
          sort_order: item && item.category_id === form.category_id ? item.sort_order : nextSortOrder(form.category_id),
        },
        variants,
      );
      if (originalImage && originalImage !== form.image_url) await removeImageByUrl(originalImage);
      toast.success(item ? 'Item updated' : 'Item added');
      onSaved();
      onClose();
    } catch (err) {
      setErrors([toMessage(err, 'Could not save the item.', true)]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={() => void cancel()} title={item ? 'Edit item' : 'Add item'} wide>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField id="i-name" label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={200} />
          </div>
          <div>
            <label htmlFor="i-category" className="label">
              Category
            </label>
            <select id="i-category" className="field" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="i-diet" className="label">
              Vegetarian marking
            </label>
            <select id="i-diet" className="field" value={form.diet} onChange={(e) => set('diet', e.target.value as FormState['diet'])}>
              <option value="veg">Vegetarian</option>
              <option value="nonveg">Non-vegetarian</option>
              <option value="na">Not shown</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <TextArea id="i-desc" label="Description" optional rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={400} />
          </div>
          <div>
            <TextField
              id="i-price"
              label="Price (₹)"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={hasVariants ? '' : form.price}
              disabled={hasVariants}
              placeholder={hasVariants ? 'Set by options below' : '0'}
              onChange={(e) => set('price', e.target.value)}
              hint={hasVariants ? 'Options below set the prices.' : undefined}
            />
          </div>
          <div className="flex flex-col justify-end gap-3 pb-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Available to order</span>
              <Switch label="Available to order" checked={form.is_available} onChange={(v) => set('is_available', v)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Featured on home page</span>
              <Switch label="Featured on home page" checked={form.is_featured} onChange={(v) => set('is_featured', v)} />
            </div>
          </div>
        </div>

        <ImageUploader label="Photo" folder="menu" value={form.image_url} onChange={(url) => set('image_url', url)} hint="Optional. Landscape or portrait both work." />

        <fieldset className="rounded-2xl border border-gold-500/20 p-4">
          <legend className="px-2 text-sm text-gold-300">Options (Half / Full, 4 / 8 Pieces, Chicken / Mutton...)</legend>
          {form.variants.length === 0 && <p className="text-sm text-mute">No options. The item uses the single price above.</p>}
          <ul className="space-y-3">
            {form.variants.map((v, i) => (
              <li key={i} className="grid grid-cols-[1fr_6.5rem] items-center gap-2 sm:grid-cols-[1fr_7rem_auto_auto]">
                <input aria-label={`Option ${i + 1} label`} className="field py-2.5" placeholder="Label, e.g. Half" value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} maxLength={80} />
                <input aria-label={`Option ${i + 1} price`} className="field py-2.5" type="number" inputMode="decimal" min="0" step="1" placeholder="₹" value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} />
                <div className="flex items-center gap-2">
                  <Switch label={`Option ${i + 1} available`} checked={v.is_available} onChange={(val) => setVariant(i, { is_available: val })} />
                  <span className="text-xs text-mute sm:hidden">Available</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => set('variants', form.variants.filter((_, idx) => idx !== i))}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => set('variants', [...form.variants, { label: '', price: '', is_available: true }])}>
            Add option
          </Button>
        </fieldset>

        {errors.length > 0 && (
          <ul className="space-y-1 rounded-xl border border-red-400/40 bg-red-950/30 p-3 text-sm text-red-200" role="alert">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-3 border-t border-gold-500/15 pt-4">
          <Button type="button" variant="ghost" onClick={() => void cancel()}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save item
          </Button>
        </div>
      </form>
    </Modal>
  );
}
