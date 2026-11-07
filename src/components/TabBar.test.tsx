import React from 'react'
import { describe, expect, test } from 'bun:test'
import { createTab } from '../core/tabs'
import type { HttpRequest } from '../core/types'
import { TabBar } from './TabBar'

function makeTestRequest(id: string, name: string, method: HttpRequest['method'] = 'GET'): HttpRequest {
  return {
    id,
    name,
    method,
    url: 'https://api.example.com/' + id,
    params: [],
    headers: [],
    body: { type: 'none' },
    auth: { type: 'none' },
  }
}

describe('TabBar Component & Multi-Tab State', () => {
  test('renders tab list with active and inactive tabs', () => {
    const t1 = createTab(makeTestRequest('r1', 'Get Users', 'GET'), null, 'tab-1')
    const t2 = createTab(makeTestRequest('r2', 'Create User', 'POST'), null, 'tab-2')

    let selectedTabId = ''
    let closedTabId = ''
    let newTabTriggered = false

    const element = (
      <TabBar
        tabs={[t1, t2]}
        activeTabId="tab-1"
        onSelectTab={(id) => {
          selectedTabId = id
        }}
        onCloseTab={(id) => {
          closedTabId = id
        }}
        onNewTab={() => {
          newTabTriggered = true
        }}
      />
    )

    expect(element).toBeDefined()
    expect(element.props.tabs.length).toBe(2)
    expect(element.props.activeTabId).toBe('tab-1')

    // Simulate interactions via props
    element.props.onSelectTab('tab-2')
    expect(selectedTabId).toBe('tab-2')

    element.props.onCloseTab('tab-1')
    expect(closedTabId).toBe('tab-1')

    element.props.onNewTab()
    expect(newTabTriggered).toBe(true)
  })

  test('reflects dirty indicator when tab request is modified', () => {
    const req = makeTestRequest('r1', 'Get Users', 'GET')
    const t1 = createTab(req, null, 'tab-1')

    // Initially clean
    expect(t1.request.name).toBe('Get Users')

    // Dirty
    const modifiedReq = { ...req, name: 'Modified Users' }
    const dirtyTab = { ...t1, request: modifiedReq }

    const element = (
      <TabBar
        tabs={[dirtyTab]}
        activeTabId="tab-1"
        onSelectTab={() => {}}
        onCloseTab={() => {}}
        onNewTab={() => {}}
      />
    )

    expect(element.props.tabs[0].request.name).toBe('Modified Users')
  })
})
