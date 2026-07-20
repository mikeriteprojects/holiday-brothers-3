// Single source of truth for money formatting — always "$##.00", never a
// bare number or a mismatched decimal count.
export function formatMoney(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}
