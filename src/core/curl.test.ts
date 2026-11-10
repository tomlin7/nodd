import { describe, expect, test } from 'bun:test'
import {
  generateCurlSnippet,
  generateFetchSnippet,
  generatePythonSnippet,
  parseCurlCommand,
  tokenizeCurl,
} from './curl'
import type { HttpRequest } from './types'

describe('cURL Parser & Snippet Generator', () => {
  test('tokenizes curl arguments with single and double quotes', () => {
    const cmd = `curl -X POST "https://api.example.com/users" -H 'Authorization: Bearer xyz' -d '{"name": "Alice"}'`
    const tokens = tokenizeCurl(cmd)
    expect(tokens[0]).toBe('curl')
    expect(tokens[1]).toBe('-X')
    expect(tokens[2]).toBe('POST')
    expect(tokens[3]).toBe('https://api.example.com/users')
    expect(tokens[4]).toBe('-H')
    expect(tokens[5]).toBe('Authorization: Bearer xyz')
    expect(tokens[6]).toBe('-d')
    expect(tokens[7]).toBe('{"name": "Alice"}')
  })

  test('parses standard curl command into HttpRequest object', () => {
    const cmd = `curl -X POST "https://api.example.com/items?limit=10" -H "Content-Type: application/json" -H "X-Trace-Id: 999" -d '{"title": "Widget"}'`
    const parsed = parseCurlCommand(cmd)

    expect(parsed).not.toBeNull()
    expect(parsed?.method).toBe('POST')
    expect(parsed?.url).toBe('https://api.example.com/items')
    expect(parsed?.params?.length).toBe(1)
    expect(parsed?.params?.[0].key).toBe('limit')
    expect(parsed?.params?.[0].value).toBe('10')
    expect(parsed?.headers?.length).toBe(2)
    expect(parsed?.body?.type).toBe('json')
    expect(parsed?.body?.rawText).toBe('{"title": "Widget"}')
  })

  test('parses curl with bearer auth header cleanly into authConfig', () => {
    const cmd = `curl -X GET "https://api.example.com/profile" -H "Authorization: Bearer secret-token-123"`
    const parsed = parseCurlCommand(cmd)

    expect(parsed).not.toBeNull()
    expect(parsed?.method).toBe('GET')
    expect(parsed?.auth?.type).toBe('bearer')
    expect(parsed?.auth?.bearerToken).toBe('secret-token-123')
  })

  test('generates valid curl snippet from HttpRequest', () => {
    const req: HttpRequest = {
      id: 'test',
      name: 'Test',
      method: 'POST',
      url: 'https://api.example.com/posts',
      params: [{ id: 'p1', key: 'sort', value: 'desc', enabled: true }],
      headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
      body: { type: 'json', rawText: '{"foo":"bar"}' },
      auth: { type: 'none' },
    }

    const snippet = generateCurlSnippet(req)
    expect(snippet).toContain('curl -X POST "https://api.example.com/posts?sort=desc"')
    expect(snippet).toContain('-H "Accept: application/json"')
    expect(snippet).toContain(`-d '{"foo":"bar"}'`)
  })

  test('generates valid JavaScript fetch snippet', () => {
    const req: HttpRequest = {
      id: 'test',
      name: 'Test',
      method: 'GET',
      url: 'https://api.example.com/data',
      params: [],
      headers: [{ id: 'h1', key: 'X-Key', value: '123', enabled: true }],
      body: { type: 'none' },
      auth: { type: 'none' },
    }

    const snippet = generateFetchSnippet(req)
    expect(snippet).toContain('fetch("https://api.example.com/data"')
    expect(snippet).toContain('"method": "GET"')
    expect(snippet).toContain('"X-Key": "123"')
  })

  test('generates valid Python requests snippet', () => {
    const req: HttpRequest = {
      id: 'test',
      name: 'Test',
      method: 'GET',
      url: 'https://api.example.com/data',
      params: [{ id: 'p1', key: 'page', value: '2', enabled: true }],
      headers: [],
      body: { type: 'none' },
      auth: { type: 'none' },
    }

    const snippet = generatePythonSnippet(req)
    expect(snippet).toContain('import requests')
    expect(snippet).toContain('url = "https://api.example.com/data"')
    expect(snippet).toContain('params =')
    expect(snippet).toContain('requests.get(')
  })

  test('interpolates path variables across curl, fetch, and python snippets', () => {
    const req: HttpRequest = {
      id: 'test',
      name: 'Test Path Vars',
      method: 'GET',
      url: 'https://api.example.com/users/:userId/posts/{postId}',
      params: [{ id: 'p1', key: 'include', value: 'comments', enabled: true }],
      pathVariables: [
        { id: 'pv1', key: 'userId', value: '42', enabled: true },
        { id: 'pv2', key: 'postId', value: '99', enabled: true },
      ],
      headers: [],
      body: { type: 'none' },
      auth: { type: 'none' },
    }

    const curlSnippet = generateCurlSnippet(req)
    expect(curlSnippet).toContain('https://api.example.com/users/42/posts/99?include=comments')

    const fetchSnippet = generateFetchSnippet(req)
    expect(fetchSnippet).toContain('fetch("https://api.example.com/users/42/posts/99?include=comments"')

    const pythonSnippet = generatePythonSnippet(req)
    expect(pythonSnippet).toContain('url = "https://api.example.com/users/42/posts/99"')
  })

  test('parses curl command with multipart -F flags into formDataParams', () => {
    const cmd = 'curl -X POST https://api.example.com/upload -F "title=My Photo" -F "image=@/tmp/photo.jpg"'
    const req = parseCurlCommand(cmd)
    expect(req).not.toBeNull()
    if (!req || !req.body) return
    expect(req.method).toBe('POST')
    expect(req.body.type).toBe('form-data')
    expect(req.body.formDataParams).toHaveLength(2)
    expect(req.body.formDataParams?.[0]).toMatchObject({ key: 'title', value: 'My Photo', type: 'text', enabled: true })
    expect(req.body.formDataParams?.[1]).toMatchObject({ key: 'image', value: '/tmp/photo.jpg', type: 'file', enabled: true })
  })

  test('generates curl, fetch, and python snippets for multipart form-data', () => {
    const req: HttpRequest = {
      id: 'test_fd',
      name: 'Upload',
      method: 'POST',
      url: 'https://api.example.com/upload',
      params: [],
      headers: [],
      body: {
        type: 'form-data',
        formDataParams: [
          { id: '1', key: 'username', value: 'alice', type: 'text', enabled: true },
          { id: '2', key: 'avatar', value: '/tmp/avatar.png', type: 'file', enabled: true },
        ],
      },
      auth: { type: 'none' },
    }

    const curl = generateCurlSnippet(req)
    expect(curl).toContain('-F "username=alice"')
    expect(curl).toContain('-F "avatar=@/tmp/avatar.png"')

    const fetchSnippet = generateFetchSnippet(req)
    expect(fetchSnippet).toContain('const formData = new FormData()')
    expect(fetchSnippet).toContain('formData.append("username", "alice")')

    const pythonSnippet = generatePythonSnippet(req)
    expect(pythonSnippet).toContain('data = {')
    expect(pythonSnippet).toContain('"username": "alice"')
    expect(pythonSnippet).toContain('files = {')
    expect(pythonSnippet).toContain('"avatar": open("/tmp/avatar.png", "rb")')
  })
})