import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getTradlyResponseError,
  normalizeTradlyResponse,
} from '../state/api-response.ts'
import { parseSignUpResponse } from '../state/auth/signup-response.ts'
import { getDeviceUUID } from '../config/uuid.ts'

test('network errors become a safe Tradly service error', () => {
  assert.equal(
    getTradlyResponseError(new TypeError('network failure'), 'Request failed'),
    'Unable to contact the Tradly service. Check your connection and try again.',
  )
})

test('missing and malformed SDK responses are rejected', () => {
  assert.match(getTradlyResponseError(undefined, 'Request failed'), /invalid response/i)
  assert.match(
    getTradlyResponseError({ status: true, data: {} }, 'Request failed', ['user']),
    /incomplete data/i,
  )
})

test('SDK error messages are preserved', () => {
  assert.equal(
    getTradlyResponseError({ error: { message: 'Invalid credentials' } }, 'Request failed'),
    'Invalid credentials',
  )
})

test('valid envelopes pass validation when their required data is present', () => {
  const response = { status: true, data: { user: { id: 'u1' } } }
  assert.equal(getTradlyResponseError(response, 'Request failed', ['user']), undefined)
  assert.equal(normalizeTradlyResponse(response, 'Request failed', ['user']), response)
})

test('signup rejects the SDK error value that previously caused a data access crash', () => {
  assert.deepEqual(
    parseSignUpResponse(new TypeError("Cannot read properties of undefined (reading 'data')")),
    { error: 'Unable to contact the Tradly service. Check your connection and try again.' },
  )
})

test('guest UUID generation survives blocked browser storage', () => {
  const previousWindow = globalThis.window
  const previousStorage = globalThis.localStorage
  globalThis.window = {}
  globalThis.localStorage = {
    getItem() { throw new Error('Storage blocked') },
    setItem() { throw new Error('Storage blocked') },
  }

  try {
    const first = getDeviceUUID()
    assert.match(first, /^[\da-f-]{36}$/i)
    assert.equal(getDeviceUUID(), first)
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})
