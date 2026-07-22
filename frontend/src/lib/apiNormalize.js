/**
 * Normalize list payloads: plain array, { data: [] }, or { data: { data: [] } }.
 */
export function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
}

/** Axios response → list (handles nested `data` from paginated APIs). */
export function extractListFromResponse(response) {
  return extractList(response?.data);
}

export function extractErrorMessage(error, fallback = 'Something went wrong') {
  const msg = error?.response?.data?.message;
  if (typeof msg === 'string') return msg;
  if (Array.isArray(msg)) return msg.join(', ');
  return error?.message || fallback;
}
