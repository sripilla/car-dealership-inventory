import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/** Renders the child routes only for a logged-in user; otherwise sends them to /login. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()

  // Wait for GET /api/auth/me before deciding, or a reload would flash
  // the login page for a user who is actually logged in.
  if (loading) return <p role="status">Loading…</p>
  // replace: Back shouldn't return to a page the user can't see.
  if (user === null) return <Navigate to="/login" replace />
  return <Outlet />
}
