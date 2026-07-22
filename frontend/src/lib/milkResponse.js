import { extractListFromResponse } from './apiNormalize';
import { sortByDateDescending, isoDayPrefix } from './dates';

/** Milk “my” / admin list: normalize body and sort newest first. */
export function milkEntriesFromResponse(response) {
  const list = extractListFromResponse(response);
  return sortByDateDescending(list, 'date');
}

/** Preset: all | today | week | month */
export function filterMilkEntriesByPreset(entries, preset) {
  if (preset === 'all' || !entries?.length) return entries;

  const today = new Date().toISOString().split('T')[0];
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthPrefix = new Date().toISOString().slice(0, 7);

  return entries.filter((m) => {
    const day = isoDayPrefix(m.date);
    if (!day) return false;
    if (preset === 'today') return day === today;
    if (preset === 'week') return day >= weekStart;
    if (preset === 'month') return day.startsWith(monthPrefix);
    return true;
  });
}
