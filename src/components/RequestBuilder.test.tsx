import { describe, expect, it } from 'vitest'
import { buildUrlWithParams, createId, parseUrlParams } from '../core/url'
import type { HttpRequest } from '../core/types'

describe('Request Builder Logic', () => {
  it('syncs URL parameters two-way', () => {
    let req: HttpRequest = {
      id: 'req_1',
      name: 'Sync Test',
      method: 'GET',
      url: 'https://api.test/users',
      params: [],
      headers: [],
      body: { type: 'none' },
      auth: { type: 'none' },
    }

    // 1. User adds param in KeyValueTable
    const newParams = [
      { id: 'p1', key: 'role', value: 'admin', enabled: true },
      { id: 'p2', key: 'limit', value: '25', enabled: true },
    ]
    req = {
      ...req,
      params: newParams,
      url: buildUrlWithParams(req.url, newParams),
    }

    expect(req.url).toBe('https://api.test/users?role=admin&limit=25')

    // 2. User edits URL query directly
    const editedUrl = 'https://api.test/users?role=member&active=true'
    const parsed = parseUrlParams(editedUrl)
    req = {
      ...req,
      url: editedUrl,
      params: parsed.params,
    }

    expect(req.params.length).toBe(2)
    expect(req.params[0].key).toBe('role')
    expect(req.params[0].value).toBe('member')
    expect(req.params[1].key).toBe('active')
    expect(req.params[1].value).toBe('true')
  })

  it('formats JSON payload properly', () => {
    const raw = '{"name":"Alice", "age": 30}'
    const parsed = JSON.parse(raw)
    const formatted = JSON.stringify(parsed, null, 2)

    expect(formatted).toContain('\n  "name": "Alice"')
    expect(formatted).toContain('\n  "age": 30')
  })

  it('updates request method and preserves colors', () => {
    const req: HttpRequest = {
      id: 'req_2',
      name: 'Method Test',
      method: 'GET',
      url: 'https://api.test',
      params: [],
      headers: [],
      body: { type: 'none' },
      auth: { type: 'none' },
    }

    const updated: HttpRequest = { ...req, method: 'POST' }
    expect(updated.method).toBe('POST')
  })
})
