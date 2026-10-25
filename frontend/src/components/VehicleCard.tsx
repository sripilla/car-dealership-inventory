import { useState } from 'react'
import type { Vehicle } from '../api/types'
import { formatPrice, stockLabel } from '../lib/format'
import { CarIcon } from './Logo'

// Card artwork colours per category, from the Forecourt mockups. Unknown
// categories (the API returns category as plain text) get the neutral one.
const ART: Record<string, string> = {
  Sedan: 'bg-peach-tint text-terracotta-dark',
  SUV: 'bg-sage-tint text-sage-dark',
  Hatchback: 'bg-cream text-muted',
  Electric: 'bg-sage text-sage-dark',
}

function badgeClass(quantity: number): string {
  if (quantity === 0) return 'bg-cream text-ink'
  if (quantity === 1) return 'bg-danger-tint text-danger'
  return 'bg-sage-tint text-sage-dark'
}

interface VehicleCardProps {
  vehicle: Vehicle
  /** Buys one unit. The card stays disabled until the promise settles. */
  onPurchase: (vehicle: Vehicle) => Promise<void>
}

/** One vehicle on the dashboard, with its Purchase button. */
export function VehicleCard({ vehicle, onPurchase }: VehicleCardProps) {
  const [purchasing, setPurchasing] = useState(false)
  const outOfStock = vehicle.quantity === 0
  const name = `${vehicle.make} ${vehicle.model}`

  async function handlePurchase() {
    setPurchasing(true)
    try {
      await onPurchase(vehicle)
    } finally {
      setPurchasing(false)
    }
  }

  let buttonText = 'Purchase'
  if (outOfStock) buttonText = 'Out of stock'
  else if (purchasing) buttonText = 'Purchasing…'

  return (
    <article className="flex gap-4 rounded-[1.75rem] bg-sand p-4 sm:flex-col sm:p-[1.125rem]">
      <div
        className={`grid shrink-0 place-items-center rounded-full sm:h-30 sm:rounded-2xl ${
          ART[vehicle.category] ?? ART.Hatchback
        } size-20 sm:size-auto`}
      >
        <CarIcon className="size-9 sm:size-11" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-xs font-medium tracking-widest text-terracotta-dark uppercase">
          {vehicle.category}
        </p>
        <h3 className="mt-1 truncate font-display text-lg">{name}</h3>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-lg font-semibold">{formatPrice(vehicle.price)}</span>
          <span className={`rounded-full px-3 py-1 text-xs ${badgeClass(vehicle.quantity)}`}>
            {stockLabel(vehicle.quantity)}
          </span>
        </div>

        {/* Disabled at 0 (the spec) and while a purchase is in flight, so a
            double click can't buy twice. */}
        <button
          type="button"
          onClick={handlePurchase}
          disabled={outOfStock || purchasing}
          className="btn-primary mt-4 w-full py-2.5"
        >
          {buttonText}
        </button>
      </div>
    </article>
  )
}
