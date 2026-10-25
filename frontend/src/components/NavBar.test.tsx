import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { TOKEN_KEY } from '../api/client'
import { AuthProvider } from '../context/AuthProvider'
import { adminUser, logInAs, normalUser } from '../test/auth'
import { NavBar } from './NavBar'

function renderNav() {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<h1>Login page</h1>} />
          <Route path="*" element={<NavBar />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

test('shows the logged-in user and the inventory link', async () => {
  logInAs(normalUser)
  renderNav()

  expect(await screen.findByText(normalUser.email)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Inventory' })).toHaveAttribute('href', '/')
})

test('hides the Admin link from a normal user', async () => {
  logInAs(normalUser)
  renderNav()

  // Wait until /me has loaded; before that, every link is hidden anyway,
  // and this test would pass without checking anything.
  await screen.findByText(normalUser.email)
  expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
})

test('shows the Admin link to an admin', async () => {
  logInAs(adminUser)
  renderNav()

  expect(await screen.findByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
})

test('Log out clears the token and goes to the login page', async () => {
  logInAs(normalUser)
  renderNav()

  await userEvent.setup().click(await screen.findByRole('button', { name: 'Log out' }))

  expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument()
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
})
