/**
 * Build billing/month-selector options (most recent first).
 *
 * Months are filtered so only those on or after a user's joining month are
 * returned — customers (and admins viewing a customer) can only pick months
 * from when the member joined onward. Pass no `joinDate` to get the plain
 * trailing-`count` list (backward compatible).
 *
 * @param {Object} [opts]
 * @param {number} [opts.count=12]              Months to look back from today.
 * @param {Date|string|number} [opts.joinDate] Joining date; months before it are excluded.
 *                                            Accepts a Date or a "YYYY-MM" string.
 * @returns {{ value: string, label: string }[]}  e.g. { value: '2026-07', label: 'July 2026' }
 */
function toMonthKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) return value;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  // Local getters (not toISOString) so the key matches the visible month in any timezone.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthKey(date = new Date()) {
  return toMonthKey(date);
}

export function getMonthOptions({ count = 12, joinDate } = {}) {
  const today = new Date();
  const joinKey = joinDate ? toMonthKey(joinDate) : '';

  const options = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = toMonthKey(date);
    // Only keep months on or after the joining month.
    if (joinKey && value < joinKey) continue;
    const label = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
    options.push({ value, label });
  }
  return options;
}
