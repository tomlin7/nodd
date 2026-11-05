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
        gap: 4,
        height: '100%',
        flexShrink: 0,
      }}
    >
      <Button
        testId="window-minimize"
        aria-label="Minimize"
        onClick={() => renderer?.minimizeWindow?.()}
        style={{
          width: 30,
          height: 30,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          hover: { backgroundColor: C.overlay },
          active: { backgroundColor: C.overlayStrong },
        }}
      >
        <Icon name="windowMinimize" size={12} color={C.secondary} />
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
          width: 30,
          height: 30,
          borderRadius: 6,
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
          width: 30,
          height: 30,
          borderRadius: 6,
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
  environments = [],
  sidebarOpen,
  onToggleSidebar,
  settingsOpen,
  onOpenSettings,
  onSelectEnvironment,
  onOpenEnvironmentManager,
}: {
  requestName?: string
  method?: HttpMethod
  environment?: Environment | null
  environments?: Environment[]
  sidebarOpen: boolean
  onToggleSidebar: () => void
  settingsOpen: boolean
  onOpenSettings: () => void
  onSelectEnvironment?: (env: Environment | null) => void
  onOpenEnvironmentManager?: () => void
}) {
  const methodColor = method ? C.methods[method] || C.accent : C.accent
  const [envMenuOpen, setEnvMenuOpen] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: TITLEBAR_HEIGHT,
        backgroundColor: C.header,
        paddingLeft: IS_DARWIN ? 76 : 12,
        paddingRight: 10,
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
          gap: 8,
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
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingLeft: 2 }}>
          <text
            style={{
              fontSize: 14,
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
          maxWidth: 680,
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
              paddingLeft: 7,
              paddingRight: 7,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 4,
              backgroundColor: C.surfaceHighlight,
            }}
          >
            <text
              style={{
                fontSize: 11,
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
            fontSize: 13.5,
            fontFamily: FONT_SANS,
            fontWeight: '500',
            color: requestName ? C.text : C.tertiary,
            whiteSpace: 'nowrap',
          }}
        >
          {requestName ? requestName : 'Nodd · Minimalist API Workbench'}
        </text>
      </DragRegion>

      {/* Right controls: environment selector dropdown + settings + window controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
        }}
      >
        {/* Environment Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <Button
            testId="env-selector-button"
            onClick={() => setEnvMenuOpen((prev) => !prev)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingLeft: 10,
              paddingRight: 10,
              height: 28,
              borderRadius: 6,
              backgroundColor: environment ? '#1D1D22' : 'transparent',
              cursor: 'pointer',
              hover: { backgroundColor: '#26262D' },
            }}
          >
            <Icon name="environment" size={12} color={environment ? C.accent : C.tertiary} />
            <text
              style={{
                fontSize: 12.5,
                fontFamily: FONT_SANS,
                fontWeight: '500',
                color: environment ? C.text : C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              {environment ? environment.name : 'No Environment'}
            </text>
            <Icon name="chevronDown" size={11} color={C.tertiary} />
          </Button>

          {envMenuOpen && (
            <div
              testId="env-dropdown-menu"
              style={{
                position: 'absolute',
                top: 32,
                right: 0,
                width: 200,
                backgroundColor: '#1E1E23',
                borderRadius: 8,
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {/* Option: No Environment */}
              <Button
                testId="env-option-none"
                onClick={() => {
                  onSelectEnvironment?.(null)
                  setEnvMenuOpen(false)
                }}
                style={{
                  height: 30,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 5,
                  cursor: 'pointer',
                  backgroundColor: !environment ? C.surfaceHighlight : 'transparent',
                  hover: { backgroundColor: C.overlay },
                }}
              >
                <text
                  style={{
                    fontSize: 12.5,
                    fontFamily: FONT_SANS,
                    color: !environment ? C.accent : C.secondary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  No Environment
                </text>
                {!environment && <Icon name="check" size={12} color={C.accent} />}
              </Button>

              {environments.map((env) => {
                const isActive = environment?.id === env.id
                return (
                  <Button
                    key={env.id}
                    testId={`env-option-${env.id}`}
                    onClick={() => {
                      onSelectEnvironment?.(env)
                      setEnvMenuOpen(false)
                    }}
                    style={{
                      height: 30,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingLeft: 10,
                      paddingRight: 10,
                      borderRadius: 5,
                      cursor: 'pointer',
                      backgroundColor: isActive ? C.surfaceHighlight : 'transparent',
                      hover: { backgroundColor: C.overlay },
                    }}
                  >
                    <text
                      style={{
                        fontSize: 12.5,
                        fontFamily: FONT_SANS,
                        color: isActive ? C.accent : C.text,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {env.name}
                    </text>
                    {isActive && <Icon name="check" size={12} color={C.accent} />}
                  </Button>
                )
              })}

              <div style={{ height: 1, backgroundColor: C.border, marginTop: 4, marginBottom: 4 }} />

              <Button
                testId="manage-environments-btn"
                onClick={() => {
                  setEnvMenuOpen(false)
                  onOpenEnvironmentManager?.()
                }}
                style={{
                  height: 30,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 5,
                  cursor: 'pointer',
                  hover: { backgroundColor: C.overlay },
                }}
              >
                <Icon name="settings" size={12} color={C.secondary} />
                <text style={{ fontSize: 12.5, fontFamily: FONT_SANS, color: C.secondary, whiteSpace: 'nowrap' }}>
                  Manage Environments...
                </text>
              </Button>
            </div>
          )}
        </div>

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
