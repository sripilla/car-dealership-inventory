import { render, screen } from '@testing-library/react'
import App from './App'

// The real app with its real routes. Without a stored token, "/" is
// protected, so a first-time visitor lands on the login page.
test('a logged-out visitor sees the login page', async () => {
  render(<App />)

  expect(await screen.findByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()
})
