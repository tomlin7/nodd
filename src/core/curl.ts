import type { Environment, FormDataParam, HttpMethod, HttpRequest, KeyValuePair } from './types'
import { createId, interpolatePathVariables, parseUrlParams } from './url'
import { interpolateString } from './variables'

/**
 * Tokenizes a shell/curl command respecting single, double quotes and line continuations
 */
export function tokenizeCurl(cmd: string): string[] {
  const normalized = cmd.replace(/\\\r?\n/g, ' ').trim()
  const tokens: string[] = []
  let current = ''
  let inSingleQuote = false
  let inDoubleQuote = false
  let escaped = false

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i]

    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\' && !inSingleQuote) {
      escaped = true
      continue
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote
      continue
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote
      continue
    }

    if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (current.length > 0) {
    tokens.push(current)
  }

  return tokens
}

export function parseCurlCommand(input: string): Partial<HttpRequest> | null {
  const trimmed = input.trim()
  if (!trimmed.toLowerCase().startsWith('curl')) {
    return null
  }

  const tokens = tokenizeCurl(trimmed)
  if (tokens.length === 0 || tokens[0].toLowerCase() !== 'curl') {
    return null
  }

  let method: HttpMethod = 'GET'
  let url = ''
  const headers: KeyValuePair[] = []
  const formDataParams: FormDataParam[] = []
  let rawBody: string | undefined
  let authUser: string | undefined

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i]

    if (t === '-X' || t === '--request') {
      const next = tokens[++i]?.toUpperCase()
      if (next && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(next)) {
        method = next as HttpMethod
      }
    } else if (t === '-H' || t === '--header') {
      const val = tokens[++i]
      if (val) {
        const colonIdx = val.indexOf(':')
        if (colonIdx > 0) {
          const key = val.slice(0, colonIdx).trim()
          const headerVal = val.slice(colonIdx + 1).trim()
          headers.push({
            id: createId('header'),
            key,
            value: headerVal,
            enabled: true,
          })
        }
      }
    } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-ascii' || t === '--data-binary') {
      const bodyVal = tokens[++i]
      if (bodyVal !== undefined) {
        rawBody = rawBody ? `${rawBody}&${bodyVal}` : bodyVal
        if (method === 'GET') {
          method = 'POST'
        }
      }
    } else if (t === '-F' || t === '--form') {
      const formVal = tokens[++i]
      if (formVal) {
        const eqIdx = formVal.indexOf('=')
        if (eqIdx !== -1) {
          const key = formVal.slice(0, eqIdx).trim()
          let val = formVal.slice(eqIdx + 1).trim()
          let paramType: 'text' | 'file' = 'text'
          if (val.startsWith('@')) {
            paramType = 'file'
            val = val.slice(1)
          }
          formDataParams.push({
            id: createId('form'),
            key,
            value: val,
            type: paramType,
            enabled: true,
          })
          if (method === 'GET') {
            method = 'POST'
          }
        }
      }
    } else if (t === '-u' || t === '--user') {
      authUser = tokens[++i]
    } else if (t === '--url') {
      url = tokens[++i] ?? ''
    } else if (!t.startsWith('-') && !url) {
      url = t
    }
  }

  if (!url) {
    return null
  }

  // Parse query params out of URL
  const { baseUrl, params } = parseUrlParams(url)

  // Determine body format
  let bodyConfig = { type: 'none' } as HttpRequest['body']
  if (formDataParams.length > 0) {
    bodyConfig = { type: 'form-data', formDataParams }
  } else if (rawBody !== undefined) {
    const isJson = rawBody.trim().startsWith('{') || rawBody.trim().startsWith('[')
    if (isJson) {
      bodyConfig = { type: 'json', rawText: rawBody }
    } else {
      bodyConfig = { type: 'raw', rawText: rawBody }
    }
  }

  // Determine auth
  let authConfig = { type: 'none' } as HttpRequest['auth']
  const authHeaderIdx = headers.findIndex((h) => h.key.toLowerCase() === 'authorization')
  if (authHeaderIdx !== -1) {
    const authVal = headers[authHeaderIdx].value
    if (authVal.toLowerCase().startsWith('bearer ')) {
      authConfig = {
        type: 'bearer',
        bearerToken: authVal.slice(7).trim(),
      }
      headers.splice(authHeaderIdx, 1)
    } else if (authVal.toLowerCase().startsWith('basic ')) {
      authConfig = {
        type: 'basic',
      }
    }
  } else if (authUser) {
    const [u, p] = authUser.split(':')
    authConfig = {
      type: 'basic',
      basicUsername: u ?? '',
      basicPassword: p ?? '',
    }
  }

  return {
    method,
    url: baseUrl,
    params,
    headers,
    body: bodyConfig,
    auth: authConfig,
  }
}

/**
 * Generates an executable cURL snippet from an HttpRequest
 */
