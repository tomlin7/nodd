import React from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS } from '../theme'

interface EmptyWorkbenchProps {
  onNewTab: () => void
}

export function EmptyWorkbench({ onNewTab }: EmptyWorkbenchProps) {
  return (
    <div
      testId="empty-workbench"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        width: '100%',
        height: '100%',
        backgroundColor: C.canvas,
        padding: 32,
        gap: 20,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: '#19191D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="sparkle" size={24} color={C.accent} />
      </div>

      {/* Heading & Subheading */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
        <text
          style={{
            fontSize: 16,
            fontFamily: FONT_SANS,
            fontWeight: '600',
            color: C.text,
            whiteSpace: 'nowrap',
          }}
        >
          No Open Requests
        </text>
        <text
          style={{
            fontSize: 13,
            fontFamily: FONT_SANS,
            color: C.secondary,
            whiteSpace: 'nowrap',
          }}
        >
          Select a request from the sidebar or open a new scratchpad tab.
        </text>
      </div>

      {/* Primary Action Button */}
      <Button
        testId="empty-workbench-new-tab-btn"
        onClick={onNewTab}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          height: 38,
          paddingLeft: 18,
          paddingRight: 18,
          borderRadius: 8,
          backgroundColor: C.accent,
          cursor: 'pointer',
          hover: { backgroundColor: C.accentHover },
        }}
      >
        <Icon name="plus" size={13} color="#FFFFFF" />
        <text
          style={{
            fontSize: 13,
            fontFamily: FONT_SANS,
            fontWeight: '600',
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
          }}
        >
          New Request
        </text>
        <div
          style={{
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 1,
            paddingBottom: 1,
            borderRadius: 4,
            backgroundColor: '#00000033',
          }}
        >
          <text
            style={{
              fontSize: 11,
              fontFamily: FONT_MONO,
              color: '#FFFFFFCC',
              whiteSpace: 'nowrap',
            }}
          >
            Ctrl+T
          </text>
        </div>
      </Button>

      {/* Shortcuts List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderColor: C.border,
          width: 280,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
            New Tab
          </text>
          <text style={{ fontSize: 11.5, fontFamily: FONT_MONO, color: C.secondary, whiteSpace: 'nowrap' }}>
            Ctrl+T
          </text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
            Toggle Sidebar
          </text>
          <text style={{ fontSize: 11.5, fontFamily: FONT_MONO, color: C.secondary, whiteSpace: 'nowrap' }}>
            Ctrl+B
          </text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
            New Collection Request
          </text>
          <text style={{ fontSize: 11.5, fontFamily: FONT_MONO, color: C.secondary, whiteSpace: 'nowrap' }}>
            Ctrl+N
          </text>
        </div>
      </div>
    </div>
  )
}
