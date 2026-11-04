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
