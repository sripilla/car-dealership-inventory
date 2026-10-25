import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiErrorMessage } from '../api/errors'
import type { Vehicle } from '../api/types'
import { fetchVehicles, purchaseVehicle } from '../api/vehicles'
import { SearchBar } from '../components/SearchBar'
import { Toast } from '../components/Toast'
import { VehicleCard } from '../components/VehicleCard'
import {
  buildSearchParams,
  EMPTY_SEARCH,
  priceRangeError,
  type SearchForm,
  type SearchParams,
} from '../lib/search'
import { useToast } from '../lib/useToast'

function purchaseMessage(vehicle: Vehicle): string {
  const name = `${vehicle.make} ${vehicle.model}`
  if (vehicle.quantity === 0) return `Purchased ${name}. That was the last one.`
  return `Purchased ${name}. ${vehicle.quantity} left in stock.`
}

/** /: every vehicle (or the search matches), each with a Purchase button. */
export function DashboardPage() {
  const [form, setForm] = useState<SearchForm>(EMPTY_SEARCH)
  // The filters behind the list on screen; reused when the list is reloaded.
  const [applied, setApplied] = useState<SearchParams>({})
  // null while loading.
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [rangeError, setRangeError] = useState<string | null>(null)
  const { toast, showToast, dismiss } = useToast()

  // Only the newest request may update the list, so a slow earlier search
  // can't overwrite a later one.
  const latestRequest = useRef(0)

  // Fetches and shows a list. State changes only in the promise callbacks,
  // after the response, so the first load can run straight from useEffect
  // (vehicles already starts as null, which shows the loading cards).
  const load = useCallback((params: SearchParams) => {
    const requestId = ++latestRequest.current
    fetchVehicles(params).then(
      (list) => {
        if (requestId === latestRequest.current) setVehicles(list)
      },
      (err: unknown) => {
        if (requestId === latestRequest.current) {
          setVehicles([])
          setLoadError(apiErrorMessage(err, 'Could not load the vehicles. Please try again.'))
        }
      },
    )
  }, [])

  useEffect(() => {
    load({})
  }, [load])

  /** Shows the loading cards again, then loads. For searches and refreshes. */
  function reload(params: SearchParams) {
    setVehicles(null)
    setLoadError(null)
    load(params)
  }

  function handleSearch() {
    // The API would answer 422; checking here avoids the round trip.
    const error = priceRangeError(form)
    setRangeError(error)
    if (error) return
    const params = buildSearchParams(form)
    setApplied(params)
    reload(params)
  }

  function handleClear() {
    setForm(EMPTY_SEARCH)
    setRangeError(null)
    setApplied({})
    reload({})
  }

  async function handlePurchase(vehicle: Vehicle) {
    try {
      // Show the stock the server returns, not a local guess (count - 1).
      const updated = await purchaseVehicle(vehicle.id)
      setVehicles((list) => list?.map((v) => (v.id === updated.id ? updated : v)) ?? list)
      showToast('success', purchaseMessage(updated))
    } catch (err) {
      showToast('error', apiErrorMessage(err, 'Could not complete the purchase. Please try again.'))
      // 400 (sold out) or 404 (deleted): this list is out of date, so reload it.
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      if (status === 400 || status === 404) reload(applied)
    }
  }

  const hasFilters = Object.keys(applied).length > 0
  const count = vehicles?.length ?? 0
  let countText = `${count} listed`
  if (hasFilters) countText = count === 1 ? '1 result' : `${count} results`

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-sand px-5 py-8 sm:px-12 sm:py-12">
        <div aria-hidden="true" className="absolute -top-24 -right-16 size-80 rounded-full bg-peach" />
        <div aria-hidden="true" className="absolute -bottom-36 left-1/2 size-56 rounded-full bg-sage" />
        <div className="relative">
          <h1 className="font-display text-4xl sm:text-6xl">Find your next car.</h1>
          <p className="mt-2 mb-6 text-muted">Search the lot by make, model, category or price.</p>
          <SearchBar value={form} onChange={setForm} onSubmit={handleSearch} error={rangeError} />
        </div>
      </section>

      <div className="mt-10 mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h2 className="font-display text-3xl">All vehicles</h2>
        {vehicles !== null && <span className="text-sm text-muted">{countText}</span>}
        {hasFilters && (
          <button type="button" onClick={handleClear} className="text-link font-display text-sm">
            Clear filters
          </button>
        )}
      </div>

      {loadError && (
        <p role="alert" className="mb-5 rounded-full bg-danger-tint px-5 py-3 text-sm text-danger">
          {loadError}
        </p>
      )}

      {vehicles === null && <LoadingCards />}

      {vehicles !== null && vehicles.length === 0 && !loadError && (
        <div className="rounded-[1.75rem] bg-sand px-8 py-10">
          <p className="font-display text-xl">
            {hasFilters ? 'No cars match your search.' : 'No vehicles listed yet.'}
          </p>
          <p className="mt-1 text-muted">
            {hasFilters
              ? 'Try a broader search or widen the price range.'
              : 'Check back soon: new stock arrives every week.'}
          </p>
        </div>
      )}

      {vehicles !== null && vehicles.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <VehicleCard vehicle={vehicle} onPurchase={handlePurchase} />
            </li>
          ))}
        </ul>
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </main>
  )
}

/** Grey placeholder cards shown while the list loads. */
function LoadingCards() {
  return (
    <>
      <p role="status" className="sr-only">
        Loading vehicles…
      </p>
      <div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="animate-pulse rounded-[1.75rem] bg-sand p-[1.125rem]">
            <div className="h-30 rounded-2xl bg-sand-deep/60" />
            <div className="mt-4 h-3 w-1/3 rounded-full bg-sand-deep/60" />
            <div className="mt-3 h-4 w-2/3 rounded-full bg-sand-deep/60" />
            <div className="mt-5 h-10 rounded-full bg-sand-deep/60" />
          </div>
        ))}
      </div>
    </>
  )
}
