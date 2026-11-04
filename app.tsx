import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  applyMacCpuThrottleFromEnv,
  motion,
  render,
  useGpuix,
} from '@gpuix/react'
import { Titlebar } from './src/components/Titlebar'
import { Settings } from './src/components/Settings'
import { Sidebar } from './src/components/Sidebar'
import { RequestBuilder } from './src/components/RequestBuilder'
import { ResponseViewer } from './src/components/ResponseViewer'
import { EnvironmentManager } from './src/components/EnvironmentManager'
import { StatusBar } from './src/components/StatusBar'
import { TooltipProvider } from './src/components/tooltip-layer'
import { C, FONT_MONO, FONT_SANS, ResizeHandle } from './src/theme'
import type {
  ClientSettings,
  Collection,
  Environment,
  HistoryEntry,
  HttpRequest,
  HttpResponse,
} from './src/core/types'
import { loadCollections, saveCollections } from './src/core/collections'
import { loadEnvironments, saveEnvironments } from './src/core/environments'
import { clearHistory, loadHistory, saveHistoryEntry } from './src/core/history'
import { loadSettings, saveSettings } from './src/core/preferences'
import { executeRequest } from './src/core/client'
import { createId } from './src/core/url'

export function createInitialRequest(collectionId?: string): HttpRequest {
  return {
    id: createId('req'),
    name: 'New Request',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: [],
    headers: [
      { id: createId('header'), key: 'Accept', value: 'application/json', enabled: true },
    ],
    body: { type: 'none' },
    auth: { type: 'none' },
    collectionId,
  }
}

