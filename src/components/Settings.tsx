import React, { useState } from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { DragRegion, WindowControls } from './Titlebar'
import {
  C,
  FONT_MONO,
  FONT_SANS,
  IconButton,
  IS_DARWIN,
  TITLEBAR_HEIGHT,
} from '../theme'
import {
  endWindowDrag,
  handleTitlebarMouseDown,
  updateWindowDrag,
} from '../window-drag'
import type { ClientSettings } from '../core/types'

export function Settings({
  settings,
  onSave,
  onClose,
}: {
  settings: ClientSettings
  onSave: (next: ClientSettings) => void
  onClose: () => void
}) {
  const [activeSection, setActiveSection] = useState<'network' | 'about'>('network')
  const [current, setCurrent] = useState<ClientSettings>(settings)

  const update = (partial: Partial<ClientSettings>) => {
    const next = { ...current, ...partial }
    setCurrent(next)
    onSave(next)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        backgroundColor: C.canvas,
      }}
    >
      {/* Left Sidebar */}
      <div
        style={{
          width: 240,
          backgroundColor: C.sidebar,
          borderRightWidth: 1,
          borderColor: C.border,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: IS_DARWIN ? 36 : 12,
          paddingLeft: 12,
          paddingRight: 12,
          flexShrink: 0,
        }}
      >
        <Button
          testId="settings-back"
          onClick={onClose}
          style={{
            height: 32,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 8,
            paddingRight: 8,
            borderRadius: 7,
            cursor: 'pointer',
            hover: { backgroundColor: C.overlay },
            marginBottom: 12,
          }}
        >
          <Icon name="arrowLeft" size={14} color={C.secondary} />
          <text
            style={{
              fontSize: 13,
              fontFamily: FONT_SANS,
              color: C.text,
              whiteSpace: 'nowrap',
            }}
          >
            Back to Workbench
          </text>
        </Button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            onClick={() => setActiveSection('network')}
            style={{
              height: 36,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 7,
              cursor: 'pointer',
              backgroundColor: activeSection === 'network' ? C.surfaceHighlight : 'transparent',
              hover: { backgroundColor: activeSection === 'network' ? C.surfaceHighlight : C.overlay },
            }}
          >
            <text
              style={{
                fontSize: 13,
                fontFamily: FONT_SANS,
                fontWeight: activeSection === 'network' ? '600' : '400',
                color: activeSection === 'network' ? C.text : C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              Network & Timeouts
            </text>
          </Button>

          <Button
            onClick={() => setActiveSection('about')}
            style={{
              height: 36,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 7,
              cursor: 'pointer',
              backgroundColor: activeSection === 'about' ? C.surfaceHighlight : 'transparent',
              hover: { backgroundColor: activeSection === 'about' ? C.surfaceHighlight : C.overlay },
            }}
          >
            <text
              style={{
                fontSize: 13,
                fontFamily: FONT_SANS,
                fontWeight: activeSection === 'about' ? '600' : '400',
                color: activeSection === 'about' ? C.text : C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              About Nodd
            </text>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          height: '100%',
        }}
      >
        {/* Header Drag Region */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: TITLEBAR_HEIGHT,
            borderBottomWidth: 1,
            borderColor: C.border,
            paddingLeft: 24,
            paddingRight: 14,
            backgroundColor: C.header,
          }}
        >
          <DragRegion
            testId="titlebar-drag-settings"
            style={{
              flexGrow: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <text
              style={{
                fontSize: 14,
                fontFamily: FONT_SANS,
                fontWeight: '600',
                color: C.text,
                whiteSpace: 'nowrap',
              }}
            >
              Settings
            </text>
          </DragRegion>
          <WindowControls />
        </div>

        {/* Content Pane */}
        <div
          style={{
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflow: 'hidden',
          }}
        >
          {activeSection === 'network' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  fontFamily: FONT_SANS,
                  color: C.text,
                  whiteSpace: 'nowrap',
                }}
              >
                Network Settings
              </text>

              {/* Card 1: Timeouts & SSL */}
              <div
                style={{
                  backgroundColor: C.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.cardBorder,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {/* Row: Request Timeout */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        fontFamily: FONT_SANS,
                        color: C.text,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Request Timeout
                    </text>
                    <text
                      style={{
                        fontSize: 12,
                        fontFamily: FONT_SANS,
                        color: C.secondary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Maximum duration in milliseconds before timing out
                    </text>
                  </div>
                  <Button
                    onClick={() => {
                      const next = current.timeoutMs === 30000 ? 60000 : current.timeoutMs === 60000 ? 10000 : 30000
                      update({ timeoutMs: next })
                    }}
                    style={{
                      height: 28,
                      paddingLeft: 12,
                      paddingRight: 12,
                      borderRadius: 6,
                      backgroundColor: C.surfaceHighlight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <text
                      style={{
                        fontSize: 12,
                        fontFamily: FONT_MONO,
                        color: C.text,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {`${current.timeoutMs}ms`}
                    </text>
                  </Button>
                </div>

                <div style={{ height: 1, backgroundColor: C.border }} />

                {/* Row: Follow Redirects */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        fontFamily: FONT_SANS,
                        color: C.text,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Follow Redirects
                    </text>
                    <text
                      style={{
                        fontSize: 12,
                        fontFamily: FONT_SANS,
                        color: C.secondary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Automatically follow HTTP 3xx redirects
                    </text>
                  </div>
                  <Button
                    onClick={() => update({ followRedirects: !current.followRedirects })}
                    style={{
                      height: 28,
                      paddingLeft: 12,
                      paddingRight: 12,
                      borderRadius: 6,
                      backgroundColor: current.followRedirects ? C.surfaceHighlight : C.surface,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <text
                      style={{
                        fontSize: 12,
                        fontFamily: FONT_SANS,
                        color: current.followRedirects ? C.success : C.tertiary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {current.followRedirects ? 'Enabled' : 'Disabled'}
                    </text>
                  </Button>
                </div>

                <div style={{ height: 1, backgroundColor: C.border }} />

                {/* Row: Validate SSL */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        fontFamily: FONT_SANS,
                        color: C.text,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Validate SSL Certificates
                    </text>
                    <text
                      style={{
                        fontSize: 12,
                        fontFamily: FONT_SANS,
                        color: C.secondary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Reject self-signed or invalid SSL certificates
                    </text>
                  </div>
                  <Button
                    onClick={() => update({ validateSsl: !current.validateSsl })}
                    style={{
                      height: 28,
                      paddingLeft: 12,
                      paddingRight: 12,
                      borderRadius: 6,
                      backgroundColor: current.validateSsl ? C.surfaceHighlight : C.surface,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <text
                      style={{
                        fontSize: 12,
                        fontFamily: FONT_SANS,
                        color: current.validateSsl ? C.success : C.warning,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {current.validateSsl ? 'Strict' : 'Allow Untrusted'}
                    </text>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  fontFamily: FONT_SANS,
                  color: C.text,
                  whiteSpace: 'nowrap',
                }}
              >
                About Nodd
              </text>

              <div
                style={{
                  backgroundColor: C.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.cardBorder,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    fontFamily: FONT_SANS,
                    color: C.text,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Nodd · Minimalist API Workbench
                </text>
                <text
                  style={{
                    fontSize: 13,
                    fontFamily: FONT_SANS,
                    color: C.secondary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Version 0.1.0 · Fast, GPU-accelerated HTTP client built with GPUIX
                </text>
                <text
                  style={{
                    fontSize: 12,
                    fontFamily: FONT_SANS,
                    color: C.tertiary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Designed with calm dark graphite aesthetics and zero UI bloat.
                </text>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
