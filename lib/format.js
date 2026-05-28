export function formatAmount(amount, currency = "inr") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((amount || 0) / 100);
}
