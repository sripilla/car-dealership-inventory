import { http, HttpResponse } from 'msw'
import { TOKEN_KEY } from '../api/client'
import { API_URL, server } from './server'

// Users shaped exactly like the API's UserOut.
export const normalUser = { id: 1, email: 'priya@example.com', is_admin: false }
export const adminUser = { id: 2, email: 'admin@forecourt.in', is_admin: true }

/** Stores a token and makes GET /api/auth/me return this user for it. */
export function logInAs(user: typeof normalUser) {
  localStorage.setItem(TOKEN_KEY, `token-for-${user.id}`)
  server.use(http.get(`${API_URL}/api/auth/me`, () => HttpResponse.json(user)))
}
