import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { connectTest } from '@gpuix/react/automation'
import { createTestRoot, hasNativeTestRenderer } from '@gpuix/react/testing'

import { NoddApp } from './app'
import { Settings } from './src/components/Settings'
import { DEFAULT_SETTINGS } from './src/core/preferences'
import { resetTitlebarPress, setWindowDragStarter } from './src/window-drag'

const describeNative = hasNativeTestRenderer ? describe : describe.skip
const isDarwin = typeof process !== 'undefined' && process.platform === 'darwin'

async function pressAt(app: any, testId: string) {
  const target = app.getByTestId(testId)
  await target.waitFor({ timeoutMs: 10_000 })
  const bounds = await target.bounds()
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  await app.mouse.down({ x, y })
  await app.mouse.up({ x, y })
  return { x, y }
}

describeNative('Nodd titlebar dragging', () => {
  afterEach(() => {
    setWindowDragStarter(null)
    resetTitlebarPress()
  })

  it('starts a window drag when the header titlebar is pressed', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<NoddApp />)
    const app = await connectTest(renderer)

    let drags = 0
    setWindowDragStarter(() => {
      drags += 1
      return true
    })

    await pressAt(app, 'titlebar-drag-header')
    expect(drags).toBe(1)
    await app.close()
  })

  it('starts a window drag from the settings chrome', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<Settings settings={DEFAULT_SETTINGS} onSave={() => {}} onClose={() => {}} />)
    const app = await connectTest(renderer)

    let drags = 0
    setWindowDragStarter(() => {
      drags += 1
      return true
    })

    await pressAt(app, 'titlebar-drag-settings')
    expect(drags).toBe(1)
    await app.close()
  })

  it('zooms the window on a double click instead of dragging it', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<NoddApp />)
    const app = await connectTest(renderer)

    let drags = 0
    let zooms = 0
    setWindowDragStarter(() => {
      drags += 1
      return true
    })
    ;(renderer as any).zoomWindow = () => {
      zooms += 1
    }

    const first = await pressAt(app, 'titlebar-drag-header')
    await pressAt(app, 'titlebar-drag-header')

    expect(drags).toBe(1)
    expect(zooms).toBe(1)
    expect(first).toBeTruthy()
    await app.close()
  })

  it.skipIf(isDarwin)('zooms the window from the maximize button', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<NoddApp />)
    const app = await connectTest(renderer)

    let zooms = 0
    ;(renderer as any).zoomWindow = () => {
      zooms += 1
    }

    const maximize = app.getByTestId('window-maximize')
    await maximize.waitFor({ timeoutMs: 10_000 })
    await maximize.click()

    expect(zooms).toBe(1)
    await app.close()
  })
})
