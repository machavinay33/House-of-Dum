import { supabase } from '@/lib/supabase';
import type { GalleryImage } from '@/types';
import { removeImageByUrl } from '@/services/storage';

export async function fetchGallery(): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from('gallery')
    .select('id,image_url,caption,sort_order')
    .order('sort_order')
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as GalleryImage[];
}

export async function addGalleryImage(imageUrl: string, caption: string, sortOrder: number): Promise<GalleryImage> {
  const { data, error } = await supabase
    .from('gallery')
    .insert({ image_url: imageUrl, caption: caption.trim() || null, sort_order: sortOrder })
    .select('id,image_url,caption,sort_order')
    .single();
  if (error) throw error;
  return data as GalleryImage;
}

export async function updateGalleryCaption(id: string, caption: string): Promise<void> {
  const { error } = await supabase.from('gallery').update({ caption: caption.trim() || null }).eq('id', id);
  if (error) throw error;
}

export async function deleteGalleryImage(image: GalleryImage): Promise<void> {
  const { error } = await supabase.from('gallery').delete().eq('id', image.id);
  if (error) throw error;
  await removeImageByUrl(image.image_url);
}

export async function reorderGallery(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from('gallery').update({ sort_order: (index + 1) * 10 }).eq('id', id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
