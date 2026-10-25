import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/**
 * Renders the child routes only for an admin. Logged-out users go to
 * /login; normal users go to the dashboard. The backend still returns 403
 * for admin endpoints: this only keeps the UI from offering them.
 */
export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth()

  if (loading) return <p role="status">Loading…</p>
  if (user === null) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
