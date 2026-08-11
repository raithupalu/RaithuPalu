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

/** 
 * Centralised timezone-safe business date formatter.
 * Extracts raw YYYY-MM-DD components directly from UTC ISO strings
 * to prevent local browser timezone shifts from changing the displayed date.
 */
export function formatBusinessDate(dateValue) {
  if (!dateValue) return '—';
  
  const iso = typeof dateValue === 'string' ? dateValue : new Date(dateValue).toISOString();
  const datePart = iso.split('T')[0]; // Extract "YYYY-MM-DD"
  const parts = datePart.split('-');
  
  if (parts.length !== 3) return '—';
  const [year, month, day] = parts;
  
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const monthIdx = parseInt(month, 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return '—';
  
  return `${parseInt(day, 10)} ${monthNames[monthIdx]} ${year}`;
}