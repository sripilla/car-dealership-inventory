import type { SearchParams } from '../lib/search'
import type { VehiclePayload } from '../lib/vehicleForm'
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

/** POST /api/vehicles. */
export async function createVehicle(payload: VehiclePayload): Promise<Vehicle> {
  const { data } = await api.post<Vehicle>('/api/vehicles', payload)
  return data
}

/** PUT /api/vehicles/{id}: a partial update, so send only changed fields. */
export async function updateVehicle(id: number, changes: Partial<VehiclePayload>): Promise<Vehicle> {
  const { data } = await api.put<Vehicle>(`/api/vehicles/${id}`, changes)
  return data
}

/** DELETE /api/vehicles/{id}. Admin only. The 204 response has no body, so nothing is returned. */
export async function deleteVehicle(id: number): Promise<void> {
  await api.delete(`/api/vehicles/${id}`)
}

/** POST /api/vehicles/{id}/restock. Admin only; quantity must be at least 1. */
export async function restockVehicle(id: number, quantity: number): Promise<Vehicle> {
  const { data } = await api.post<Vehicle>(`/api/vehicles/${id}/restock`, { quantity })
  return data
}
