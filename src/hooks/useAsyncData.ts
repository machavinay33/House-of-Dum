import { useCallback, useEffect, useRef, useState } from 'react';
import { toMessage } from '@/lib/errors';

interface State<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/** Small data-loading hook with loading / error / reload states. */
export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[] = [], errorText = 'Could not load this right now.') {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    loaderRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((err) => {
        if (!cancelled) setState((s) => ({ data: s.data, error: toMessage(err, errorText), loading: false }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater: (prev: T | null) => T | null) => {
    setState((s) => ({ ...s, data: updater(s.data) }));
  }, []);

  return { ...state, reload, setData };
}
