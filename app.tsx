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
import { TabBar } from './src/components/TabBar'
import { EmptyWorkbench } from './src/components/EmptyWorkbench'
import { RequestBuilder } from './src/components/RequestBuilder'
import { ResponseViewer } from './src/components/ResponseViewer'
import { EnvironmentManager } from './src/components/EnvironmentManager'
import { StatusBar } from './src/components/StatusBar'
import { CodeSnippetModal } from './src/components/CodeSnippetModal'
import { ImportModal } from './src/components/ImportModal'
import { exportPostmanCollection } from './src/core/postman'
import { C, ResizeHandle } from './src/theme'
import type {
  ClientSettings,
  Collection,
  Environment,
  HistoryEntry,
  HttpRequest,
  WorkspaceTab,
} from './src/core/types'
import { loadCollections, saveCollections } from './src/core/collections'
import { loadEnvironments, saveEnvironments } from './src/core/environments'
import { clearHistory, loadHistory, saveHistoryEntry } from './src/core/history'
import { loadSettings, saveSettings } from './src/core/preferences'
import { executeRequest } from './src/core/client'
import { createId } from './src/core/url'
import { closeTabHelper, createTab, isTabDirty, markTabSaved } from './src/core/tabs'

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
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)

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

  // Multi-Tab Workspace State
  const [tabs, setTabs] = useState<WorkspaceTab[]>(() => {
    const cols = loadCollections()
    const firstReq = cols[0]?.folders[0]?.requests[0] ?? cols[0]?.requests[0]
    return [createTab(firstReq ?? createInitialRequest())]
  })
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id ?? 'tab-1')

  const activeTab = tabs.find((t) => t.id === activeTabId)
  const currentRequest = activeTab?.request
  const response = activeTab?.response ?? null
  const isLoading = activeTab?.isLoading ?? false

  const handleSelectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const handleNewTab = useCallback((req?: HttpRequest) => {
    const newReq = req ?? createInitialRequest()
    const newTab = createTab(newReq)
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [])

  const handleCloseTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const next = closeTabHelper(prev, activeTabId, tabId)
        setActiveTabId(next.activeTabId)
        return next.tabs
      })
    },
    [activeTabId]
  )

  const handleRequestChange = useCallback(
    (nextReq: HttpRequest) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, request: nextReq } : t))
      )
    },
    [activeTabId]
  )

  const handleSelectRequest = useCallback(
    (req: HttpRequest) => {
      // 1. Check if request is already open in a tab
      const existingTab = tabs.find((t) => t.request.id === req.id)
      if (existingTab) {
        setActiveTabId(existingTab.id)
        return
      }

      // 2. If current tab is clean & blank, replace it
      if (
        activeTab &&
        !isTabDirty(activeTab) &&
        activeTab.request.name === 'New Request' &&
        activeTab.response === null
      ) {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? createTab(req, null, t.id) : t))
        )
        return
      }

      // 3. Otherwise open in a new tab
      const newTab = createTab(req)
      setTabs((prev) => [...prev, newTab])
      setActiveTabId(newTab.id)
    },
    [tabs, activeTab, activeTabId]
  )

  const sendRequest = useCallback(async () => {
    if (isLoading || !currentRequest) return
    const targetTabId = activeTabId
    const targetRequest = currentRequest

    setTabs((prev) =>
      prev.map((t) => (t.id === targetTabId ? { ...t, isLoading: true } : t))
    )

    try {
      const res = await executeRequest(targetRequest, {
        environment: activeEnvironment,
        timeoutMs: settings.timeoutMs,
        followRedirects: settings.followRedirects,
        validateSsl: settings.validateSsl,
      })

      setTabs((prev) =>
        prev.map((t) => (t.id === targetTabId ? { ...t, response: res } : t))
      )

      const entry: HistoryEntry = {
        id: createId('hist'),
        request: { ...targetRequest },
        response: res,
        timestamp: Date.now(),
      }
      saveHistoryEntry(entry)
      setHistory(loadHistory())
    } finally {
      setTabs((prev) =>
        prev.map((t) => (t.id === targetTabId ? { ...t, isLoading: false } : t))
      )
    }
  }, [isLoading, activeTabId, currentRequest, activeEnvironment, settings])

  const saveCurrentRequest = useCallback(() => {
    if (!currentRequest) return
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

    // Mark current tab as saved (clears dirty dot)
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? markTabSaved(t) : t))
    )
  }, [collections, currentRequest, activeTabId])

  const handleCreateRequest = useCallback(
    (collectionId?: string) => {
      const newReq = createInitialRequest(collectionId)
      const cols = [...collections]
      if (cols.length > 0) {
        cols[0].requests.push(newReq)
        setCollections(cols)
        saveCollections(cols)
      }
      handleNewTab(newReq)
    },
    [collections, handleNewTab]
  )

  const handleImportCollection = useCallback((col: Collection) => {
    setCollections((prev) => {
      const updated = [...prev, col]
      saveCollections(updated)
      return updated
    })
    const firstReq = col.folders[0]?.requests[0] ?? col.requests[0]
    if (firstReq) {
      handleNewTab(firstReq)
    }
  }, [handleNewTab])

  const handleExportCollection = useCallback((col: Collection) => {
    try {
      const json = exportPostmanCollection(col)
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(json)
      }
    } catch (e) {
      console.error('Failed to export collection', e)
    }
  }, [])

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

      // New tab: Ctrl+T / Cmd+T
      if (isCtrl && key === 't') {
        e.preventDefault?.()
        handleNewTab()
        return
      }

      // Close tab: Ctrl+W / Cmd+W
      if (isCtrl && key === 'w') {
        e.preventDefault?.()
        handleCloseTab(activeTabId)
        return
      }

      // Switch tabs: Ctrl+Tab or Ctrl+Shift+Tab
      if (isCtrl && key === 'tab') {
        e.preventDefault?.()
        setTabs((currentTabs) => {
          if (currentTabs.length <= 1) return currentTabs
          const idx = currentTabs.findIndex((t) => t.id === activeTabId)
          if (idx === -1) return currentTabs
          const delta = e.shiftKey ? -1 : 1
          const nextIdx = (idx + delta + currentTabs.length) % currentTabs.length
          setActiveTabId(currentTabs[nextIdx].id)
          return currentTabs
        })
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
        } else if (codeModalOpen) {
          setCodeModalOpen(false)
        } else if (importModalOpen) {
          setImportModalOpen(false)
        }
        return
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    sendRequest,
    saveCurrentRequest,
    handleNewTab,
    handleCloseTab,
    handleCreateRequest,
    activeTabId,
    settingsOpen,
    envManagerOpen,
  ])

  return (
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
      {/* Base Workbench View */}
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
          requestName={currentRequest ? currentRequest.name : ''}
          method={currentRequest?.method}
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
                activeRequestId={currentRequest?.id}
                onSelectRequest={handleSelectRequest}
                onCreateRequest={handleCreateRequest}
                onCreateCollection={handleCreateCollection}
                onDeleteRequest={handleDeleteRequest}
                onClearHistory={handleClearHistory}
                onImportCollection={() => setImportModalOpen(true)}
                onExportCollection={handleExportCollection}
              />
            </div>
            {sidebarOpen && (
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
            )}
          </motion.div>

          {/* Main Workbench Body with TabBar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              minWidth: 0,
              minHeight: 0,
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onNewTab={() => handleNewTab()}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                minWidth: 0,
                minHeight: 0,
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <AnimatePresence initial={false}>
                {!currentRequest ? (
                  <motion.div
                    key="empty-workbench"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{
                      display: 'flex',
                      flexGrow: 1,
                      width: '100%',
                      height: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  >
                    <EmptyWorkbench onNewTab={() => handleNewTab()} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="active-workbench"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      flexGrow: 1,
                      width: '100%',
                      height: '100%',
                      minHeight: 0,
                      overflow: 'hidden',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  >
                    <RequestBuilder
                      request={currentRequest}
                      onChange={handleRequestChange}
                      onSend={sendRequest}
                      onSave={saveCurrentRequest}
                      isLoading={isLoading}
                      onOpenCodeSnippets={() => setCodeModalOpen(true)}
                    />

                    <ResponseViewer
                      response={response}
                      request={currentRequest}
                      isLoading={isLoading}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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

      {/* Screen & Modal Overlays with Smooth Presence Transitions */}
      <AnimatePresence initial={false}>
        {settingsOpen && (
          <motion.div
            key="screen-settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: C.canvas,
              overflow: 'hidden',
            }}
          >
            <Settings
              settings={settings}
              onSave={(next) => {
                setSettings(next)
                saveSettings(next)
              }}
              onClose={() => setSettingsOpen(false)}
            />
          </motion.div>
        )}

        {envManagerOpen && (
          <motion.div
            key="screen-env-manager"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: C.canvas,
              overflow: 'hidden',
            }}
          >
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
          </motion.div>
        )}

        {codeModalOpen && currentRequest && (
          <motion.div
            key="screen-code-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: C.canvas,
              overflow: 'hidden',
            }}
          >
            <CodeSnippetModal
              request={currentRequest}
              environment={activeEnvironment}
              onClose={() => setCodeModalOpen(false)}
            />
          </motion.div>
        )}

        {importModalOpen && (
          <motion.div
            key="screen-import-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: C.canvas,
              overflow: 'hidden',
            }}
          >
            <ImportModal
              onImport={handleImportCollection}
              onClose={() => setImportModalOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
  )
}

// Entry point
const isEntryPoint =
  typeof process !== 'undefined' &&
  (process.argv[1]?.endsWith('app.tsx') || process.argv[1]?.endsWith('nodd'))

if (isEntryPoint) {
  applyMacCpuThrottleFromEnv()
  render(<NoddApp />, {
    title: 'Nodd · Minimalist API Workbench',
    titlebarTransparent: true,
    width: 1200,
    height: 800,
  })
}
