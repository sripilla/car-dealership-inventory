import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route } from 'react-router-dom'
import { TOKEN_KEY } from '../api/client'
import { logInAs, normalUser } from '../test/auth'
import { renderRoutes } from '../test/render'
import { API_URL, server } from '../test/server'
import { LoginPage } from './LoginPage'

function renderLogin() {
  renderRoutes('/login', <Route path="/login" element={<LoginPage />} />)
}

async function submitLogin(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Log in' }))
}

test('shows the API error on wrong credentials and stays on the login page', async () => {
  server.use(
    http.post(`${API_URL}/api/auth/login`, () =>
      HttpResponse.json({ detail: 'Incorrect email or password' }, { status: 401 }),
    ),
  )
  renderLogin()

  await submitLogin('priya@example.com', 'wrong-password')

  expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password')
  expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
})

test('logs in, stores the token and redirects to the dashboard', async () => {
  let sentBody: unknown = null
  server.use(
    http.post(`${API_URL}/api/auth/login`, async ({ request }) => {
      sentBody = await request.json()
      return HttpResponse.json({ access_token: 'new-token', token_type: 'bearer' })
    }),
    http.get(`${API_URL}/api/auth/me`, () => HttpResponse.json(normalUser)),
  )
  renderLogin()

  await submitLogin('priya@example.com', 'SecurePass1')

  expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  expect(sentBody).toEqual({ email: 'priya@example.com', password: 'SecurePass1' })
  expect(localStorage.getItem(TOKEN_KEY)).toBe('new-token')
})

test('a user who is already logged in is sent to the dashboard', async () => {
  logInAs(normalUser)
  renderLogin()

  expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
})

test('links to the register page', () => {
  renderLogin()

  expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
    'href',
    '/register',
  )
})
