import { describe, expect, it } from 'vitest'
import type { Collection, HistoryEntry } from '../core/types'

describe('Sidebar Logic & Filtering', () => {
  const sampleCollections: Collection[] = [
    {
      id: 'c1',
      name: 'User Service API',
      createdAt: 1000,
      folders: [
        {
          id: 'f1',
          name: 'Authentication',
          collectionId: 'c1',
          requests: [
            {
              id: 'r1',
              name: 'Login User',
              method: 'POST',
              url: 'https://api.test/auth/login',
              params: [],
              headers: [],
              body: { type: 'none' },
              auth: { type: 'none' },
            },
          ],
        },
      ],
      requests: [
        {
          id: 'r2',
          name: 'Health Check',
          method: 'GET',
          url: 'https://api.test/health',
          params: [],
          headers: [],
          body: { type: 'none' },
          auth: { type: 'none' },
        },
      ],
    },
    {
      id: 'c2',
      name: 'Billing API',
      createdAt: 2000,
      folders: [],
      requests: [
        {
          id: 'r3',
          name: 'Get Invoices',
          method: 'GET',
          url: 'https://api.test/invoices',
          params: [],
          headers: [],
          body: { type: 'none' },
          auth: { type: 'none' },
        },
      ],
    },
  ]

  const sampleHistory: HistoryEntry[] = [
    {
      id: 'h1',
      request: sampleCollections[0].requests[0],
      timestamp: 5000,
    },
    {
      id: 'h2',
      request: sampleCollections[1].requests[0],
      timestamp: 6000,
    },
  ]

  it('filters collections and nested folders by request name', () => {
    const query = 'login'
    const matched = sampleCollections
      .map((col) => {
        const direct = col.requests.filter((r) => r.name.toLowerCase().includes(query))
        const folders = col.folders.map((f) => ({
          ...f,
          requests: f.requests.filter((r) => r.name.toLowerCase().includes(query)),
        })).filter((f) => f.requests.length > 0)
        return { ...col, requests: direct, folders }
      })
      .filter((col) => col.requests.length > 0 || col.folders.length > 0)

    expect(matched.length).toBe(1)
    expect(matched[0].name).toBe('User Service API')
    expect(matched[0].folders[0].requests[0].name).toBe('Login User')
  })

  it('filters history by URL query string', () => {
    const query = 'health'
    const matched = sampleHistory.filter((h) => h.request.url.includes(query))
    expect(matched.length).toBe(1)
    expect(matched[0].request.url).toBe('https://api.test/health')
  })
})
