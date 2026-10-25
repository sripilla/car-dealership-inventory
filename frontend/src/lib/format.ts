// en-IN gives Indian digit grouping (₹20,95,000); prices are whole rupees,
// so no paise are shown.
const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** A price in whole rupees, e.g. 2095000 → "₹20,95,000". */
export function formatPrice(price: number): string {
  return rupees.format(price)
}

/** The stock badge text for a vehicle card. */
export function stockLabel(quantity: number): string {
  if (quantity === 0) return 'Out of stock'
  if (quantity === 1) return 'Last one'
  return `${quantity} in stock`
}
