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
          borderColor: C.sidebarBorder,
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
            height: 34,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 10,
            paddingRight: 10,
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
                  borderRadius: 10,
                  padding: 20,
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
                        fontSize: 13.5,
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
                        fontSize: 12.5,
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
                      height: 30,
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
                        fontSize: 12.5,
                        fontFamily: FONT_MONO,
                        color: C.text,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {`${current.timeoutMs}ms`}
                    </text>
                  </Button>
                </div>

                <div style={{ height: 1, backgroundColor: '#25252A' }} />

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
                        fontSize: 13.5,
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
                        fontSize: 12.5,
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
                      height: 30,
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
                        fontSize: 12.5,
                        fontFamily: FONT_SANS,
                        color: current.followRedirects ? C.success : C.tertiary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {current.followRedirects ? 'Enabled' : 'Disabled'}
                    </text>
                  </Button>
                </div>

                <div style={{ height: 1, backgroundColor: '#25252A' }} />

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
                        fontSize: 13.5,
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
                        fontSize: 12.5,
                        fontFamily: FONT_SANS,
                        color: C.secondary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Reject connections to hosts with untrusted or self-signed certificates
                    </text>
                  </div>
                  <Button
                    onClick={() => update({ validateSsl: !current.validateSsl })}
                    style={{
                      height: 30,
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
                        fontSize: 12.5,
                        fontFamily: FONT_SANS,
                        color: current.validateSsl ? C.success : C.tertiary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {current.validateSsl ? 'Enabled' : 'Disabled'}
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
                  borderRadius: 10,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      fontFamily: FONT_SANS,
                      color: C.text,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Nodd
                  </text>
                  <text
                    style={{
                      fontSize: 12.5,
                      fontFamily: FONT_MONO,
                      color: C.tertiary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    v1.0.0
                  </text>
                </div>
                <text
                  style={{
                    fontSize: 13,
                    fontFamily: FONT_SANS,
                    color: C.secondary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Minimalist API Workbench built with GPUIX.
                </text>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
