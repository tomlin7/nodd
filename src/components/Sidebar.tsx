import React, { useMemo, useState } from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS, IconButton } from '../theme'
import type { Collection, CollectionFolder, HistoryEntry, HttpRequest } from '../core/types'
import { createId } from '../core/url'

export function Sidebar({
  collections,
  history,
  activeRequestId,
  onSelectRequest,
  onCreateRequest,
  onCreateCollection,
  onDeleteRequest,
  onClearHistory,
}: {
  collections: Collection[]
  history: HistoryEntry[]
  activeRequestId?: string
  onSelectRequest: (req: HttpRequest) => void
  onCreateRequest: (collectionId?: string) => void
  onCreateCollection: () => void
  onDeleteRequest: (requestId: string) => void
  onClearHistory: () => void
}) {
  const [activeTab, setActiveTab] = useState<'collections' | 'history'>('collections')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({})
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  const toggleCollection = (id: string) => {
    setExpandedCollections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Filtered collections
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections
    const q = searchQuery.toLowerCase()

    return collections.map((col) => {
      const directRequests = col.requests.filter(
        (r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q)
      )
      const matchedFolders = col.folders.map((f) => ({
        ...f,
        requests: f.requests.filter(
          (r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q)
        ),
      })).filter((f) => f.requests.length > 0 || f.name.toLowerCase().includes(q))

      return {
        ...col,
        folders: matchedFolders,
        requests: directRequests,
      }
    }).filter((col) => col.requests.length > 0 || col.folders.length > 0 || col.name.toLowerCase().includes(q))
  }, [collections, searchQuery])

  // Filtered history
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history
    const q = searchQuery.toLowerCase()
    return history.filter(
      (h) => h.request.name.toLowerCase().includes(q) || h.request.url.toLowerCase().includes(q)
    )
  }, [history, searchQuery])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: C.sidebar,
        borderRightWidth: 1,
        borderColor: C.sidebarBorder,
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar Header: Collections vs History Tabs */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 40,
          paddingLeft: 12,
          paddingRight: 10,
          borderBottomWidth: 1,
          borderColor: C.border,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
          <Button
            testId="sidebar-tab-collections"
            onClick={() => setActiveTab('collections')}
            style={{
              height: 26,
              paddingLeft: 8,
              paddingRight: 8,
              borderRadius: 5,
              backgroundColor: activeTab === 'collections' ? C.surfaceHighlight : 'transparent',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <text
              style={{
                fontSize: 12,
                fontFamily: FONT_SANS,
                fontWeight: activeTab === 'collections' ? '600' : '400',
                color: activeTab === 'collections' ? C.text : C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              Collections
            </text>
          </Button>

          <Button
            testId="sidebar-tab-history"
            onClick={() => setActiveTab('history')}
            style={{
              height: 26,
              paddingLeft: 8,
              paddingRight: 8,
              borderRadius: 5,
              backgroundColor: activeTab === 'history' ? C.surfaceHighlight : 'transparent',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <text
              style={{
                fontSize: 12,
                fontFamily: FONT_SANS,
                fontWeight: activeTab === 'history' ? '600' : '400',
                color: activeTab === 'history' ? C.text : C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              {`History (${history.length})`}
            </text>
          </Button>
        </div>

        {activeTab === 'collections' ? (
          <Button
            testId="new-collection-btn"
            onClick={onCreateCollection}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              hover: { backgroundColor: C.overlay },
            }}
          >
            <Icon name="plus" size={13} color={C.secondary} />
          </Button>
        ) : (
          <Button
            testId="clear-history-btn"
            onClick={onClearHistory}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              hover: { backgroundColor: '#3F2427' },
            }}
          >
            <Icon name="trash" size={12} color={C.tertiary} />
          </Button>
        )}
      </div>

      {/* Search Filter Input */}
      <div
        style={{
          paddingLeft: 10,
          paddingRight: 10,
          paddingTop: 8,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderColor: C.cardBorder,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: 28,
            borderRadius: 6,
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          <Icon name="search" size={12} color={C.tertiary} />
          <input
            testId="sidebar-search-input"
            value={searchQuery}
            placeholder={activeTab === 'collections' ? 'Filter requests…' : 'Search history…'}
            theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
            style={{
              width: '100%',
              fontSize: 11,
              fontFamily: FONT_SANS,
              color: C.text,
              backgroundColor: 'transparent',
              borderWidth: 0,
              padding: 0,
            }}
            onChange={(e) => setSearchQuery(e.value ?? '')}
          />
        </div>
      </div>

      {/* List Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 8,
          paddingBottom: 8,
          overflow: 'hidden',
          gap: 2,
        }}
      >
        {activeTab === 'collections' ? (
          filteredCollections.length === 0 ? (
            <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
                No collections found
              </text>
            </div>
          ) : (
            filteredCollections.map((col) => {
              const isColExpanded = expandedCollections[col.id] !== false
              return (
                <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Collection Row */}
                  <Button
                    testId={`collection-${col.id}`}
                    onClick={() => toggleCollection(col.id)}
                    style={{
                      height: 28,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingLeft: 6,
                      paddingRight: 6,
                      borderRadius: 5,
                      cursor: 'pointer',
                      hover: { backgroundColor: C.surfaceHighlight },
                    }}
                  >
                    <Icon name={isColExpanded ? 'chevronDown' : 'chevronRight'} size={11} color={C.tertiary} />
                    <Icon name="collection" size={13} color={C.accent} />
                    <text
                      style={{
                        fontSize: 12,
                        fontFamily: FONT_SANS,
                        fontWeight: '600',
                        color: C.text,
                        whiteSpace: 'nowrap',
                        flexGrow: 1,
                      }}
                    >
                      {col.name}
                    </text>
                  </Button>

                  {/* Folders & Direct Requests */}
                  {isColExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 14, gap: 1 }}>
                      {/* Folders */}
                      {col.folders.map((folder) => {
                        const isFolderExpanded = expandedFolders[folder.id] !== false
                        return (
                          <div key={folder.id} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                              testId={`folder-${folder.id}`}
                              onClick={() => toggleFolder(folder.id)}
                              style={{
                                height: 26,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingLeft: 6,
                                paddingRight: 6,
                                borderRadius: 4,
                                cursor: 'pointer',
                                hover: { backgroundColor: C.surfaceHighlight },
                              }}
                            >
                              <Icon name={isFolderExpanded ? 'chevronDown' : 'chevronRight'} size={10} color={C.tertiary} />
                              <Icon name="folder" size={12} color={C.secondary} />
                              <text style={{ fontSize: 11, fontFamily: FONT_SANS, color: C.secondary, whiteSpace: 'nowrap', flexGrow: 1 }}>
                                {folder.name}
                              </text>
                            </Button>

                            {/* Folder Requests */}
                            {isFolderExpanded && (
                              <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 16, gap: 1 }}>
                                {folder.requests.map((req) => (
                                  <RequestTreeRow
                                    key={req.id}
                                    request={req}
                                    active={req.id === activeRequestId}
                                    onSelect={() => onSelectRequest(req)}
                                    onDelete={() => onDeleteRequest(req.id)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Direct Requests */}
                      {col.requests.map((req) => (
                        <RequestTreeRow
                          key={req.id}
                          request={req}
                          active={req.id === activeRequestId}
                          onSelect={() => onSelectRequest(req)}
                          onDelete={() => onDeleteRequest(req.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )
        ) : (
          /* History Tab */
          filteredHistory.length === 0 ? (
            <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
                No request history
              </text>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <Button
                key={item.id}
                testId={`history-item-${item.id}`}
                onClick={() => onSelectRequest(item.request)}
                style={{
                  height: 32,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 5,
                  cursor: 'pointer',
                  hover: { backgroundColor: C.surfaceHighlight },
                }}
              >
                <div style={{ width: 34, flexShrink: 0 }}>
                  <text
                    style={{
                      fontSize: 10,
                      fontFamily: FONT_MONO,
                      fontWeight: '700',
                      color: C.methods[item.request.method] || C.text,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.request.method}
                  </text>
                </div>
                <text
                  style={{
                    fontSize: 11,
                    fontFamily: FONT_SANS,
                    color: C.text,
                    whiteSpace: 'nowrap',
                    flexGrow: 1,
                  }}
                >
                  {item.request.name || item.request.url}
                </text>
                {item.response && (
                  <text
                    style={{
                      fontSize: 10,
                      fontFamily: FONT_MONO,
                      color: item.response.status >= 200 && item.response.status < 300 ? C.success : C.warning,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {`${item.response.status}`}
                  </text>
                )}
              </Button>
            ))
          )
        )}
      </div>
    </div>
  )
}

function RequestTreeRow({
  request,
  active,
  onSelect,
  onDelete,
}: {
  request: HttpRequest
  active: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const methodColor = C.methods[request.method] || C.accent

  return (
    <Button
      testId={`request-row-${request.id}`}
      onClick={onSelect}
      style={{
        height: 26,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 6,
        paddingRight: 6,
        borderRadius: 4,
        cursor: 'pointer',
        backgroundColor: active ? C.surfaceHighlight : 'transparent',
        hover: { backgroundColor: C.surfaceHighlight },
      }}
    >
      <div style={{ width: 30, flexShrink: 0 }}>
        <text
          style={{
            fontSize: 9,
            fontFamily: FONT_MONO,
            fontWeight: '700',
            color: methodColor,
            whiteSpace: 'nowrap',
          }}
        >
          {request.method}
        </text>
      </div>
      <text
        style={{
          fontSize: 11,
          fontFamily: FONT_SANS,
          color: active ? C.text : C.secondary,
          whiteSpace: 'nowrap',
          flexGrow: 1,
        }}
      >
        {request.name}
      </text>
    </Button>
  )
}
