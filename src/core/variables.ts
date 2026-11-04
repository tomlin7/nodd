import type { Environment, HttpRequest, KeyValuePair } from './types'

/**
 * Replaces {{varName}} placeholders with values from the environment's variables dictionary.
 * If a variable is missing, it is left untouched so the user can easily see unfulfilled variables.
 */
export function interpolateString(input: string, variables?: Record<string, string>): string {
  if (!input || !variables) return input
  return input.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (match, varName) => {
    if (Object.prototype.hasOwnProperty.call(variables, varName)) {
      return variables[varName] ?? ''
    }
    return match
  })
}

/**
 * Interpolates key-value pairs (both keys and values).
 */
export function interpolatePairs(pairs: KeyValuePair[], variables?: Record<string, string>): KeyValuePair[] {
  if (!variables) return pairs
  return pairs.map((pair) => ({
    ...pair,
    key: interpolateString(pair.key, variables),
    value: interpolateString(pair.value, variables),
  }))
}

/**
 * Deeply interpolates an HttpRequest with environment variables.
 */
export function interpolateRequest(req: HttpRequest, env?: Environment | null): HttpRequest {
  if (!env || !env.variables) return req
  const vars = env.variables

  return {
    ...req,
    url: interpolateString(req.url, vars),
    params: interpolatePairs(req.params, vars),
    headers: interpolatePairs(req.headers, vars),
    body: {
      ...req.body,
      rawText: req.body.rawText ? interpolateString(req.body.rawText, vars) : undefined,
      formParams: req.body.formParams ? interpolatePairs(req.body.formParams, vars) : undefined,
    },
    auth: {
      ...req.auth,
      bearerToken: req.auth.bearerToken ? interpolateString(req.auth.bearerToken, vars) : undefined,
      basicUsername: req.auth.basicUsername ? interpolateString(req.auth.basicUsername, vars) : undefined,
      basicPassword: req.auth.basicPassword ? interpolateString(req.auth.basicPassword, vars) : undefined,
      apiKeyValue: req.auth.apiKeyValue ? interpolateString(req.auth.apiKeyValue, vars) : undefined,
    },
  }
}
