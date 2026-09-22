import { supabase } from '@/lib/supabase';
import type {
  AdminOrder,
  CartLine,
  CheckoutValues,
  OrderLineSnapshot,
  OrderStatus,
  PlacedOrder,
  TrackedOrder,
} from '@/types';
import { normalizeOrderCode } from '@/utils/validation';

/* eslint-disable @typescript-eslint/no-explicit-any */
function toLines(raw: any[] | null | undefined): OrderLineSnapshot[] {
  return (raw ?? []).map((i) => ({
    name: i.name,
    variant_label: i.variant_label ?? null,
    quantity: Number(i.quantity),
    unit_price: Number(i.unit_price),
    line_total: Number(i.line_total),
  }));
}

/**
 * Creates an order through the place_order() database function.
 * Only ids and quantities are sent. Prices are looked up on the server.
 */
export async function placeOrder(values: CheckoutValues, lines: CartLine[]): Promise<PlacedOrder> {
  const { data, error } = await supabase.rpc('place_order', {
    p_customer_name: values.fullName.trim(),
    p_phone: values.phone.trim(),
    p_address: values.address.trim(),
    p_landmark: values.landmark.trim(),
    p_instructions: values.instructions.trim() || null,
    p_items: lines.map((l) => ({ item_id: l.itemId, variant_id: l.variantId, quantity: l.quantity })),
  });
  if (error) throw error;
  if (!data) throw new Error('The order could not be created. Please try again.');
  const d = data as any;
  return {
    order_code: d.order_code,
    status: d.status,
    total: Number(d.total),
    created_at: d.created_at,
    customer_name: d.customer_name,
    phone: d.phone,
    address: d.address,
    landmark: d.landmark,
    instructions: d.instructions ?? null,
    items: toLines(d.items),
  };
}

/** Looks an order up by its public code. Returns null if it does not exist. */
export async function trackOrder(rawCode: string): Promise<TrackedOrder | null> {
  const code = normalizeOrderCode(rawCode);
  const { data, error } = await supabase.rpc('track_order', { p_code: code });
  if (error) throw error;
  if (!data) return null;
  const d = data as any;
  return {
    order_code: d.order_code,
    status: d.status,
    total: Number(d.total),
    created_at: d.created_at,
    updated_at: d.updated_at,
    customer_first_name: d.customer_first_name ?? '',
    timeline: d.timeline ?? {},
    items: toLines(d.items),
  };
}

/* ------------------------------ Admin ------------------------------ */

export async function fetchAdminOrders(limit = 200): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((o: any) => ({
    ...o,
    total: Number(o.total),
    order_items: (o.order_items ?? [])
      .map((i: any) => ({ ...i, unit_price: Number(i.unit_price), line_total: Number(i.line_total) }))
      .sort((a: any, b: any) => a.line_no - b.line_no),
  })) as AdminOrder[];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
}
