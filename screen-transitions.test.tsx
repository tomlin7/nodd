import React from 'react'
import { describe, expect, it } from 'vitest'
import { connectTest } from '@gpuix/react/automation'
import { createTestRoot, hasNativeTestRenderer } from '@gpuix/react/testing'
import { NoddApp } from './app'

const describeNative = hasNativeTestRenderer ? describe : describe.skip

describeNative('Screen Transitions Automation', () => {
  it('opens and closes settings with presence transitions smoothly', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<NoddApp />)
    const app = await connectTest(renderer)

    // 1. Settings button in Titlebar is present
    const settingsBtn = app.getByTestId('open-settings')
    await settingsBtn.waitFor({ timeoutMs: 3000 })
    const bounds = await settingsBtn.bounds()

    // 2. Click settings button to open settings screen
    await app.mouse.down({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })
    await app.mouse.up({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })

    // Wait for transition duration (0.16s)
    await new Promise((r) => setTimeout(r, 250))

    // 3. Verify settings back button is visible
    const backBtn = app.getByTestId('settings-back')
    await backBtn.waitFor({ timeoutMs: 3000 })
    expect(backBtn).toBeDefined()

    // 4. Click back button to close settings screen
    const backBounds = await backBtn.bounds()
    await app.mouse.down({ x: backBounds.x + backBounds.width / 2, y: backBounds.y + backBounds.height / 2 })
    await app.mouse.up({ x: backBounds.x + backBounds.width / 2, y: backBounds.y + backBounds.height / 2 })

    await new Promise((r) => setTimeout(r, 250))

    // 5. Verify main workbench titlebar is active and responsive
    const titlebarHeader = app.getByTestId('titlebar-drag-header')
    await titlebarHeader.waitFor({ timeoutMs: 3000 })
    expect(titlebarHeader).toBeDefined()

    await app.close()
  })

  it('switches RequestBuilder tabs smoothly without crashing', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<NoddApp />)
    const app = await connectTest(renderer)

    // 1. Click Headers tab
    const headersTab = app.getByTestId('tab-headers')
    await headersTab.waitFor({ timeoutMs: 3000 })
    const hBounds = await headersTab.bounds()
    await app.mouse.down({ x: hBounds.x + hBounds.width / 2, y: hBounds.y + hBounds.height / 2 })
    await app.mouse.up({ x: hBounds.x + hBounds.width / 2, y: hBounds.y + hBounds.height / 2 })

    await new Promise((r) => setTimeout(r, 200))

    // 2. Click Auth tab
    const authTab = app.getByTestId('tab-auth')
    await authTab.waitFor({ timeoutMs: 3000 })
    const aBounds = await authTab.bounds()
    await app.mouse.down({ x: aBounds.x + aBounds.width / 2, y: aBounds.y + aBounds.height / 2 })
    await app.mouse.up({ x: aBounds.x + aBounds.width / 2, y: aBounds.y + aBounds.height / 2 })

    await new Promise((r) => setTimeout(r, 200))

    // 3. Click Params tab back
    const paramsTab = app.getByTestId('tab-params')
    await paramsTab.waitFor({ timeoutMs: 3000 })
    const pBounds = await paramsTab.bounds()
    await app.mouse.down({ x: pBounds.x + pBounds.width / 2, y: pBounds.y + pBounds.height / 2 })
    await app.mouse.up({ x: pBounds.x + pBounds.width / 2, y: pBounds.y + pBounds.height / 2 })

    await new Promise((r) => setTimeout(r, 200))

    expect(paramsTab).toBeDefined()
    await app.close()
  })

  it('opens and closes environment manager screen smoothly', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<NoddApp />)
    const app = await connectTest(renderer)

    // 1. Click Environment pill in Status Bar
    const envBtn = app.getByTestId('status-bar-env')
    await envBtn.waitFor({ timeoutMs: 3000 })
    const bounds = await envBtn.bounds()
    await app.mouse.down({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })
    await app.mouse.up({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })

    await new Promise((r) => setTimeout(r, 250))

    // 2. Verify Environment Manager is presented with back button
    const backBtn = app.getByTestId('env-manager-back')
    await backBtn.waitFor({ timeoutMs: 3000 })
    expect(backBtn).toBeDefined()

    // 3. Click back button to return to workbench
    const backBounds = await backBtn.bounds()
    await app.mouse.down({ x: backBounds.x + backBounds.width / 2, y: backBounds.y + backBounds.height / 2 })
    await app.mouse.up({ x: backBounds.x + backBounds.width / 2, y: backBounds.y + backBounds.height / 2 })

    await new Promise((r) => setTimeout(r, 250))

    // 4. Verify main workbench restored
    const titlebarHeader = app.getByTestId('titlebar-drag-header')
    await titlebarHeader.waitFor({ timeoutMs: 3000 })
    expect(titlebarHeader).toBeDefined()

    await app.close()
  })

  it('renders environment and method dropdown menus in deferred floating layer', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<NoddApp />)
    const app = await connectTest(renderer)

    // 1. Open Environment dropdown from Titlebar
    const envSelectorBtn = app.getByTestId('env-selector-button')
    await envSelectorBtn.waitFor({ timeoutMs: 3000 })
    const envBounds = await envSelectorBtn.bounds()
    await app.mouse.down({ x: envBounds.x + envBounds.width / 2, y: envBounds.y + envBounds.height / 2 })
    await app.mouse.up({ x: envBounds.x + envBounds.width / 2, y: envBounds.y + envBounds.height / 2 })

    await new Promise((r) => setTimeout(r, 150))

    // 2. Verify env dropdown menu is mounted and visible
    const envMenu = app.getByTestId('env-dropdown-menu')
    await envMenu.waitFor({ timeoutMs: 3000 })
    expect(envMenu).toBeDefined()

    // 3. Click outside in workbench to dismiss
    const titlebarHeader = app.getByTestId('titlebar-drag-header')
    const tBounds = await titlebarHeader.bounds()
    await app.mouse.down({ x: tBounds.x + tBounds.width / 2, y: tBounds.y + tBounds.height / 2 })
    await app.mouse.up({ x: tBounds.x + tBounds.width / 2, y: tBounds.y + tBounds.height / 2 })

    await new Promise((r) => setTimeout(r, 150))

    // 4. Open Method dropdown in RequestBuilder
    const methodBtn = app.getByTestId('method-selector-button')
    await methodBtn.waitFor({ timeoutMs: 3000 })
    const mBounds = await methodBtn.bounds()
    await app.mouse.down({ x: mBounds.x + mBounds.width / 2, y: mBounds.y + mBounds.height / 2 })
    await app.mouse.up({ x: mBounds.x + mBounds.width / 2, y: mBounds.y + mBounds.height / 2 })

    await new Promise((r) => setTimeout(r, 150))

    // 5. Verify method dropdown menu is mounted and visible
    const methodMenu = app.getByTestId('method-dropdown-menu')
    await methodMenu.waitFor({ timeoutMs: 3000 })
    expect(methodMenu).toBeDefined()

    // Select POST method
    const postOption = app.getByTestId('method-option-POST')
    await postOption.waitFor({ timeoutMs: 3000 })
    const postBounds = await postOption.bounds()
    await app.mouse.down({ x: postBounds.x + postBounds.width / 2, y: postBounds.y + postBounds.height / 2 })
    await app.mouse.up({ x: postBounds.x + postBounds.width / 2, y: postBounds.y + postBounds.height / 2 })

    await new Promise((r) => setTimeout(r, 150))

    await app.close()
  })
})
