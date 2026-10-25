// The same password rules as the backend (app/schemas/user.py), checked in
// the browser so the user sees the problem before anything is sent.

export const MIN_PASSWORD_CHARS = 8
// bcrypt only uses the first 72 bytes of a password.
export const MAX_PASSWORD_BYTES = 72

export interface PasswordErrors {
  password?: string
  confirm?: string
}

/** Problems with a new password and its confirmation; {} when both are fine. */
export function passwordErrors(password: string, confirm: string): PasswordErrors {
  const errors: PasswordErrors = {}

  // [...password] counts characters (code points) like Python's len().
  // password.length would count an emoji as 2.
  if ([...password].length < MIN_PASSWORD_CHARS) {
    errors.password = `Use at least ${MIN_PASSWORD_CHARS} characters.`
  } else if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    errors.password = `Use at most ${MAX_PASSWORD_BYTES} bytes (accented letters and emoji count as more).`
  }

  if (confirm !== password) {
    errors.confirm = "Passwords don't match."
  }

  return errors
}
