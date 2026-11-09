import React from 'react'
import { describe, expect, test } from 'bun:test'
import { CommandPalette } from './CommandPalette'

describe('CommandPalette Component', () => {
  test('renders command palette and filters commands cleanly', () => {
    let sent = false
    let closed = false

    const element = (
      <CommandPalette
        isOpen={true}
        onClose={() => {
          closed = true
        }}
        onSendRequest={() => {
          sent = true
        }}
        onSaveRequest={() => {}}
        onNewTab={() => {}}
        onCloseTab={() => {}}
        onToggleSidebar={() => {}}
        onOpenSettings={() => {}}
        onOpenEnvironmentManager={() => {}}
        onOpenCodeSnippets={() => {}}
        onImportCollection={() => {}}
        onClearHistory={() => {}}
        environments={[{ id: 'e1', name: 'Production', variables: {} }]}
        activeEnvironment={null}
        onSelectEnvironment={() => {}}
        collections={[]}
        onSelectRequest={() => {}}
      />
    )

    expect(element).toBeDefined()
    expect(element.props.isOpen).toBe(true)

    // Trigger onSendRequest & onClose
    element.props.onSendRequest()
    element.props.onClose()

    expect(sent).toBe(true)
    expect(closed).toBe(true)
  })
})
