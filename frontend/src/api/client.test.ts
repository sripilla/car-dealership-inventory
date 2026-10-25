import { http, HttpResponse } from 'msw'
import { API_URL, server } from '../test/server'
import { api, setUnauthorizedHandler, TOKEN_KEY } from './client'

// Records the Authorization header of the next request to /api/auth/me.
function captureAuthHeader() {
  const seen: { header: string | null } = { header: null }
  server.use(
    http.get(`${API_URL}/api/auth/me`, ({ request }) => {
      seen.header = request.headers.get('Authorization')
      return HttpResponse.json({ id: 1, email: 'a@b.com', is_admin: false })
    }),
  )
  return seen
}

// Makes GET /api/vehicles answer with the given status.
function respondWith(status: number) {
  server.use(
    http.get(`${API_URL}/api/vehicles`, () =>
      HttpResponse.json({ detail: 'error' }, { status }),
    ),
  )
}

afterEach(() => setUnauthorizedHandler(null))

test('attaches the stored token as a Bearer header', async () => {
  localStorage.setItem(TOKEN_KEY, 'abc123')
  const seen = captureAuthHeader()

  await api.get('/api/auth/me')

  expect(seen.header).toBe('Bearer abc123')
})

test('sends no Authorization header when no token is stored', async () => {
  const seen = captureAuthHeader()

  await api.get('/api/auth/me')

  expect(seen.header).toBeNull()
})

test('a 401 clears the stored token and calls the unauthorized handler', async () => {
  localStorage.setItem(TOKEN_KEY, 'expired')
  const onUnauthorized = vi.fn()
  setUnauthorizedHandler(onUnauthorized)
  respondWith(401)

  // The error still reaches the caller, so a form can show it.
  await expect(api.get('/api/vehicles')).rejects.toMatchObject({
    response: { status: 401 },
  })

  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  expect(onUnauthorized).toHaveBeenCalledOnce()
})

// Only 401 means "your login is no longer valid". A 403 on delete or a 400
// on an out-of-stock purchase must not log the user out.
test.each([
  [400, 'out of stock'],
  [403, 'not an admin'],
  [404, 'unknown vehicle'],
  [422, 'invalid input'],
])('a %i (%s) keeps the token and does not log out', async (status) => {
  localStorage.setItem(TOKEN_KEY, 'valid')
  const onUnauthorized = vi.fn()
  setUnauthorizedHandler(onUnauthorized)
  respondWith(status)

  await expect(api.get('/api/vehicles')).rejects.toMatchObject({
    response: { status },
  })

  expect(localStorage.getItem(TOKEN_KEY)).toBe('valid')
  expect(onUnauthorized).not.toHaveBeenCalled()
})
