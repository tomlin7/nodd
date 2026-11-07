import React from 'react'
import { describe, expect, test } from 'bun:test'
import type { HttpRequest } from '../core/types'
import { CodeSnippetModal } from './CodeSnippetModal'

function makeTestRequest(): HttpRequest {
  return {
    id: 'req-test',
    name: 'Sample API Call',
    method: 'POST',
    url: 'https://httpbin.org/post',
    params: [{ id: 'p1', key: 'source', value: 'nodd', enabled: true }],
    headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
    body: { type: 'json', rawText: '{"msg": "hello world"}' },
    auth: { type: 'none' },
  }
}

describe('CodeSnippetModal Component', () => {
  test('renders snippet modal with request name and close trigger', () => {
    let closed = false
    const req = makeTestRequest()

    const element = (
      <CodeSnippetModal
        request={req}
        onClose={() => {
          closed = true
        }}
      />
    )

    expect(element).toBeDefined()
    expect(element.props.request.name).toBe('Sample API Call')

    element.props.onClose()
    expect(closed).toBe(true)
  })
})
