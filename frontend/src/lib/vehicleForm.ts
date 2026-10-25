import type { Vehicle, VehicleCategory } from '../api/types'

// The admin add/edit form. The same rules as the backend's VehicleCreate,
// checked in the browser so mistakes never reach the API.

/** The form's inputs, exactly as typed (all strings). */
export interface VehicleFormValues {
  make: string
  model: string
  category: VehicleCategory | ''
  price: string
  quantity: string
}

export const EMPTY_VEHICLE_FORM: VehicleFormValues = {
  make: '',
  model: '',
  category: '',
  price: '',
  quantity: '',
}

export type VehicleFormErrors = Partial<Record<keyof VehicleFormValues, string>>

/** Body of POST /api/vehicles. */
export interface VehiclePayload {
  make: string
  model: string
  category: VehicleCategory
  price: number
  quantity: number
}

// Whole numbers only, written as digits (optionally negative, so a negative
// quantity gets its own message). "1.5", "1e3" and "" don't match.
const INTEGER = /^-?\d+$/

/** Problems with the form; {} when it can be sent. */
export function vehicleFormErrors(values: VehicleFormValues): VehicleFormErrors {
  const errors: VehicleFormErrors = {}
  const price = values.price.trim()
  const quantity = values.quantity.trim()

  if (!values.make.trim()) errors.make = 'Enter a make.'
  if (!values.model.trim()) errors.model = 'Enter a model.'
  if (!values.category) errors.category = 'Choose a category.'

  // Price > 0: a free car is a typo.
  if (!INTEGER.test(price) || Number(price) < 1) {
    errors.price = 'Enter a whole-rupee price of at least ₹1.'
  }

  // Quantity ≥ 0: 0 is a valid "out of stock".
  if (quantity === '') errors.quantity = 'Enter the number in stock.'
  else if (!INTEGER.test(quantity)) errors.quantity = 'Enter a whole number.'
  else if (Number(quantity) < 0) errors.quantity = "Quantity can't be negative."

  return errors
}

/** The POST body. Only call once vehicleFormErrors() is {}. */
export function toCreatePayload(values: VehicleFormValues): VehiclePayload {
  return {
    make: values.make.trim(),
    model: values.model.trim(),
    category: values.category as VehicleCategory,
    // Numbers, never strings: the API's integers are strict.
    price: Number(values.price.trim()),
    quantity: Number(values.quantity.trim()),
  }
}

/** Pre-fills the edit form from a vehicle. */
export function formValuesFrom(vehicle: Vehicle): VehicleFormValues {
  return {
    make: vehicle.make,
    model: vehicle.model,
    category: vehicle.category as VehicleCategory,
    price: String(vehicle.price),
    quantity: String(vehicle.quantity),
  }
}

/**
 * The PUT body: only the fields that differ from the saved vehicle. PUT is a
 * partial update, and no field is ever null, which the API rejects with 422.
 */
export function changedFields(original: Vehicle, values: VehicleFormValues): Partial<VehiclePayload> {
  const next = toCreatePayload(values)
  const changes: Partial<VehiclePayload> = {}
  if (next.make !== original.make) changes.make = next.make
  if (next.model !== original.model) changes.model = next.model
  if (next.category !== original.category) changes.category = next.category
  if (next.price !== original.price) changes.price = next.price
  if (next.quantity !== original.quantity) changes.quantity = next.quantity
  return changes
}

/** The restock amount must be a whole number of at least 1. */
export function restockError(amount: string): string | null {
  const trimmed = amount.trim()
  if (!INTEGER.test(trimmed) || Number(trimmed) < 1) return 'Enter at least 1.'
  return null
}
