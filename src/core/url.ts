import type { KeyValuePair } from './types'

let nextId = 1
export function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${(nextId++).toString(36)}`
}

/**
 * Extracts query parameters from a URL string into KeyValuePairs,
 * and returns the base URL without query parameters.
 */
export function parseUrlParams(fullUrl: string): { baseUrl: string; params: KeyValuePair[] } {
  if (!fullUrl) return { baseUrl: '', params: [] }

  try {
    const questionIdx = fullUrl.indexOf('?')
    if (questionIdx === -1) {
      return { baseUrl: fullUrl, params: [] }
    }

    const baseUrl = fullUrl.slice(0, questionIdx)
    const queryString = fullUrl.slice(questionIdx + 1)
    const hashIdx = queryString.indexOf('#')
    const queryPart = hashIdx === -1 ? queryString : queryString.slice(0, hashIdx)

    const params: KeyValuePair[] = []
    const pairs = queryPart.split('&')

    for (const pair of pairs) {
      if (!pair) continue
      const eqIdx = pair.indexOf('=')
      let key = ''
      let value = ''

      if (eqIdx === -1) {
        key = decodeURIComponent(pair)
      } else {
        key = decodeURIComponent(pair.slice(0, eqIdx))
        value = decodeURIComponent(pair.slice(eqIdx + 1))
      }

      params.push({
        id: createId('param'),
        key,
        value,
        enabled: true,
      })
    }

    return { baseUrl, params }
  } catch {
    return { baseUrl: fullUrl, params: [] }
  }
}

/**
 * Rebuilds a full URL from a base URL and an array of KeyValuePairs.
 * Only enabled parameters with a non-empty key are appended.
 */
export function buildUrlWithParams(baseUrl: string, params: KeyValuePair[]): string {
  if (!baseUrl) return ''

  // Separate hash if present
  let cleanBase = baseUrl
  let hashPart = ''
  const hashIdx = cleanBase.indexOf('#')
  if (hashIdx !== -1) {
    hashPart = cleanBase.slice(hashIdx)
    cleanBase = cleanBase.slice(0, hashIdx)
  }

  // Remove existing query part in cleanBase if any
  const questionIdx = cleanBase.indexOf('?')
  if (questionIdx !== -1) {
    cleanBase = cleanBase.slice(0, questionIdx)
  }

  const activeParams = params.filter((p) => p.enabled && p.key.trim().length > 0)
  if (activeParams.length === 0) {
    return cleanBase + hashPart
  }

  const queryStrings = activeParams.map(
    (p) => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value ?? '')}`
  )

  return `${cleanBase}?${queryStrings.join('&')}${hashPart}`
}

/**
 * Extracts route parameters from a URL path.
 * Supports both colon style (e.g. `/:userId`) and curly brace style (e.g. `/{userId}`).
 * Ignores environment variables with double braces (`{{env}}`), query strings, hashes, and protocol/host ports.
 * Returns unique parameter names in order of appearance.
 */
export function extractPathVariables(url: string): string[] {
  if (!url) return []

  // 1. Strip query and fragment
  const cleanUrl = url.split(/[?#]/)[0] || ''

  // 2. Isolate path portion after scheme + authority
  const schemeIdx = cleanUrl.indexOf('://')
  const hostAndPath = schemeIdx !== -1 ? cleanUrl.slice(schemeIdx + 3) : cleanUrl
  const slashIdx = hostAndPath.indexOf('/')
  const path = slashIdx !== -1 ? hostAndPath.slice(slashIdx) : (cleanUrl.startsWith('/') ? cleanUrl : '')

  if (!path) return []

  const keys: string[] = []
  const seen = new Set<string>()

  // Match either :var (after start of path or /) OR {var} / {{env}}
  const regex = /(?:^|\/):([a-zA-Z_][a-zA-Z0-9_]*)(?=\/|[?#.]|$)|(\{{1,2}[a-zA-Z_][a-zA-Z0-9_]*\}{1,2})/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(path)) !== null) {
    if (match[1]) {
      const key = match[1]
      if (!seen.has(key)) {
        seen.add(key)
        keys.push(key)
      }
    } else if (match[2]) {
      const braceToken = match[2]
      if (!braceToken.startsWith('{{') && !braceToken.endsWith('}}')) {
        const key = braceToken.slice(1, -1)
        if (key && !seen.has(key)) {
          seen.add(key)
          keys.push(key)
        }
      }
    }
  }

  return keys
}

/**
 * Synchronizes the path variables array against the URL string:
 * - Detects variables in the URL path.
 * - Preserves existing values, descriptions, and enabled states for matching keys.
 * - Adds new entries for newly detected path variables.
 * - Drops variables that are no longer in the URL path.
 */
export function syncPathVariables(
  url: string,
  currentPathVariables: KeyValuePair[] = []
): KeyValuePair[] {
  const detectedKeys = extractPathVariables(url)
  if (detectedKeys.length === 0) return []

  const existingMap = new Map<string, KeyValuePair>()
  for (const pv of currentPathVariables) {
    if (!existingMap.has(pv.key)) {
      existingMap.set(pv.key, pv)
    }
  }

  return detectedKeys.map((key) => {
    const existing = existingMap.get(key)
    if (existing) {
      return existing
    }
    return {
      id: createId('pvar'),
      key,
      value: '',
      enabled: true,
      description: '',
    }
  })
}

/**
 * Substitutes enabled path variables into the URL path.
 * If a variable is disabled or has an empty value, it is left untouched.
 */
export function interpolatePathVariables(
  url: string,
  pathVariables?: KeyValuePair[]
): string {
  if (!url || !pathVariables || pathVariables.length === 0) {
    return url
  }

  const varMap = new Map<string, string>()
  for (const pv of pathVariables) {
    if (pv.enabled && pv.value !== undefined && pv.value !== '') {
      varMap.set(pv.key, pv.value)
    }
  }

  if (varMap.size === 0) {
    return url
  }

  return url.replace(
    /(?:^|\/):([a-zA-Z_][a-zA-Z0-9_]*)(?=\/|[?#.]|$)|(\{{1,2}[a-zA-Z_][a-zA-Z0-9_]*\}{1,2})/g,
    (match, colonKey, braceToken) => {
      if (colonKey) {
        if (varMap.has(colonKey)) {
          const prefix = match.startsWith('/') ? '/' : ''
          return `${prefix}${encodeURIComponent(varMap.get(colonKey)!)}`
        }
        return match
      }
      if (braceToken) {
        if (!braceToken.startsWith('{{') && !braceToken.endsWith('}}')) {
          const key = braceToken.slice(1, -1)
          if (varMap.has(key)) {
            return encodeURIComponent(varMap.get(key)!)
          }
        }
        return match
      }
      return match
    }
  )
}
