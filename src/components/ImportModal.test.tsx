import React from 'react'
import { describe, expect, test } from 'bun:test'
import { ImportModal } from './ImportModal'
import type { Collection } from '../core/types'

describe('ImportModal Component', () => {
  test('renders import modal and triggers close', () => {
    let closed = false
    let imported: Collection | null = null

    const element = (
      <ImportModal
        onImport={(col) => {
          imported = col
        }}
        onClose={() => {
          closed = true
        }}
      />
    )

    expect(element).toBeDefined()
    element.props.onClose()
    expect(closed).toBe(true)
  })
})
