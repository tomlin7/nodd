import { describe, expect, test } from 'bun:test'
import { closeTabHelper, createTab, isTabDirty, markTabSaved } from './tabs'
import type { HttpRequest } from './types'

function makeTestRequest(id: string, name: string): HttpRequest {
  return {
    id,
    name,
    method: 'GET',
    url: 'https://api.example.com/' + id,
    params: [],
    headers: [],
    body: { type: 'none' },
    auth: { type: 'none' },
  }
}

describe('Workspace Tab Logic', () => {
  test('creates tab with snapshot and defaults to not dirty', () => {
    const req = makeTestRequest('r1', 'Get Users')
    const tab = createTab(req)

    expect(tab.id).toBeDefined()
    expect(tab.request.name).toBe('Get Users')
    expect(isTabDirty(tab)).toBe(false)
  })

  test('detects dirty state when request fields change', () => {
    const req = makeTestRequest('r1', 'Get Users')
    const tab = createTab(req)

    expect(isTabDirty(tab)).toBe(false)

    // Modify url
    const modifiedTab = {
      ...tab,
      request: { ...tab.request, url: 'https://api.example.com/posts' },
    }
    expect(isTabDirty(modifiedTab)).toBe(true)

    // Save tab snapshot
    const savedTab = markTabSaved(modifiedTab)
    expect(isTabDirty(savedTab)).toBe(false)
  })

  test('detects dirty state on headers, params, and method', () => {
    const req = makeTestRequest('r1', 'Get Users')
    const tab = createTab(req)

    const methodTab = {
      ...tab,
      request: { ...tab.request, method: 'POST' as const },
    }
    expect(isTabDirty(methodTab)).toBe(true)

    const headerTab = {
      ...tab,
      request: {
        ...tab.request,
        headers: [{ id: 'h1', key: 'Auth', value: '123', enabled: true }],
      },
    }
    expect(isTabDirty(headerTab)).toBe(true)
  })

  test('closeTabHelper handles closing inactive tab', () => {
    const t1 = createTab(makeTestRequest('r1', 'Req 1'), null, 'tab-1')
    const t2 = createTab(makeTestRequest('r2', 'Req 2'), null, 'tab-2')
    const t3 = createTab(makeTestRequest('r3', 'Req 3'), null, 'tab-3')

    const res = closeTabHelper([t1, t2, t3], 'tab-1', 'tab-2', () => makeTestRequest('new', 'New'))
    expect(res.tabs.length).toBe(2)
    expect(res.tabs.map((t) => t.id)).toEqual(['tab-1', 'tab-3'])
    expect(res.activeTabId).toBe('tab-1')
  })

  test('closeTabHelper handles closing active tab and switches smoothly', () => {
    const t1 = createTab(makeTestRequest('r1', 'Req 1'), null, 'tab-1')
    const t2 = createTab(makeTestRequest('r2', 'Req 2'), null, 'tab-2')
    const t3 = createTab(makeTestRequest('r3', 'Req 3'), null, 'tab-3')

    // Close t2 when t2 is active -> should switch to t3
    const res = closeTabHelper([t1, t2, t3], 'tab-2', 'tab-2', () => makeTestRequest('new', 'New'))
    expect(res.tabs.length).toBe(2)
    expect(res.activeTabId).toBe('tab-3')

    // Close t3 when t3 is active -> should switch back to t1
    const res2 = closeTabHelper(res.tabs, 'tab-3', 'tab-3', () => makeTestRequest('new', 'New'))
    expect(res2.tabs.length).toBe(1)
    expect(res2.activeTabId).toBe('tab-1')
  })

  test('closeTabHelper creates fallback tab when closing the last remaining tab', () => {
    const t1 = createTab(makeTestRequest('r1', 'Req 1'), null, 'tab-1')
    const res = closeTabHelper([t1], 'tab-1', 'tab-1', () => makeTestRequest('fallback', 'Fallback'))

    expect(res.tabs.length).toBe(1)
    expect(res.tabs[0].request.name).toBe('Fallback')
    expect(res.activeTabId).toBe(res.tabs[0].id)
  })
})
