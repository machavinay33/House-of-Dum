/**
 * Converts any thrown value into a message that is safe and useful to show.
 * Database messages are only shown when they were raised deliberately by our own
 * SQL functions (SQLSTATE P0001) or when `exposeRaw` is true (admin screens).
 */
export function toMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
  exposeRaw = false,
): string {
  if (!err) return fallback;
  const e = err as { message?: string; code?: string };
  const msg = typeof err === 'string' ? err : (e.message ?? '');
  const code = e.code;

  if (/failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(msg)) {
    return 'Network problem. Please check your internet connection and try again.';
  }
  if (code === 'P0001' && msg) return msg;
  if (code === '42501' || /row-level security|permission denied/i.test(msg)) {
    return 'You do not have permission to do that. Please sign in again.';
  }
  if (code === '23505') return 'That already exists. Please use a different value.';
  if (code === '23503') return 'This is linked to other records and cannot be changed that way.';
  if (exposeRaw && msg) return msg;
  return fallback;
}
