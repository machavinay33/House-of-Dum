import { fetchGallery } from '@/services/gallery';
import { useAsyncData } from '@/hooks/useAsyncData';

export function useGallery() {
  const { data, loading, error, reload } = useAsyncData(() => fetchGallery(), [], 'We could not load the gallery.');
  return { images: data ?? [], loading, error, reload };
}
