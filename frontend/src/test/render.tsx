import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthProvider'

/**
 * Renders `routes` inside the real AuthProvider, starting at `path`.
 * A placeholder dashboard at "/" shows where successful logins end up.
 */
export function renderRoutes(path: string, routes: ReactNode) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {routes}
          <Route path="/" element={<h1>Dashboard</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}
