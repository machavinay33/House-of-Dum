import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartLine, MenuItem, MenuVariant } from '@/types';
import { CART_MAX_AGE_MS, CART_STORAGE_KEY, MAX_QTY } from '@/lib/constants';

interface CartApi {
  lines: CartLine[];
  count: number;
  subtotal: number;
  /** Increments every time something is added; used to trigger the cart badge animation. */
  pulse: number;
  addItem: (item: MenuItem, variant?: MenuVariant | null, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  replaceLines: (lines: CartLine[]) => void;
  getQuantity: (itemId: string, variantId: string | null) => number;
}

const CartContext = createContext<CartApi | null>(null);

export function cartKey(itemId: string, variantId: string | null): string {
  return `${itemId}:${variantId ?? ''}`;
}

function isLine(x: unknown): x is CartLine {
  if (!x || typeof x !== 'object') return false;
  const l = x as Record<string, unknown>;
  return (
    typeof l.key === 'string' &&
    typeof l.itemId === 'string' &&
    (l.variantId === null || typeof l.variantId === 'string') &&
    typeof l.name === 'string' &&
    (l.variantLabel === null || typeof l.variantLabel === 'string') &&
    typeof l.unitPrice === 'number' &&
    typeof l.quantity === 'number' &&
    l.quantity >= 1 &&
    l.quantity <= MAX_QTY
  );
}

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { lines?: unknown; savedAt?: number };
    if (!parsed || !Array.isArray(parsed.lines)) return [];
    if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > CART_MAX_AGE_MS) return [];
    return parsed.lines.filter(isLine);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadCart);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    try {
      if (lines.length === 0) localStorage.removeItem(CART_STORAGE_KEY);
      else localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ lines, savedAt: Date.now() }));
    } catch {
      /* storage unavailable (private mode) - cart still works for this visit */
    }
  }, [lines]);

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) setLines(loadCart());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addItem = useCallback((item: MenuItem, variant: MenuVariant | null = null, quantity = 1) => {
    if (!item.is_available || (variant && !variant.is_available)) return;
    const key = cartKey(item.id, variant?.id ?? null);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l));
      }
      return [
        ...prev,
        {
          key,
          itemId: item.id,
          variantId: variant?.id ?? null,
          name: item.name,
          variantLabel: variant?.label ?? null,
          unitPrice: variant ? variant.price : item.price,
          quantity: Math.min(MAX_QTY, quantity),
        },
      ];
    });
    setPulse((p) => p + 1);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l)),
    );
  }, []);

  const removeLine = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);
  const replaceLines = useCallback((next: CartLine[]) => setLines(next), []);

  const getQuantity = useCallback(
    (itemId: string, variantId: string | null) => lines.find((l) => l.key === cartKey(itemId, variantId))?.quantity ?? 0,
    [lines],
  );

  const value = useMemo<CartApi>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0);
    return { lines, count, subtotal, pulse, addItem, setQuantity, removeLine, clear, replaceLines, getQuantity };
  }, [lines, pulse, addItem, setQuantity, removeLine, clear, replaceLines, getQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
