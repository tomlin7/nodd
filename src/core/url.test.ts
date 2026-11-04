import { describe, expect, it } from 'vitest'
import { buildUrlWithParams, createId, parseUrlParams } from './url'

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
    expect(id1.startsWith('test_')).toBe(true)
  })
})
