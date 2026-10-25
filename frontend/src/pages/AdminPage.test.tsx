import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { API_URL, server } from '../test/server'
import { corolla, creta } from '../test/vehicles'
import { AdminPage } from './AdminPage'

const VEHICLE_URL = `${API_URL}/api/vehicles/:id`

// Records the JSON body of every request to a URL, answering with `respond`.
function recordBodies(method: 'post' | 'put', url: string, respond: () => Response) {
  const bodies: unknown[] = []
  server.use(
    http[method](url, async ({ request }) => {
      bodies.push(await request.json())
      return respond()
    }),
  )
  return bodies
}

async function renderAdmin() {
  server.use(http.get(`${API_URL}/api/vehicles`, () => HttpResponse.json([corolla, creta])))
  render(<AdminPage />)
  await screen.findByRole('cell', { name: /^Hyundai Creta/ })
  return userEvent.setup()
}

/** The table row for a vehicle, found by its first cell ("Hyundai Creta ID 2"). */
function row(name: string) {
  return screen.getByRole('cell', { name: new RegExp(`^${name}`) }).closest('tr') as HTMLElement
}

test('lists every vehicle with its category, price and stock', async () => {
  await renderAdmin()

  const cretaRow = within(row('Hyundai Creta'))
  expect(cretaRow.getByText('SUV')).toBeInTheDocument()
  expect(cretaRow.getByText('₹13,99,000')).toBeInTheDocument()
  expect(cretaRow.getByText('2 in stock')).toBeInTheDocument()
})

test('adding a vehicle sends numbers, not strings, and adds the row', async () => {
  const swift = { id: 9, make: 'Maruti', model: 'Swift', category: 'Hatchback', price: 699000, quantity: 4 }
  const bodies = recordBodies('post', `${API_URL}/api/vehicles`, () =>
    HttpResponse.json(swift, { status: 201 }),
  )
  const user = await renderAdmin()

  await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
  await user.type(screen.getByLabelText('Make'), 'Maruti')
  await user.type(screen.getByLabelText('Model'), 'Swift')
  await user.selectOptions(screen.getByLabelText('Category'), 'Hatchback')
  await user.type(screen.getByLabelText('Price (₹)'), '699000')
  await user.type(screen.getByLabelText('Quantity'), '4')
  await user.click(screen.getByRole('button', { name: 'Add to inventory' }))

  expect(await screen.findByRole('cell', { name: /^Maruti Swift/ })).toBeInTheDocument()
  expect(bodies).toEqual([
    { make: 'Maruti', model: 'Swift', category: 'Hatchback', price: 699000, quantity: 4 },
  ])
  expect(screen.getByRole('status')).toHaveTextContent('Added Maruti Swift.')
})

test('an invalid new vehicle shows the errors and sends nothing', async () => {
  const bodies = recordBodies('post', `${API_URL}/api/vehicles`, () => HttpResponse.json({}))
  const user = await renderAdmin()

  await user.click(screen.getByRole('button', { name: 'Add vehicle' }))
  await user.type(screen.getByLabelText('Price (₹)'), '0')
  await user.type(screen.getByLabelText('Quantity'), '-1')
  await user.click(screen.getByRole('button', { name: 'Add to inventory' }))

  expect(screen.getByText('Enter a whole-rupee price of at least ₹1.')).toBeInTheDocument()
  expect(screen.getByText("Quantity can't be negative.")).toBeInTheDocument()
  expect(bodies).toHaveLength(0)
})

test('editing sends only the changed field and updates the row', async () => {
  const bodies = recordBodies('put', VEHICLE_URL, () =>
    HttpResponse.json({ ...creta, price: 1499000 }),
  )
  const user = await renderAdmin()

  await user.click(screen.getByRole('button', { name: 'Edit Hyundai Creta' }))
  const price = screen.getByLabelText('Price (₹)')
  await user.clear(price)
  await user.type(price, '1499000')
  await user.click(screen.getByRole('button', { name: 'Save changes' }))

  expect(await within(row('Hyundai Creta')).findByText('₹14,99,000')).toBeInTheDocument()
  expect(bodies).toEqual([{ price: 1499000 }])
})

