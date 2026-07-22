/** ISO string for sorting/filtering (UTC). Empty string if invalid. */
export function toComparableIso(value) {
  if (value == null || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

export function isoDayPrefix(value) {
  const iso = toComparableIso(value);
  return iso ? iso.split('T')[0] : '';
}

export function isoMonthPrefix(value) {
  const day = isoDayPrefix(value);
  return day ? day.slice(0, 7) : '';
}

/** Newest first; invalid dates sort last. */
export function sortByDateDescending(items, key = 'date') {
  return [...items].sort((a, b) => {
    const ta = new Date(a[key]).getTime();
    const tb = new Date(b[key]).getTime();
    const na = Number.isNaN(ta) ? -Infinity : ta;
    const nb = Number.isNaN(tb) ? -Infinity : tb;
    return nb - na;
  });
}
