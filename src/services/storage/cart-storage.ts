import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = 'ficct.mobile.cart.v1';

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string | null;
}

export const cartStorage = {
  async load(): Promise<CartItem[]> {
    const raw = await AsyncStorage.getItem(CART_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CartItem[];
    } catch {
      return [];
    }
  },
  async save(items: CartItem[]): Promise<void> {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  },
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(CART_KEY);
  },
};
