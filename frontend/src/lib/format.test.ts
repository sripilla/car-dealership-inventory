import { formatPrice, stockLabel } from './format'

test.each([
  [699000, '₹6,99,000'],
  [2095000, '₹20,95,000'],
  // Indian grouping: lakh and crore, not millions.
  [10000000, '₹1,00,00,000'],
  [1, '₹1'],
])('formats %i rupees as %s', (rupees, expected) => {
  expect(formatPrice(rupees)).toBe(expected)
})

// Both sides of each boundary: 0 is sold out, 1 is the last unit.
test.each([
  [0, 'Out of stock'],
  [1, 'Last one'],
  [2, '2 in stock'],
  [12, '12 in stock'],
])('stock %i reads %j', (quantity, expected) => {
  expect(stockLabel(quantity)).toBe(expected)
})
