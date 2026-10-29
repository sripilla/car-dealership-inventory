import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setUnauthorizedHandler, TOKEN_KEY } from '../api/client'
import type { User } from '../api/types'
import { AuthContext } from './authContext'

/**
 * Holds the logged-in user for the whole app.
 *
 * The token lives in localStorage so a page reload keeps the user logged in;
 * the user itself always comes from GET /api/auth/me, so the server stays
 * the source of truth for is_admin.
 */

/** Supplies authentication state and functions
 * Manages the user, token, login, logout, and 
 * loading state; shares them with the app.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  // Only loading when there is a stored token whose user isn't known yet.
  const [loading, setLoading] = useState(() => token !== null)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Any 401 from any API call logs the user out (see api/client.ts).
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // On page load with a stored token, find out who it belongs to.
  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY) === null) return
    // Ignore a response that arrives after unmount (or StrictMode's
    // mount-unmount-mount in development).
    let cancelled = false
    api
      .get<User>('/api/auth/me')
      .then((response) => {
        if (!cancelled) setUser(response.data)
      })
      .catch(() => {
        if (!cancelled) logout()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ access_token: string }>('/api/auth/login', {
      email,
      password,
    })
    localStorage.setItem(TOKEN_KEY, data.access_token)
    setToken(data.access_token)
    const me = await api.get<User>('/api/auth/me')
    setUser(me.data)
    return me.data
  }, [])

  const value = useMemo(
    () => ({ user, token, isAdmin: user?.is_admin ?? false, loading, login, logout }),
    [user, token, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
