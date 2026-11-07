import type { HttpRequest, HttpResponse, WorkspaceTab } from './types'
import { createId } from './url'

export function serializeRequest(req: HttpRequest): string {
  return JSON.stringify({
    name: req.name,
    method: req.method,
    url: req.url,
    params: req.params.map((p) => ({ key: p.key, value: p.value, enabled: p.enabled })),
    headers: req.headers.map((h) => ({ key: h.key, value: h.value, enabled: h.enabled })),
    body: req.body,
    auth: req.auth,
  })
}

export function createTab(
  request: HttpRequest,
  response: HttpResponse | null = null,
  idOverride?: string
): WorkspaceTab {
  return {
    id: idOverride ?? createId('tab'),
    request,
    initialSnapshot: serializeRequest(request),
    response,
    isLoading: false,
  }
}

export function isTabDirty(tab: WorkspaceTab): boolean {
  return serializeRequest(tab.request) !== tab.initialSnapshot
}

export function markTabSaved(tab: WorkspaceTab): WorkspaceTab {
  return {
    ...tab,
    initialSnapshot: serializeRequest(tab.request),
  }
}

export function closeTabHelper(
  tabs: WorkspaceTab[],
  activeTabId: string,
  tabIdToClose: string,
  createFallbackRequest: () => HttpRequest
): { tabs: WorkspaceTab[]; activeTabId: string } {
  if (tabs.length <= 1) {
    const fallbackTab = createTab(createFallbackRequest())
    return { tabs: [fallbackTab], activeTabId: fallbackTab.id }
  }

  const closeIdx = tabs.findIndex((t) => t.id === tabIdToClose)
  if (closeIdx === -1) {
    return { tabs, activeTabId }
  }

  const nextTabs = tabs.filter((t) => t.id !== tabIdToClose)
  let nextActiveId = activeTabId

  if (activeTabId === tabIdToClose) {
    const nextIdx = Math.min(closeIdx, nextTabs.length - 1)
    nextActiveId = nextTabs[nextIdx].id
  }

  return { tabs: nextTabs, activeTabId: nextActiveId }
}
