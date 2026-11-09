import React, { useEffect, useMemo, useState } from 'react'
import { Button, motion } from '@gpuix/react'
import { Icon, type IconName } from './Icons'
import { C, FONT_MONO, FONT_SANS } from '../theme'
import type { Collection, Environment, HttpRequest } from '../core/types'

export interface CommandItem {
  id: string
  title: string
  category: string
  shortcut?: string
  icon: IconName
  action: () => void
}

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onSendRequest: () => void
  onSaveRequest: () => void
  onNewTab: () => void
  onCloseTab: () => void
  onToggleSidebar: () => void
  onOpenSettings: () => void
  onOpenEnvironmentManager: () => void
  onOpenCodeSnippets: () => void
  onImportCollection: () => void
  onExportCollection?: (col: Collection) => void
  onClearHistory: () => void
  environments: Environment[]
  activeEnvironment: Environment | null
  onSelectEnvironment: (env: Environment | null) => void
  collections: Collection[]
  onSelectRequest: (req: HttpRequest) => void
  currentRequest?: HttpRequest
}

export function CommandPalette({
  isOpen,
  onClose,
  onSendRequest,
  onSaveRequest,
  onNewTab,
  onCloseTab,
  onToggleSidebar,
  onOpenSettings,
  onOpenEnvironmentManager,
  onOpenCodeSnippets,
  onImportCollection,
  onExportCollection,
  onClearHistory,
  environments,
  activeEnvironment,
  onSelectEnvironment,
  collections,
  onSelectRequest,
  currentRequest,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Construct available command items
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      {
        id: 'send-request',
        title: 'Send Request',
        category: 'Request',
        shortcut: '^⏎',
        icon: 'send',
        action: onSendRequest,
      },
      {
        id: 'save-request',
        title: 'Save Request',
        category: 'Request',
        shortcut: '^S',
        icon: 'save',
        action: onSaveRequest,
      },
      {
        id: 'new-tab',
        title: 'New Request Tab',
        category: 'Workspace',
        shortcut: '^T',
        icon: 'plus',
        action: onNewTab,
      },
      {
        id: 'close-tab',
        title: 'Close Active Tab',
        category: 'Workspace',
        shortcut: '^W',
        icon: 'close',
        action: onCloseTab,
      },
      {
        id: 'toggle-sidebar',
        title: 'Toggle Sidebar',
        category: 'View',
        shortcut: '^B',
        icon: 'sidebar',
        action: onToggleSidebar,
      },
      {
        id: 'code-snippets',
        title: 'Generate Code Snippets (cURL, Fetch, Python)',
        category: 'Tools',
        icon: 'code',
        action: onOpenCodeSnippets,
      },
      {
        id: 'import-collection',
        title: 'Import Postman Collection',
        category: 'Collections',
        icon: 'collection',
        action: onImportCollection,
      },
      {
        id: 'manage-environments',
        title: 'Manage Environments...',
        category: 'Environment',
        icon: 'environment',
        action: onOpenEnvironmentManager,
      },
      {
        id: 'select-env-none',
        title: 'Select Environment: No Environment',
        category: 'Environment',
        icon: 'environment',
        action: () => onSelectEnvironment(null),
      },
    ]

    // Add each configured environment
    for (const env of environments) {
      list.push({
        id: `select-env-${env.id}`,
        title: `Select Environment: ${env.name}`,
        category: 'Environment',
        icon: 'environment',
        action: () => onSelectEnvironment(env),
      })
    }

    // Export collection if available
    if (collections.length > 0 && onExportCollection) {
      list.push({
        id: 'export-collection',
        title: `Export Collection: ${collections[0].name}`,
        category: 'Collections',
        icon: 'save',
        action: () => onExportCollection(collections[0]),
      })
    }

    // Clear history
    list.push({
      id: 'clear-history',
      title: 'Clear Request History',
      category: 'History',
      icon: 'trash',
      action: onClearHistory,
    })

    // Open settings
    list.push({
      id: 'open-settings',
      title: 'Open Settings',
      category: 'Settings',
      shortcut: '^,',
      icon: 'settings',
      action: onOpenSettings,
    })

    // Add requests from collections for fast jumping
    for (const col of collections) {
      const allReqs: HttpRequest[] = [...col.requests]
      for (const f of col.folders) {
        allReqs.push(...f.requests)
      }
      for (const req of allReqs) {
        list.push({
          id: `jump-req-${req.id}`,
          title: `Jump to: ${req.method} ${req.name}`,
          category: `Collection: ${col.name}`,
          icon: 'bolt',
          action: () => onSelectRequest(req),
        })
      }
    }

    return list
  }, [
    onSendRequest,
    onSaveRequest,
    onNewTab,
    onCloseTab,
    onToggleSidebar,
    onOpenCodeSnippets,
    onImportCollection,
    onOpenEnvironmentManager,
    onSelectEnvironment,
    environments,
    collections,
    onExportCollection,
    onClearHistory,
    onOpenSettings,
    onSelectRequest,
  ])

  // Filter commands
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allCommands
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    )
  }, [allCommands, query])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: any) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault?.()
        setSelectedIndex((prev) =>
          filteredCommands.length === 0 ? 0 : (prev + 1) % filteredCommands.length
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault?.()
        setSelectedIndex((prev) =>
          filteredCommands.length === 0
            ? 0
            : (prev - 1 + filteredCommands.length) % filteredCommands.length
        )
      } else if (e.key === 'Enter') {
        e.preventDefault?.()
        const selected = filteredCommands[selectedIndex]
        if (selected) {
          selected.action()
          onClose()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault?.()
        onClose()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }
  }, [filteredCommands, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <div
      testId="command-palette-backdrop"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#00000088',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 80,
        overflow: 'hidden',
      }}
      onMouseDown={onClose}
    >
      <motion.div
        {...({ testId: "command-palette-modal" } as any)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          width: 580,
          maxHeight: 460,
          backgroundColor: '#19191D',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.borderStrong,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onMouseDown={(e: any) => e.stopPropagation?.()}
      >
        {/* Input Bar */}
        <div
          style={{
            height: 48,
            borderBottomWidth: 1,
            borderColor: C.border,
            paddingLeft: 16,
            paddingRight: 16,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: '#1C1C22',
            flexShrink: 0,
          }}
        >
          <Icon name="search" size={15} color={C.secondary} />
          <input
            testId="command-palette-input"
            value={query}
            placeholder="Type a command or search..."
            theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
            style={{
              width: '100%',
              fontSize: 13.5,
              fontFamily: FONT_SANS,
              color: C.text,
              backgroundColor: 'transparent',
              borderWidth: 0,
              padding: 0,
            }}
            onChange={(e) => {
              setQuery(e.value ?? '')
              setSelectedIndex(0)
            }}
          />
          <div
            style={{
              paddingLeft: 6,
              paddingRight: 6,
              height: 20,
              borderRadius: 4,
              backgroundColor: C.surfaceHighlight,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <text style={{ fontSize: 10.5, fontFamily: FONT_MONO, color: C.tertiary, whiteSpace: 'nowrap' }}>
              ESC
            </text>
          </div>
        </div>

        {/* Command Items List */}
        <div
          testId="command-palette-list"
          style={{
            flexGrow: 1,
            maxHeight: 360,
            overflowY: 'scroll',
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {filteredCommands.length === 0 ? (
            <div
              style={{
                paddingTop: 36,
                paddingBottom: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <text style={{ fontSize: 13, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
                No matching commands
              </text>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = selectedIndex === idx
              return (
                <Button
                  key={cmd.id}
                  testId={`command-item-${cmd.id}`}
                  onClick={() => {
                    cmd.action()
                    onClose()
                  }}
                  style={{
                    height: 38,
                    paddingLeft: 12,
                    paddingRight: 12,
                    borderRadius: 6,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? C.surfaceHighlight : 'transparent',
                    hover: { backgroundColor: C.surfaceHighlight },
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Icon name={cmd.icon} size={14} color={isSelected ? C.text : C.secondary} />
                    <text
                      style={{
                        fontSize: 13,
                        fontFamily: FONT_SANS,
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? C.text : C.secondary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cmd.title}
                    </text>
                    <div
                      style={{
                        paddingLeft: 5,
                        paddingRight: 5,
                        height: 16,
                        borderRadius: 3,
                        backgroundColor: '#1E1E24',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <text style={{ fontSize: 10, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
                        {cmd.category}
                      </text>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <div
                      style={{
                        paddingLeft: 6,
                        paddingRight: 6,
                        height: 18,
                        borderRadius: 4,
                        backgroundColor: '#24242C',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <text style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.tertiary, whiteSpace: 'nowrap' }}>
                        {cmd.shortcut}
                      </text>
                    </div>
                  )}
                </Button>
              )
            })
          )}
        </div>

        {/* Footer Hint Bar */}
        <div
          style={{
            height: 28,
            borderTopWidth: 1,
            borderColor: C.border,
            paddingLeft: 16,
            paddingRight: 16,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#141418',
            flexShrink: 0,
          }}
        >
          <text style={{ fontSize: 11, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
            ↑↓ navigate · ↵ select · esc close
          </text>
          <text style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.tertiary, whiteSpace: 'nowrap' }}>
            {`${filteredCommands.length} commands`}
          </text>
        </div>
      </motion.div>
    </div>
  )
}
