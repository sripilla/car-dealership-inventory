import type { SearchParams } from '../lib/search'
import { api } from './client'
import type { Vehicle } from './types'

// One small function per vehicle endpoint, so pages never build URLs.

/**
 * All vehicles, or only the matches when any filter is set. With no
 * filters it calls GET /api/vehicles (the spec's "view all"); otherwise
 * GET /api/vehicles/search with only the filled-in parameters.
 */
export async function fetchVehicles(params: SearchParams = {}): Promise<Vehicle[]> {
  const hasFilters = Object.keys(params).length > 0
  const { data } = hasFilters
    ? await api.get<Vehicle[]>('/api/vehicles/search', { params })
    : await api.get<Vehicle[]>('/api/vehicles')
  return data
}

/** Buys one unit. Resolves to the vehicle with its new stock. */
export async function purchaseVehicle(id: number): Promise<Vehicle> {
  const { data } = await api.post<Vehicle>(`/api/vehicles/${id}/purchase`)
  return data
}
