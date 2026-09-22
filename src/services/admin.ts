import { supabase } from '@/lib/supabase';
import { removeImageByUrl } from '@/services/storage';
import { invalidateMenuCache } from '@/services/menu';

export interface CategoryInput {
  id?: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface VariantInput {
  id?: string;
  label: string;
  price: number;
  is_available: boolean;
}

export interface ItemInput {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_veg: boolean | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
}

export async function saveCategory(input: CategoryInput): Promise<void> {
  const payload = {
    name: input.name.trim(),
    description: input.description.trim() || null,
    sort_order: input.sort_order,
  };
  const res = input.id
    ? await supabase.from('menu_categories').update(payload).eq('id', input.id)
    : await supabase.from('menu_categories').insert(payload);
  if (res.error) throw res.error;
  invalidateMenuCache();
}

/** Deletes a category. Its items are deleted too; past orders keep their own snapshots. */
export async function deleteCategory(id: string, imageUrls: (string | null)[] = []): Promise<void> {
  const { error } = await supabase.from('menu_categories').delete().eq('id', id);
  if (error) throw error;
  invalidateMenuCache();
  await Promise.all(imageUrls.map((u) => removeImageByUrl(u)));
}

export async function saveItem(input: ItemInput, variants: VariantInput[]): Promise<void> {
  const cleanVariants = variants.filter((v) => v.label.trim());
  const price = cleanVariants.length > 0 ? Math.min(...cleanVariants.map((v) => v.price)) : input.price;

  const payload = {
    category_id: input.category_id,
    name: input.name.trim(),
    description: input.description.trim() || null,
    price,
    image_url: input.image_url,
    is_veg: input.is_veg,
    is_available: input.is_available,
    is_featured: input.is_featured,
    sort_order: input.sort_order,
  };

  let itemId = input.id;
  if (itemId) {
    const { error } = await supabase.from('menu_items').update(payload).eq('id', itemId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from('menu_items').insert(payload).select('id').single();
    if (error) throw error;
    itemId = (data as { id: string }).id;
  }

  // Sync variants: delete removed ones, upsert the rest.
  const { data: existing, error: existingError } = await supabase
    .from('menu_item_variants')
    .select('id')
    .eq('item_id', itemId);
  if (existingError) throw existingError;

  const keep = new Set(cleanVariants.map((v) => v.id).filter(Boolean) as string[]);
  const toDelete = ((existing ?? []) as { id: string }[]).map((r) => r.id).filter((id) => !keep.has(id));
  if (toDelete.length > 0) {
    const { error } = await supabase.from('menu_item_variants').delete().in('id', toDelete);
    if (error) throw error;
  }
  if (cleanVariants.length > 0) {
    const { error } = await supabase.from('menu_item_variants').upsert(
      cleanVariants.map((v, index) => ({
        id: v.id ?? crypto.randomUUID(),
        item_id: itemId,
        label: v.label.trim(),
        price: v.price,
        is_available: v.is_available,
        sort_order: (index + 1) * 10,
      })),
    );
    if (error) throw error;
  }
  invalidateMenuCache();
}

export async function patchItem(
  id: string,
  patch: Partial<{ is_available: boolean; is_featured: boolean }>,
): Promise<void> {
  const { error } = await supabase.from('menu_items').update(patch).eq('id', id);
  if (error) throw error;
  invalidateMenuCache();
}

export async function deleteItem(id: string, imageUrl: string | null): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
  invalidateMenuCache();
  await removeImageByUrl(imageUrl);
}

export async function reorder(table: 'menu_categories' | 'menu_items', orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from(table).update({ sort_order: (index + 1) * 10 }).eq('id', id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  invalidateMenuCache();
}
