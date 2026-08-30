/** Payment document helpers (backend: totalAmount, paid, pending, milkCharges, previousBalance). */

export const billTotal = (p) => Number(p?.totalAmount) || 0;
export const amountPaid = (p) => Number(p?.paid) || 0;
export const amountPending = (p) => {
  if (p == null) return 0;
  if (p.pending != null && !Number.isNaN(Number(p.pending))) return Number(p.pending);
  return Math.max(0, billTotal(p) - amountPaid(p));
};

// Current-month milk charges (before previous balance). Falls back to totalAmount
// for old bills that predate the milk/previous split.
export const milkCharges = (p) => {
  if (p == null) return 0;
  if (p.milkCharges != null && !Number.isNaN(Number(p.milkCharges))) return Number(p.milkCharges);
  return billTotal(p);
};

// Outstanding balance carried forward from earlier unpaid bills.
export const previousBalance = (p) => Number(p?.previousBalance) || 0;

export const isFullyPaid = (p) => billTotal(p) > 0 && amountPending(p) <= 0.001;

// Status: 'paid' | 'partial' | 'pending'
export const paymentStatus = (p) => {
  if (isFullyPaid(p)) return "paid";
  if (amountPaid(p) > 0) return "partial";
  return "pending";
};

export const displayStatus = (p) => paymentStatus(p);