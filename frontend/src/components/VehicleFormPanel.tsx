import { useState, type FormEvent } from 'react'
import { VEHICLE_CATEGORIES, type VehicleCategory } from '../api/types'
import {
  vehicleFormErrors,
  type VehicleFormErrors,
  type VehicleFormValues,
} from '../lib/vehicleForm'

interface VehicleFormPanelProps {
  /** Small line above the title, e.g. "Editing ID 3". */
  eyebrow: string
  title: string
  submitLabel: string
  initial: VehicleFormValues
  /**
   * Called with valid values. Resolves to a message to show in the panel
   * (an API error, or "nothing changed"), or null when it worked.
   */
  onSubmit: (values: VehicleFormValues) => Promise<string | null>
  onCancel: () => void
}

/** The admin's add and edit form: one panel, used for both. */
export function VehicleFormPanel({
  eyebrow,
  title,
  submitLabel,
  initial,
  onSubmit,
  onCancel,
}: VehicleFormPanelProps) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<VehicleFormErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    const found = vehicleFormErrors(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      setMessage(await onSubmit(values))
    } finally {
      setSaving(false)
    }
  }

  // Wires an input to its label and error message.
  function fieldProps(key: keyof VehicleFormValues) {
    return {
      id: `vehicle-${key}`,
      'aria-invalid': Boolean(errors[key]),
      'aria-describedby': errors[key] ? `vehicle-${key}-error` : undefined,
      className: 'field-input',
    }
  }

  function errorFor(key: keyof VehicleFormValues) {
    return (
      errors[key] && (
        <p id={`vehicle-${key}-error`} className="field-error">
          {errors[key]}
        </p>
      )
    )
  }

  return (
    <section aria-labelledby="vehicle-form-title" className="rounded-[2rem] bg-sand p-6 sm:p-7">
      <p className="text-xs font-medium tracking-widest text-terracotta-dark uppercase">{eyebrow}</p>
      <h2 id="vehicle-form-title" className="mt-1 font-display text-2xl">
        {title}
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="vehicle-make" className="field-label">
            Make
          </label>
          <input {...fieldProps('make')} value={values.make} onChange={(e) => set('make', e.target.value)} />
          {errorFor('make')}
        </div>

        <div>
          <label htmlFor="vehicle-model" className="field-label">
            Model
          </label>
          <input {...fieldProps('model')} value={values.model} onChange={(e) => set('model', e.target.value)} />
          {errorFor('model')}
        </div>

        <div className="col-span-2">
          <label htmlFor="vehicle-category" className="field-label">
            Category
          </label>
          <select
            {...fieldProps('category')}
            value={values.category}
            onChange={(e) => set('category', e.target.value as VehicleCategory | '')}
          >
            <option value="">Choose…</option>
            {VEHICLE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errorFor('category')}
        </div>

        <div>
          <label htmlFor="vehicle-price" className="field-label">
            Price (₹)
          </label>
          <input
            {...fieldProps('price')}
            inputMode="numeric"
            value={values.price}
            onChange={(e) => set('price', e.target.value)}
          />
          {errorFor('price')}
        </div>

        <div>
          <label htmlFor="vehicle-quantity" className="field-label">
            Quantity
          </label>
          <input
            {...fieldProps('quantity')}
            inputMode="numeric"
            value={values.quantity}
            onChange={(e) => set('quantity', e.target.value)}
          />
          {errorFor('quantity')}
        </div>

        {message && (
          <p role="alert" className="col-span-2 rounded-2xl bg-danger-tint px-4 py-3 text-sm text-danger">
            {message}
          </p>
        )}

        <div className="col-span-2 mt-1 flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : submitLabel}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
