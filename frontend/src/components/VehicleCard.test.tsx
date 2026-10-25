import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Vehicle } from '../api/types'
import { VehicleCard } from './VehicleCard'

const creta: Vehicle = {
  id: 2,
  make: 'Hyundai',
  model: 'Creta',
  category: 'SUV',
  price: 1399000,
  quantity: 2,
}

function renderCard(vehicle: Vehicle, onPurchase = vi.fn().mockResolvedValue(undefined)) {
  render(<VehicleCard vehicle={vehicle} onPurchase={onPurchase} />)
  return onPurchase
}

test('shows make, model, category, Indian-format price and stock', () => {
  renderCard(creta)

  expect(screen.getByRole('heading', { name: 'Hyundai Creta' })).toBeInTheDocument()
  expect(screen.getByText('SUV')).toBeInTheDocument()
  expect(screen.getByText('₹13,99,000')).toBeInTheDocument()
  expect(screen.getByText('2 in stock')).toBeInTheDocument()
})

// The spec's rule, tested on both sides of the boundary.
test('the purchase button is disabled and reads "Out of stock" at quantity 0', () => {
  const onPurchase = renderCard({ ...creta, quantity: 0 })

  expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled()
  expect(screen.queryByRole('button', { name: 'Purchase' })).not.toBeInTheDocument()
  expect(onPurchase).not.toHaveBeenCalled()
})

test('the purchase button is enabled at quantity 1', () => {
  renderCard({ ...creta, quantity: 1 })

  expect(screen.getByRole('button', { name: 'Purchase' })).toBeEnabled()
  expect(screen.getByText('Last one')).toBeInTheDocument()
})

test('clicking Purchase calls onPurchase with the vehicle', async () => {
  const onPurchase = renderCard(creta)

  await userEvent.setup().click(screen.getByRole('button', { name: 'Purchase' }))

  expect(onPurchase).toHaveBeenCalledExactlyOnceWith(creta)
})

// Stops a double click from buying two cars.
test('the button is disabled while the purchase is in progress', async () => {
  let finish = () => {}
  const onPurchase = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
  renderCard(creta, onPurchase)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: 'Purchase' }))

  expect(screen.getByRole('button', { name: 'Purchasing…' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Purchasing…' }))
  expect(onPurchase).toHaveBeenCalledOnce()

  finish()
  expect(await screen.findByRole('button', { name: 'Purchase' })).toBeEnabled()
})
