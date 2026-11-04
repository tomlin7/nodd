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
            fontSize: 13,
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
            fontSize: 13,
            fontFamily: FONT_SANS,
            color: C.tertiary,
            whiteSpace: 'nowrap',
          }}
        >
          Send a request to see the response
        </text>
      </div>
    )
  }

  const statusColor = getStatusColor(response.status)
  const headerKeys = Object.keys(response.headers)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        width: '100%',
        height: '100%',
        backgroundColor: C.canvas,
        borderTopWidth: 1,
        borderColor: C.border,
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
          height: 42,
          paddingLeft: 20,
          paddingRight: 20,
          backgroundColor: C.surface,
          borderBottomWidth: 1,
          borderColor: C.border,
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
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 3,
              paddingBottom: 3,
              borderRadius: 6,
              backgroundColor: C.surfaceHighlight,
              borderWidth: 1,
              borderColor: C.border,
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
                fontSize: 12,
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
              paddingTop: 3,
              paddingBottom: 3,
              borderRadius: 6,
              backgroundColor: C.surfaceHighlight,
            }}
          >
            <text
              style={{
                fontSize: 11,
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
              paddingTop: 3,
              paddingBottom: 3,
              borderRadius: 6,
              backgroundColor: C.surfaceHighlight,
            }}
          >
            <text
              style={{
                fontSize: 11,
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
                  height: 22,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 4,
                  backgroundColor: viewMode === 'pretty' ? C.surface : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <text
                  style={{
                    fontSize: 11,
                    fontFamily: FONT_SANS,
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
                  height: 22,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 4,
                  backgroundColor: viewMode === 'raw' ? C.surface : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <text
                  style={{
                    fontSize: 11,
                    fontFamily: FONT_SANS,
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
                height: 26,
                paddingLeft: 10,
                paddingRight: 10,
                borderRadius: 6,
                backgroundColor: activeTab === 'body' ? C.surfaceHighlight : 'transparent',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <text
                style={{
                  fontSize: 12,
                  fontFamily: FONT_SANS,
                  fontWeight: activeTab === 'body' ? '600' : '400',
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
                height: 26,
                paddingLeft: 10,
                paddingRight: 10,
                borderRadius: 6,
                backgroundColor: activeTab === 'headers' ? C.surfaceHighlight : 'transparent',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <text
                style={{
                  fontSize: 12,
                  fontFamily: FONT_SANS,
                  fontWeight: activeTab === 'headers' ? '600' : '400',
                  color: activeTab === 'headers' ? C.text : C.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {`Headers (${headerKeys.length})`}
              </text>
            </Button>
          </div>

          {/* Copy Body Button */}
          <Button
            testId="copy-response-button"
            onClick={copyToClipboard}
            style={{
              height: 26,
              paddingLeft: 8,
              paddingRight: 8,
              borderRadius: 6,
              backgroundColor: C.surfaceHighlight,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              hover: { backgroundColor: C.borderStrong },
            }}
          >
            <Icon name={copied ? 'check' : 'copy'} size={12} color={copied ? C.success : C.secondary} />
            <text style={{ fontSize: 11, fontFamily: FONT_SANS, color: copied ? C.success : C.secondary, whiteSpace: 'nowrap' }}>
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
            paddingTop: 10,
            paddingBottom: 10,
            backgroundColor: '#2A181A',
            borderBottomWidth: 1,
            borderColor: '#4A2428',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="close" size={13} color={C.error} />
          <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.error, whiteSpace: 'nowrap' }}>
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
              borderRadius: 8,
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.border,
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
                paddingLeft: 12,
                paddingRight: 12,
                height: 32,
                borderBottomWidth: 1,
                borderColor: C.border,
              }}
            >
              <Icon name="search" size={12} color={C.tertiary} />
              <input
                testId="response-filter-input"
                value={filterQuery}
                placeholder="Filter response body..."
                theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
                style={{
                  width: '100%',
                  fontSize: 12,
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
                  <Icon name="close" size={11} color={C.tertiary} />
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
                gap: 2,
              }}
            >
              {lines.length === 0 ? (
                <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
                  {filterQuery ? 'No lines matched filter' : 'Empty response body'}
                </text>
              ) : (
                lines.slice(0, 100).map((line, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div style={{ width: 36, textAlign: 'right', flexShrink: 0 }}>
                      <text
                        style={{
                          fontSize: 11,
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
                          fontSize: 12,
                          lineHeight: 18,
                          fontFamily: FONT_MONO,
                          color: C.text,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {line}
                      </text>
                    </div>
                  </div>
                ))
              )}
              {lines.length > 100 && (
                <div style={{ paddingLeft: 48, paddingTop: 8 }}>
                  <text style={{ fontSize: 11, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
                    {`…and ${lines.length - 100} more lines`}
                  </text>
                </div>
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
              borderRadius: 8,
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.border,
              padding: 12,
              gap: 8,
            }}
          >
            {headerKeys.length === 0 ? (
              <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
                No response headers returned
              </text>
            ) : (
              headerKeys.map((key) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderBottomWidth: 1,
                    borderColor: C.cardBorder,
                  }}
                >
                  <div style={{ width: 200, flexShrink: 0 }}>
                    <text
                      style={{
                        fontSize: 12,
                        fontFamily: FONT_MONO,
                        fontWeight: '600',
                        color: C.secondary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {key}
                    </text>
                  </div>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <text
                      style={{
                        fontSize: 12,
                        fontFamily: FONT_MONO,
                        color: C.text,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {response.headers[key]}
                    </text>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
