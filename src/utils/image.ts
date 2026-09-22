/**
 * Resizes and compresses an image in the browser before upload, so pages stay fast
 * even when the restaurant uploads large phone photos.
 */
export async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
    throw new Error('Please choose a JPG, PNG or WebP image.');
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('That image is too large. Please choose one under 25 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not process this image.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) throw new Error('Could not compress the image. Try a different file.');
  return blob;
}
