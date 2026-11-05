import React from 'react'
import { describe, expect, it } from 'vitest'
import { connectTest } from '@gpuix/react/automation'
import { createTestRoot, hasNativeTestRenderer } from '@gpuix/react/testing'
import { NoddApp } from './app'

const describeNative = hasNativeTestRenderer ? describe : describe.skip

describeNative('Toggle Sidebar Automation', () => {
  it('toggles sidebar open and closed repeatedly without crashing', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<NoddApp />)
    const app = await connectTest(renderer)

    // 1. Initial state: toggle button exists
    const toggleBtn = app.getByTestId('toggle-sidebar')
    await toggleBtn.waitFor({ timeoutMs: 2000 })
    let bounds = await toggleBtn.bounds()

    // 2. Click to collapse sidebar
    console.log('Collapsing sidebar...')
    await app.mouse.down({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })
    await app.mouse.up({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })

    // Wait for animation transition (0.2s)
    await new Promise((r) => setTimeout(r, 300))

    // Verify app did not crash, titlebar and button are still present
    const toggleAfterCollapse = await app.getByTestId('toggle-sidebar').all()
    expect(toggleAfterCollapse.length).toBe(1)

    // 3. Click to expand sidebar again
    console.log('Expanding sidebar...')
    bounds = await toggleBtn.bounds()
    await app.mouse.down({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })
    await app.mouse.up({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })

    // Wait for animation transition (0.2s)
    await new Promise((r) => setTimeout(r, 300))

    // Verify app did not crash
    const toggleAfterExpand = await app.getByTestId('toggle-sidebar').all()
    expect(toggleAfterExpand.length).toBe(1)

    // Verify collection search bar is visible
    const searchBar = await app.getByTestId('sidebar-search-input').all()
    expect(searchBar.length).toBe(1)

    await app.close()
  })
})
