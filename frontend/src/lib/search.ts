import type { VehicleCategory } from '../api/types'

/** The search bar's inputs, exactly as typed (all strings). */
export interface SearchForm {
  make: string
  model: string
  category: VehicleCategory | ''
  minPrice: string
  maxPrice: string
}

export const EMPTY_SEARCH: SearchForm = {
  make: '',
  model: '',
  category: '',
  minPrice: '',
  maxPrice: '',
}

/** Query parameters of GET /api/vehicles/search. */
export interface SearchParams {
  make?: string
  model?: string
  category?: VehicleCategory
  min_price?: number
  max_price?: number
}

/**
 * Turns the form into API parameters, leaving out every empty input:
 * the API answers category="" with 422, and an empty make matches everything.
 */
export function buildSearchParams(form: SearchForm): SearchParams {
  const params: SearchParams = {}
  const make = form.make.trim()
  const model = form.model.trim()
  const minPrice = form.minPrice.trim()
  const maxPrice = form.maxPrice.trim()

  if (make) params.make = make
  if (model) params.model = model
  if (form.category) params.category = form.category
  // Compared with "", not truthiness: "0" is a real price.
  if (minPrice !== '') params.min_price = Number(minPrice)
  if (maxPrice !== '') params.max_price = Number(maxPrice)
  return params
}

/** The same rule as the API's 422, checked before sending. */
export function priceRangeError(form: SearchForm): string | null {
  const { min_price: min, max_price: max } = buildSearchParams(form)
  if (min !== undefined && max !== undefined && min > max) {
    return 'Min price must not be more than max price.'
  }
  return null
}
