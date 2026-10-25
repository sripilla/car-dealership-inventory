import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Logo } from './Logo'

// The active link is terracotta, as in the mockups.
function linkClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'text-terracotta-dark' : 'text-ink hover:text-terracotta-dark'
}

/**
 * The top bar on every logged-in page. The Admin link appears only for
 * admins (is_admin from GET /api/auth/me); the API still enforces 403.
 * On small screens the email is hidden but both links stay, so an admin
 * can always reach /admin.
 */
export function NavBar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
      <Logo />

      <nav aria-label="Main" className="flex items-center gap-3 text-sm sm:gap-5">
        <NavLink to="/" end className={linkClass}>
          Inventory
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={linkClass}>
            Admin
          </NavLink>
        )}
        {user && (
          <span className="hidden rounded-full bg-sage-tint px-3 py-1 text-xs text-sage-dark sm:inline">
            {isAdmin ? 'Admin · ' : ''}
            {user.email}
          </span>
        )}
        <button type="button" onClick={handleLogout} className="btn-secondary px-4 py-2 text-sm">
          Log out
        </button>
      </nav>
    </header>
  )
}
