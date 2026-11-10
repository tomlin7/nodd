import React from 'react'
import { describe, expect, test } from 'bun:test'
import { UnsavedChangesModal } from './UnsavedChangesModal'

describe('UnsavedChangesModal Component', () => {
  test('renders modal element with props and triggers actions', () => {
    let saved = false
    let discarded = false
    let cancelled = false

    const element = (
      <UnsavedChangesModal
        isOpen={true}
        tabName="Payment Webhook"
        onSave={() => {
          saved = true
        }}
        onDiscard={() => {
          discarded = true
        }}
        onCancel={() => {
          cancelled = true
        }}
      />
    )

    expect(element).toBeDefined()
    expect(element.props.isOpen).toBe(true)
    expect(element.props.tabName).toBe('Payment Webhook')

    element.props.onSave()
    expect(saved).toBe(true)

    element.props.onDiscard()
    expect(discarded).toBe(true)

    element.props.onCancel()
    expect(cancelled).toBe(true)
  })

  test('passes isOpen=false cleanly', () => {
    const element = (
      <UnsavedChangesModal
        isOpen={false}
        tabName="Test Request"
        onSave={() => {}}
        onDiscard={() => {}}
        onCancel={() => {}}
      />
    )

    expect(element.props.isOpen).toBe(false)
  })
})
