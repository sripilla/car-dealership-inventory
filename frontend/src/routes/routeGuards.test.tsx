import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { TOKEN_KEY } from '../api/client'
import { AuthProvider } from '../context/AuthProvider'
import { adminUser, logInAs, normalUser } from '../test/auth'
import { API_URL, server } from '../test/server'
import { AdminRoute } from './AdminRoute'
import { ProtectedRoute } from './ProtectedRoute'

// Placeholder pages: these tests are about where the user ends up, not
// what the real pages show.
function renderAt(path: string) {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<h1>Login page</h1>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<h1>Dashboard</h1>} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<h1>Admin panel</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

test.each(['/', '/admin'])('without a token, %s redirects to /login', async (path) => {
  renderAt(path)

  expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument()
})

test('a logged-in user sees the dashboard', async () => {
  logInAs(normalUser)
  renderAt('/')

  expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
})

test('a normal user on /admin is sent to the dashboard', async () => {
  logInAs(normalUser)
  renderAt('/admin')

  expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Admin panel' })).not.toBeInTheDocument()
})

test('an admin can open /admin', async () => {
  logInAs(adminUser)
  renderAt('/admin')

  expect(await screen.findByRole('heading', { name: 'Admin panel' })).toBeInTheDocument()
})

// The page-reload case: a token is stored, but the server no longer
// accepts it (expired, or signed with an old secret).
test('a stored token the API rejects redirects to /login and is cleared', async () => {
  localStorage.setItem(TOKEN_KEY, 'expired')
  server.use(
    http.get(`${API_URL}/api/auth/me`, () =>
      HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 }),
    ),
  )
  renderAt('/')

  expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument()
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
})
