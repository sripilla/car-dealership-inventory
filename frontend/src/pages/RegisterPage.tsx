import axios from 'axios'
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api } from '../api/client'
import { apiErrorMessage } from '../api/errors'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/useAuth'
import { passwordErrors, type PasswordErrors } from '../lib/passwordRules'

/**
 * /register: public. Creates a normal (buyer) account, then logs straight in.
 * There is no admin option: admins are created only by the seed script.
 */
export function RegisterPage() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<PasswordErrors>({})
  const [emailTaken, setEmailTaken] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setEmailTaken(false)
    setFormError(null)

    // Check locally first, so an invalid password is never sent.
    const errors = passwordErrors(password, confirm)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      // Only email and password: confirm is a browser-side check.
      await api.post('/api/auth/register', { email, password })
      await login(email, password)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setEmailTaken(true)
      } else {
        setFormError(apiErrorMessage(err, 'Could not create the account. Please try again.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-5xl">Create an account</h1>
      <p className="mt-2 text-muted">Buyer accounts only. Admins are set up by the dealership.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {formError && (
          <p role="alert" className="rounded-full bg-danger-tint px-5 py-3 text-sm text-danger">
            {formError}
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
            aria-invalid={emailTaken}
            aria-describedby={emailTaken ? 'email-error' : undefined}
            className="field-input"
          />
          {emailTaken && (
            <p id="email-error" className="field-error">
              That email is already registered.{' '}
              <Link to="/login" className="text-link">
                Log in instead?
              </Link>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            className="field-input"
          />
          {fieldErrors.password && (
            <p id="password-error" className="field-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirm" className="field-label">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={Boolean(fieldErrors.confirm)}
            aria-describedby={fieldErrors.confirm ? 'confirm-error' : undefined}
            className="field-input"
          />
          {fieldErrors.confirm && (
            <p id="confirm-error" className="field-error">
              {fieldErrors.confirm}
            </p>
          )}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-link">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
