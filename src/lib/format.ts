/** All monetary amounts are stored as whole dollars in these helpers (the DB stores cents). */
export function formatMoney(amount: number, opts?: { compact?: boolean }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts?.compact ? 1 : 0,
    notation: opts?.compact ? "compact" : "standard",
  }).format(amount);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}
