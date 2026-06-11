import { useCallback, useEffect, useState } from 'react';

import { cartStorage, type CartItem } from '@/services/storage/cart-storage';

/**
 * Cart hook backed by persistent storage. Hydrates items on mount and keeps
 * them in sync via `cartStorage`. Exposes mutators (`add` merges by variant,
 * `remove`, `updateQuantity` removes when qty <= 0, `clear`) and derived
 * totals (`subtotal`, `tax` at 13%, `total`, `count`).
 * @returns Cart state, derived totals, mutators, and a `hydrated` flag.
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void (async () => {
      setItems(await cartStorage.load());
      setHydrated(true);
    })();
  }, []);

  const persist = useCallback(async (next: CartItem[]) => {
    setItems(next);
    await cartStorage.save(next);
  }, []);

  const add = useCallback(
    async (item: CartItem) => {
      const existing = items.find((i) => i.variantId === item.variantId);
      if (existing) {
        await persist(
          items.map((i) =>
            i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i,
          ),
        );
        return;
      }
      await persist([...items, item]);
    },
    [items, persist],
  );

  const remove = useCallback(async (variantId: string) => {
    const next = items.filter((i) => i.variantId !== variantId);
    await persist(next);
  }, [items, persist]);

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      if (quantity <= 0) return remove(variantId);
      await persist(items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)));
    },
    [items, persist, remove],
  );

  const clear = useCallback(async () => {
    await persist([]);
  }, [persist]);

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tax = subtotal * 0.13;
  const total = subtotal + tax;
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, hydrated, subtotal, tax, total, count, add, remove, updateQuantity, clear };
}
