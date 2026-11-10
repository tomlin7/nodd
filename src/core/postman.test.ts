import { describe, expect, test } from 'bun:test'
import { exportPostmanCollection, importPostmanCollection } from './postman'
import type { Collection } from './types'

const samplePostmanV2Json = JSON.stringify({
  info: {
    name: 'GitHub API Sample',
    description: 'Sample collection for testing import',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    {
      name: 'Get User Profile',
      request: {
        method: 'GET',
        header: [{ key: 'Accept', value: 'application/vnd.github.v3+json' }],
        url: {
          raw: 'https://api.github.com/users/octocat?extra=1',
          query: [{ key: 'extra', value: '1' }],
        },
        auth: {
          type: 'bearer',
          bearer: [{ key: 'token', value: 'ghp_sample123' }],
        },
      },
    },
    {
      name: 'Repositories',
      item: [
        {
          name: 'Create Repo',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: 'https://api.github.com/user/repos',
            body: {
              mode: 'raw',
              raw: '{"name": "hello-world", "private": false}',
            },
          },
        },
      ],
    },
  ],
})

describe('Postman v2.1 Import & Export Engine', () => {
  test('imports collection with root requests and nested folders', () => {
    const col = importPostmanCollection(samplePostmanV2Json)

    expect(col.name).toBe('GitHub API Sample')
    expect(col.description).toBe('Sample collection for testing import')
    expect(col.requests.length).toBe(1)
    expect(col.requests[0].name).toBe('Get User Profile')
    expect(col.requests[0].method).toBe('GET')
    expect(col.requests[0].url).toBe('https://api.github.com/users/octocat')
    expect(col.requests[0].auth.type).toBe('bearer')
    expect(col.requests[0].auth.bearerToken).toBe('ghp_sample123')

    // Folder checks
    expect(col.folders.length).toBe(1)
    expect(col.folders[0].name).toBe('Repositories')
    expect(col.folders[0].requests.length).toBe(1)
    expect(col.folders[0].requests[0].name).toBe('Create Repo')
    expect(col.folders[0].requests[0].method).toBe('POST')
    expect(col.folders[0].requests[0].body.type).toBe('json')
  })

  test('exports collection to valid Postman v2.1 schema', () => {
    const sampleCol: Collection = {
      id: 'col-1',
      name: 'Nodd Export Test',
      createdAt: Date.now(),
      folders: [
        {
          id: 'folder-1',
          name: 'Auth',
          collectionId: 'col-1',
          requests: [
            {
              id: 'req-1',
              name: 'Login',
              method: 'POST',
              url: 'https://api.example.com/login',
              params: [],
              headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
              body: { type: 'json', rawText: '{"user":"test"}' },
              auth: { type: 'none' },
            },
          ],
        },
      ],
      requests: [
        {
          id: 'req-root',
          name: 'Health Check',
          method: 'GET',
          url: 'https://api.example.com/health',
          params: [{ id: 'p1', key: 'verbose', value: 'true', enabled: true }],
          headers: [],
          body: { type: 'none' },
          auth: { type: 'none' },
        },
      ],
    }

    const exportedJson = exportPostmanCollection(sampleCol)
    const parsed = JSON.parse(exportedJson)

    expect(parsed.info.name).toBe('Nodd Export Test')
    expect(parsed.info.schema).toContain('v2.1.0')
    expect(parsed.item.length).toBe(2) // 1 root request + 1 folder
    expect(parsed.item[0].name).toBe('Health Check')
    expect(parsed.item[1].name).toBe('Auth')
    expect(parsed.item[1].item.length).toBe(1)
  })

  test('imports and exports path variables in Postman url.variable schema', () => {
    const jsonWithVars = JSON.stringify({
      info: { name: 'Path Var Collection' },
      item: [
        {
          name: 'Get User By ID',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users/:userId/orders/{orderId}',
              variable: [
                { key: 'userId', value: '42', description: 'User ID' },
                { key: 'orderId', value: '1001', description: 'Order ID' },
              ],
            },
          },
        },
      ],
    })

    const col = importPostmanCollection(jsonWithVars)
    expect(col.requests.length).toBe(1)
    const req = col.requests[0]
    expect(req.pathVariables?.length).toBe(2)
    expect(req.pathVariables?.[0].key).toBe('userId')
    expect(req.pathVariables?.[0].value).toBe('42')
    expect(req.pathVariables?.[1].key).toBe('orderId')
    expect(req.pathVariables?.[1].value).toBe('1001')

    const exported = exportPostmanCollection(col)
    const parsed = JSON.parse(exported)
    expect(parsed.item[0].request.url.variable).toBeDefined()
    expect(parsed.item[0].request.url.variable.length).toBe(2)
    expect(parsed.item[0].request.url.variable[0].key).toBe('userId')
    expect(parsed.item[0].request.url.variable[0].value).toBe('42')
  })

  test('throws descriptive error on malformed JSON', () => {
    expect(() => importPostmanCollection('invalid json text')).toThrow(
      'Invalid JSON format: Could not parse Postman collection.'
    )
  })

  test('imports and exports multipart formdata body in Postman v2.1 schema', () => {
    const postmanJson = JSON.stringify({
      info: { name: 'Formdata Collection', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
      item: [
        {
          name: 'Upload File',
          request: {
            method: 'POST',
            url: 'https://api.example.com/upload',
            body: {
              mode: 'formdata',
              formdata: [
                { key: 'description', value: 'My Document', type: 'text' },
                { key: 'attachment', src: '/documents/doc.pdf', type: 'file' },
              ],
            },
          },
        },
      ],
    })

    const col = importPostmanCollection(postmanJson)
    expect(col.requests.length).toBe(1)
    const req = col.requests[0]
    expect(req.body.type).toBe('form-data')
    expect(req.body.formDataParams?.length).toBe(2)
    expect(req.body.formDataParams?.[0]).toMatchObject({ key: 'description', value: 'My Document', type: 'text', enabled: true })
    expect(req.body.formDataParams?.[1]).toMatchObject({ key: 'attachment', value: '/documents/doc.pdf', type: 'file', enabled: true })

    const exported = JSON.parse(exportPostmanCollection(col))
    const itemReq = exported.item[0].request
    expect(itemReq.body.mode).toBe('formdata')
    expect(itemReq.body.formdata).toHaveLength(2)
    expect(itemReq.body.formdata[0]).toEqual({ key: 'description', value: 'My Document', type: 'text', disabled: false })
    expect(itemReq.body.formdata[1]).toEqual({ key: 'attachment', src: '/documents/doc.pdf', type: 'file', disabled: false })
  })
})