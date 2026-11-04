import React from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS, IconButton } from '../theme'
import type { KeyValuePair } from '../core/types'
import { createId } from '../core/url'

export function KeyValueTable({
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  emptyLabel = 'No items defined',
}: {
  pairs: KeyValuePair[]
  onChange: (next: KeyValuePair[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  emptyLabel?: string
}) {
  const updatePair = (id: string, partial: Partial<KeyValuePair>) => {
    onChange(
      pairs.map((p) => (p.id === id ? { ...p, ...partial } : p))
    )
  }

  const removePair = (id: string) => {
    onChange(pairs.filter((p) => p.id !== id))
  }

  const addRow = () => {
    onChange([
      ...pairs,
      {
        id: createId('row'),
        key: '',
        value: '',
        enabled: true,
      },
    ])
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 6,
      }}
    >
      {/* Table Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: 4,
          borderBottomWidth: 1,
          borderColor: C.border,
        }}
      >
        <div style={{ width: 24, flexShrink: 0 }} />
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <text
            style={{
              fontSize: 11,
              fontFamily: FONT_SANS,
              fontWeight: '600',
              color: C.tertiary,
              whiteSpace: 'nowrap',
            }}
          >
            KEY
          </text>
        </div>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <text
            style={{
              fontSize: 11,
              fontFamily: FONT_SANS,
              fontWeight: '600',
              color: C.tertiary,
              whiteSpace: 'nowrap',
            }}
          >
            VALUE
          </text>
        </div>
        <div style={{ width: 28, flexShrink: 0 }} />
      </div>

      {/* Rows */}
      {pairs.length === 0 ? (
        <div
          style={{
            paddingTop: 16,
            paddingBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <text
            style={{
              fontSize: 12,
              fontFamily: FONT_SANS,
              color: C.tertiary,
              whiteSpace: 'nowrap',
            }}
          >
            {emptyLabel}
          </text>
        </div>
      ) : (
        pairs.map((pair) => (
          <div
            key={pair.id}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingLeft: 8,
              paddingRight: 8,
              height: 32,
              borderRadius: 6,
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            {/* Enabled Checkbox Toggle */}
            <Button
              testId={`toggle-${pair.id}`}
              onClick={() => updatePair(pair.id, { enabled: !pair.enabled })}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: pair.enabled ? C.accent : C.borderStrong,
                backgroundColor: pair.enabled ? C.accent : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {pair.enabled && <Icon name="check" size={12} color="#FFFFFF" />}
            </Button>

            {/* Key Input */}
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <input
                testId={`key-${pair.id}`}
                value={pair.key}
                placeholder={keyPlaceholder}
                theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
                style={{
                  width: '100%',
                  height: 24,
                  fontSize: 12,
                  fontFamily: FONT_MONO,
                  color: pair.enabled ? C.text : C.tertiary,
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  padding: 0,
                }}
                onChange={(e) => updatePair(pair.id, { key: e.value ?? '' })}
              />
            </div>

            {/* Value Input */}
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <input
                testId={`value-${pair.id}`}
                value={pair.value}
                placeholder={valuePlaceholder}
                theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
                style={{
                  width: '100%',
                  height: 24,
                  fontSize: 12,
                  fontFamily: FONT_MONO,
                  color: pair.enabled ? C.text : C.tertiary,
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  padding: 0,
                }}
                onChange={(e) => updatePair(pair.id, { value: e.value ?? '' })}
              />
            </div>

            {/* Remove Row Button */}
            <Button
              testId={`remove-${pair.id}`}
              onClick={() => removePair(pair.id)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                hover: { backgroundColor: '#3F2427' },
                flexShrink: 0,
              }}
            >
              <Icon name="trash" size={12} color={C.tertiary} />
            </Button>
          </div>
        ))
      )}

      {/* Add Row Action */}
      <div style={{ display: 'flex', flexDirection: 'row', marginTop: 4 }}>
        <Button
          testId="add-row-button"
          onClick={addRow}
          style={{
            height: 28,
            paddingLeft: 10,
            paddingRight: 10,
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
            hover: { backgroundColor: C.surfaceHighlight },
          }}
        >
          <Icon name="plus" size={12} color={C.secondary} />
          <text
            style={{
              fontSize: 12,
              fontFamily: FONT_SANS,
              color: C.secondary,
              whiteSpace: 'nowrap',
            }}
          >
            Add Row
          </text>
        </Button>
      </div>
    </div>
  )
}
