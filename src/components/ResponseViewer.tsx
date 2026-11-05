import React, { useMemo, useState } from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS } from '../theme'
import type { HttpResponse } from '../core/types'

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return C.success
  if (status >= 300 && status < 400) return C.info
  if (status >= 400 && status < 500) return C.warning
  return C.error
}

export function ResponseViewer({
  response,
  isLoading,
}: {
  response: HttpResponse | null
  isLoading?: boolean
}) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body')
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty')
  const [copied, setCopied] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')

  // Formatted JSON lines
  const { formattedBody, isJson } = useMemo(() => {
    if (!response || !response.body) return { formattedBody: '', isJson: false }
    try {
      const parsed = JSON.parse(response.body)
      return {
        formattedBody: JSON.stringify(parsed, null, 2),
        isJson: true,
      }
    } catch {
      return {
        formattedBody: response.body,
        isJson: false,
      }
    }
  }, [response])

  const lines = useMemo(() => {
    const text = viewMode === 'pretty' ? formattedBody : (response?.body ?? '')
    if (!text) return []
    const allLines = text.split('\n')
    if (!filterQuery.trim()) return allLines
    const q = filterQuery.toLowerCase()
    return allLines.filter((l) => l.toLowerCase().includes(q))
  }, [formattedBody, response, viewMode, filterQuery])

  const copyToClipboard = async () => {
    if (!response?.body) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(response.body)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <text
          style={{
            fontSize: 13.5,
            fontFamily: FONT_SANS,
            color: C.tertiary,
            whiteSpace: 'nowrap',
          }}
        >
          Sending request…
        </text>
      </div>
    )
  }

  if (!response) {
    return (
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <text
          style={{
            fontSize: 13.5,
            fontFamily: FONT_SANS,
            color: C.tertiary,
            whiteSpace: 'nowrap',
          }}
        >
          Send a request to inspect response
        </text>
      </div>
    )
  }

  const statusColor = getStatusColor(response.status)
  const headerEntries = Object.entries(response.headers)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        width: '100%',
        height: '100%',
        backgroundColor: C.canvas,
        overflow: 'hidden',
      }}
    >
      {/* Top Response Header Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 44,
          paddingLeft: 20,
          paddingRight: 20,
          backgroundColor: C.surface,
          flexShrink: 0,
        }}
      >
        {/* Left: Status, Time, Size */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Status Badge */}
          <div
            testId="response-status-badge"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingLeft: 10,
              paddingRight: 10,
              height: 28,
              borderRadius: 6,
              backgroundColor: C.surfaceHighlight,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: statusColor,
              }}
            />
            <text
              style={{
                fontSize: 13,
                fontFamily: FONT_MONO,
                fontWeight: '700',
                color: statusColor,
                whiteSpace: 'nowrap',
              }}
            >
              {response.status === 0
                ? 'Network Error'
                : `${response.status} ${response.statusText}`}
            </text>
          </div>

          {/* Time Badge */}
          <div
            testId="response-time-badge"
            style={{
              paddingLeft: 8,
              paddingRight: 8,
              height: 28,
              borderRadius: 6,
              backgroundColor: C.surfaceHighlight,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <text
              style={{
                fontSize: 12.5,
                fontFamily: FONT_MONO,
                color: C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              {`${response.timeMs} ms`}
            </text>
          </div>

          {/* Size Badge */}
          <div
            testId="response-size-badge"
            style={{
              paddingLeft: 8,
              paddingRight: 8,
              height: 28,
              borderRadius: 6,
              backgroundColor: C.surfaceHighlight,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <text
              style={{
                fontSize: 12.5,
                fontFamily: FONT_MONO,
                color: C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              {formatBytes(response.sizeBytes)}
            </text>
          </div>
        </div>

        {/* Right: Body / Headers Tabs & Actions */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* View Mode (Pretty vs Raw) */}
          {activeTab === 'body' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                borderRadius: 6,
                backgroundColor: C.surfaceHighlight,
                padding: 2,
              }}
            >
              <Button
                testId="view-mode-pretty"
                onClick={() => setViewMode('pretty')}
                style={{
                  height: 24,
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 4,
                  backgroundColor: viewMode === 'pretty' ? C.surface : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <text
                  style={{
                    fontSize: 12,
                    fontFamily: FONT_SANS,
                    fontWeight: viewMode === 'pretty' ? '600' : '400',
                    color: viewMode === 'pretty' ? C.text : C.tertiary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Pretty
                </text>
              </Button>
              <Button
                testId="view-mode-raw"
                onClick={() => setViewMode('raw')}
                style={{
                  height: 24,
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 4,
                  backgroundColor: viewMode === 'raw' ? C.surface : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <text
                  style={{
                    fontSize: 12,
                    fontFamily: FONT_SANS,
                    fontWeight: viewMode === 'raw' ? '600' : '400',
                    color: viewMode === 'raw' ? C.text : C.tertiary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Raw
                </text>
              </Button>
            </div>
          )}

          {/* Body / Headers Toggle */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
            <Button
              testId="response-tab-body"
              onClick={() => setActiveTab('body')}
              style={{
                height: 28,
                paddingLeft: 12,
                paddingRight: 12,
                borderRadius: 6,
                backgroundColor: activeTab === 'body' ? C.surfaceHighlight : 'transparent',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <text
                style={{
                  fontSize: 13,
                  fontFamily: FONT_SANS,
                  fontWeight: activeTab === 'body' ? '600' : '500',
                  color: activeTab === 'body' ? C.text : C.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                Body
              </text>
            </Button>
            <Button
              testId="response-tab-headers"
              onClick={() => setActiveTab('headers')}
              style={{
                height: 28,
                paddingLeft: 12,
                paddingRight: 12,
                borderRadius: 6,
                backgroundColor: activeTab === 'headers' ? C.surfaceHighlight : 'transparent',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <text
                style={{
                  fontSize: 13,
                  fontFamily: FONT_SANS,
                  fontWeight: activeTab === 'headers' ? '600' : '500',
                  color: activeTab === 'headers' ? C.text : C.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {`Headers (${headerEntries.length})`}
              </text>
            </Button>
          </div>

          {/* Copy Body Button */}
          <Button
            testId="copy-response-button"
            onClick={copyToClipboard}
            style={{
              height: 28,
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 6,
              backgroundColor: C.surfaceHighlight,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              hover: { backgroundColor: C.borderStrong },
            }}
          >
            <Icon name={copied ? 'check' : 'copy'} size={12} color={copied ? C.success : C.secondary} />
            <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: copied ? C.success : C.secondary, whiteSpace: 'nowrap' }}>
              {copied ? 'Copied' : 'Copy'}
            </text>
          </Button>
        </div>
      </div>

      {/* Network Error Banner */}
      {response.error && (
        <div
          style={{
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 12,
            paddingBottom: 12,
            backgroundColor: '#251517',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="close" size={14} color={C.error} />
          <text style={{ fontSize: 13, fontFamily: FONT_SANS, color: C.error, whiteSpace: 'nowrap' }}>
            {response.error}
          </text>
        </div>
      )}

      {/* Content Area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          overflow: 'hidden',
          padding: 16,
        }}
      >
        {activeTab === 'body' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              borderRadius: 10,
              backgroundColor: C.card,
              overflow: 'hidden',
            }}
          >
            {/* Filter / Search Bar */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingLeft: 14,
                paddingRight: 14,
                height: 36,
                backgroundColor: '#1E1E23',
              }}
            >
              <Icon name="search" size={13} color={C.tertiary} />
              <input
                testId="response-filter-input"
                value={filterQuery}
                placeholder="Filter response body..."
                theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
                style={{
                  width: '100%',
                  fontSize: 13,
                  fontFamily: FONT_MONO,
                  color: C.text,
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  padding: 0,
                }}
                onChange={(e) => setFilterQuery(e.value ?? '')}
              />
              {filterQuery && (
                <Button onClick={() => setFilterQuery('')} style={{ cursor: 'pointer' }}>
                  <Icon name="close" size={12} color={C.tertiary} />
                </Button>
              )}
            </div>

            {/* Line Viewer */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                padding: 12,
                overflow: 'hidden',
              }}
            >
              {lines.length === 0 ? (
                <text style={{ fontSize: 13, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
                  Empty response body
                </text>
              ) : (
                lines.map((line, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                      lineHeight: 20,
                    }}
                  >
                    <div style={{ width: 36, flexShrink: 0, textAlign: 'right' }}>
                      <text
                        style={{
                          fontSize: 12,
                          fontFamily: FONT_MONO,
                          color: C.ghost,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {`${idx + 1}`}
                      </text>
                    </div>
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <text
                        style={{
                          fontSize: 13,
                          fontFamily: FONT_MONO,
                          color: line.includes(':') && line.includes('"') ? C.accent : C.text,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {line}
                      </text>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              borderRadius: 10,
              backgroundColor: C.card,
              padding: 14,
              overflow: 'hidden',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingBottom: 6,
              }}
            >
              <div style={{ width: 220, flexShrink: 0 }}>
                <text style={{ fontSize: 12, fontFamily: FONT_SANS, fontWeight: '600', color: C.tertiary, whiteSpace: 'nowrap' }}>
                  HEADER NAME
                </text>
              </div>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <text style={{ fontSize: 12, fontFamily: FONT_SANS, fontWeight: '600', color: C.tertiary, whiteSpace: 'nowrap' }}>
                  VALUE
                </text>
              </div>
            </div>

            {headerEntries.map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  height: 32,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 5,
                  backgroundColor: C.surface,
                }}
              >
                <div style={{ width: 220, flexShrink: 0 }}>
                  <text style={{ fontSize: 12.5, fontFamily: FONT_MONO, color: C.accent, whiteSpace: 'nowrap' }}>
                    {k}
                  </text>
                </div>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <text style={{ fontSize: 12.5, fontFamily: FONT_MONO, color: C.text, whiteSpace: 'nowrap' }}>
                    {v}
                  </text>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
