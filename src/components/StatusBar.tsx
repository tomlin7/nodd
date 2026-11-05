import React from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS } from '../theme'
import type { Environment, HttpResponse } from '../core/types'
import { formatBytes } from './ResponseViewer'

export function StatusBar({
  activeEnvironment,
  response,
  isLoading,
  onOpenEnvironmentManager,
}: {
  activeEnvironment?: Environment | null
  response?: HttpResponse | null
  isLoading?: boolean
  onOpenEnvironmentManager?: () => void
}) {
  const getStatusColor = (status?: number) => {
    if (!status) return C.tertiary
    if (status >= 200 && status < 300) return C.success
    if (status >= 300 && status < 400) return C.info
    if (status >= 400 && status < 500) return C.warning
    return C.error
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 28,
        backgroundColor: C.header,
        borderTopWidth: 1,
        borderColor: C.border,
        paddingLeft: 14,
        paddingRight: 14,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Left: Environment pill */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Button
          testId="status-bar-env"
          onClick={onOpenEnvironmentManager}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingLeft: 6,
            paddingRight: 6,
            height: 20,
            borderRadius: 4,
            cursor: 'pointer',
            hover: { backgroundColor: C.overlay },
          }}
        >
          <Icon name="environment" size={11} color={activeEnvironment ? C.accent : C.tertiary} />
          <text
            style={{
              fontSize: 12,
              fontFamily: FONT_SANS,
              color: activeEnvironment ? C.secondary : C.tertiary,
              whiteSpace: 'nowrap',
            }}
          >
            {activeEnvironment ? activeEnvironment.name : 'No Environment'}
          </text>
        </Button>
      </div>

      {/* Center: Live status / response overview */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="sparkle" size={11} color={C.accent} />
            <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.accent, whiteSpace: 'nowrap' }}>
              Sending HTTP request...
            </text>
          </div>
        ) : response ? (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: getStatusColor(response.status),
                }}
              />
              <text
                style={{
                  fontSize: 12,
                  fontFamily: FONT_MONO,
                  fontWeight: '700',
                  color: getStatusColor(response.status),
                  whiteSpace: 'nowrap',
                }}
              >
                {`${response.status} ${response.statusText}`}
              </text>
            </div>
            <text style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.tertiary, whiteSpace: 'nowrap' }}>
              ·
            </text>
            <text style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.secondary, whiteSpace: 'nowrap' }}>
              {`${response.timeMs}ms`}
            </text>
            <text style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.tertiary, whiteSpace: 'nowrap' }}>
              ·
            </text>
            <text style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.secondary, whiteSpace: 'nowrap' }}>
              {formatBytes(response.sizeBytes)}
            </text>
          </div>
        ) : (
          <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.ghost, whiteSpace: 'nowrap' }}>
            Ready
          </text>
        )}
      </div>

      {/* Right: Keyboard shortcuts cheat sheet */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <text style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.tertiary, whiteSpace: 'nowrap' }}>
            ^⏎
          </text>
          <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
            Send
          </text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <text style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.tertiary, whiteSpace: 'nowrap' }}>
            ^S
          </text>
          <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
            Save
          </text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <text style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.tertiary, whiteSpace: 'nowrap' }}>
            ^N
          </text>
          <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
            New
          </text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <text style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.tertiary, whiteSpace: 'nowrap' }}>
            ^B
          </text>
          <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
            Sidebar
          </text>
        </div>
      </div>
    </div>
  )
}
