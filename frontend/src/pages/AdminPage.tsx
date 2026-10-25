import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { apiErrorMessage } from '../api/errors'
import type { Vehicle } from '../api/types'
import {
  createVehicle,
  deleteVehicle,
  fetchVehicles,
  restockVehicle,
  updateVehicle,
} from '../api/vehicles'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Toast } from '../components/Toast'
import { VehicleFormPanel } from '../components/VehicleFormPanel'
import { formatPrice, stockLabel } from '../lib/format'
import { useToast } from '../lib/useToast'
import {
  changedFields,
  EMPTY_VEHICLE_FORM,
  formValuesFrom,
  restockError,
  toCreatePayload,
  type VehicleFormValues,
} from '../lib/vehicleForm'

// What the side panel is showing: nothing, the add form, or the edit form.
type Panel = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; vehicle: Vehicle }

const nameOf = (vehicle: Vehicle) => `${vehicle.make} ${vehicle.model}`

/**
 * /admin: admins only (AdminRoute). Add, edit, delete and restock vehicles.
 * Every change shows the vehicle the API returns, so the table always
 * matches the server.
 */
export function AdminPage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>({ mode: 'closed' })
  const [toDelete, setToDelete] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast, showToast, dismiss } = useToast()

  // State changes only in the promise callbacks (see DashboardPage).
  const load = useCallback(() => {
    fetchVehicles().then(setVehicles, (err: unknown) => {
      setVehicles([])
      setLoadError(apiErrorMessage(err, 'Could not load the vehicles. Please try again.'))
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /** Puts the API's copy of a vehicle into the table, replacing the old one. */
  function replaceRow(updated: Vehicle) {
    setVehicles((list) => list?.map((v) => (v.id === updated.id ? updated : v)) ?? list)
  }

  async function handleAdd(values: VehicleFormValues): Promise<string | null> {
    try {
      const created = await createVehicle(toCreatePayload(values))
      setVehicles((list) => [...(list ?? []), created])
      setPanel({ mode: 'closed' })
      showToast('success', `Added ${nameOf(created)}.`)
      return null
    } catch (err) {
      return apiErrorMessage(err, 'Could not add the vehicle. Please try again.')
    }
  }

  async function handleEdit(vehicle: Vehicle, values: VehicleFormValues): Promise<string | null> {
    // PUT is a partial update: send only what changed, and nothing if nothing did.
    const changes = changedFields(vehicle, values)
    if (Object.keys(changes).length === 0) return 'Nothing to save: no fields changed.'
    try {
      const updated = await updateVehicle(vehicle.id, changes)
      replaceRow(updated)
      setPanel({ mode: 'closed' })
      showToast('success', `Saved changes to ${nameOf(updated)}.`)
      return null
    } catch (err) {
      return apiErrorMessage(err, 'Could not save the changes. Please try again.')
    }
  }

  async function confirmDelete() {
    if (toDelete === null) return
    const vehicle = toDelete
    setDeleting(true)
    try {
      await deleteVehicle(vehicle.id)
      setVehicles((list) => list?.filter((v) => v.id !== vehicle.id) ?? list)
      if (panel.mode === 'edit' && panel.vehicle.id === vehicle.id) setPanel({ mode: 'closed' })
      showToast('success', `Deleted ${nameOf(vehicle)}.`)
    } catch (err) {
      // 403 if this account lost admin rights; 404 if someone else deleted it.
      showToast('error', apiErrorMessage(err, 'Could not delete the vehicle. Please try again.'))
      if (axios.isAxiosError(err) && err.response?.status === 404) load()
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  async function handleRestock(vehicle: Vehicle, amount: number): Promise<boolean> {
    try {
      const updated = await restockVehicle(vehicle.id, amount)
      replaceRow(updated)
      showToast('success', `Restocked ${nameOf(updated)}: ${updated.quantity} in stock.`)
      return true
    } catch (err) {
      showToast('error', apiErrorMessage(err, 'Could not restock the vehicle. Please try again.'))
      return false
    }
  }

  const cancelDelete = useCallback(() => setToDelete(null), [])

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-4xl sm:text-5xl">Manage stock</h1>
            <button type="button" onClick={() => setPanel({ mode: 'add' })} className="btn-primary py-2.5">
              <span aria-hidden="true">+</span> Add vehicle
            </button>
          </div>

          {loadError && (
            <p role="alert" className="mb-5 rounded-full bg-danger-tint px-5 py-3 text-sm text-danger">
              {loadError}
            </p>
          )}

          {vehicles === null ? (
            <p role="status" className="rounded-[2rem] bg-sand p-8 text-muted">
              Loading vehicles…
            </p>
          ) : (
            // Scrolls sideways on narrow screens instead of squashing columns.
            <div className="overflow-x-auto rounded-[2rem] bg-sand p-4 sm:p-6">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead className="text-xs tracking-widest text-muted uppercase">
                  <tr className="border-b border-sand-deep">
                    <th className="py-3 pr-3 font-medium">Vehicle</th>
                    <th className="py-3 pr-3 font-medium">Category</th>
                    <th className="py-3 pr-3 font-medium">Price</th>
                    <th className="py-3 pr-3 font-medium">Stock</th>
                    <th className="py-3 pr-3 font-medium">Restock</th>
                    <th className="py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className={`border-b border-sand-deep/70 last:border-0 ${
                        panel.mode === 'edit' && panel.vehicle.id === vehicle.id ? 'bg-peach-tint/60' : ''
                      }`}
                    >
                      <td className="py-3 pr-3">
                        <span className="block font-semibold">{nameOf(vehicle)}</span>
                        <span className="text-xs text-muted">ID {vehicle.id}</span>
                      </td>
                      <td className="py-3 pr-3">{vehicle.category}</td>
                      <td className="py-3 pr-3">{formatPrice(vehicle.price)}</td>
                      <td className="py-3 pr-3">
                        <span className="rounded-full bg-cream px-3 py-1 text-xs">{stockLabel(vehicle.quantity)}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <RestockControl vehicle={vehicle} onRestock={handleRestock} />
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setPanel({ mode: 'edit', vehicle })}
                            aria-label={`Edit ${nameOf(vehicle)}`}
                            className="btn-secondary size-10 p-0"
                          >
                            <span aria-hidden="true">✎</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(vehicle)}
                            aria-label={`Delete ${nameOf(vehicle)}`}
                            className="btn-secondary size-10 p-0 text-danger"
                          >
                            <span aria-hidden="true">🗑</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vehicles.length === 0 && !loadError && (
                <p className="px-2 py-8 text-center text-muted">No vehicles yet. Add the first one.</p>
              )}
            </div>
          )}
        </div>

        {/* key: a fresh form for each vehicle, so values from the last one never leak in. */}
        {panel.mode === 'add' && (
          <VehicleFormPanel
            key="add"
            eyebrow="New vehicle"
            title="Add a vehicle"
            submitLabel="Add to inventory"
            initial={EMPTY_VEHICLE_FORM}
            onSubmit={handleAdd}
            onCancel={() => setPanel({ mode: 'closed' })}
          />
        )}
        {panel.mode === 'edit' && (
          <VehicleFormPanel
            key={panel.vehicle.id}
            eyebrow={`Editing ID ${panel.vehicle.id}`}
            title={nameOf(panel.vehicle)}
            submitLabel="Save changes"
            initial={formValuesFrom(panel.vehicle)}
            onSubmit={(values) => handleEdit(panel.vehicle, values)}
            onCancel={() => setPanel({ mode: 'closed' })}
          />
        )}
      </div>

      {toDelete && (
        <ConfirmDialog
          title={`Delete ${nameOf(toDelete)}?`}
          confirmLabel="Delete vehicle"
          cancelLabel="Keep it"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        >
          This removes the vehicle and its {toDelete.quantity} units from inventory. It can't be undone.
        </ConfirmDialog>
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </main>
  )
}

/** The restock amount input and Add button for one table row. */
function RestockControl({
  vehicle,
  onRestock,
}: {
  vehicle: Vehicle
  onRestock: (vehicle: Vehicle, amount: number) => Promise<boolean>
}) {
  const [amount, setAmount] = useState('5')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inputId = `restock-${vehicle.id}`

  async function handleClick() {
    // The API's rule (quantity ≥ 1), checked first so 0 is never sent.
    const problem = restockError(amount)
    setError(problem)
    if (problem) return
    setBusy(true)
    const ok = await onRestock(vehicle, Number(amount.trim()))
    setBusy(false)
    if (ok) setAmount('5')
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label={`Restock amount for ${nameOf(vehicle)}`}
          aria-invalid={error !== null}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="field-input w-16 px-3 py-2 text-center"
        />
        <button type="button" onClick={handleClick} disabled={busy} className="btn-secondary px-4 py-2 text-sm">
          Add
        </button>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
