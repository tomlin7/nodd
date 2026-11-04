import React, { useState } from 'react'
import { Button, useGpuix } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS, IconButton, IS_DARWIN, TITLEBAR_HEIGHT } from '../theme'
import type { Environment, HttpMethod } from '../core/types'
import {
  endWindowDrag,
  handleTitlebarMouseDown,
  isWindowMaximized,
  toggleWindowZoom,
  updateWindowDrag,
} from '../window-drag'

export function DragRegion({
  testId,
  style,
  children,
}: {
  testId: string
  style?: Record<string, unknown>
  children?: React.ReactNode
}) {
  const { renderer } = useGpuix()
  return (
    <div
      testId={testId}
      style={{ ...style, pointerEvents: 'auto' }}
      onMouseDown={(e: any) => handleTitlebarMouseDown(renderer, e)}
      onMouseMove={() => updateWindowDrag()}
      onMouseUp={() => endWindowDrag()}
    >
      {children}
    </div>
  )
}

export function WindowControls() {
  const { renderer } = useGpuix()
  const [maximized, setMaximized] = useState(false)
  if (IS_DARWIN) return null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: '100%',
        flexShrink: 0,
      }}
    >
      <Button
        testId="window-minimize"
        aria-label="Minimize"
        onClick={() => renderer?.minimizeWindow?.()}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          hover: { backgroundColor: C.overlay },
          active: { backgroundColor: C.overlayStrong },
        }}
      >
        <Icon name="windowMinimize" size={13} color={C.secondary} />
      </Button>
      <Button
        testId="window-maximize"
        aria-label={maximized ? 'Restore' : 'Maximize'}
        onClick={() => {
          toggleWindowZoom(renderer)
          setMaximized(isWindowMaximized())
        }}
        onMouseEnter={() => setMaximized(isWindowMaximized())}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          hover: { backgroundColor: C.overlay },
          active: { backgroundColor: C.overlayStrong },
        }}
      >
        <Icon name={maximized ? 'windowRestore' : 'windowMaximize'} size={12} color={C.secondary} />
      </Button>
      <Button
        testId="window-close"
        aria-label="Close"
        onClick={() => {
          if (typeof process !== 'undefined') process.exit(0)
        }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          hover: { backgroundColor: '#3F2427' },
          active: { backgroundColor: '#582E33' },
        }}
      >
        <Icon name="windowClose" size={12} color={C.secondary} />
      </Button>
    </div>
  )
}

export function Titlebar({
  requestName,
  method,
  environment,
  sidebarOpen,
  onToggleSidebar,
  settingsOpen,
  onOpenSettings,
}: {
  requestName?: string
  method?: HttpMethod
  environment?: Environment | null
  sidebarOpen: boolean
  onToggleSidebar: () => void
  settingsOpen: boolean
  onOpenSettings: () => void
}) {
  const methodColor = method ? C.methods[method] || C.accent : C.accent

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: TITLEBAR_HEIGHT,
        backgroundColor: C.header,
        borderBottomWidth: 1,
        borderColor: C.border,
        paddingLeft: IS_DARWIN ? 76 : 14,
        paddingRight: 14,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Left controls: toggle sidebar + brand */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <IconButton
          icon="sidebar"
          testId="toggle-sidebar"
          active={sidebarOpen}
          tooltip="Toggle Sidebar (Ctrl+B)"
          onClick={onToggleSidebar}
        />
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <text
            style={{
              fontSize: 13,
              fontFamily: FONT_SANS,
              fontWeight: '600',
              color: C.text,
              whiteSpace: 'nowrap',
            }}
          >
            nodd
          </text>
        </div>
      </div>

      {/* Middle drag area with request info */}
      <DragRegion
        testId="titlebar-drag-header"
        style={{
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
          maxWidth: 700,
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        {method && (
          <div
            style={{
              paddingLeft: 6,
              paddingRight: 6,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 4,
              backgroundColor: C.surfaceHighlight,
            }}
          >
            <text
              style={{
                fontSize: 10,
                fontFamily: FONT_MONO,
                fontWeight: '700',
                color: methodColor,
                whiteSpace: 'nowrap',
              }}
            >
              {method}
            </text>
          </div>
        )}
        <text
          style={{
            fontSize: 12,
            fontFamily: FONT_SANS,
            color: requestName ? C.text : C.tertiary,
            whiteSpace: 'nowrap',
          }}
        >
          {requestName ? requestName : 'Nodd · Minimalist API Workbench'}
        </text>
      </DragRegion>

      {/* Right controls: environment indicator + settings + window controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {environment && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingLeft: 8,
              paddingRight: 8,
              height: 24,
              borderRadius: 5,
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <Icon name="environment" size={11} color={C.secondary} />
            <text
              style={{
                fontSize: 11,
                fontFamily: FONT_SANS,
                color: C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              {environment.name}
            </text>
          </div>
        )}

        <IconButton
          icon="settings"
          testId="open-settings"
          active={settingsOpen}
          tooltip="Settings (,)"
          onClick={onOpenSettings}
        />

        <WindowControls />
      </div>
    </div>
  )
}
