import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { apiErrorMessage } from '../api/errors'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/useAuth'

/** /login: public. Redirects to the dashboard once the user is logged in. */
export function LoginPage() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Covers both a successful login (user is set) and visiting /login while
  // already logged in.
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      // The API sends the same 401 for a wrong password and an unknown email.
      setError(apiErrorMessage(err, 'Could not log in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-5xl">Welcome back.</h1>
      <p className="mt-2 text-muted">Log in to browse the lot and manage stock.</p>

      {/* noValidate: our own messages instead of the browser's pop-ups. */}
      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {error && (
          <p role="alert" className="rounded-full bg-danger-tint px-5 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6">
        New here?{' '}
        <Link to="/register" className="text-link">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
