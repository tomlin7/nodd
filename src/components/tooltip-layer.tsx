import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Tooltips that live above the canvas.
 *
 * GPUIX has no z-index: the paint order is the tree order. A tooltip drawn
 * inside the titlebar is therefore painted before the reader, and the page
 * canvas covers it. So the tooltip is drawn in an overlay that is the last
 * child of the window instead, and it is positioned in window coordinates.
 *
 * The state lives in the overlay, not in the provider. A provider that held
 * it would redraw the whole window every time a label appeared.
 */

export interface TooltipAnchor {
  text: string
  /** The anchor's box, in window coordinates. */
  x: number
  y: number
  width: number
  height: number
}

interface TooltipApi {
  show: (anchor: TooltipAnchor) => void
  hide: () => void
}

const TooltipContext = createContext<TooltipApi>({ show: () => {}, hide: () => {} })

export function useTooltip(): TooltipApi {
  return useContext(TooltipContext)
}

/** The label that is showing, and the listeners that want to know about it. */
let current: TooltipAnchor | null = null
const listeners = new Set<(anchor: TooltipAnchor | null) => void>()

const api: TooltipApi = {
  show(next: TooltipAnchor) {
    current = next
    for (const listener of listeners) listener(next)
  },
  hide() {
    if (current === null) return
    current = null
    for (const listener of listeners) listener(null)
  },
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => api, [])

  return (
    <TooltipContext.Provider value={value}>
      {children}
      <TooltipOverlay />
    </TooltipContext.Provider>
  )
}

function TooltipOverlay() {
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(current)

  useEffect(() => {
    const listener = (next: TooltipAnchor | null) => setAnchor(next)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  if (!anchor) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: anchor.x,
        top: anchor.y + anchor.height + 6,
        display: 'flex',
        alignItems: 'center',
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#2E2E32',
        backgroundColor: '#1E1E20',
        boxShadow: {
          offsetX: 0,
          offsetY: 4,
          blurRadius: 12,
          spreadRadius: 0,
          color: '#00000080',
        },
        // The overlay is chrome: it must not eat the click meant for the page.
        pointerEvents: 'none',
      }}
    >
      <text style={{ fontSize: 11, fontFamily: 'IBM Plex Sans', color: '#9E9EA9', whiteSpace: 'nowrap' }}>
        {anchor.text}
      </text>
    </div>
  )
}
