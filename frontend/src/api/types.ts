// Shapes returned by the backend. Keep in sync with app/schemas/*.py.

/** UserOut: never includes the password. */
export interface User {
  id: number
  email: string
  is_admin: boolean
}
