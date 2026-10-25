import axios from 'axios'

/** localStorage key for the JWT. */
export const TOKEN_KEY = 'token'

/**
 * The one Axios instance every API call goes through.
 *
 * adapter 'fetch': Axios's default XMLHttpRequest adapter isn't intercepted
 * by MSW under jsdom, so tests would hit the real network. Every modern
 * browser supports fetch, so the app behaves the same either way.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  adapter: 'fetch',
})

// Called after a 401. AuthContext registers a function here that clears the
// logged-in user, so the client doesn't need to know about React.
let onUnauthorized: (() => void) | null = null

/** Registers (or, with null, removes) the function to call after a 401. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

// Read the token on every request rather than once at startup, so a login
// or logout takes effect immediately.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Only 401 means the token is missing, expired or invalid. Other errors
// (403 not admin, 400 out of stock) leave the user logged in.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      onUnauthorized?.()
    }
    // Re-throw so the caller can still show the error message.
    return Promise.reject(error)
  },
)
