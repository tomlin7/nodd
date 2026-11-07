import React from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS } from '../theme'
import type { WorkspaceTab } from '../core/types'
import { isTabDirty } from '../core/tabs'

interface TabBarProps {
  tabs: WorkspaceTab[]
  activeTabId: string
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onNewTab: () => void
}

export function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}: TabBarProps) {
  return (
    <div
      testId="tab-bar"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: 36,
        backgroundColor: '#131316',
        borderBottomWidth: 1,
        borderColor: C.border,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Tabs scrollable / flex container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          height: '100%',
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const dirty = isTabDirty(tab)
          const method = tab.request.method || 'GET'
          const methodColor = (C.methods as Record<string, string>)[method] ?? C.secondary
          const tabTitle = tab.request.name.trim() || 'Untitled Request'

          return (
            <div
              key={tab.id}
              testId={`tab-item-${tab.id}`}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: 36,
                paddingRight: 6,
                maxWidth: 220,
                minWidth: 130,
                backgroundColor: isActive ? '#1A1A1E' : 'transparent',
                borderRightWidth: 1,
                borderColor: C.border,
                position: 'relative',
              }}
            >
              {/* Tab Select Button */}
              <Button
                testId={`tab-select-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  height: '100%',
                  paddingLeft: 12,
                  paddingRight: 4,
                  flexGrow: 1,
                  minWidth: 0,
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  hover: {
                    backgroundColor: isActive ? '#1A1A1E' : C.overlay,
                  },
                }}
              >
                {/* Method badge */}
                <text
                  style={{
                    fontSize: 10,
                    fontFamily: FONT_MONO,
                    fontWeight: '700',
                    color: methodColor,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {method}
                </text>

                {/* Tab Title */}
                <text
                  style={{
                    fontSize: 12.5,
                    fontFamily: FONT_SANS,
                    fontWeight: isActive ? '500' : '400',
                    color: isActive ? C.text : C.secondary,
                    whiteSpace: 'nowrap',
                    flexGrow: 1,
                    flexShrink: 1,
                    overflow: 'hidden',
                  }}
                >
                  {tabTitle}
                </text>

                {/* Dirty indicator */}
                {dirty && (
                  <div
                    testId={`tab-dirty-${tab.id}`}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: C.accent,
                      flexShrink: 0,
                    }}
                  />
                )}
              </Button>

              {/* Close Button */}
              <Button
                testId={`close-tab-${tab.id}`}
                onClick={() => onCloseTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  hover: { backgroundColor: C.overlayStrong },
                }}
              >
                <Icon name="close" size={10} color={isActive ? C.secondary : C.ghost} />
              </Button>
            </div>
          )
        })}
      </div>

      {/* New Tab Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 6,
          paddingRight: 8,
          flexShrink: 0,
        }}
      >
        <Button
          testId="new-tab-button"
          onClick={onNewTab}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: 5,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            hover: { backgroundColor: C.overlay },
          }}
        >
          <Icon name="plus" size={13} color={C.tertiary} />
        </Button>
      </div>
    </div>
  )
}
