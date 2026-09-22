import { MEDIA_BUCKET, supabase } from '@/lib/supabase';
import { compressImage } from '@/utils/image';

export type MediaFolder = 'menu' | 'gallery' | 'branding';

/** Compresses the image in the browser, uploads it to Supabase Storage and returns its public URL. */
export async function uploadImage(file: File, folder: MediaFolder): Promise<string> {
  const blob = await compressImage(file, folder === 'branding' ? 1200 : 1600);
  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Best-effort cleanup of an image we uploaded earlier. Ignores external URLs and errors. */
export async function removeImageByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return;
  const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  try {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  } catch {
    /* orphaned files are harmless */
  }
}
