import { AxiosError, type AxiosResponse } from 'axios'
import { apiErrorMessage } from './errors'

const FALLBACK = 'Something went wrong.'

// An AxiosError as the client throws it when the API answers with an error.
function errorWithBody(status: number, data: unknown) {
  const response = { status, data } as AxiosResponse
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response)
}

test('uses a plain-text detail from the API', () => {
  const error = errorWithBody(401, { detail: 'Incorrect email or password' })

  expect(apiErrorMessage(error, FALLBACK)).toBe('Incorrect email or password')
})

// FastAPI's 422 body: detail is a list of problems, one per invalid field.
test('uses the first message of a validation error list', () => {
  const error = errorWithBody(422, {
    detail: [{ loc: ['body', 'price'], msg: 'Input should be greater than 0' }],
  })

  expect(apiErrorMessage(error, FALLBACK)).toBe('Input should be greater than 0')
})

test('falls back when there is no response (network down)', () => {
  const error = new AxiosError('Network Error', 'ERR_NETWORK')

  expect(apiErrorMessage(error, FALLBACK)).toBe(FALLBACK)
})

test.each([
  ['a body without detail', errorWithBody(500, 'Internal Server Error')],
  ['a non-Axios error', new Error('boom')],
])('falls back for %s', (_name, error) => {
  expect(apiErrorMessage(error, FALLBACK)).toBe(FALLBACK)
})
