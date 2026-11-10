import { describe, expect, it } from 'vitest'
import {
  buildUrlWithParams,
  createId,
  extractPathVariables,
  interpolatePathVariables,
  parseUrlParams,
  syncPathVariables,
} from './url'

describe('URL Parser and Builder', () => {
  it('extracts query parameters correctly', () => {
    const url = 'https://api.example.com/v1/users?page=2&limit=50&active=true'
    const { baseUrl, params } = parseUrlParams(url)

    expect(baseUrl).toBe('https://api.example.com/v1/users')
    expect(params.length).toBe(3)
    expect(params[0].key).toBe('page')
    expect(params[0].value).toBe('2')
    expect(params[1].key).toBe('limit')
    expect(params[1].value).toBe('50')
    expect(params[2].key).toBe('active')
    expect(params[2].value).toBe('true')
  })

  it('handles URLs without query parameters', () => {
    const url = 'https://api.example.com/v1/users'
    const { baseUrl, params } = parseUrlParams(url)

    expect(baseUrl).toBe('https://api.example.com/v1/users')
    expect(params.length).toBe(0)
  })

  it('handles URL decoding in params', () => {
    const url = 'https://example.com/search?query=hello%20world&tag=%23cool'
    const { params } = parseUrlParams(url)

    expect(params[0].key).toBe('query')
    expect(params[0].value).toBe('hello world')
    expect(params[1].key).toBe('tag')
    expect(params[1].value).toBe('#cool')
  })

  it('builds URL from base URL and parameters', () => {
    const baseUrl = 'https://api.example.com/items'
    const params = [
      { id: '1', key: 'sort', value: 'desc', enabled: true },
      { id: '2', key: 'archived', value: 'false', enabled: false }, // disabled
      { id: '3', key: 'q', value: 'react & bun', enabled: true },
    ]

    const result = buildUrlWithParams(baseUrl, params)
    expect(result).toBe('https://api.example.com/items?sort=desc&q=react%20%26%20bun')
  })

  it('preserves hash fragments', () => {
    const baseUrl = 'https://example.com/doc#section-2'
    const params = [{ id: '1', key: 'v', value: '1', enabled: true }]
    const result = buildUrlWithParams(baseUrl, params)

    expect(result).toBe('https://example.com/doc?v=1#section-2')
  })

  it('generates unique IDs with createId', () => {
    const id1 = createId('test')
    const id2 = createId('test')
    expect(id1).not.toBe(id2)
  })
})

describe('Path Variables Extraction and Interpolation', () => {
  it('extracts colon-style path variables from URL path', () => {
    const url = 'https://api.example.com/users/:userId/posts/:postId'
    const vars = extractPathVariables(url)
    expect(vars).toEqual(['userId', 'postId'])
  })

  it('extracts curly-brace style path variables from URL path', () => {
    const url = 'https://api.example.com/organizations/{orgId}/teams/{teamId}'
    const vars = extractPathVariables(url)
    expect(vars).toEqual(['orgId', 'teamId'])
  })

  it('extracts mixed colon and curly-brace path variables', () => {
    const url = 'https://api.example.com/v1/:tenant/repos/{repoName}'
    const vars = extractPathVariables(url)
    expect(vars).toEqual(['tenant', 'repoName'])
  })

  it('ignores protocol port and double-bracket environment variables', () => {
    const url = 'http://localhost:8080/{{version}}/users/:userId'
    const vars = extractPathVariables(url)
    expect(vars).toEqual(['userId'])
  })

  it('ignores query parameters and hashes when extracting path variables', () => {
    const url = 'https://api.example.com/items/:itemId?query=:notAVar#hash:tag'
    const vars = extractPathVariables(url)
    expect(vars).toEqual(['itemId'])
  })

  it('deduplicates duplicate path variable names', () => {
    const url = 'https://api.example.com/:id/revisions/:id'
    const vars = extractPathVariables(url)
    expect(vars).toEqual(['id'])
  })

  it('syncPathVariables preserves existing values and adds new variables', () => {
    const existing = [
      { id: 'pv1', key: 'userId', value: '42', enabled: true, description: 'User identifier' },
    ]
    const updatedUrl = 'https://api.example.com/users/:userId/orders/:orderId'
    const synced = syncPathVariables(updatedUrl, existing)

    expect(synced.length).toBe(2)
    expect(synced[0].key).toBe('userId')
    expect(synced[0].value).toBe('42')
    expect(synced[0].description).toBe('User identifier')
    expect(synced[1].key).toBe('orderId')
    expect(synced[1].value).toBe('')
    expect(synced[1].enabled).toBe(true)
  })

  it('syncPathVariables drops variables no longer present in URL', () => {
    const existing = [
      { id: 'pv1', key: 'userId', value: '42', enabled: true },
      { id: 'pv2', key: 'postId', value: '99', enabled: true },
    ]
    const updatedUrl = 'https://api.example.com/users/:userId'
    const synced = syncPathVariables(updatedUrl, existing)

    expect(synced.length).toBe(1)
    expect(synced[0].key).toBe('userId')
    expect(synced[0].value).toBe('42')
  })

  it('interpolates path variables into URL with URI encoding', () => {
    const url = 'https://api.example.com/users/:userId/tags/{tag}'
    const pathVars = [
      { id: '1', key: 'userId', value: '123', enabled: true },
      { id: '2', key: 'tag', value: 'web & api', enabled: true },
    ]
    const result = interpolatePathVariables(url, pathVars)
    expect(result).toBe('https://api.example.com/users/123/tags/web%20%26%20api')
  })

  it('leaves disabled or empty path variables intact in URL', () => {
    const url = 'https://api.example.com/users/:userId/posts/:postId'
    const pathVars = [
      { id: '1', key: 'userId', value: '42', enabled: true },
      { id: '2', key: 'postId', value: '', enabled: true }, // empty
    ]
    const result = interpolatePathVariables(url, pathVars)
    expect(result).toBe('https://api.example.com/users/42/posts/:postId')
  })

  it('safely handles URLs without path variables', () => {
    const url = 'https://api.example.com/health'
    const result = interpolatePathVariables(url, [])
    expect(result).toBe('https://api.example.com/health')
  })
})
