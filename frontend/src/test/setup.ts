// Adds matchers like toBeInTheDocument() and toBeDisabled() to expect().
import '@testing-library/jest-dom/vitest'
import { server } from './server'

// 'error': a request no handler matches fails the test, so a wrong URL or a
// forgotten handler can't slip through silently.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
// Drop the handlers a test added, and the stored token, so tests can't
// affect each other.
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())
