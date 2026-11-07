import { describe, expect, it } from 'vitest'
import { formatBytes, getStatusColor } from './ResponseViewer'
import { C } from '../theme'
import { createAssertion, runAssertions } from '../core/tests'
import type { HttpResponse } from '../core/types'

describe('ResponseViewer Logic and Helpers', () => {
  it('formats byte sizes cleanly', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1048576 * 2.5)).toBe('2.50 MB')
  })

  it('determines status colors according to HTTP code ranges', () => {
    expect(getStatusColor(200)).toBe(C.success)
    expect(getStatusColor(204)).toBe(C.success)
    expect(getStatusColor(301)).toBe(C.info)
    expect(getStatusColor(400)).toBe(C.warning)
    expect(getStatusColor(404)).toBe(C.warning)
    expect(getStatusColor(500)).toBe(C.error)
    expect(getStatusColor(0)).toBe(C.error)
  })

  it('formats JSON string reliably', () => {
    const raw = '{"status":"ok","count":42}'
    const parsed = JSON.parse(raw)
    const formatted = JSON.stringify(parsed, null, 2)
    expect(formatted).toContain('  "status": "ok"')
    expect(formatted).toContain('  "count": 42')
  })

  it('evaluates assertions and calculates pass rates', () => {
    const res: HttpResponse = {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '{"message": "pong"}',
      sizeBytes: 20,
      timeMs: 80,
      timestamp: Date.now(),
    }
    const assertions = [
      createAssertion('status_code', '200'),
      createAssertion('response_time', '100'),
    ]
    const results = runAssertions(assertions, res)
    expect(results.length).toBe(2)
    expect(results.every((r) => r.passed)).toBe(true)
  })
})
