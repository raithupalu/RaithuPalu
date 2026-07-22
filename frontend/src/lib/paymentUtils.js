/** Payment document helpers (backend: totalAmount, paid, pending). */

export const billTotal = (p) => Number(p?.totalAmount) || 0;
export const amountPaid = (p) => Number(p?.paid) || 0;
export const amountPending = (p) => {
  if (p == null) return 0;
  if (p.pending != null && !Number.isNaN(Number(p.pending))) return Number(p.pending);
  return Math.max(0, billTotal(p) - amountPaid(p));
};

export const isFullyPaid = (p) => billTotal(p) > 0 && amountPending(p) <= 0.001;

export const displayStatus = (p) => (isFullyPaid(p) ? "paid" : "pending");
