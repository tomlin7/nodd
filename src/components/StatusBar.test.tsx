import { describe, expect, it } from 'vitest'
import type { Environment, HttpResponse } from '../core/types'
import { formatBytes } from './ResponseViewer'

describe('StatusBar Component Helpers & Logic', () => {
  const sampleEnv: Environment = {
    id: 'env_1',
    name: 'Staging Server',
    variables: { baseUrl: 'https://staging.api.com' },
  }

  const sampleResponse: HttpResponse = {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    body: '{"success":true}',
    sizeBytes: 1536,
    timeMs: 42,
    timestamp: Date.now(),
  }

  it('formats byte sizes cleanly for status bar', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(2097152)).toBe('2.00 MB')
  })

  it('determines status code color thresholds correctly', () => {
    const getStatusColorType = (status?: number) => {
      if (!status) return 'default'
      if (status >= 200 && status < 300) return 'success'
      if (status >= 300 && status < 400) return 'info'
      if (status >= 400 && status < 500) return 'warning'
      return 'error'
    }

    expect(getStatusColorType(200)).toBe('success')
    expect(getStatusColorType(204)).toBe('success')
    expect(getStatusColorType(301)).toBe('info')
    expect(getStatusColorType(404)).toBe('warning')
    expect(getStatusColorType(500)).toBe('error')
    expect(getStatusColorType(undefined)).toBe('default')
  })

  it('accurately reports active environment name vs fallback', () => {
    const getEnvDisplay = (env: Environment | null | undefined) => {
      return env ? env.name : 'No Environment'
    }

    expect(getEnvDisplay(sampleEnv)).toBe('Staging Server')
    expect(getEnvDisplay(null)).toBe('No Environment')
    expect(getEnvDisplay(undefined)).toBe('No Environment')
  })
})
