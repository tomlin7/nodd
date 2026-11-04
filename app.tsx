import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyMacCpuThrottleFromEnv,
  render,
  useGpuix,
} from '@gpuix/react'
import { Titlebar } from './src/components/Titlebar'
import { Settings } from './src/components/Settings'
import { RequestBuilder } from './src/components/RequestBuilder'
import { TooltipProvider } from './src/components/tooltip-layer'
import { C, FONT_MONO, FONT_SANS } from './src/theme'
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
import { loadHistory, saveHistoryEntry } from './src/core/history'
import { loadSettings, saveSettings } from './src/core/preferences'
import { executeRequest } from './src/core/client'
import { createId } from './src/core/url'

export function createInitialRequest(): HttpRequest {
  return {
    id: createId('req'),
    name: 'Get All Users',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users',
    params: [
      { id: createId('param'), key: '_limit', value: '5', enabled: true },
    ],
    headers: [
      { id: createId('header'), key: 'Accept', value: 'application/json', enabled: true },
    ],
    body: { type: 'none' },
    auth: { type: 'none' },
  }
}

export function NoddApp() {
  const { renderer } = useGpuix()

  const [settings, setSettings] = useState<ClientSettings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

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

    // Find and update or add to first collection
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
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
            }}
          >
            <Titlebar
              requestName={currentRequest.name}
              method={currentRequest.method}
              environment={activeEnvironment}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              settingsOpen={settingsOpen}
              onOpenSettings={() => setSettingsOpen(true)}
            />

            {/* Main Workbench Body */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                width: '100%',
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
            </div>
          </div>
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
