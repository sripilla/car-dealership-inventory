import type { FormEvent } from 'react'
import { VEHICLE_CATEGORIES, type VehicleCategory } from '../api/types'
import type { SearchForm } from '../lib/search'

interface SearchBarProps {
  value: SearchForm
  onChange: (value: SearchForm) => void
  onSubmit: () => void
  error: string | null
}

/**
 * Make and Model are separate inputs because they map one-to-one to the
 * API's make and model parameters. The category values are the API's exact,
 * case-sensitive spellings.
 */
export function SearchBar({ value, onChange, onSubmit, error }: SearchBarProps) {
  function set<K extends keyof SearchForm>(key: K, fieldValue: SearchForm[K]) {
    onChange({ ...value, [key]: fieldValue })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      role="search"
      className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1fr_1.2fr_1fr_1fr_auto] lg:items-end"
    >
      <div>
        <label htmlFor="search-make" className="field-label">
          Make
        </label>
        <input
          id="search-make"
          value={value.make}
          onChange={(e) => set('make', e.target.value)}
          placeholder="e.g. Toyota"
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="search-model" className="field-label">
          Model
        </label>
        <input
          id="search-model"
          value={value.model}
          onChange={(e) => set('model', e.target.value)}
          placeholder="e.g. Corolla"
          className="field-input"
        />
      </div>

      <div className="col-span-2 lg:col-span-1">
        <label htmlFor="search-category" className="field-label">
          Category
        </label>
        <select
          id="search-category"
          value={value.category}
          onChange={(e) => set('category', e.target.value as VehicleCategory | '')}
          className="field-input appearance-auto"
        >
          <option value="">All categories</option>
          {VEHICLE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="search-min" className="field-label">
          Min price
        </label>
        <input
          id="search-min"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value.minPrice}
          onChange={(e) => set('minPrice', e.target.value)}
          placeholder="₹"
          aria-invalid={error !== null}
          aria-describedby={error ? 'search-error' : undefined}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="search-max" className="field-label">
          Max price
        </label>
        <input
          id="search-max"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value.maxPrice}
          onChange={(e) => set('maxPrice', e.target.value)}
          placeholder="₹"
          aria-invalid={error !== null}
          aria-describedby={error ? 'search-error' : undefined}
          className="field-input"
        />
      </div>

      <button type="submit" className="btn-primary col-span-2 lg:col-span-1">
        Search
      </button>

      {error && (
        <p id="search-error" className="field-error col-span-2 lg:col-span-6">
          {error}
        </p>
      )}
    </form>
  )
}