test('saving an unchanged vehicle sends nothing', async () => {
  const bodies = recordBodies('put', VEHICLE_URL, () => HttpResponse.json(creta))
  const user = await renderAdmin()

  await user.click(screen.getByRole('button', { name: 'Edit Hyundai Creta' }))
  await user.click(screen.getByRole('button', { name: 'Save changes' }))

  expect(screen.getByText('Nothing to save: no fields changed.')).toBeInTheDocument()
  expect(bodies).toHaveLength(0)
})

test('delete asks first; "Keep it" sends nothing', async () => {
  let deletes = 0
  server.use(
    http.delete(VEHICLE_URL, () => {
      deletes += 1
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const user = await renderAdmin()

  await user.click(screen.getByRole('button', { name: 'Delete Hyundai Creta' }))
  const dialog = screen.getByRole('dialog', { name: 'Delete Hyundai Creta?' })
  expect(dialog).toHaveTextContent('its 2 units')
  await user.click(within(dialog).getByRole('button', { name: 'Keep it' }))

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(row('Hyundai Creta')).toBeInTheDocument()
  expect(deletes).toBe(0)
})

// 204 has no body: the page must not try to read JSON from it.
test('confirming delete removes the row after the 204', async () => {
  let deletedId: string | null = null
  server.use(
    http.delete(VEHICLE_URL, ({ params }) => {
      deletedId = params.id as string
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const user = await renderAdmin()

  await user.click(screen.getByRole('button', { name: 'Delete Hyundai Creta' }))
  await user.click(screen.getByRole('button', { name: 'Delete vehicle' }))

  expect(await screen.findByRole('status')).toHaveTextContent('Deleted Hyundai Creta.')
  expect(screen.queryByRole('cell', { name: /^Hyundai Creta/ })).not.toBeInTheDocument()
  expect(deletedId).toBe('2')
})

test('a 403 on delete shows the error and keeps the row', async () => {
  server.use(
    http.delete(VEHICLE_URL, () =>
      HttpResponse.json({ detail: 'Admin privileges required' }, { status: 403 }),
    ),
  )
  const user = await renderAdmin()

  await user.click(screen.getByRole('button', { name: 'Delete Hyundai Creta' }))
  await user.click(screen.getByRole('button', { name: 'Delete vehicle' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Admin privileges required')
  expect(row('Hyundai Creta')).toBeInTheDocument()
})

test('restock sends the amount as a number and shows the new stock', async () => {
  const bodies = recordBodies('post', `${API_URL}/api/vehicles/:id/restock`, () =>
    HttpResponse.json({ ...creta, quantity: 7 }),
  )
  const user = await renderAdmin()

  const cretaRow = within(row('Hyundai Creta'))
  const amount = cretaRow.getByLabelText('Restock amount for Hyundai Creta')
  await user.clear(amount)
  await user.type(amount, '5')
  await user.click(cretaRow.getByRole('button', { name: 'Add' }))

  expect(await cretaRow.findByText('7 in stock')).toBeInTheDocument()
  expect(bodies).toEqual([{ quantity: 5 }])
})

test('a restock amount of 0 shows an error and sends nothing', async () => {
  const bodies = recordBodies('post', `${API_URL}/api/vehicles/:id/restock`, () =>
    HttpResponse.json(creta),
  )
  const user = await renderAdmin()

  const cretaRow = within(row('Hyundai Creta'))
  const amount = cretaRow.getByLabelText('Restock amount for Hyundai Creta')
  await user.clear(amount)
  await user.type(amount, '0')
  await user.click(cretaRow.getByRole('button', { name: 'Add' }))

  expect(cretaRow.getByText('Enter at least 1.')).toBeInTheDocument()
  expect(bodies).toHaveLength(0)
})
