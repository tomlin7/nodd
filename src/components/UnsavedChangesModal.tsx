import React, { useEffect } from 'react'
import { Button, motion } from '@gpuix/react'
import { Icon } from './Icons'
import { C, FONT_MONO, FONT_SANS } from '../theme'

export interface UnsavedChangesModalProps {
  isOpen: boolean
  tabName: string
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function UnsavedChangesModal({
  isOpen,
  tabName,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault?.()
        onCancel()
      } else if (e.key === 'Enter') {
        e.preventDefault?.()
        onSave()
      } else if ((e.ctrlKey || e.altKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault?.()
        onDiscard()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onSave, onDiscard, onCancel])

  if (!isOpen) return null

  const displayTitle = tabName.trim() || 'Untitled Request'

  return (
    <div
      testId="unsaved-changes-backdrop"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#00000088',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      onMouseDown={onCancel}
    >
      <motion.div
        {...({ testId: 'unsaved-changes-modal' } as any)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          width: 440,
          backgroundColor: '#1A1A1F',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.borderStrong,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 22,
          gap: 16,
        }}
        onMouseDown={(e: any) => e.stopPropagation?.()}
      >
        {/* Header with Warning Icon */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#382B14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="alertTriangle" size={18} color="#F59E0B" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <text
              style={{
                fontSize: 15,
                fontWeight: '600',
                fontFamily: FONT_SANS,
                color: C.text,
                whiteSpace: 'nowrap',
              }}
            >
              Save changes?
            </text>
            <text
              style={{
                fontSize: 12,
                fontFamily: FONT_MONO,
                color: C.accent,
                whiteSpace: 'nowrap',
              }}
            >
              {displayTitle}
            </text>
          </div>
        </div>

        {/* Body Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <text
            style={{
              fontSize: 13,
              fontFamily: FONT_SANS,
              color: C.secondary,
              lineHeight: 1.4,
            }}
          >
            {`Do you want to save the changes you made to "${displayTitle}"? Your changes will be lost if you close without saving.`}
          </text>
        </div>

        {/* Actions Row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
            borderTopWidth: 1,
            borderColor: C.border,
            marginTop: 4,
          }}
        >
          {/* Cancel button */}
          <Button
            testId="cancel-discard-button"
            onClick={onCancel}
            style={{
              height: 32,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 6,
              backgroundColor: 'transparent',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              hover: { backgroundColor: C.surfaceHighlight },
            }}
          >
            <text
              style={{
                fontSize: 12.5,
                fontFamily: FONT_SANS,
                color: C.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              Cancel
            </text>
            <text
              style={{
                fontSize: 10,
                fontFamily: FONT_MONO,
                color: C.tertiary,
                whiteSpace: 'nowrap',
              }}
            >
              Esc
            </text>
          </Button>

          {/* Right action buttons: Don't Save & Save */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Button
              testId="confirm-discard-button"
              onClick={onDiscard}
              style={{
                height: 32,
                paddingLeft: 12,
                paddingRight: 12,
                borderRadius: 6,
                backgroundColor: '#2A181A',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                hover: { backgroundColor: '#3D2024' },
              }}
            >
              <text
                style={{
                  fontSize: 12.5,
                  fontFamily: FONT_SANS,
                  fontWeight: '500',
                  color: '#F87171',
                  whiteSpace: 'nowrap',
                }}
              >
                Don't Save
              </text>
            </Button>

            <Button
              testId="save-and-close-button"
              onClick={onSave}
              style={{
                height: 32,
                paddingLeft: 14,
                paddingRight: 14,
                borderRadius: 6,
                backgroundColor: C.accent,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                hover: { backgroundColor: C.accentHover },
              }}
            >
              <Icon name="save" size={13} color="#FFFFFF" />
              <text
                style={{
                  fontSize: 12.5,
                  fontFamily: FONT_SANS,
                  fontWeight: '600',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                }}
              >
                Save
              </text>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