export function generateCurlSnippet(req: HttpRequest, env?: Environment | null): string {
  let url = interpolatePathVariables(req.url, req.pathVariables)
  if (req.params.length > 0) {
    const activeParams = req.params.filter((p) => p.enabled && p.key.trim().length > 0)
    if (activeParams.length > 0) {
      const q = activeParams
        .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&')
      url = url.includes('?') ? `${url}&${q}` : `${url}?${q}`
    }
  }

  if (env) {
    url = interpolateString(url, env.variables)
  }

  const parts = [`curl -X ${req.method} "${url}"`]

  // Auth headers
  if (req.auth.type === 'bearer' && req.auth.bearerToken) {
    const token = env ? interpolateString(req.auth.bearerToken, env.variables) : req.auth.bearerToken
    parts.push(`  -H "Authorization: Bearer ${token}"`)
  } else if (req.auth.type === 'basic' && (req.auth.basicUsername || req.auth.basicPassword)) {
    const u = env ? interpolateString(req.auth.basicUsername ?? '', env.variables) : (req.auth.basicUsername ?? '')
    const p = env ? interpolateString(req.auth.basicPassword ?? '', env.variables) : (req.auth.basicPassword ?? '')
    parts.push(`  -u "${u}:${p}"`)
  }

  // Headers (do not output Content-Type header if body is form-data as curl sets multipart boundary)
  for (const h of req.headers) {
    if (h.enabled && h.key.trim().length > 0) {
      if (req.body.type === 'form-data' && h.key.toLowerCase() === 'content-type') {
        continue
      }
      const v = env ? interpolateString(h.value, env.variables) : h.value
      parts.push(`  -H "${h.key}: ${v}"`)
    }
  }

  // Body
  if (req.body.type === 'json' && req.body.rawText) {
    const bodyStr = env ? interpolateString(req.body.rawText, env.variables) : req.body.rawText
    parts.push(`  -H "Content-Type: application/json"`)
    parts.push(`  -d '${bodyStr.replace(/'/g, "'\\''")}'`)
  } else if (req.body.type === 'raw' && req.body.rawText) {
    const bodyStr = env ? interpolateString(req.body.rawText, env.variables) : req.body.rawText
    parts.push(`  -H "Content-Type: text/plain"`)
    parts.push(`  -d '${bodyStr.replace(/'/g, "'\\''")}'`)
  } else if (req.body.type === 'x-www-form-urlencoded' && req.body.formParams) {
    const encoded = req.body.formParams
      .filter((p) => p.enabled && p.key.trim().length > 0)
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&')
    if (encoded) {
      parts.push(`  -H "Content-Type: application/x-www-form-urlencoded"`)
      parts.push(`  -d '${encoded}'`)
    }
  } else if (req.body.type === 'form-data' && req.body.formDataParams) {
    for (const p of req.body.formDataParams) {
      if (p.enabled && p.key.trim().length > 0) {
        const v = env ? interpolateString(p.value, env.variables) : p.value
        if (p.type === 'file') {
          parts.push(`  -F "${p.key}=@${v}"`)
        } else {
          parts.push(`  -F "${p.key}=${v}"`)
        }
      }
    }
  }

  return parts.join(' \\\n')
}

/**
 * Generates an executable JavaScript fetch snippet
 */
export function generateFetchSnippet(req: HttpRequest, env?: Environment | null): string {
  let url = interpolatePathVariables(req.url, req.pathVariables)
  if (req.params.length > 0) {
    const activeParams = req.params.filter((p) => p.enabled && p.key.trim().length > 0)
    if (activeParams.length > 0) {
      const q = activeParams
        .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&')
      url = url.includes('?') ? `${url}&${q}` : `${url}?${q}`
    }
  }

  if (env) {
    url = interpolateString(url, env.variables)
  }

  const headersObj: Record<string, string> = {}
  if (req.auth.type === 'bearer' && req.auth.bearerToken) {
    const token = env ? interpolateString(req.auth.bearerToken, env.variables) : req.auth.bearerToken
    headersObj['Authorization'] = `Bearer ${token}`
  } else if (req.auth.type === 'basic') {
    const u = env ? interpolateString(req.auth.basicUsername ?? '', env.variables) : (req.auth.basicUsername ?? '')
    const p = env ? interpolateString(req.auth.basicPassword ?? '', env.variables) : (req.auth.basicPassword ?? '')
    headersObj['Authorization'] = `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`
  }

  for (const h of req.headers) {
    if (h.enabled && h.key.trim()) {
      if (req.body.type === 'form-data' && h.key.toLowerCase() === 'content-type') {
        continue
      }
      headersObj[h.key] = env ? interpolateString(h.value, env.variables) : h.value
    }
  }

  let bodyStr: string | undefined
  if (req.body.type === 'json' && req.body.rawText) {
    headersObj['Content-Type'] = 'application/json'
    bodyStr = env ? interpolateString(req.body.rawText, env.variables) : req.body.rawText
  } else if (req.body.type === 'raw' && req.body.rawText) {
    headersObj['Content-Type'] = 'text/plain'
    bodyStr = env ? interpolateString(req.body.rawText, env.variables) : req.body.rawText
  }

  if (req.body.type === 'form-data' && req.body.formDataParams) {
    const formLines = ['const formData = new FormData();']
    for (const p of req.body.formDataParams) {
      if (p.enabled && p.key.trim()) {
        const v = env ? interpolateString(p.value, env.variables) : p.value
        formLines.push(`formData.append("${p.key}", "${v}");`)
      }
    }
    const options: Record<string, any> = {
      method: req.method,
      headers: headersObj,
    }
    let optionsFormatted = JSON.stringify(options, null, 2)
    optionsFormatted = optionsFormatted.replace('}\n}', '},\n  body: formData\n}')
    return `${formLines.join('\n')}\nconst response = await fetch("${url}", ${optionsFormatted});\nconst data = await response.json();\nconsole.log(data);`
  }

  const options: Record<string, any> = {
    method: req.method,
    headers: headersObj,
  }

  let optionsFormatted = JSON.stringify(options, null, 2)
  if (bodyStr) {
    optionsFormatted = optionsFormatted.replace(
      '}\n}',
      `},\n  body: ${req.body.type === 'json' ? `JSON.stringify(${bodyStr.trim()})` : JSON.stringify(bodyStr)}\n}`
    )
  }

  return `const response = await fetch("${url}", ${optionsFormatted});\nconst data = await response.json();\nconsole.log(data);`
}

