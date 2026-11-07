import React, { useState } from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS, TITLEBAR_HEIGHT } from '../theme'
import type { Environment, HttpRequest } from '../core/types'
import {
  generateCurlSnippet,
  generateFetchSnippet,
  generatePythonSnippet,
} from '../core/curl'

interface CodeSnippetModalProps {
  request: HttpRequest
  environment?: Environment | null
  onClose: () => void
}

type SnippetLang = 'curl' | 'fetch' | 'python'

export function CodeSnippetModal({
  request,
  environment,
  onClose,
}: CodeSnippetModalProps) {
  const [selectedLang, setSelectedLang] = useState<SnippetLang>('curl')
  const [copied, setCopied] = useState(false)

  const getSnippet = () => {
    switch (selectedLang) {
      case 'curl':
        return generateCurlSnippet(request, environment)
      case 'fetch':
        return generateFetchSnippet(request, environment)
      case 'python':
        return generatePythonSnippet(request, environment)
    }
  }

  const snippet = getSnippet()

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(snippet)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      testId="code-snippet-modal"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: C.canvas,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: TITLEBAR_HEIGHT,
          borderBottomWidth: 1,
          borderColor: C.border,
          paddingLeft: 20,
          paddingRight: 16,
          backgroundColor: C.header,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <text
            style={{
              fontSize: 14,
              fontFamily: FONT_SANS,
              fontWeight: '600',
              color: C.text,
              whiteSpace: 'nowrap',
            }}
          >
            Code Snippets
          </text>
          <text
            style={{
              fontSize: 12,
              fontFamily: FONT_SANS,
              color: C.tertiary,
              whiteSpace: 'nowrap',
            }}
          >
            {request.name}
          </text>
        </div>

        {/* Close Button */}
        <Button
          testId="close-code-modal"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            hover: { backgroundColor: C.overlay },
          }}
        >
          <Icon name="close" size={13} color={C.secondary} />
        </Button>
      </div>

      {/* Language Selector & Copy Action Toolbar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 44,
          paddingLeft: 20,
          paddingRight: 20,
          borderBottomWidth: 1,
          borderColor: C.border,
          backgroundColor: '#151518',
          flexShrink: 0,
        }}
      >
        {/* Language Tabs */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
          {(
            [
              { id: 'curl', label: 'cURL' },
              { id: 'fetch', label: 'JavaScript (Fetch)' },
              { id: 'python', label: 'Python (Requests)' },
            ] as const
          ).map((lang) => {
            const isSel = selectedLang === lang.id
            return (
              <Button
                key={lang.id}
                testId={`snippet-lang-${lang.id}`}
                onClick={() => setSelectedLang(lang.id)}
                style={{
                  height: 28,
                  paddingLeft: 12,
                  paddingRight: 12,
                  borderRadius: 6,
                  backgroundColor: isSel ? '#202026' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  hover: { backgroundColor: isSel ? '#202026' : C.overlay },
                }}
              >
                <text
                  style={{
                    fontSize: 12.5,
                    fontFamily: FONT_SANS,
                    fontWeight: isSel ? '600' : '400',
                    color: isSel ? C.text : C.secondary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lang.label}
                </text>
              </Button>
            )
          })}
        </div>

        {/* Copy Button */}
        <Button
          testId="copy-snippet-button"
          onClick={handleCopy}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 28,
            paddingLeft: 12,
            paddingRight: 12,
            borderRadius: 6,
            backgroundColor: copied ? '#143823' : '#222228',
            cursor: 'pointer',
            hover: { backgroundColor: copied ? '#143823' : '#2A2A32' },
          }}
        >
          <Icon name={copied ? 'check' : 'copy'} size={12} color={copied ? C.success : C.secondary} />
          <text
            style={{
              fontSize: 12,
              fontFamily: FONT_SANS,
              fontWeight: '500',
              color: copied ? C.success : C.text,
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? 'Copied' : 'Copy Snippet'}
          </text>
        </Button>
      </div>

      {/* Code Display Area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          padding: 20,
          overflow: 'hidden',
          backgroundColor: '#101012',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            padding: 16,
            borderRadius: 8,
            backgroundColor: '#141417',
            overflow: 'hidden',
          }}
        >
          {snippet.split('\n').map((line, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: 20,
                gap: 12,
              }}
            >
              <text
                style={{
                  width: 32,
                  fontSize: 12,
                  fontFamily: FONT_MONO,
                  color: C.ghost,
                  textAlign: 'right',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {`${idx + 1}`}
              </text>
              <text
                style={{
                  fontSize: 12.5,
                  fontFamily: FONT_MONO,
                  color: C.text,
                  whiteSpace: 'nowrap',
                }}
              >
                {line}
              </text>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
