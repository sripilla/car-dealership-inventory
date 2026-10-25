import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { Vehicle } from '../api/types'
import { API_URL, server } from '../test/server'
import { corolla, creta, fortuner } from '../test/vehicles'
import { DashboardPage } from './DashboardPage'

// Makes GET /api/vehicles return this list.
function listReturns(vehicles: Vehicle[]) {
  server.use(http.get(`${API_URL}/api/vehicles`, () => HttpResponse.json(vehicles)))
}

// Records the query of every GET /api/vehicles/search and returns `results`.
function searchReturns(results: Vehicle[]) {
  const queries: Record<string, string>[] = []
  server.use(
    http.get(`${API_URL}/api/vehicles/search`, ({ request }) => {
      queries.push(Object.fromEntries(new URL(request.url).searchParams))
      return HttpResponse.json(results)
    }),
  )
  return queries
}

/** The card (article) whose heading is this vehicle's name. */
function card(name: string) {
  return screen.getByRole('heading', { name }).closest('article') as HTMLElement
}

test('lists every vehicle, including out-of-stock ones', async () => {
  listReturns([corolla, { ...creta, quantity: 0 }])
  render(<DashboardPage />)

  expect(await screen.findByRole('heading', { name: 'Toyota Corolla Altis' })).toBeInTheDocument()
  expect(within(card('Hyundai Creta')).getByRole('button', { name: 'Out of stock' })).toBeDisabled()
  expect(screen.getByText('2 listed')).toBeInTheDocument()
})

test('shows an empty state when there are no vehicles', async () => {
  listReturns([])
  render(<DashboardPage />)

  expect(await screen.findByText('No vehicles listed yet.')).toBeInTheDocument()
})

test('purchasing updates the stock from the API response and confirms it', async () => {
  listReturns([creta])
  let purchasedId: string | null = null
  server.use(
    http.post(`${API_URL}/api/vehicles/:id/purchase`, ({ params }) => {
      purchasedId = params.id as string
      return HttpResponse.json({ ...creta, quantity: 1 })
    }),
  )
  render(<DashboardPage />)

  await userEvent.setup().click(await screen.findByRole('button', { name: 'Purchase' }))

  expect(await screen.findByRole('status')).toHaveTextContent('Purchased Hyundai Creta. 1 left in stock.')
  expect(within(card('Hyundai Creta')).getByText('Last one')).toBeInTheDocument()
  expect(purchasedId).toBe('2')
})

test('buying the last unit disables the button', async () => {
  listReturns([fortuner])
  server.use(
    http.post(`${API_URL}/api/vehicles/:id/purchase`, () =>
      HttpResponse.json({ ...fortuner, quantity: 0 }),
    ),
  )
  render(<DashboardPage />)

  await userEvent.setup().click(await screen.findByRole('button', { name: 'Purchase' }))

  expect(await screen.findByRole('button', { name: 'Out of stock' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('That was the last one.')
})

// Someone else bought the last one first: the API says 400, so the page
// shows why and reloads, and the card then shows the real stock.
test('a sold-out purchase shows the API error and refreshes the stock', async () => {
  // The first load sees 1 in stock; every load after that sees 0.
  let loads = 0
  server.use(
    http.get(`${API_URL}/api/vehicles`, () => {
      loads += 1
      return HttpResponse.json([{ ...fortuner, quantity: loads === 1 ? 1 : 0 }])
    }),
    http.post(`${API_URL}/api/vehicles/:id/purchase`, () =>
      HttpResponse.json({ detail: 'Vehicle is out of stock' }, { status: 400 }),
    ),
  )
  render(<DashboardPage />)

  await userEvent.setup().click(await screen.findByRole('button', { name: 'Purchase' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Vehicle is out of stock')
  expect(await screen.findByRole('button', { name: 'Out of stock' })).toBeDisabled()
  expect(loads).toBe(2)
})

test('search sends only the filled-in inputs and shows only the matches', async () => {
  listReturns([corolla, creta, fortuner])
  const queries = searchReturns([corolla, fortuner])
  render(<DashboardPage />)
  const user = userEvent.setup()
  await screen.findByRole('heading', { name: 'Hyundai Creta' })

  await user.type(screen.getByLabelText('Make'), 'toy')
  await user.click(screen.getByRole('button', { name: 'Search' }))

  expect(await screen.findByText('2 results')).toBeInTheDocument()
  expect(queries).toEqual([{ make: 'toy' }])
  expect(screen.queryByRole('heading', { name: 'Hyundai Creta' })).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Toyota Fortuner' })).toBeInTheDocument()
})

test('search sends the category and price range in the API format', async () => {
  listReturns([corolla, creta, fortuner])
  const queries = searchReturns([fortuner])
  render(<DashboardPage />)
  const user = userEvent.setup()
  await screen.findByRole('heading', { name: 'Hyundai Creta' })

  await user.selectOptions(screen.getByLabelText('Category'), 'SUV')
  await user.type(screen.getByLabelText('Min price'), '2000000')
  await user.click(screen.getByRole('button', { name: 'Search' }))

  expect(await screen.findByText('1 result')).toBeInTheDocument()
  expect(queries).toEqual([{ category: 'SUV', min_price: '2000000' }])
})

test('min price above max price shows an error and sends nothing', async () => {
  listReturns([corolla])
  const queries = searchReturns([])
  render(<DashboardPage />)
  const user = userEvent.setup()
  await screen.findByRole('heading', { name: 'Toyota Corolla Altis' })

  await user.type(screen.getByLabelText('Min price'), '3000000')
  await user.type(screen.getByLabelText('Max price'), '1000000')
  await user.click(screen.getByRole('button', { name: 'Search' }))

  expect(await screen.findByText('Min price must not be more than max price.')).toBeInTheDocument()
  expect(queries).toHaveLength(0)
  expect(screen.getByRole('heading', { name: 'Toyota Corolla Altis' })).toBeInTheDocument()
})

test('no matches shows an empty state, and Clear filters shows everything again', async () => {
  listReturns([corolla, creta])
  searchReturns([])
  render(<DashboardPage />)
  const user = userEvent.setup()
  await screen.findByRole('heading', { name: 'Hyundai Creta' })

  await user.type(screen.getByLabelText('Make'), 'tesla')
  await user.click(screen.getByRole('button', { name: 'Search' }))
  expect(await screen.findByText('No cars match your search.')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Clear filters' }))

  expect(await screen.findByRole('heading', { name: 'Hyundai Creta' })).toBeInTheDocument()
  expect(screen.getByLabelText('Make')).toHaveValue('')
})
