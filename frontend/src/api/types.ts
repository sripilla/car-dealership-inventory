// Shapes returned by the backend. Keep in sync with app/schemas/*.py.

/** UserOut: never includes the password. */
export interface User {
  id: number
  email: string
  is_admin: boolean
}

/** The allowed categories, exactly as the API spells them (case-sensitive). */
export const VEHICLE_CATEGORIES = ['Sedan', 'SUV', 'Hatchback', 'Electric'] as const
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number]

/** VehicleOut. Price is whole rupees. */
export interface Vehicle {
  id: number
  make: string
  model: string
  category: string
  price: number
  quantity: number
}
