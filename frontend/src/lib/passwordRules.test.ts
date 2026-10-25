import { passwordErrors } from './passwordRules'

// Mirrors the backend: at least 8 characters, at most 72 bytes (UTF-8).
test.each([
  ['1234567', 'Use at least 8 characters.'],
  // 7 emoji: .length is 14 in JavaScript, but it's 7 characters to Python.
  ['😀😀😀😀😀😀😀', 'Use at least 8 characters.'],
  ['a'.repeat(73), 'Use at most 72 bytes (accented letters and emoji count as more).'],
  // 37 × "é" = 74 bytes, though only 37 characters.
  ['é'.repeat(37), 'Use at most 72 bytes (accented letters and emoji count as more).'],
])('rejects %j', (password, message) => {
  expect(passwordErrors(password, password)).toEqual({ password: message })
})

test.each([
  ['12345678', 'exactly 8 characters'],
  ['a'.repeat(72), 'exactly 72 bytes'],
  ['é'.repeat(36), '36 two-byte characters = 72 bytes'],
])('accepts %j (%s)', (password) => {
  expect(passwordErrors(password, password)).toEqual({})
})

test('reports a confirm password that does not match', () => {
  expect(passwordErrors('SecurePass1', 'SecurePass2')).toEqual({
    confirm: "Passwords don't match.",
  })
})

test('reports both problems at once', () => {
  expect(passwordErrors('short', 'shorter')).toEqual({
    password: 'Use at least 8 characters.',
    confirm: "Passwords don't match.",
  })
})
