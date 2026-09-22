import { useRef, useState } from 'react';
import type { GalleryImage } from '@/types';
import { toMessage } from '@/lib/errors';
import { addGalleryImage, deleteGalleryImage, fetchGallery, reorderGallery, updateGalleryCaption } from '@/services/gallery';
import { uploadImage } from '@/services/storage';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StateMessage } from '@/components/ui/StateMessage';
import { ArrowButtons, moveId } from '@/components/admin/controls';

export function AdminGallery() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsyncData(() => fetchGallery(), [], 'Could not load the gallery.');
  const images = data ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [captions, setCaptions] = useState<Record<string, string>>({});

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    let order = images.reduce((m, i) => Math.max(m, i.sort_order), 0);
    let ok = 0;
    setUploading({ done: 0, total: list.length });
    for (const file of list) {
      try {
        const url = await uploadImage(file, 'gallery');
        order += 10;
        const row = await addGalleryImage(url, '', order);
        setData((prev) => [...(prev ?? []), row]);
        ok += 1;
      } catch (err) {
        toast.error(`${file.name}: ${toMessage(err, 'Upload failed.', true)}`);
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    if (inputRef.current) inputRef.current.value = '';
    if (ok > 0) toast.success(`${ok} image${ok === 1 ? '' : 's'} added`);
  };

  const move = async (id: string, delta: -1 | 1) => {
    const ids = moveId(images.map((i) => i.id), id, delta);
    const byId = new Map(images.map((i) => [i.id, i]));
    const previous = images;
    setData(() => ids.map((x, idx) => ({ ...(byId.get(x) as GalleryImage), sort_order: (idx + 1) * 10 })));
    try {
      await reorderGallery(ids);
    } catch (err) {
      setData(() => previous);
      toast.error(toMessage(err, 'Could not save the new order.', true));
    }
  };

  const remove = async (img: GalleryImage) => {
    if (!window.confirm('Delete this image from the gallery?')) return;
    try {
      await deleteGalleryImage(img);
      setData((prev) => (prev ?? []).filter((i) => i.id !== img.id));
      toast.success('Image deleted');
    } catch (err) {
      toast.error(toMessage(err, 'Could not delete the image.', true));
    }
  };

  const saveCaption = async (img: GalleryImage) => {
    const next = (captions[img.id] ?? img.caption ?? '').trim();
    if (next === (img.caption ?? '')) return;
    try {
      await updateGalleryCaption(img.id, next);
      setData((prev) => (prev ?? []).map((i) => (i.id === img.id ? { ...i, caption: next || null } : i)));
      toast.success('Caption saved');
    } catch (err) {
      toast.error(toMessage(err, 'Could not save the caption.', true));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl">Gallery</h2>
          <p className="text-sm text-mute">Images are resized in your browser before upload. Use the arrows to change the order.</p>
        </div>
        <div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" id="gallery-upload" onChange={(e) => void handleFiles(e.target.files)} />
          <Button onClick={() => inputRef.current?.click()} loading={uploading !== null}>
            {uploading ? `Uploading ${uploading.done + 1} of ${uploading.total}` : 'Upload images'}
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {loading && (
          <div className="flex justify-center py-16 text-gold-400">
            <Spinner className="h-8 w-8" />
          </div>
        )}
        {error && !loading && <StateMessage tone="error" title="Gallery did not load" message={error} onRetry={reload} />}
        {!loading && !error && images.length === 0 && (
          <StateMessage title="No images yet" message="Upload photos of your food and restaurant. They appear on the Gallery page and the home page." />
        )}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, index) => (
            <li key={img.id} className="overflow-hidden rounded-2xl border border-gold-500/15 bg-coal/80">
              <img src={img.image_url} alt={img.caption || 'Gallery image'} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <div className="space-y-3 p-3">
                <input
                  aria-label="Caption"
                  className="field py-2.5"
                  placeholder="Caption (optional)"
                  maxLength={140}
                  value={captions[img.id] ?? img.caption ?? ''}
                  onChange={(e) => setCaptions((c) => ({ ...c, [img.id]: e.target.value }))}
                  onBlur={() => void saveCaption(img)}
                />
                <div className="flex items-center justify-between">
                  <ArrowButtons
                    label="image"
                    onUp={() => void move(img.id, -1)}
                    onDown={() => void move(img.id, 1)}
                    disableUp={index === 0}
                    disableDown={index === images.length - 1}
                  />
                  <Button variant="danger" size="sm" onClick={() => void remove(img)}>
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
