export function formatPrice(value: number): string {
  const n = Number(value) || 0;
  const hasPaise = Math.round(n * 100) % 100 !== 0;
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function whatsappHref(number: string, text?: string): string {
  const digits = number.replace(/\D/g, '');
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${withCountry}${q}`;
}

export function instagramHref(handleOrUrl: string): string {
  const v = handleOrUrl.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, '')}`;
}

export function mapsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function splitList(value: string): string[] {
  return value
    .split(/[|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
