import { describe, expect, it } from 'vitest'
import { interpolatePairs, interpolateRequest, interpolateString } from './variables'
import type { Environment, HttpRequest } from './types'

describe('Variable Interpolation', () => {
  it('interpolates single and multiple variables in string', () => {
    const vars = { host: 'api.io', version: 'v2', id: '99' }
    const input = 'https://{{host}}/{{version}}/users/{{id}}'
    expect(interpolateString(input, vars)).toBe('https://api.io/v2/users/99')
  })

  it('leaves missing variables intact', () => {
    const vars = { host: 'api.io' }
    const input = 'https://{{host}}/{{missing}}'
    expect(interpolateString(input, vars)).toBe('https://api.io/{{missing}}')
  })

  it('interpolates key value pairs', () => {
    const vars = { headerKey: 'X-Custom-ID', headerVal: 'secret-123' }
    const pairs = [
      { id: '1', key: '{{headerKey}}', value: '{{headerVal}}', enabled: true },
    ]
    const result = interpolatePairs(pairs, vars)
    expect(result[0].key).toBe('X-Custom-ID')
    expect(result[0].value).toBe('secret-123')
  })

  it('deeply interpolates an HttpRequest', () => {
    const env: Environment = {
      id: 'env_1',
      name: 'Test Env',
      variables: {
        baseUrl: 'https://test.dev',
        token: 'xyz-token',
        tag: 'beta',
      },
    }

    const req: HttpRequest = {
      id: 'req_1',
      name: 'Test',
      method: 'POST',
      url: '{{baseUrl}}/items',
      params: [{ id: 'p1', key: 'tag', value: '{{tag}}', enabled: true }],
      headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
      body: {
        type: 'json',
        rawText: '{"auth": "{{token}}"}',
      },
      auth: {
        type: 'bearer',
        bearerToken: '{{token}}',
      },
    }

    const res = interpolateRequest(req, env)
    expect(res.url).toBe('https://test.dev/items')
    expect(res.params[0].value).toBe('beta')
    expect(res.body.rawText).toBe('{"auth": "xyz-token"}')
    expect(res.auth.bearerToken).toBe('xyz-token')
  })
})
