import React, { useState } from 'react'
import { Button } from '@gpuix/react'
import { Icon } from './Icons'
import { WindowControls } from './Titlebar'
import { C, FONT_MONO, FONT_SANS, TITLEBAR_HEIGHT } from '../theme'
import type { Environment } from '../core/types'
import { createId } from '../core/url'
import {
  endWindowDrag,
  handleTitlebarMouseDown,
  updateWindowDrag,
} from '../window-drag'

export function EnvironmentManager({
  environments,
  activeEnvironment,
  onSelectEnvironment,
  onSaveEnvironments,
  onClose,
}: {
  environments: Environment[]
  activeEnvironment: Environment | null
  onSelectEnvironment: (env: Environment | null) => void
  onSaveEnvironments: (envs: Environment[]) => void
  onClose: () => void
}) {
  const [list, setList] = useState<Environment[]>(environments)
  const [selectedId, setSelectedId] = useState<string>(() => {
    return activeEnvironment?.id ?? (environments[0]?.id || '')
  })

  const selectedEnv = list.find((e) => e.id === selectedId) || list[0]

  const updateEnv = (id: string, partial: Partial<Environment>) => {
    const next = list.map((e) => (e.id === id ? { ...e, ...partial } : e))
    setList(next)
    onSaveEnvironments(next)
    if (activeEnvironment?.id === id) {
      onSelectEnvironment({ ...activeEnvironment, ...partial })
    }
  }

  const createEnvironment = () => {
    const newEnv: Environment = {
      id: createId('env'),
      name: `Environment ${list.length + 1}`,
      variables: {
        baseUrl: 'https://api.example.com',
      },
    }
    const next = [...list, newEnv]
    setList(next)
    setSelectedId(newEnv.id)
    onSaveEnvironments(next)
  }

  const deleteEnvironment = (id: string) => {
    const next = list.filter((e) => e.id !== id)
    setList(next)
    onSaveEnvironments(next)
    if (selectedId === id && next.length > 0) {
      setSelectedId(next[0].id)
    }
    if (activeEnvironment?.id === id) {
      onSelectEnvironment(next[0] || null)
    }
  }

  const updateVariable = (varKey: string, newKey: string, newValue: string) => {
    if (!selectedEnv) return
    const vars = { ...selectedEnv.variables }
    if (varKey !== newKey) {
      delete vars[varKey]
    }
    vars[newKey] = newValue
    updateEnv(selectedEnv.id, { variables: vars })
  }

  const deleteVariable = (varKey: string) => {
    if (!selectedEnv) return
    const vars = { ...selectedEnv.variables }
    delete vars[varKey]
    updateEnv(selectedEnv.id, { variables: vars })
  }

  const addVariable = () => {
    if (!selectedEnv) return
    const vars = { ...selectedEnv.variables }
    let base = 'newVar'
    let counter = 1
    while (vars[`${base}${counter}`]) {
      counter++
    }
    vars[`${base}${counter}`] = ''
    updateEnv(selectedEnv.id, { variables: vars })
  }

  const variableEntries = selectedEnv ? Object.entries(selectedEnv.variables) : []

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        backgroundColor: C.canvas,
      }}
    >
      {/* Left Sidebar: Environment List */}
      <div
        style={{
          width: 240,
          backgroundColor: C.sidebar,
          borderRightWidth: 1,
          borderColor: C.sidebarBorder,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 12,
          paddingLeft: 12,
          paddingRight: 12,
          flexShrink: 0,
        }}
      >
        <Button
          testId="env-manager-back"
          onClick={onClose}
          style={{
            height: 34,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 10,
            paddingRight: 10,
            borderRadius: 7,
            cursor: 'pointer',
            hover: { backgroundColor: C.overlay },
            marginBottom: 12,
          }}
        >
          <Icon name="arrowLeft" size={14} color={C.secondary} />
          <text
            style={{
              fontSize: 13,
              fontFamily: FONT_SANS,
              color: C.text,
              whiteSpace: 'nowrap',
            }}
          >
            Back to Workbench
          </text>
        </Button>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 6 }}>
          <text style={{ fontSize: 12, fontFamily: FONT_SANS, fontWeight: '600', color: C.tertiary, whiteSpace: 'nowrap' }}>
            ENVIRONMENTS
          </text>
          <Button
            testId="create-env-button"
            onClick={createEnvironment}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              hover: { backgroundColor: C.overlay },
            }}
          >
            <Icon name="plus" size={12} color={C.secondary} />
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {list.map((env) => {
            const isSelected = selectedEnv?.id === env.id
            const isActive = activeEnvironment?.id === env.id
            return (
              <Button
                key={env.id}
                testId={`select-env-${env.id}`}
                onClick={() => setSelectedId(env.id)}
                style={{
                  height: 34,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 6,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? C.surfaceHighlight : 'transparent',
                  hover: { backgroundColor: isSelected ? C.surfaceHighlight : C.overlay },
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0, flexGrow: 1 }}>
                  <Icon name="environment" size={13} color={isActive ? C.accent : C.tertiary} />
                  <text
                    style={{
                      fontSize: 13,
                      fontFamily: FONT_SANS,
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? C.text : C.secondary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {env.name}
                  </text>
                </div>
                {isActive && (
                  <div style={{ paddingLeft: 6, paddingRight: 6, paddingTop: 1, paddingBottom: 1, borderRadius: 3, backgroundColor: '#27272D' }}>
                    <text style={{ fontSize: 11, fontFamily: FONT_SANS, fontWeight: '600', color: C.accent, whiteSpace: 'nowrap' }}>
                      Active
                    </text>
                  </div>
                )}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Main Content: Variable Table */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          height: '100%',
        }}
      >
        {/* Titlebar Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: TITLEBAR_HEIGHT,
            borderBottomWidth: 1,
            borderColor: C.border,
            paddingLeft: 24,
            paddingRight: 14,
            backgroundColor: C.header,
          }}
        >
          <div
            testId="titlebar-drag-env"
            style={{
              flexGrow: 1,
              height: '100%',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseDown={(e: any) => handleTitlebarMouseDown(undefined, e)}
            onMouseMove={() => updateWindowDrag()}
            onMouseUp={() => endWindowDrag()}
          >
            <text
              style={{
                fontSize: 14,
                fontFamily: FONT_SANS,
                fontWeight: '600',
                color: C.text,
                whiteSpace: 'nowrap',
              }}
            >
              Environment Variables
            </text>
          </div>
          <WindowControls />
        </div>

        {/* Content Pane */}
        {selectedEnv ? (
          <div
            style={{
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              overflow: 'hidden',
              flexGrow: 1,
            }}
          >
            {/* Header with Name and Set Active Button */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <text style={{ fontSize: 18, fontWeight: '600', fontFamily: FONT_SANS, color: C.text, whiteSpace: 'nowrap' }}>
                  {selectedEnv.name}
                </text>
                <text style={{ fontSize: 13, fontFamily: FONT_SANS, color: C.secondary, whiteSpace: 'nowrap' }}>
                  Reference these variables in requests using {`{{variableName}}`}
                </text>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                <Button
                  testId="set-active-env-btn"
                  onClick={() => onSelectEnvironment(selectedEnv)}
                  style={{
                    height: 32,
                    paddingLeft: 14,
                    paddingRight: 14,
                    borderRadius: 6,
                    backgroundColor: activeEnvironment?.id === selectedEnv.id ? C.surfaceHighlight : C.accent,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <text
                    style={{
                      fontSize: 12.5,
                      fontFamily: FONT_SANS,
                      fontWeight: '600',
                      color: activeEnvironment?.id === selectedEnv.id ? C.secondary : '#FFFFFF',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeEnvironment?.id === selectedEnv.id ? 'Current Active' : 'Set as Active'}
                  </text>
                </Button>

                {list.length > 1 && (
                  <Button
                    testId="delete-env-btn"
                    onClick={() => deleteEnvironment(selectedEnv.id)}
                    style={{
                      height: 32,
                      paddingLeft: 12,
                      paddingRight: 12,
                      borderRadius: 6,
                      backgroundColor: C.surface,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      hover: { backgroundColor: '#3F2427' },
                    }}
                  >
                    <Icon name="trash" size={13} color={C.tertiary} />
                  </Button>
                )}
              </div>
            </div>

            {/* Variable Table Card */}
            <div
              style={{
                backgroundColor: C.card,
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingBottom: 6,
                }}
              >
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <text style={{ fontSize: 12, fontFamily: FONT_SANS, fontWeight: '600', color: C.tertiary, whiteSpace: 'nowrap' }}>
                    VARIABLE
                  </text>
                </div>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <text style={{ fontSize: 12, fontFamily: FONT_SANS, fontWeight: '600', color: C.tertiary, whiteSpace: 'nowrap' }}>
                    VALUE
                  </text>
                </div>
                <div style={{ width: 28, flexShrink: 0 }} />
              </div>

              {/* Rows */}
              {variableEntries.map(([varKey, varVal]) => (
                <div
                  key={varKey}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    height: 36,
                    paddingLeft: 10,
                    paddingRight: 10,
                    borderRadius: 6,
                    backgroundColor: C.surface,
                  }}
                >
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <input
                      value={varKey}
                      placeholder="Variable name"
                      theme={{ text: C.text, textMuted: C.secondary, textFaint: C.tertiary }}
                      style={{
                        width: '100%',
                        fontSize: 13,
                        fontFamily: FONT_MONO,
                        color: C.accent,
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        padding: 0,
                      }}
                      onChange={(e) => updateVariable(varKey, e.value ?? '', varVal)}
                    />
                  </div>

                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <input
                      value={varVal}
                      placeholder="Value"
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
                      onChange={(e) => updateVariable(varKey, varKey, e.value ?? '')}
                    />
                  </div>

                  <Button
                    onClick={() => deleteVariable(varKey)}
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
                </div>
              ))}

              {/* Add Variable Button */}
              <div style={{ display: 'flex', flexDirection: 'row', marginTop: 4 }}>
                <Button
                  testId="add-variable-btn"
                  onClick={addVariable}
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
                  <text style={{ fontSize: 12.5, fontFamily: FONT_SANS, color: C.secondary, whiteSpace: 'nowrap' }}>
                    Add Variable
                  </text>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <text style={{ fontSize: 13.5, fontFamily: FONT_SANS, color: C.tertiary, whiteSpace: 'nowrap' }}>
              No environment selected
            </text>
          </div>
        )}
      </div>
    </div>
  )
}
