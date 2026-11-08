import React, { useMemo, useState } from 'react'
import { AnimatePresence, Button, motion } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS } from '../theme'
import type { HttpRequest, HttpResponse } from '../core/types'
import { runAssertions } from '../core/tests'

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
  request,
  isLoading,
}: {
  response: HttpResponse | null
  request?: HttpRequest
  isLoading?: boolean
}) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'tests'>('body')
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty')
  const [copied, setCopied] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')
  const [headersFilterQuery, setHeadersFilterQuery] = useState('')

  // Test results evaluation
  const testResults = useMemo(() => {
    return runAssertions(request?.assertions, response)
  }, [request?.assertions, response])

  const passedTestsCount = testResults.filter((r) => r.passed).length

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

  const { lines, matchCount } = useMemo(() => {
    const text = viewMode === 'pretty' ? formattedBody : (response?.body ?? '')
    if (!text) return { lines: [], matchCount: 0 }
    const rawLines = text.split('\n')
    const q = filterQuery.trim().toLowerCase()

    if (!q) {
      return {
        lines: rawLines.map((content, idx) => ({
          lineNum: idx + 1,
          content,
          matches: false,
        })),
        matchCount: 0,
      }
    }

    const filtered: Array<{ lineNum: number; content: string; matches: boolean }> = []
    let matches = 0

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i]
      if (line.toLowerCase().includes(q)) {
        matches++
        filtered.push({
          lineNum: i + 1,
          content: line,
          matches: true,
        })
      }
    }

    return { lines: filtered, matchCount: matches }
  }, [formattedBody, response?.body, viewMode, filterQuery])

  const filteredHeaderEntries = useMemo(() => {
    if (!response?.headers) return []
    const all = Object.entries(response.headers)
    const q = headersFilterQuery.trim().toLowerCase()
    if (!q) return all
    return all.filter(([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q))
  }, [response?.headers, headersFilterQuery])

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
        minHeight: 0,
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
            {testResults.length > 0 && (
              <Button
                testId="response-tab-tests"
                onClick={() => setActiveTab('tests')}
                style={{
                  height: 28,
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 6,
                  backgroundColor: activeTab === 'tests' ? C.surfaceHighlight : 'transparent',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: passedTestsCount === testResults.length ? C.success : C.error,
                  }}
                />
                <text
                  style={{
                    fontSize: 12.5,
                    fontFamily: FONT_SANS,
                    fontWeight: activeTab === 'tests' ? '600' : '500',
                    color: activeTab === 'tests' ? C.text : C.secondary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {`Tests (${passedTestsCount}/${testResults.length})`}
                </text>
              </Button>
            )}

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
          minHeight: 0,
          overflow: 'hidden',
          padding: 16,
          position: 'relative',
        }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              width: '100%',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
        {activeTab === 'body' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              minHeight: 0,
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
                flexShrink: 0,
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
                onChange={(e) => {
                  const val = e?.value !== undefined ? e.value : (e as any)?.target?.value ?? ''
                  setFilterQuery(val)
                }}
              />
              {filterQuery.trim().length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <text
                    testId="response-filter-match-count"
                    style={{
                      fontSize: 11.5,
                      fontFamily: FONT_SANS,
                      color: matchCount === 0 ? C.warning : C.tertiary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {matchCount === 0 ? 'No matches' : `${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`}
                  </text>
                  <Button
                    testId="clear-filter-button"
                    onClick={() => setFilterQuery('')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      hover: { backgroundColor: C.overlay },
                    }}
                  >
                    <Icon name="close" size={12} color={C.tertiary} />
                  </Button>
                </div>
              )}
            </div>

            {/* Line Viewer */}
            <div
              testId="response-line-viewer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                minHeight: 0,
                padding: 12,
                overflowY: 'scroll',
              }}
            >
              {lines.length === 0 ? (
                <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <text style={{ fontSize: 13, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
                    {filterQuery.trim() ? `No lines matching "${filterQuery}"` : 'Empty response body'}
                  </text>
                </div>
              ) : (
                lines.map((item) => (
                  <div
                    key={item.lineNum}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                      lineHeight: 20,
                      backgroundColor: item.matches ? '#202028' : 'transparent',
                      borderRadius: 3,
                    }}
                  >
                    <div style={{ width: 36, flexShrink: 0, textAlign: 'right' }}>
                      <text
                        style={{
                          fontSize: 12,
                          fontFamily: FONT_MONO,
                          color: item.matches ? C.accent : C.ghost,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {`${item.lineNum}`}
                      </text>
                    </div>
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <text
                        style={{
                          fontSize: 13,
                          fontFamily: FONT_MONO,
                          color: item.matches ? C.text : item.content.includes(':') && item.content.includes('"') ? C.accent : C.text,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.content}
                      </text>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div
            testId="response-tests-pane"
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              minHeight: 0,
              padding: 16,
              gap: 8,
              overflowY: 'scroll',
              backgroundColor: '#101012',
            }}
          >
            {testResults.map((r, idx) => (
              <div
                key={idx}
                testId={`test-result-${idx}`}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: 12,
                  paddingRight: 12,
                  height: 38,
                  borderRadius: 6,
                  backgroundColor: '#16161A',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      paddingLeft: 8,
                      paddingRight: 8,
                      paddingTop: 2,
                      paddingBottom: 2,
                      borderRadius: 4,
                      backgroundColor: r.passed ? '#143823' : '#38161A',
                    }}
                  >
                    <text
                      style={{
                        fontSize: 11,
                        fontFamily: FONT_SANS,
                        fontWeight: '700',
                        color: r.passed ? C.success : C.error,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.passed ? 'PASS' : 'FAIL'}
                    </text>
                  </div>
                  <text
                    style={{
                      fontSize: 13,
                      fontFamily: FONT_SANS,
                      color: C.text,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.message}
                  </text>
                </div>

                <text
                  style={{
                    fontSize: 12,
                    fontFamily: FONT_MONO,
                    color: C.tertiary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {`Actual: ${r.actual}`}
                </text>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'headers' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              minHeight: 0,
              borderRadius: 10,
              backgroundColor: C.card,
              overflow: 'hidden',
            }}
          >
            {/* Headers Search Bar */}
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
                borderBottomWidth: 1,
                borderColor: C.border,
                flexShrink: 0,
              }}
            >
              <Icon name="search" size={13} color={C.tertiary} />
              <input
                testId="headers-filter-input"
                value={headersFilterQuery}
                placeholder="Filter headers by name or value..."
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
                onChange={(e) => {
                  const val = e?.value !== undefined ? e.value : (e as any)?.target?.value ?? ''
                  setHeadersFilterQuery(val)
                }}
              />
              {headersFilterQuery.trim().length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <text
                    testId="headers-filter-match-count"
                    style={{
                      fontSize: 11.5,
                      fontFamily: FONT_SANS,
                      color: filteredHeaderEntries.length === 0 ? C.warning : C.tertiary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {filteredHeaderEntries.length === 0
                      ? 'No matches'
                      : `${filteredHeaderEntries.length} of ${headerEntries.length}`}
                  </text>
                  <Button
                    testId="clear-headers-filter-button"
                    onClick={() => setHeadersFilterQuery('')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      hover: { backgroundColor: C.overlay },
                    }}
                  >
                    <Icon name="close" size={12} color={C.tertiary} />
                  </Button>
                </div>
              )}
            </div>

            {/* Column Headers */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingLeft: 14,
                paddingRight: 14,
                paddingTop: 12,
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderColor: C.border,
                flexShrink: 0,
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

            <div
              testId="response-headers-viewer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                minHeight: 0,
                padding: 14,
                overflowY: 'scroll',
                gap: 8,
              }}
            >
              {filteredHeaderEntries.length === 0 ? (
                <div style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <text style={{ fontSize: 13, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
                    {headersFilterQuery.trim() ? `No headers matching "${headersFilterQuery}"` : 'No headers returned'}
                  </text>
                </div>
              ) : (
                filteredHeaderEntries.map(([k, v]) => (
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
                    flexShrink: 0,
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
              ))
              )}
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
