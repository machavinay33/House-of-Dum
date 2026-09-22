import type { OrderStatus, RestaurantSettings } from '@/types';

export const CART_STORAGE_KEY = 'hod.cart.v1';
export const LAST_ORDER_KEY = 'hod.lastOrder.v1';
export const CART_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const MAX_QTY = 20;

/**
 * Only used if the database cannot be reached, so the site never renders blank.
 * The real values live in the restaurant_settings table and are edited in /admin.
 */
export const FALLBACK_SETTINGS: RestaurantSettings = {
  name: 'House of Dum',
  tagline: 'Hyderabadi Dum Biryani & Kababs',
  logo_url: null,
  hero_image_url: null,
  phone: '',
  whatsapp: '',
  address: '',
  instagram: '',
  opening_hours: '',
  description: '',
  branches: '',
};

export const DEFAULT_LOGO = '/logo.png';

export const STATUS_FLOW: OrderStatus[] = [
  'received',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
];

export const ALL_STATUSES: OrderStatus[] = [...STATUS_FLOW, 'cancelled'];

export const STATUS_META: Record<OrderStatus, { label: string; hint: string; tone: string }> = {
  received: {
    label: 'Order Received',
    hint: 'We have your order and will confirm it shortly.',
    tone: 'text-gold-300 border-gold-500/40 bg-gold-500/10',
  },
  confirmed: {
    label: 'Order Confirmed',
    hint: 'The restaurant has accepted your order.',
    tone: 'text-sky-300 border-sky-400/40 bg-sky-400/10',
  },
  preparing: {
    label: 'Preparing',
    hint: 'Your food is being cooked in the kitchen.',
    tone: 'text-orange-300 border-orange-400/40 bg-orange-400/10',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    hint: 'Your order is on its way to you.',
    tone: 'text-violet-300 border-violet-400/40 bg-violet-400/10',
  },
  delivered: {
    label: 'Delivered',
    hint: 'Enjoy your meal!',
    tone: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
  },
  cancelled: {
    label: 'Cancelled',
    hint: 'This order was cancelled. Please call the restaurant if you have questions.',
    tone: 'text-red-300 border-red-400/40 bg-red-400/10',
  },
};

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/track-order', label: 'Track Order' },
] as const;

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const LAST_CODE_KEY = 'hod.lastCode.v1';