export function NoddApp() {
  const { renderer } = useGpuix()

  const [settings, setSettings] = useState<ClientSettings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [envManagerOpen, setEnvManagerOpen] = useState(false)

  // Resizable Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [resizing, setResizing] = useState<string | null>(null)
  const resizeOrigin = useRef({ startX: 0, startWidth: 260 })

  const [environments, setEnvironments] = useState<Environment[]>(loadEnvironments)
  const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(() => {
    const list = loadEnvironments()
    return list.length > 0 ? list[0] : null
  })

  const [collections, setCollections] = useState<Collection[]>(loadCollections)
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)

  const [currentRequest, setCurrentRequest] = useState<HttpRequest>(() => {
    const cols = loadCollections()
    const firstReq = cols[0]?.folders[0]?.requests[0] ?? cols[0]?.requests[0]
    return firstReq ?? createInitialRequest()
  })

  const [response, setResponse] = useState<HttpResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const sendRequest = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const res = await executeRequest(currentRequest, {
        environment: activeEnvironment,
        timeoutMs: settings.timeoutMs,
        followRedirects: settings.followRedirects,
        validateSsl: settings.validateSsl,
      })
      setResponse(res)

      const entry: HistoryEntry = {
        id: createId('hist'),
        request: { ...currentRequest },
        response: res,
        timestamp: Date.now(),
      }
      saveHistoryEntry(entry)
      setHistory(loadHistory())
    } finally {
      setIsLoading(false)
    }
  }, [currentRequest, activeEnvironment, settings, isLoading])

  const saveCurrentRequest = useCallback(() => {
    const cols = [...collections]
    if (cols.length === 0) return

    let updated = false
    for (const c of cols) {
      const reqIdx = c.requests.findIndex((r) => r.id === currentRequest.id)
      if (reqIdx !== -1) {
        c.requests[reqIdx] = { ...currentRequest }
        updated = true
        break
      }
      for (const f of c.folders) {
        const folderReqIdx = f.requests.findIndex((r) => r.id === currentRequest.id)
        if (folderReqIdx !== -1) {
          f.requests[folderReqIdx] = { ...currentRequest }
          updated = true
          break
        }
      }
      if (updated) break
    }

    if (!updated) {
      cols[0].requests.unshift({ ...currentRequest })
    }

    setCollections(cols)
    saveCollections(cols)
  }, [collections, currentRequest])

  const handleCreateRequest = useCallback((collectionId?: string) => {
    const newReq = createInitialRequest(collectionId)
    const cols = [...collections]
    if (cols.length > 0) {
      cols[0].requests.push(newReq)
      setCollections(cols)
      saveCollections(cols)
    }
    setCurrentRequest(newReq)
    setResponse(null)
  }, [collections])

  const handleCreateCollection = () => {
    const newCol: Collection = {
      id: createId('col'),
      name: `New Collection ${collections.length + 1}`,
      createdAt: Date.now(),
      folders: [],
      requests: [createInitialRequest()],
    }
    const updated = [...collections, newCol]
    setCollections(updated)
    saveCollections(updated)
  }

  const handleDeleteRequest = (requestId: string) => {
    const cols = collections.map((col) => ({
      ...col,
      requests: col.requests.filter((r) => r.id !== requestId),
      folders: col.folders.map((f) => ({
        ...f,
        requests: f.requests.filter((r) => r.id !== requestId),
      })),
    }))
    setCollections(cols)
    saveCollections(cols)
  }

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
  }

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      const isCtrl = e.ctrlKey || e.metaKey
      const key = e.key?.toLowerCase()

      // Send request: Ctrl+Enter / Cmd+Enter
      if (isCtrl && e.key === 'Enter') {
        e.preventDefault?.()
        sendRequest()
        return
      }

      // Save request: Ctrl+S / Cmd+S
      if (isCtrl && key === 's') {
        e.preventDefault?.()
        saveCurrentRequest()
        return
      }

      // New request: Ctrl+N / Cmd+N
      if (isCtrl && key === 'n') {
        e.preventDefault?.()
        handleCreateRequest()
        return
      }

      // Toggle sidebar: Ctrl+B / Cmd+B
      if (isCtrl && key === 'b') {
        e.preventDefault?.()
        setSidebarOpen((prev) => !prev)
        return
      }

      // Escape: Close modals / views
      if (e.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false)
        } else if (envManagerOpen) {
          setEnvManagerOpen(false)
        }
        return
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [sendRequest, saveCurrentRequest, handleCreateRequest, settingsOpen, envManagerOpen])

  return (
    <TooltipProvider>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: C.canvas,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {settingsOpen ? (
          <Settings
            settings={settings}
            onSave={(next) => {
              setSettings(next)
              saveSettings(next)
            }}
            onClose={() => setSettingsOpen(false)}
          />
        ) : envManagerOpen ? (
          <EnvironmentManager
            environments={environments}
            activeEnvironment={activeEnvironment}
            onSelectEnvironment={(env) => setActiveEnvironment(env)}
            onSaveEnvironments={(next) => {
              setEnvironments(next)
              saveEnvironments(next)
            }}
            onClose={() => setEnvManagerOpen(false)}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <Titlebar
              requestName={currentRequest.name}
              method={currentRequest.method}
              environment={activeEnvironment}
              environments={environments}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              settingsOpen={settingsOpen}
              onOpenSettings={() => setSettingsOpen(true)}
              onSelectEnvironment={(env) => setActiveEnvironment(env)}
              onOpenEnvironmentManager={() => setEnvManagerOpen(true)}
            />

            {/* Split Body: Sidebar + Main Workbench */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexGrow: 1,
                width: '100%',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Sliding Sidebar Drawer */}
              <motion.div
                initial={false}
                animate={{ width: sidebarOpen ? sidebarWidth : 0 }}
                transition={{ duration: resizing === 'left' ? 0 : 0.2, ease: 'easeOut' }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  height: '100%',
                  flexShrink: 0,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div style={{ width: sidebarWidth, height: '100%', display: 'flex', flexShrink: 0 }}>
                  <Sidebar
                    collections={collections}
                    history={history}
                    activeRequestId={currentRequest.id}
                    onSelectRequest={(req) => {
                      setCurrentRequest(req)
                      setResponse(null)
                    }}
                    onCreateRequest={handleCreateRequest}
                    onCreateCollection={handleCreateCollection}
                    onDeleteRequest={handleDeleteRequest}
                    onClearHistory={handleClearHistory}
                  />
                </div>
                <ResizeHandle
                  testId="resize-handle-left"
                  side="left"
                  isResizing={resizing === 'left'}
                  onMouseDown={(e: any) => {
                    if (e.button === 0) {
                      resizeOrigin.current = { startX: e.x ?? 0, startWidth: sidebarWidth }
                      setResizing('left')
                    }
                  }}
                />
              </motion.div>

              {/* Main Workbench Body */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  minWidth: 0,
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                <RequestBuilder
                  request={currentRequest}
                  onChange={setCurrentRequest}
                  onSend={sendRequest}
                  onSave={saveCurrentRequest}
                  isLoading={isLoading}
                />

                <ResponseViewer
                  response={response}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Bottom Status Bar */}
            <StatusBar
              activeEnvironment={activeEnvironment}
              response={response}
              isLoading={isLoading}
              onOpenEnvironmentManager={() => setEnvManagerOpen(true)}
            />
          </div>
        )}

        {/* Global Resizing Overlay */}
        {resizing !== null && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              cursor: 'col-resize',
              backgroundColor: '#00000001',
            }}
            onMouseMove={(e: any) => {
              const currentX = e.x ?? 0
              if (resizing === 'left') {
                const newWidth = Math.max(180, Math.min(480, currentX))
                setSidebarWidth(newWidth)
              }
            }}
            onMouseUp={() => setResizing(null)}
          />
        )}
      </div>
    </TooltipProvider>
  )
}

// Entry point
applyMacCpuThrottleFromEnv()
render(<NoddApp />, {
  title: 'Nodd · Minimalist API Workbench',
  titlebarTransparent: true,
  width: 1200,
  height: 800,
})
