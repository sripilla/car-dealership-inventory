import axios from 'axios'

/**
 * A message to show the user for a failed API call.
 *
 * FastAPI sends {"detail": "..."} for errors the routes raise (401, 404, 409)
 * and {"detail": [{"msg": "..."}, ...]} for validation errors (422). Anything
 * else (network down, a 500 page) gets the fallback.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const detail: unknown = error.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && typeof detail[0]?.msg === 'string') return detail[0].msg
  return fallback
}
