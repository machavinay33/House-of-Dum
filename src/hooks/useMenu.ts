import { fetchMenu } from '@/services/menu';
import { useAsyncData } from '@/hooks/useAsyncData';

export function useMenu() {
  const { data, loading, error, reload } = useAsyncData(() => fetchMenu(), [], 'We could not load the menu. Please try again.');
  return {
    categories: data?.categories ?? [],
    items: data?.items ?? [],
    loading,
    error,
    reload,
  };
}
