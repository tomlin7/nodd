import fs from 'fs'
import path from 'path'
import type { Environment, HttpRequest, HttpResponse } from './types'
import { buildUrlWithParams, interpolatePathVariables } from './url'
import { interpolateRequest } from './variables'

export interface ExecuteOptions {
  environment?: Environment | null
  timeoutMs?: number
  followRedirects?: boolean
  validateSsl?: boolean
}

/**
 * Executes an HTTP request and measures status, latency, size, headers, and body.
 */
export async function executeRequest(
  originalRequest: HttpRequest,
  options?: ExecuteOptions
): Promise<HttpResponse> {
  const req = interpolateRequest(originalRequest, options?.environment)
  const timeoutMs = options?.timeoutMs ?? 30000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const startTime = performance.now()

  try {
    // 1. Build Final URL (Interpolating path variables first, then query parameters)
    const urlWithPathVars = interpolatePathVariables(req.url, req.pathVariables)
    let finalUrl = buildUrlWithParams(urlWithPathVars, req.params)
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`
    }

    // 2. Prepare Headers
    const headers = new Headers()
    for (const h of req.headers) {
      if (h.enabled && h.key.trim().length > 0) {
        headers.set(h.key.trim(), h.value ?? '')
      }
    }

    // 3. Prepare Auth
    if (req.auth.type === 'bearer' && req.auth.bearerToken) {
      headers.set('Authorization', `Bearer ${req.auth.bearerToken.trim()}`)
    } else if (req.auth.type === 'basic') {
      const creds = `${req.auth.basicUsername ?? ''}:${req.auth.basicPassword ?? ''}`
      const base64 = Buffer.from(creds).toString('base64')
      headers.set('Authorization', `Basic ${base64}`)
    } else if (req.auth.type === 'apikey' && req.auth.apiKeyKey && req.auth.apiKeyValue) {
      if (req.auth.apiKeyIn === 'query') {
        const separator = finalUrl.includes('?') ? '&' : '?'
        finalUrl = `${finalUrl}${separator}${encodeURIComponent(req.auth.apiKeyKey)}=${encodeURIComponent(req.auth.apiKeyValue)}`
      } else {
        headers.set(req.auth.apiKeyKey.trim(), req.auth.apiKeyValue)
      }
    }

    // 4. Prepare Body
    let bodyPayload: BodyInit | undefined = undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body.type === 'json' && req.body.rawText) {
        bodyPayload = req.body.rawText
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json')
        }
      } else if (req.body.type === 'raw' && req.body.rawText) {
        bodyPayload = req.body.rawText
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'text/plain')
        }
      } else if (req.body.type === 'x-www-form-urlencoded' && req.body.formParams) {
        const form = new URLSearchParams()
        for (const p of req.body.formParams) {
          if (p.enabled && p.key.trim().length > 0) {
            form.append(p.key.trim(), p.value ?? '')
          }
        }
        bodyPayload = form.toString()
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/x-www-form-urlencoded')
        }
      } else if (req.body.type === 'form-data' && req.body.formDataParams) {
        const form = new FormData()
        for (const p of req.body.formDataParams) {
          if (p.enabled && p.key.trim().length > 0) {
            if (p.type === 'file' && p.value && fs.existsSync(p.value)) {
              const fileBuf = fs.readFileSync(p.value)
              const fileName = path.basename(p.value)
              const blob = new Blob([fileBuf])
              form.append(p.key.trim(), blob, fileName)
            } else {
              form.append(p.key.trim(), p.value ?? '')
            }
          }
        }
        bodyPayload = form
        // Let the fetch runtime automatically set the Content-Type with boundary
        headers.delete('content-type')
      }
    }

    // 5. Execute Fetch
    const response = await fetch(finalUrl, {
      method: req.method,
      headers,
      body: bodyPayload,
      signal: controller.signal,
      redirect: options?.followRedirects === false ? 'manual' : 'follow',
      ...(options?.validateSsl === false ? { tls: { rejectUnauthorized: false } } : {}),
    })

    const endTime = performance.now()
    const timeMs = Math.max(1, Math.round(endTime - startTime))

    // 6. Read Body & Response Headers
    const responseText = await response.text()
    const sizeBytes = Buffer.byteLength(responseText, 'utf8')

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((val, key) => {
      responseHeaders[key.toLowerCase()] = val
    })

    return {
      status: response.status,
      statusText: response.statusText || getStatusText(response.status),
      headers: responseHeaders,
      body: responseText,
      sizeBytes,
      timeMs,
      timestamp: Date.now(),
    }
  } catch (err: any) {
    const endTime = performance.now()
    const timeMs = Math.max(1, Math.round(endTime - startTime))
    const isAbort = err?.name === 'AbortError' || controller.signal.aborted

    return {
      status: 0,
      statusText: isAbort ? 'Timed Out' : 'Network Error',
      headers: {},
      body: '',
      sizeBytes: 0,
      timeMs,
      error: isAbort ? `Request exceeded timeout of ${timeoutMs}ms` : err?.message || 'Failed to send request',
      timestamp: Date.now(),
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

function getStatusText(code: number): string {
  const map: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  }
  return map[code] ?? 'Unknown'
}
