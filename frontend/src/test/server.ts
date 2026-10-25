import { setupServer } from 'msw/node'

// The fake API used by every test. Starts with no handlers: each test adds
// the responses it needs with server.use(...), so a test shows exactly what
// the API returned for it.
export const server = setupServer()

// Matches VITE_API_URL in vite.config.ts's test settings.
export const API_URL = 'http://api.test'
