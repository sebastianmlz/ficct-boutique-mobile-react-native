import { useSyncExternalStore } from 'react';

import { cartStorage, type CartItem } from '@/services/storage/cart-storage';

// Module-level shared store. Every useCart() instance subscribes to the SAME
// state, so adding from ProductDetailScreen re-renders CartScreen and the tab
// badge immediately. (The previous per-hook useState copies only hydrated on
// mount, so other screens didn't see changes until the app relaunched.)
let items: CartItem[] = [];
let hydrated = false;
let hydrating = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!hydrated && !hydrating) {
    hydrating = true;
    void cartStorage.load().then((loaded) => {
      items = loaded;
      hydrated = true;
      emit();
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

async function persist(next: CartItem[]): Promise<void> {
  items = next;
  emit();
  await cartStorage.save(next);
}

/** Adds an item, merging quantity when the variant is already in the cart. */
async function add(item: CartItem): Promise<void> {
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
}

/** Removes a variant from the cart entirely. */
async function remove(variantId: string): Promise<void> {
  await persist(items.filter((i) => i.variantId !== variantId));
}

/** Sets a variant's quantity; removes the row when quantity drops to 0. */
async function updateQuantity(variantId: string, quantity: number): Promise<void> {
  if (quantity <= 0) return remove(variantId);
  await persist(items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)));
}

/** Empties the cart (used after a confirmed order). */
async function clear(): Promise<void> {
  await persist([]);
}

const getItems = (): CartItem[] => items;
const getHydrated = (): boolean => hydrated;

/**
 * Cart hook backed by a single shared store persisted via `cartStorage`.
 * All subscribed components re-render on every mutation. Exposes mutators
 * (`add` merges by variant, `remove`, `updateQuantity` removes when qty <= 0,
 * `clear`) and derived totals (`subtotal`, `tax` at 13%, `total`, `count`).
 * @returns Cart state, derived totals, mutators, and a `hydrated` flag.
 */
export function useCart() {
  const current = useSyncExternalStore(subscribe, getItems, getItems);
  const isHydrated = useSyncExternalStore(subscribe, getHydrated, getHydrated);

  const subtotal = current.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tax = subtotal * 0.13;
  const total = subtotal + tax;
  const count = current.reduce((s, i) => s + i.quantity, 0);

  return { items: current, hydrated: isHydrated, subtotal, tax, total, count, add, remove, updateQuantity, clear };
}
