import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@gpuix/react'
import { Icon, type IconName } from './components/Icons'
import { useTooltip } from './components/tooltip-layer'

export const C = {
  canvas: '#121215',
  surface: '#18181C',
  surfaceHighlight: '#26262D',
  sidebar: '#141417',
  header: '#161619',
  raised: '#1C1C21',
  card: '#202024',
  cardBorder: '#E6EAF20A',
  composer: '#1B1B20',
  overlay: '#E6EAF20D',
  overlayStrong: '#E6EAF217',
  item: '#F0F0F00F',
  border: '#E6EAF212',
  borderStrong: '#E6EAF224',
  sidebarBorder: '#232328',
  text: '#EDEDF0',
  secondary: '#9E9EA9',
  tertiary: '#6E6E7A',
  ghost: '#4A4A54',
  accent: '#E2795B',
  accentHover: '#EA876B',
  error: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  info: '#60A5FA',
  inverse: '#E7E9EC',
  onInverse: '#17181C',
  methods: {
    GET: '#34D399',
    POST: '#60A5FA',
    PUT: '#FBBF24',
    DELETE: '#F87171',
    PATCH: '#A78BFA',
    HEAD: '#9E9EA9',
    OPTIONS: '#94A3B8',
  },
}

export const IS_DARWIN = typeof process !== 'undefined' && process.platform === 'darwin'

export const TITLEBAR_HEIGHT = 48
export const FONT_SANS = typeof window === 'undefined' ? 'Helvetica' : 'IBM Plex Sans'
export const FONT_MONO = typeof window === 'undefined' ? 'Menlo' : 'Lilex'

export function IconButton({
  icon,
  onClick,
  dimmed,
  size = 14,
  testId,
  borderRadius = 7,
  active = false,
  tooltip,
}: {
  icon: IconName
  onClick?: () => void
  dimmed?: boolean
  size?: number
  testId?: string
  borderRadius?: number
  active?: boolean
  tooltip?: string
}) {
  const [hovered, setHovered] = useState(false)
  const { show, hide } = useTooltip()
  const anchorRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  const handleLayout = (event: any) => {
    if (typeof event?.x !== 'number') return
    anchorRef.current = {
      x: event.x,
      y: event.y,
      width: event.width ?? 0,
      height: event.height ?? 0,
    }
  }

  useEffect(() => {
    if (!hovered || !tooltip || active) {
      hide()
      return
    }
    const anchor = anchorRef.current
    if (anchor) show({ text: tooltip, ...anchor })
  }, [hovered, tooltip, active, show, hide])

  return (
    <div style={{ position: 'relative' }} onLayout={handleLayout}>
      <Button
        testId={testId}
        disabled={dimmed}
        style={{
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: dimmed ? 0.35 : 1,
          backgroundColor: active ? '#2B2B2F' : '#00000000',
          hover: dimmed ? undefined : { backgroundColor: active ? '#2B2B2F' : C.overlay },
          active: dimmed ? undefined : { backgroundColor: C.overlayStrong },
        }}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Icon name={icon} size={size} color={active ? C.text : C.tertiary} />
      </Button>
      {hovered && tooltip && !active && (
        <div
          style={{
            position: 'absolute',
            top: 34,
            right: 0,
            backgroundColor: '#1E1E20',
            borderWidth: 1,
            borderColor: '#2E2E32',
            borderRadius: 6,
            paddingTop: 4,
            paddingBottom: 4,
            paddingLeft: 8,
            paddingRight: 8,
            boxShadow: {
              offsetX: 0,
              offsetY: 4,
              blurRadius: 12,
              spreadRadius: 0,
              color: '#00000080',
            },
          }}
        >
          <text
            style={{
              fontSize: 11,
              fontFamily: FONT_SANS,
              color: C.secondary,
              whiteSpace: 'nowrap',
            }}
          >
            {tooltip}
          </text>
        </div>
      )}
    </div>
  )
}

export function ResizeHandle({
  testId,
  isResizing,
  side = 'left',
  onMouseDown,
}: {
  testId?: string
  isResizing?: boolean
  side?: 'left' | 'right'
  onMouseDown?: (e: any) => void
}) {
  return (
    <div
      testId={testId}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        ...(side === 'left' ? { right: 0 } : { left: 0 }),
        width: 8,
        cursor: 'col-resize',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={onMouseDown}
    >
      <div
        style={{
          width: 1,
          height: '100%',
          backgroundColor: isResizing ? C.accent : 'transparent',
          hover: { backgroundColor: C.borderStrong },
        }}
      />
    </div>
  )
}
