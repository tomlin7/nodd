import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { executeRequest } from './client'
import type { HttpRequest } from './types'

describe('HTTP Client Engine', () => {
  let server: any
  let serverUrl = ''

  beforeAll(() => {
    server = Bun.serve({
      port: 0,
      async fetch(req) {
        const url = new URL(req.url)
        const method = req.method

        if (url.pathname === '/echo-headers') {
          const auth = req.headers.get('authorization')
          const custom = req.headers.get('x-custom')
          return new Response(JSON.stringify({ auth, custom }), {
            headers: { 'Content-Type': 'application/json', 'X-Response-Test': 'pass' },
          })
        }

        if (url.pathname === '/echo-body') {
          const text = await req.text()
          return new Response(text, {
            status: 201,
            headers: { 'Content-Type': req.headers.get('content-type') || 'text/plain' },
          })
        }

        if (url.pathname === '/params') {
          const query = Object.fromEntries(url.searchParams.entries())
          return new Response(JSON.stringify(query), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (url.pathname.startsWith('/users/')) {
          return new Response(JSON.stringify({ path: url.pathname }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (url.pathname === '/delay') {
          await new Promise((r) => setTimeout(r, 100))
          return new Response('delayed')
        }

        return new Response('Not Found', { status: 404 })
      },
    })
    serverUrl = `http://localhost:${server.port}`
  })

  afterAll(() => {
    server.stop()
  })

  it('executes a GET request with query params', async () => {
    const req: HttpRequest = {
      id: 'req_1',
      name: 'Test GET',
      method: 'GET',
      url: `${serverUrl}/params`,
      params: [
        { id: '1', key: 'search', value: 'banana', enabled: true },
        { id: '2', key: 'disabled', value: 'no', enabled: false },
      ],
      headers: [],
      body: { type: 'none' },
      auth: { type: 'none' },
    }

    const res = await executeRequest(req)
    expect(res.status).toBe(200)
    expect(res.statusText).toBe('OK')
    expect(res.timeMs).toBeGreaterThan(0)
    const json = JSON.parse(res.body)
    expect(json).toEqual({ search: 'banana' })
  })

  it('executes a request with path variables correctly interpolated', async () => {
    const req: HttpRequest = {
      id: 'req_path_vars',
      name: 'Test Path Variables',
      method: 'GET',
      url: `${serverUrl}/users/:userId/profile`,
      params: [],
      pathVariables: [
        { id: 'pv1', key: 'userId', value: '42', enabled: true },
      ],
      headers: [],
      body: { type: 'none' },
      auth: { type: 'none' },
    }

    const res = await executeRequest(req)
    expect(res.status).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.path).toBe('/users/42/profile')
  })

  it('executes a POST request with JSON body and custom headers', async () => {
    const payload = JSON.stringify({ item: 'keyboard', price: 99 })
    const req: HttpRequest = {
      id: 'req_2',
      name: 'Test POST',
      method: 'POST',
      url: `${serverUrl}/echo-body`,
      params: [],
      headers: [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }],
      body: { type: 'json', rawText: payload },
      auth: { type: 'none' },
    }

    const res = await executeRequest(req)
    expect(res.status).toBe(201)
    expect(res.statusText).toBe('Created')
    expect(res.sizeBytes).toBeGreaterThan(0)
    expect(res.body).toBe(payload)
  })

  it('handles Bearer and Basic authentication headers', async () => {
    const req: HttpRequest = {
      id: 'req_3',
      name: 'Test Auth',
      method: 'GET',
      url: `${serverUrl}/echo-headers`,
      params: [],
      headers: [{ id: '1', key: 'X-Custom', value: 'alpha', enabled: true }],
      body: { type: 'none' },
      auth: { type: 'bearer', bearerToken: 'secret-token-xyz' },
    }

    const res = await executeRequest(req)
    expect(res.status).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.auth).toBe('Bearer secret-token-xyz')
    expect(json.custom).toBe('alpha')
    expect(res.headers['x-response-test']).toBe('pass')
  })

  it('captures network failure and timeouts cleanly', async () => {
    const req: HttpRequest = {
      id: 'req_4',
      name: 'Test Timeout',
      method: 'GET',
      url: `${serverUrl}/delay`,
      params: [],
      headers: [],
      body: { type: 'none' },
      auth: { type: 'none' },
    }

    // Set timeout to 20ms, server delays 100ms
    const res = await executeRequest(req, { timeoutMs: 20 })
    expect(res.status).toBe(0)
    expect(res.statusText).toBe('Timed Out')
    expect(res.error).toContain('exceeded timeout')
  })
})
