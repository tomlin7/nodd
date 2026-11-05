import React, { useState } from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { KeyValueTable } from './KeyValueTable'
import { C, FONT_MONO, FONT_SANS } from '../theme'
import type { AuthType, BodyType, HttpMethod, HttpRequest, KeyValuePair } from '../core/types'
import { buildUrlWithParams, parseUrlParams } from '../core/url'

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
type ActiveTab = 'params' | 'headers' | 'auth' | 'body'

export function RequestBuilder({
  request,
  onChange,
  onSend,
  onSave,
  isLoading,
}: {
  request: HttpRequest
  onChange: (next: HttpRequest) => void
  onSend: () => void
  onSave: () => void
  isLoading?: boolean
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('params')
  const [methodMenuOpen, setMethodMenuOpen] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)

  const methodColor = C.methods[request.method] || C.accent

  // URL Input Handler (syncs query params to request.params)
  const handleUrlChange = (newUrl: string) => {
    if (newUrl.includes('?')) {
      const { params } = parseUrlParams(newUrl)
      onChange({
        ...request,
        url: newUrl,
        params,
      })
    } else {
      onChange({
        ...request,
        url: newUrl,
      })
    }
  }

  // Params Table Handler (syncs params into request.url)
  const handleParamsChange = (nextParams: KeyValuePair[]) => {
    const nextUrl = buildUrlWithParams(request.url, nextParams)
    onChange({
      ...request,
      url: nextUrl,
      params: nextParams,
    })
  }

  // Format JSON Body
  const handleFormatJson = () => {
    if (!request.body.rawText) return
    try {
      const parsed = JSON.parse(request.body.rawText)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonError(null)
      onChange({
        ...request,
        body: {
          ...request.body,
          rawText: formatted,
        },
      })
    } catch (err: any) {
      setJsonError(err?.message || 'Invalid JSON syntax')
    }
  }

  const activeParamsCount = request.params.filter((p) => p.enabled && p.key.trim().length > 0).length
  const activeHeadersCount = request.headers.filter((h) => h.enabled && h.key.trim().length > 0).length

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12,
      }}
    >
      {/* URL Row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          width: '100%',
        }}
      >
        {/* Method Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <Button
            testId="method-selector-button"
            onClick={() => setMethodMenuOpen((prev) => !prev)}
            style={{
              height: 38,
              paddingLeft: 14,
              paddingRight: 10,
              borderRadius: 8,
              backgroundColor: C.surface,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              hover: { backgroundColor: C.surfaceHighlight },
            }}
          >
            <text
              style={{
                fontSize: 13,
                fontFamily: FONT_MONO,
                fontWeight: '700',
                color: methodColor,
                whiteSpace: 'nowrap',
              }}
            >
              {request.method}
            </text>
            <Icon name="chevronDown" size={11} color={C.tertiary} />
          </Button>

          {/* Method Menu List */}
          {methodMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 42,
                left: 0,
                width: 130,
                backgroundColor: '#1E1E23',
                borderRadius: 8,
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {METHODS.map((m) => (
                <Button
                  key={m}
                  testId={`method-option-${m}`}
                  onClick={() => {
                    onChange({ ...request, method: m })
                    setMethodMenuOpen(false)
                  }}
                  style={{
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 10,
                    borderRadius: 5,
                    cursor: 'pointer',
                    backgroundColor: request.method === m ? C.surfaceHighlight : 'transparent',
                    hover: { backgroundColor: C.surfaceHighlight },
                  }}
                >
                  <text
                    style={{
                      fontSize: 12.5,
                      fontFamily: FONT_MONO,
                      fontWeight: '700',
                      color: C.methods[m] || C.text,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m}
                  </text>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* URL Input */}
        <div
          style={{
            flexGrow: 1,
            height: 38,
            borderRadius: 8,
            backgroundColor: C.surface,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 14,
            paddingRight: 14,
            hover: { backgroundColor: C.surfaceHighlight },
          }}
        >
          <input
            testId="url-input"
            value={request.url}
            placeholder="https://api.example.com/v1/resource"
            theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
            style={{
              width: '100%',
              fontSize: 13.5,
              fontFamily: FONT_MONO,
              color: C.text,
              backgroundColor: 'transparent',
              borderWidth: 0,
              padding: 0,
            }}
            onChange={(e) => handleUrlChange(e.value ?? '')}
            onSubmit={onSend}
          />
        </div>

        {/* Send Button */}
        <Button
          testId="send-request-button"
          disabled={isLoading}
          onClick={onSend}
          style={{
            height: 38,
            paddingLeft: 18,
            paddingRight: 18,
            borderRadius: 8,
            backgroundColor: C.accent,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            cursor: isLoading ? 'default' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            hover: isLoading ? undefined : { backgroundColor: C.accentHover },
          }}
        >
          <Icon name="send" size={13} color="#FFFFFF" />
          <text
            style={{
              fontSize: 13,
              fontFamily: FONT_SANS,
              fontWeight: '600',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? 'Sending…' : 'Send'}
          </text>
        </Button>

        {/* Save Button */}
        <Button
          testId="save-request-button"
          onClick={onSave}
          style={{
            height: 38,
            paddingLeft: 14,
            paddingRight: 14,
            borderRadius: 8,
            backgroundColor: C.surface,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            hover: { backgroundColor: C.surfaceHighlight },
          }}
        >
          <Icon name="save" size={13} color={C.secondary} />
          <text
            style={{
              fontSize: 13,
              fontFamily: FONT_SANS,
              color: C.secondary,
              whiteSpace: 'nowrap',
            }}
          >
            Save
          </text>
        </Button>
      </div>

      {/* Tabs Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingBottom: 4,
          marginTop: 6,
        }}
      >
        <TabButton
          label="Params"
          count={activeParamsCount}
          active={activeTab === 'params'}
          testId="tab-params"
          onClick={() => setActiveTab('params')}
        />
        <TabButton
          label="Headers"
          count={activeHeadersCount}
          active={activeTab === 'headers'}
          testId="tab-headers"
          onClick={() => setActiveTab('headers')}
        />
        <TabButton
          label="Auth"
          active={activeTab === 'auth'}
          testId="tab-auth"
          onClick={() => setActiveTab('auth')}
        />
        <TabButton
          label="Body"
          active={activeTab === 'body'}
          testId="tab-body"
          onClick={() => setActiveTab('body')}
        />
      </div>

      {/* Tab Panes */}
      <div style={{ marginTop: 6, width: '100%' }}>
        {activeTab === 'params' && (
          <KeyValueTable
            pairs={request.params}
            onChange={handleParamsChange}
            keyPlaceholder="Parameter"
            valuePlaceholder="Value"
            emptyLabel="No query parameters defined"
          />
        )}

        {activeTab === 'headers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Common Header Presets */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
                Presets:
              </text>
              <PresetButton
                label="JSON"
                onClick={() => {
                  const existing = request.headers.filter((h) => h.key.toLowerCase() !== 'content-type' && h.key.toLowerCase() !== 'accept')
                  onChange({
                    ...request,
                    headers: [
                      ...existing,
                      { id: `h_${Date.now()}_1`, key: 'Content-Type', value: 'application/json', enabled: true },
                      { id: `h_${Date.now()}_2`, key: 'Accept', value: 'application/json', enabled: true },
                    ],
                  })
                }}
              />
              <PresetButton
                label="Bearer Auth"
                onClick={() => {
                  const existing = request.headers.filter((h) => h.key.toLowerCase() !== 'authorization')
                  onChange({
                    ...request,
                    headers: [
                      ...existing,
                      { id: `h_${Date.now()}`, key: 'Authorization', value: 'Bearer {{token}}', enabled: true },
                    ],
                  })
                }}
              />
            </div>
            <KeyValueTable
              pairs={request.headers}
              onChange={(nextHeaders) => onChange({ ...request, headers: nextHeaders })}
              keyPlaceholder="Header"
              valuePlaceholder="Value"
              emptyLabel="No headers defined"
            />
          </div>
        )}

        {activeTab === 'auth' && (
          <AuthPane
            auth={request.auth}
            onChange={(nextAuth) => onChange({ ...request, auth: nextAuth })}
          />
        )}

        {activeTab === 'body' && (
          <BodyPane
            body={request.body}
            onChange={(nextBody) => onChange({ ...request, body: nextBody })}
            onFormatJson={handleFormatJson}
            jsonError={jsonError}
          />
        )}
      </div>
    </div>
  )
}

function TabButton({
  label,
  count,
  active,
  testId,
  onClick,
}: {
  label: string
  count?: number
  active: boolean
  testId: string
  onClick: () => void
}) {
  return (
    <Button
      testId={testId}
      onClick={onClick}
      style={{
        height: 30,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        backgroundColor: active ? C.surfaceHighlight : 'transparent',
        hover: { backgroundColor: active ? C.surfaceHighlight : C.overlay },
      }}
    >
      <text
        style={{
          fontSize: 13,
          fontFamily: FONT_SANS,
          fontWeight: active ? '600' : '500',
          color: active ? C.text : C.secondary,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </text>
      {typeof count === 'number' && count > 0 && (
        <div
          style={{
            paddingLeft: 6,
            paddingRight: 6,
            borderRadius: 10,
            backgroundColor: '#27272D',
          }}
        >
          <text style={{ fontSize: 11, fontFamily: FONT_MONO, fontWeight: '600', color: C.accent, whiteSpace: 'nowrap' }}>
            {`${count}`}
          </text>
        </div>
      )}
    </Button>
  )
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      style={{
        height: 24,
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: 4,
        backgroundColor: C.surface,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        hover: { backgroundColor: C.surfaceHighlight },
      }}
    >
      <text style={{ fontSize: 11.5, fontFamily: FONT_MONO, color: C.secondary, whiteSpace: 'nowrap' }}>
        {label}
      </text>
    </Button>
  )
}

function AuthPane({
  auth,
  onChange,
}: {
  auth: HttpRequest['auth']
  onChange: (next: HttpRequest['auth']) => void
}) {
  const types: { id: AuthType; label: string }[] = [
    { id: 'none', label: 'No Auth' },
    { id: 'bearer', label: 'Bearer Token' },
    { id: 'basic', label: 'Basic Auth' },
    { id: 'apikey', label: 'API Key' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Auth Type Selector */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
        {types.map((t) => (
          <Button
            key={t.id}
            testId={`auth-type-${t.id}`}
            onClick={() => onChange({ ...auth, type: t.id })}
            style={{
              height: 28,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              backgroundColor: auth.type === t.id ? C.surfaceHighlight : C.surface,
            }}
          >
            <text
              style={{
                fontSize: 12.5,
                fontFamily: FONT_SANS,
                fontWeight: auth.type === t.id ? '600' : '400',
                color: auth.type === t.id ? C.text : C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </text>
          </Button>
        ))}
      </div>

      {auth.type === 'none' && (
        <text style={{ fontSize: 13, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
          This request does not use any authorization.
        </text>
      )}

      {auth.type === 'bearer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 520 }}>
          <text style={{ fontSize: 12, fontFamily: FONT_SANS, fontWeight: '600', color: C.secondary, whiteSpace: 'nowrap' }}>
            TOKEN
          </text>
          <div
            style={{
              height: 36,
              borderRadius: 6,
              backgroundColor: C.surface,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 12,
              paddingRight: 12,
            }}
          >
            <input
              testId="bearer-token-input"
              value={auth.bearerToken ?? ''}
              placeholder="e.g. eyJhbGciOi... or {{token}}"
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
              onChange={(e) => onChange({ ...auth, bearerToken: e.value ?? '' })}
            />
          </div>
        </div>
      )}

      {auth.type === 'basic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 520 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <text style={{ fontSize: 12, fontFamily: FONT_SANS, fontWeight: '600', color: C.secondary, whiteSpace: 'nowrap' }}>
              USERNAME
            </text>
            <div style={{ height: 36, borderRadius: 6, backgroundColor: C.surface, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12 }}>
              <input
                testId="basic-username-input"
                value={auth.basicUsername ?? ''}
                placeholder="Username or {{username}}"
                theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
                style={{ width: '100%', fontSize: 13, fontFamily: FONT_MONO, color: C.text, backgroundColor: 'transparent', borderWidth: 0, padding: 0 }}
                onChange={(e) => onChange({ ...auth, basicUsername: e.value ?? '' })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <text style={{ fontSize: 12, fontFamily: FONT_SANS, fontWeight: '600', color: C.secondary, whiteSpace: 'nowrap' }}>
              PASSWORD
            </text>
            <div style={{ height: 36, borderRadius: 6, backgroundColor: C.surface, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12 }}>
              <input
                testId="basic-password-input"
                value={auth.basicPassword ?? ''}
                placeholder="Password or {{password}}"
                theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
                style={{ width: '100%', fontSize: 13, fontFamily: FONT_MONO, color: C.text, backgroundColor: 'transparent', borderWidth: 0, padding: 0 }}
                onChange={(e) => onChange({ ...auth, basicPassword: e.value ?? '' })}
              />
            </div>
          </div>
        </div>
      )}

      {auth.type === 'apikey' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 520 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <text style={{ fontSize: 12, fontFamily: FONT_SANS, fontWeight: '600', color: C.secondary, whiteSpace: 'nowrap' }}>
              KEY NAME
            </text>
            <div style={{ height: 36, borderRadius: 6, backgroundColor: C.surface, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12 }}>
              <input
                testId="apikey-key-input"
                value={auth.apiKeyKey ?? ''}
                placeholder="X-API-Key"
                theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
                style={{ width: '100%', fontSize: 13, fontFamily: FONT_MONO, color: C.text, backgroundColor: 'transparent', borderWidth: 0, padding: 0 }}
                onChange={(e) => onChange({ ...auth, apiKeyKey: e.value ?? '' })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <text style={{ fontSize: 12, fontFamily: FONT_SANS, fontWeight: '600', color: C.secondary, whiteSpace: 'nowrap' }}>
              VALUE
            </text>
            <div style={{ height: 36, borderRadius: 6, backgroundColor: C.surface, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12 }}>
              <input
                testId="apikey-val-input"
                value={auth.apiKeyValue ?? ''}
                placeholder="Secret key or {{apiKey}}"
                theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
                style={{ width: '100%', fontSize: 13, fontFamily: FONT_MONO, color: C.text, backgroundColor: 'transparent', borderWidth: 0, padding: 0 }}
                onChange={(e) => onChange({ ...auth, apiKeyValue: e.value ?? '' })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BodyPane({
  body,
  onChange,
  onFormatJson,
  jsonError,
}: {
  body: HttpRequest['body']
  onChange: (next: HttpRequest['body']) => void
  onFormatJson: () => void
  jsonError?: string | null
}) {
  const types: { id: BodyType; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'json', label: 'JSON' },
    { id: 'raw', label: 'Raw Text' },
    { id: 'x-www-form-urlencoded', label: 'Form URL-Encoded' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Format Selector */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
          {types.map((t) => (
            <Button
              key={t.id}
              testId={`body-type-${t.id}`}
              onClick={() => onChange({ ...body, type: t.id })}
              style={{
                height: 28,
                paddingLeft: 12,
                paddingRight: 12,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                backgroundColor: body.type === t.id ? C.surfaceHighlight : C.surface,
              }}
            >
              <text
                style={{
                  fontSize: 12.5,
                  fontFamily: FONT_SANS,
                  fontWeight: body.type === t.id ? '600' : '400',
                  color: body.type === t.id ? C.text : C.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </text>
            </Button>
          ))}
        </div>

        {body.type === 'json' && (
          <Button
            testId="format-json-button"
            onClick={onFormatJson}
            style={{
              height: 28,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 6,
              backgroundColor: C.surface,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              hover: { backgroundColor: C.surfaceHighlight },
            }}
          >
            <Icon name="sparkle" size={12} color={C.accent} />
            <text style={{ fontSize: 12, fontFamily: FONT_SANS, color: C.text, whiteSpace: 'nowrap' }}>
              Format JSON
            </text>
          </Button>
        )}
      </div>

      {jsonError && (
        <text style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.error, whiteSpace: 'nowrap' }}>
          {`JSON Error: ${jsonError}`}
        </text>
      )}

      {body.type === 'none' && (
        <text style={{ fontSize: 13, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
          This request has no body.
        </text>
      )}

      {(body.type === 'json' || body.type === 'raw') && (
        <div
          style={{
            borderRadius: 8,
            backgroundColor: C.surface,
            padding: 12,
          }}
        >
          <textarea
            testId="body-editor"
            value={body.rawText ?? ''}
            placeholder={body.type === 'json' ? '{\n  "key": "value"\n}' : 'Raw payload...'}
            minRows={6}
            maxRows={16}
            theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
            style={{
              width: '100%',
              fontSize: 13,
              lineHeight: 20,
              fontFamily: FONT_MONO,
              color: C.text,
              backgroundColor: 'transparent',
              borderWidth: 0,
              padding: 0,
            }}
            onChange={(e) => onChange({ ...body, rawText: e.value ?? '' })}
          />
        </div>
      )}

      {body.type === 'x-www-form-urlencoded' && (
        <KeyValueTable
          pairs={body.formParams ?? []}
          onChange={(nextParams) => onChange({ ...body, formParams: nextParams })}
          keyPlaceholder="Field"
          valuePlaceholder="Value"
          emptyLabel="No form fields defined"
        />
      )}
    </div>
  )
}
