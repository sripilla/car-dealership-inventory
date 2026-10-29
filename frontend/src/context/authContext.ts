import { createContext } from 'react'
import type { User } from '../api/types'

/** defines what authentication data exists */
export interface AuthState {
  /** The logged-in user from GET /api/auth/me, or null. */
  user: User | null
  token: string | null
  isAdmin: boolean
  /** True while a stored token's user is still being loaded. */
  loading: boolean
  /** Logs in and loads the user. Rejects with the API error on failure. */
  login: (email: string, password: string) => Promise<User>
  logout: () => void
}

// Kept apart from AuthProvider.tsx so that file exports only a component
// (oxlint's react/only-export-components rule, needed for fast refresh).
export const AuthContext = createContext<AuthState | null>(null)
