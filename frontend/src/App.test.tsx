import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from './App'
import { adminUser, logInAs } from './test/auth'
import { API_URL, server } from './test/server'
import { creta } from './test/vehicles'

// The real app with its real routes. BrowserRouter reads the jsdom URL,
// which carries over between tests, so each test starts at "/".
beforeEach(() => window.history.pushState({}, '', '/'))

// Without a stored token, "/" is protected, so a first-time visitor lands
// on the login page.
test('a logged-out visitor sees the login page', async () => {
  render(<App />)

  expect(await screen.findByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()
})

test('an admin can open the admin panel from the nav bar', async () => {
  logInAs(adminUser)
  server.use(http.get(`${API_URL}/api/vehicles`, () => HttpResponse.json([creta])))
  render(<App />)

  await userEvent.setup().click(await screen.findByRole('link', { name: 'Admin' }))

  expect(await screen.findByRole('heading', { name: 'Manage stock' })).toBeInTheDocument()
})
