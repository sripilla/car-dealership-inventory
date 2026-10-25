import { useContext } from 'react'
import { AuthContext, type AuthState } from './authContext'

/** The current auth state. Must be used inside <AuthProvider>. */
export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (auth === null) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return auth
}