/**
 * Generates an executable Python requests snippet
 */
export function generatePythonSnippet(req: HttpRequest, env?: Environment | null): string {
  let url = interpolatePathVariables(req.url, req.pathVariables)
  const lines = ['import requests\n']
  lines.push(`url = "${env ? interpolateString(url, env.variables) : url}"`)

  const paramsObj: Record<string, string> = {}
  for (const p of req.params) {
    if (p.enabled && p.key.trim()) {
      paramsObj[p.key] = env ? interpolateString(p.value, env.variables) : p.value
    }
  }
  if (Object.keys(paramsObj).length > 0) {
    lines.push(`params = ${JSON.stringify(paramsObj, null, 4)}`)
  }

  const headersObj: Record<string, string> = {}
  if (req.auth.type === 'bearer' && req.auth.bearerToken) {
    const token = env ? interpolateString(req.auth.bearerToken, env.variables) : req.auth.bearerToken
    headersObj['Authorization'] = `Bearer ${token}`
  }
  for (const h of req.headers) {
    if (h.enabled && h.key.trim()) {
      if (req.body.type === 'form-data' && h.key.toLowerCase() === 'content-type') {
        continue
      }
      headersObj[h.key] = env ? interpolateString(h.value, env.variables) : h.value
    }
  }
  if (Object.keys(headersObj).length > 0) {
    lines.push(`headers = ${JSON.stringify(headersObj, null, 4)}`)
  }

  let bodyArg = ''
  if (req.body.type === 'json' && req.body.rawText) {
    const raw = env ? interpolateString(req.body.rawText, env.variables) : req.body.rawText
    lines.push(`payload = ${raw.trim()}`)
    bodyArg = ', json=payload'
  } else if (req.body.type === 'raw' && req.body.rawText) {
    const raw = env ? interpolateString(req.body.rawText, env.variables) : req.body.rawText
    lines.push(`data = ${JSON.stringify(raw)}`)
    bodyArg = ', data=data'
  } else if (req.body.type === 'form-data' && req.body.formDataParams) {
    const textParams = req.body.formDataParams.filter((p) => p.enabled && p.key.trim() && p.type !== 'file')
    const fileParams = req.body.formDataParams.filter((p) => p.enabled && p.key.trim() && p.type === 'file')

    if (textParams.length > 0) {
      const dataObj: Record<string, string> = {}
      for (const p of textParams) {
        dataObj[p.key] = env ? interpolateString(p.value, env.variables) : p.value
      }
      lines.push(`data = ${JSON.stringify(dataObj, null, 4)}`)
      bodyArg += ', data=data'
    }

    if (fileParams.length > 0) {
      const fileLines = fileParams.map((p) => {
        const v = env ? interpolateString(p.value, env.variables) : p.value
        return `    "${p.key}": open(${JSON.stringify(v)}, "rb")`
      })
      lines.push(`files = {\n${fileLines.join(',\n')}\n}`)
      bodyArg += ', files=files'
    }
  }

  const args = ['url']
  if (Object.keys(paramsObj).length > 0) args.push('params=params')
  if (Object.keys(headersObj).length > 0) args.push('headers=headers')
  if (req.auth.type === 'basic') {
    const u = env ? interpolateString(req.auth.basicUsername ?? '', env.variables) : (req.auth.basicUsername ?? '')
    const p = env ? interpolateString(req.auth.basicPassword ?? '', env.variables) : (req.auth.basicPassword ?? '')
    args.push(`auth=("${u}", "${p}")`)
  }

  lines.push(
    `response = requests.${req.method.toLowerCase()}(${args.join(', ')}${bodyArg})`
  )
  lines.push('print(response.status_code)')
  lines.push('print(response.json())')

  return lines.join('\n')
}
