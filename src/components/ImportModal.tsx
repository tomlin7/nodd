import React, { useState } from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS, TITLEBAR_HEIGHT } from '../theme'
import type { Collection } from '../core/types'
import { importPostmanCollection } from '../core/postman'

interface ImportModalProps {
  onImport: (collection: Collection) => void
  onClose: () => void
}

const SAMPLE_POSTMAN_COLLECTION = JSON.stringify(
  {
    info: {
      name: 'JSONPlaceholder API',
      description: 'Sample collection with REST resources',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [
      {
        name: 'Get All Posts',
        request: {
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/posts',
          header: [{ key: 'Accept', value: 'application/json' }],
        },
      },
      {
        name: 'Create Post',
        request: {
          method: 'POST',
          url: 'https://jsonplaceholder.typicode.com/posts',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: {
            mode: 'raw',
            raw: JSON.stringify({ title: 'New Article', body: 'Content goes here...', userId: 1 }, null, 2),
          },
        },
      },
    ],
  },
  null,
  2
)

export function ImportModal({ onImport, onClose }: ImportModalProps) {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    if (!jsonText.trim()) {
      setError('Please paste a Postman Collection JSON string.')
      return
    }

    try {
      const col = importPostmanCollection(jsonText)
      setError(null)
      onImport(col)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to import collection.')
    }
  }

  const handleLoadSample = () => {
    setJsonText(SAMPLE_POSTMAN_COLLECTION)
    setError(null)
  }

  return (
    <div
      testId="import-collection-modal"
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
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <text
            style={{
              fontSize: 14,
              fontFamily: FONT_SANS,
              fontWeight: '600',
              color: C.text,
              whiteSpace: 'nowrap',
            }}
          >
            Import Postman Collection
          </text>
          <text
            style={{
              fontSize: 12,
              fontFamily: FONT_SANS,
              color: C.tertiary,
              whiteSpace: 'nowrap',
            }}
          >
            v2.1 JSON Schema
          </text>
        </div>

        {/* Close Button */}
        <Button
          testId="close-import-modal"
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

      {/* Main Form Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          padding: 24,
          gap: 16,
          overflow: 'hidden',
        }}
      >
        {/* Actions bar above input */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <text
            style={{
              fontSize: 13,
              fontFamily: FONT_SANS,
              color: C.secondary,
              whiteSpace: 'nowrap',
            }}
          >
            Paste your exported Postman collection JSON below:
          </text>

          <Button
            testId="load-sample-collection-button"
            onClick={handleLoadSample}
            style={{
              height: 28,
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 6,
              backgroundColor: C.surface,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              hover: { backgroundColor: C.surfaceHighlight },
            }}
          >
            <text
              style={{
                fontSize: 12,
                fontFamily: FONT_SANS,
                color: C.accent,
                whiteSpace: 'nowrap',
              }}
            >
              Load Sample Postman Collection
            </text>
          </Button>
        </div>

        {/* JSON Input Area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            borderRadius: 8,
            backgroundColor: '#141417',
            padding: 12,
            overflow: 'hidden',
          }}
        >
          <input
            testId="import-json-input"
            value={jsonText}
            placeholder='{\n  "info": { "name": "My API" },\n  "item": [ ... ]\n}'
            theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
            style={{
              width: '100%',
              height: '100%',
              fontSize: 12.5,
              fontFamily: FONT_MONO,
              color: C.text,
              backgroundColor: 'transparent',
              borderWidth: 0,
              padding: 0,
            }}
            onChange={(e) => {
              setJsonText(e.value ?? '')
              if (error) setError(null)
            }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 6,
              backgroundColor: C.errorBg,
              flexShrink: 0,
            }}
          >
            <text
              style={{
                fontSize: 12.5,
                fontFamily: FONT_SANS,
                color: C.error,
                whiteSpace: 'nowrap',
              }}
            >
              {error}
            </text>
          </div>
        )}

        {/* Bottom Action Footer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
            paddingTop: 8,
          }}
        >
          <Button
            testId="cancel-import-button"
            onClick={onClose}
            style={{
              height: 36,
              paddingLeft: 16,
              paddingRight: 16,
              borderRadius: 6,
              backgroundColor: C.surface,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              hover: { backgroundColor: C.surfaceHighlight },
            }}
          >
            <text
              style={{
                fontSize: 13,
                fontFamily: FONT_SANS,
                color: C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              Cancel
            </text>
          </Button>

          <Button
            testId="confirm-import-button"
            onClick={handleImport}
            style={{
              height: 36,
              paddingLeft: 18,
              paddingRight: 18,
              borderRadius: 6,
              backgroundColor: C.accent,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              hover: { backgroundColor: C.accentHover },
            }}
          >
            <text
              style={{
                fontSize: 13,
                fontFamily: FONT_SANS,
                fontWeight: '600',
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
              }}
            >
              Import Collection
            </text>
          </Button>
        </div>
      </div>
    </div>
  )
}
