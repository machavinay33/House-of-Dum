import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdminOrder, OrderStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { ALL_STATUSES, STATUS_META } from '@/lib/constants';
import { toMessage } from '@/lib/errors';
import { formatDateTime, formatPrice, startOfToday, telHref } from '@/lib/format';
import { fetchAdminOrders, updateOrderStatus } from '@/services/orders';
import { useToast } from '@/hooks/useToast';
import { Modal } from '@/components/ui/Modal';
import { Button, AnchorButton } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StateMessage } from '@/components/ui/StateMessage';
import { StatCard } from '@/components/admin/controls';

type Filter = 'all' | 'open' | OrderStatus;

const filters: { value: Filter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'all', label: 'All' },
  ...ALL_STATUSES.map((s) => ({ value: s as Filter, label: STATUS_META[s].label })),
];

function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs ${STATUS_META[status].tone}`}>{STATUS_META[status].label}</span>;
}

export function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(100);
  const [filter, setFilter] = useState<Filter>('open');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const knownIds = useRef<Set<string> | null>(null);

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = await fetchAdminOrders(limit);
        // Announce brand-new orders that arrive while the dashboard is open.
        if (knownIds.current) {
          const fresh = data.filter((o) => !knownIds.current!.has(o.id));
          if (fresh.length > 0) toast.info(fresh.length === 1 ? `New order ${fresh[0].order_code}` : `${fresh.length} new orders`);
        }
        knownIds.current = new Set(data.map((o) => o.id));
        setOrders(data);
        setError(null);
      } catch (err) {
        if (!silent) setError(toMessage(err, 'Could not load orders.', true));
      } finally {
        setLoading(false);
      }
    },
    [limit, toast],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Live updates: Supabase Realtime (RLS applies) plus a slow poll as a safety net.
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => void refresh(true))
      .subscribe();
    const timer = window.setInterval(() => void refresh(true), 30000);
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const stats = useMemo(() => {
    const start = startOfToday().getTime();
    const today = orders.filter((o) => new Date(o.created_at).getTime() >= start);
    return {
      today: today.length,
      pending: orders.filter((o) => o.status === 'received').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      out: orders.filter((o) => o.status === 'out_for_delivery').length,
      completed: today.filter((o) => o.status === 'delivered').length,
      cancelled: today.filter((o) => o.status === 'cancelled').length,
      revenue: today.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter === 'open' && (o.status === 'delivered' || o.status === 'cancelled')) return false;
      if (filter !== 'open' && filter !== 'all' && o.status !== filter) return false;
      if (q && !`${o.order_code} ${o.customer_name} ${o.phone}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, filter, search]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const changeStatus = async (order: AdminOrder, status: OrderStatus) => {
    if (status === order.status || savingId) return;
    if (status === 'cancelled' && !window.confirm(`Cancel order ${order.order_code}? The customer will see it as cancelled.`)) return;
    setSavingId(order.id);
    try {
      await updateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status, updated_at: new Date().toISOString() } : o)));
      toast.success(`${order.order_code} is now ${STATUS_META[status].label}`);
      void refresh(true);
    } catch (err) {
      toast.error(toMessage(err, 'Could not update the order.', true));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Today's orders" value={stats.today} />
        <StatCard label="Today's revenue" value={formatPrice(stats.revenue)} note="Excludes cancelled orders" highlight />
        <StatCard label="Pending" value={stats.pending} note="Received, not yet confirmed" />
        <StatCard label="Preparing" value={stats.preparing} />
        <StatCard label="Out for delivery" value={stats.out} />
        <StatCard label="Completed today" value={stats.completed} />
        <StatCard label="Cancelled today" value={stats.cancelled} />
      </div>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Filter orders">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm transition ${
                filter === f.value ? 'border-gold-400 bg-gold-400 font-medium text-ink' : 'border-gold-500/25 text-cream/80 hover:border-gold-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search code, name or phone"
          aria-label="Search orders"
          className="field lg:max-w-xs"
        />
      </div>

      <div className="mt-5">
        {loading && (
          <div className="flex justify-center py-16 text-gold-400">
            <Spinner className="h-8 w-8" />
          </div>
        )}
        {error && !loading && <StateMessage tone="error" title="Orders did not load" message={error} onRetry={() => void refresh()} />}
        {!loading && !error && visible.length === 0 && <StateMessage title="No orders here" message="New orders appear automatically." />}

        {!loading && !error && visible.length > 0 && (
          <ul className="divide-y divide-gold-500/10 overflow-hidden rounded-2xl border border-gold-500/15 bg-coal/70">
            {visible.map((o) => (
              <li key={o.id}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 transition hover:bg-white/[0.02]">
                  <button type="button" onClick={() => setSelectedId(o.id)} className="min-w-0 flex-1 basis-60 text-left" aria-label={`Open order ${o.order_code}`}>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-2xl text-gold-300">{o.order_code}</span>
                      <StatusPill status={o.status} />
                    </span>
                    <span className="mt-1 block text-cream">{o.customer_name}</span>
                    <span className="block text-sm text-mute">
                      {o.order_items.reduce((n, i) => n + i.quantity, 0)} items &middot; {formatDateTime(o.created_at)}
                    </span>
                  </button>
                  <p className="font-display text-2xl text-cream">{formatPrice(o.total)}</p>
                  <label className="sr-only" htmlFor={`status-${o.id}`}>
                    Status for {o.order_code}
                  </label>
                  <select
                    id={`status-${o.id}`}
                    value={o.status}
                    disabled={savingId === o.id}
                    onChange={(e) => void changeStatus(o, e.target.value as OrderStatus)}
                    className="field w-auto min-w-[10.5rem] py-2.5"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && orders.length >= limit && (
          <div className="mt-5 text-center">
            <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + 100)}>
              Load older orders
            </Button>
          </div>
        )}
      </div>

      <Modal open={selected !== null} onClose={() => setSelectedId(null)} title={selected ? `Order ${selected.order_code}` : 'Order'} wide>
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusPill status={selected.status} />
              <p className="text-sm text-mute">Placed {formatDateTime(selected.created_at)}</p>
            </div>

            <div>
              <p className="label">Change status</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={savingId === selected.id}
                    onClick={() => void changeStatus(selected, s)}
                    aria-pressed={selected.status === s}
                    className={`min-h-[42px] rounded-full border px-4 text-sm transition disabled:opacity-50 ${
                      selected.status === s
                        ? 'border-gold-400 bg-gold-400 font-medium text-ink'
                        : s === 'cancelled'
                          ? 'border-red-500/40 text-red-300 hover:bg-red-500/10'
                          : 'border-gold-500/30 text-cream/85 hover:border-gold-400'
                    }`}
                  >
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-gold-500/15 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-mute">Customer</p>
                <p className="mt-0.5 text-base text-cream">{selected.customer_name}</p>
              </div>
              <div>
                <p className="text-mute">Phone</p>
                <a href={telHref(selected.phone)} className="mt-0.5 block text-base text-gold-300 underline underline-offset-4">
                  {selected.phone}
                </a>
              </div>
              <div className="sm:col-span-2">
                <p className="text-mute">Address</p>
                <p className="mt-0.5 text-base text-cream">{selected.address}</p>
                {selected.landmark && <p className="text-mute">Landmark: {selected.landmark}</p>}
              </div>
              {selected.instructions && (
                <div className="sm:col-span-2">
                  <p className="text-mute">Delivery instructions</p>
                  <p className="mt-0.5 text-base text-cream">{selected.instructions}</p>
                </div>
              )}
            </div>

            <div>
              <p className="label">Items</p>
              <ul className="divide-y divide-gold-500/10 rounded-2xl border border-gold-500/15">
                {selected.order_items.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="text-cream">
                        {i.quantity} &times; {i.item_name}
                        {i.variant_label && <span className="text-mute"> ({i.variant_label})</span>}
                      </p>
                      <p className="text-xs text-mute">{formatPrice(i.unit_price)} each</p>
                    </div>
                    <p className="text-gold-300">{formatPrice(i.line_total)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-lg">Total</span>
                <span className="gold-text font-display text-3xl font-bold">{formatPrice(selected.total)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <AnchorButton href={telHref(selected.phone)} size="sm">
                Call customer
              </AnchorButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
