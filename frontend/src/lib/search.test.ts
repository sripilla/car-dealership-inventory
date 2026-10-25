import { buildSearchParams, EMPTY_SEARCH, priceRangeError } from './search'

test('an empty form sends no parameters at all', () => {
  expect(buildSearchParams(EMPTY_SEARCH)).toEqual({})
})

// The API treats these as client mistakes (category "" is 422) or as
// "match everything" (make ""), so empty inputs must be left out.
test('blank and whitespace-only inputs are left out', () => {
  const form = { ...EMPTY_SEARCH, make: '   ', model: '', minPrice: ' ' }

  expect(buildSearchParams(form)).toEqual({})
})

test('text is trimmed and prices are sent as numbers', () => {
  const form = {
    make: '  toy ',
    model: 'Corolla',
    category: 'Sedan' as const,
    minPrice: '1000000',
    maxPrice: '2500000',
  }

  expect(buildSearchParams(form)).toEqual({
    make: 'toy',
    model: 'Corolla',
    category: 'Sedan',
    min_price: 1000000,
    max_price: 2500000,
  })
})

// 0 is a real value, not an empty input.
test('a price of 0 is kept', () => {
  expect(buildSearchParams({ ...EMPTY_SEARCH, minPrice: '0' })).toEqual({ min_price: 0 })
})

test('min price above max price is an error', () => {
  const form = { ...EMPTY_SEARCH, minPrice: '2000001', maxPrice: '2000000' }

  expect(priceRangeError(form)).toBe('Min price must not be more than max price.')
})

test.each([
  ['equal bounds (inclusive range)', '2000000', '2000000'],
  ['min below max', '1000000', '2000000'],
  ['only min', '1000000', ''],
  ['only max', '', '2000000'],
  ['neither', '', ''],
])('no price error for %s', (_name, minPrice, maxPrice) => {
  expect(priceRangeError({ ...EMPTY_SEARCH, minPrice, maxPrice })).toBeNull()
})
