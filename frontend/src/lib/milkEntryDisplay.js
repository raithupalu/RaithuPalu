/** Supports current schema (`pricePerLitre`) and legacy (`rate`). */
export function milkLineRate(entry) {
  if (!entry) return 0;
  const r = entry.pricePerLitre ?? entry.rate;
  return Number(r) || 0;
}

export function milkLineAmount(entry) {
  return (Number(entry?.quantity) || 0) * milkLineRate(entry);
}
