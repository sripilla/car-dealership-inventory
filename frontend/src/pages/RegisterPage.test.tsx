import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route } from 'react-router-dom'
import { normalUser } from '../test/auth'
import { renderRoutes } from '../test/render'
import { API_URL, server } from '../test/server'
import { RegisterPage } from './RegisterPage'

// Counts calls to POST /api/auth/register and answers with the given response.
function mockRegister(respond: () => Response) {
  const calls: unknown[] = []
  server.use(
    http.post(`${API_URL}/api/auth/register`, async ({ request }) => {
      calls.push(await request.json())
      return respond()
    }),
  )
  return calls
}

const created = () =>
  HttpResponse.json({ id: 1, email: 'arjun@example.com', is_admin: false }, { status: 201 })

function renderRegister() {
  renderRoutes('/register', <Route path="/register" element={<RegisterPage />} />)
}

async function fillAndSubmit(email: string, password: string, confirm: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm password'), confirm)
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

test('shows an error when the two passwords differ, and sends nothing', async () => {
  const calls = mockRegister(created)
  renderRegister()

  await fillAndSubmit('arjun@example.com', 'SecurePass1', 'SecurePass2')

  expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument()
  expect(calls).toHaveLength(0)
})

test('shows an error for a password under 8 characters, and sends nothing', async () => {
  const calls = mockRegister(created)
  renderRegister()

  await fillAndSubmit('arjun@example.com', 'short', 'short')

  expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument()
  expect(calls).toHaveLength(0)
})

test('shows a log-in link when the email is already registered (409)', async () => {
  mockRegister(() =>
    HttpResponse.json({ detail: 'Email already registered' }, { status: 409 }),
  )
  renderRegister()

  await fillAndSubmit('arjun@example.com', 'SecurePass1', 'SecurePass1')

  expect(await screen.findByText(/That email is already registered/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Log in instead?' })).toHaveAttribute('href', '/login')
})

test('shows the API message for other validation errors (422)', async () => {
  mockRegister(() =>
    HttpResponse.json(
      { detail: [{ loc: ['body', 'email'], msg: 'value is not a valid email address' }] },
      { status: 422 },
    ),
  )
  renderRegister()

  await fillAndSubmit('arjun@example', 'SecurePass1', 'SecurePass1')

  expect(await screen.findByRole('alert')).toHaveTextContent('value is not a valid email address')
})

test('registers, logs in and redirects to the dashboard', async () => {
  const calls = mockRegister(created)
  server.use(
    http.post(`${API_URL}/api/auth/login`, () =>
      HttpResponse.json({ access_token: 'new-token', token_type: 'bearer' }),
    ),
    http.get(`${API_URL}/api/auth/me`, () => HttpResponse.json(normalUser)),
  )
  renderRegister()

  await fillAndSubmit('arjun@example.com', 'SecurePass1', 'SecurePass1')

  expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  // Only email and password: no confirm field, and never is_admin.
  expect(calls).toEqual([{ email: 'arjun@example.com', password: 'SecurePass1' }])
})
