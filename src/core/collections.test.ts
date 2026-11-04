import { describe, expect, it } from 'vitest'
import { createDefaultCollection, loadCollections, saveCollections } from './collections'
import { loadEnvironments, saveEnvironments, createDefaultEnvironments } from './environments'
import { clearHistory, loadHistory, saveHistoryEntry } from './history'

describe('Collections, Environments, and History Persistence', () => {
  it('creates and validates default collections structure', () => {
    const col = createDefaultCollection()
    expect(col.name).toBe('Quickstart API')
    expect(col.folders.length).toBeGreaterThan(0)
    expect(col.folders[0].requests.length).toBeGreaterThan(0)
    expect(col.requests.length).toBeGreaterThan(0)
  })

  it('loads and saves collections', () => {
    const collections = [createDefaultCollection()]
    collections[0].name = 'Modified Collection'
    saveCollections(collections)

    const loaded = loadCollections()
    expect(loaded.length).toBeGreaterThan(0)
    expect(loaded[0].name).toBe('Modified Collection')
  })

  it('loads and saves environments', () => {
    const envs = createDefaultEnvironments()
    expect(envs.length).toBe(3)
    expect(envs[0].name).toBe('Development')
    expect(envs[0].variables.baseUrl).toBeDefined()

    saveEnvironments(envs)
    const loaded = loadEnvironments()
    expect(loaded.length).toBe(3)
  })

  it('manages history entries cleanly', () => {
    clearHistory()
    expect(loadHistory().length).toBe(0)

    saveHistoryEntry({
      id: 'hist_1',
      request: {
        id: 'req_1',
        name: 'Test',
        method: 'GET',
        url: 'https://example.com',
        params: [],
        headers: [],
        body: { type: 'none' },
        auth: { type: 'none' },
      },
      response: {
        status: 200,
        statusText: 'OK',
        headers: {},
        body: 'ok',
        sizeBytes: 2,
        timeMs: 15,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    })

    const list = loadHistory()
    expect(list.length).toBe(1)
    expect(list[0].request.url).toBe('https://example.com')
  })
})
