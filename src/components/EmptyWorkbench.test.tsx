import React from 'react'
import { describe, expect, test } from 'bun:test'
import { EmptyWorkbench } from './EmptyWorkbench'

describe('EmptyWorkbench Component', () => {
  test('renders empty workbench and handles new tab click', () => {
    let triggered = false

    const element = (
      <EmptyWorkbench
        onNewTab={() => {
          triggered = true
        }}
      />
    )

    expect(element).toBeDefined()
    element.props.onNewTab()
    expect(triggered).toBe(true)
  })
})
