import { describe, expect, test } from 'bun:test'
import { createAssertion, runAssertions } from './tests'
import type { HttpResponse, RequestAssertion } from './types'

const mockResponse: HttpResponse = {
  status: 200,
  statusText: 'OK',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ id: 101, username: 'johndoe', active: true }),
  sizeBytes: 128,
  timeMs: 145,
  timestamp: Date.now(),
}

describe('Response Assertions Engine', () => {
  test('evaluates status_code assertion correctly', () => {
    const a1 = createAssertion('status_code', '200')
    const a2 = createAssertion('status_code', '404')

    const res = runAssertions([a1, a2], mockResponse)
    expect(res.length).toBe(2)
    expect(res[0].passed).toBe(true)
    expect(res[1].passed).toBe(false)
  })

  test('evaluates response_time assertion', () => {
    const aFast = createAssertion('response_time', '500')
    const aTooFast = createAssertion('response_time', '50')

    const res = runAssertions([aFast, aTooFast], mockResponse)
    expect(res[0].passed).toBe(true)
    expect(res[1].passed).toBe(false)
  })

  test('evaluates body_contains assertion', () => {
    const aContains = createAssertion('body_contains', 'johndoe')
    const aMissing = createAssertion('body_contains', 'nonexistent_token')

    const res = runAssertions([aContains, aMissing], mockResponse)
    expect(res[0].passed).toBe(true)
    expect(res[1].passed).toBe(false)
  })

  test('evaluates json_path_exists assertion', () => {
    const aHasKey = createAssertion('json_path_exists', 'username')
    const aMissingKey = createAssertion('json_path_exists', 'secretKey')

    const res = runAssertions([aHasKey, aMissingKey], mockResponse)
    expect(res[0].passed).toBe(true)
    expect(res[1].passed).toBe(false)
  })

  test('skips disabled assertions', () => {
    const aDisabled: RequestAssertion = {
      ...createAssertion('status_code', '200'),
      enabled: false,
    }

    const res = runAssertions([aDisabled], mockResponse)
    expect(res.length).toBe(0)
  })
})
