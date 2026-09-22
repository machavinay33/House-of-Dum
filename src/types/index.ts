export type OrderStatus =
  | 'received'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface MenuVariant {
  id: string;
  item_id: string;
  label: string;
  price: number;
  sort_order: number;
  is_available: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  variants: MenuVariant[];
}

export interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

export interface RestaurantSettings {
  id?: string;
  name: string;
  tagline: string;
  logo_url: string | null;
  hero_image_url: string | null;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  opening_hours: string;
  description: string;
  branches: string;
}

export interface CartLine {
  key: string;
  itemId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  /** Display price only. The server always re-prices the order. */
  unitPrice: number;
  quantity: number;
}

export interface CheckoutValues {
  fullName: string;
  phone: string;
  address: string;
  landmark: string;
  instructions: string;
}

export type CheckoutErrors = Partial<Record<keyof CheckoutValues, string>>;

export interface OrderLineSnapshot {
  name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PlacedOrder {
  order_code: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  customer_name: string;
  phone: string;
  address: string;
  landmark: string;
  instructions: string | null;
  items: OrderLineSnapshot[];
}

export interface TrackedOrder {
  order_code: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
  customer_first_name: string;
  timeline: Partial<Record<OrderStatus, string | null>>;
  items: OrderLineSnapshot[];
}

export interface AdminOrderItem {
  id: string;
  order_id: string;
  item_name: string;
  variant_label: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  line_no: number;
}

export interface AdminOrder {
  id: string;
  order_code: string;
  customer_name: string;
  phone: string;
  address: string;
  landmark: string;
  instructions: string | null;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
  order_items: AdminOrderItem[];
}
