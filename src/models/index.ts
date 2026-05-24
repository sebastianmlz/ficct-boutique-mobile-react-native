export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
}

export interface InventoryEntry {
  id: string;
  variantId: string;
  branch: Branch;
  quantity: number;
}

export interface Variant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  priceOverride: number | null;
  stock: InventoryEntry[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  basePrice: number;
  currency: string;
  imageUrl: string | null;
  isActive: boolean;
  variants: Variant[];
}

export interface OrderSummary {
  id: string;
  code: string;
  status: string;
  createdAt: string;
}
