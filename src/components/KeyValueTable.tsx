import React from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS } from '../theme'
import type { KeyValuePair } from '../core/types'
import { createId } from '../core/url'

export function KeyValueTable({
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  emptyLabel = 'No items defined',
  allowAdd = true,
  readOnlyKeys = false,
  disableDelete = false,
}: {
  pairs: KeyValuePair[]
  onChange: (next: KeyValuePair[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  emptyLabel?: string
  allowAdd?: boolean
  readOnlyKeys?: boolean
  disableDelete?: boolean
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
          gap: 10,
          paddingLeft: 10,
          paddingRight: 10,
          paddingBottom: 4,
        }}
      >
        <div style={{ width: 20, flexShrink: 0 }} />
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <text
            style={{
              fontSize: 12,
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
              fontSize: 12,
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
              fontSize: 13,
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
              gap: 10,
              paddingLeft: 10,
              paddingRight: 10,
              height: 36,
              borderRadius: 6,
              backgroundColor: C.surface,
              hover: { backgroundColor: C.surfaceHighlight },
            }}
          >
            {/* Enabled Checkbox Toggle */}
            <Button
              testId={`toggle-${pair.id}`}
              onClick={() => updatePair(pair.id, { enabled: !pair.enabled })}
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                backgroundColor: pair.enabled ? C.accent : '#25252B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {pair.enabled && <Icon name="check" size={12} color="#FFFFFF" />}
            </Button>

            {/* Key Input or Read-Only Variable Name */}
            <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
              {readOnlyKeys ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <text
                    style={{
                      fontSize: 12,
                      fontFamily: FONT_MONO,
                      color: C.tertiary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    :
                  </text>
                  <text
                    testId={`key-${pair.id}`}
                    style={{
                      fontSize: 13,
                      fontFamily: FONT_MONO,
                      fontWeight: '600',
                      color: C.accent,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pair.key}
                  </text>
                </div>
              ) : (
                <input
                  testId={`key-${pair.id}`}
                  value={pair.key}
                  placeholder={keyPlaceholder}
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
                  onChange={(e) => updatePair(pair.id, { key: e.value ?? '' })}
                />
              )}
            </div>

            {/* Value Input */}
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <input
                testId={`val-${pair.id}`}
                value={pair.value}
                placeholder={valuePlaceholder}
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
                onChange={(e) => updatePair(pair.id, { value: e.value ?? '' })}
              />
            </div>

            {/* Remove Row Button or Empty Spacer */}
            {disableDelete ? (
              <div style={{ width: 26, flexShrink: 0 }} />
            ) : (
              <Button
                testId={`remove-${pair.id}`}
                onClick={() => removePair(pair.id)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  hover: { backgroundColor: '#3F2427' },
                  flexShrink: 0,
                }}
              >
                <Icon name="trash" size={13} color={C.tertiary} />
              </Button>
            )}
          </div>
        ))
      )}

      {/* Add Row Button */}
      {allowAdd && (
        <div style={{ display: 'flex', flexDirection: 'row', marginTop: 4 }}>
          <Button
            testId="add-row-button"
            onClick={addRow}
            style={{
              height: 32,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 6,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              backgroundColor: C.surface,
              hover: { backgroundColor: C.surfaceHighlight },
            }}
          >
            <Icon name="plus" size={12} color={C.secondary} />
            <text
              style={{
                fontSize: 12.5,
                fontFamily: FONT_SANS,
                color: C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              Add Row
            </text>
          </Button>
        </div>
      )}
    </div>
  )
}
