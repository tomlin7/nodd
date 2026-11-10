import type {
  AuthConfig,
  BodyConfig,
  Collection,
  CollectionFolder,
  HttpMethod,
  HttpRequest,
  KeyValuePair,
} from './types'
import { createId, parseUrlParams, syncPathVariables } from './url'

export interface PostmanUrlObject {
  raw?: string
  protocol?: string
  host?: string[]
  path?: string[]
  query?: Array<{ key?: string; value?: string; disabled?: boolean; description?: string }>
  variable?: Array<{ key?: string; value?: string; disabled?: boolean; description?: string }>
}

export interface PostmanRequestObject {
  method?: string
  url?: string | PostmanUrlObject
  header?: Array<{ key?: string; value?: string; disabled?: boolean; description?: string }>
  body?: {
    mode?: string
    raw?: string
    urlencoded?: Array<{ key?: string; value?: string; disabled?: boolean }>
    formdata?: Array<{ key?: string; value?: string; src?: string; type?: string; disabled?: boolean; description?: string }>
  }
  auth?: {
    type?: string
    bearer?: Array<{ key?: string; value?: string }>
    basic?: Array<{ key?: string; value?: string }>
  }
}

export interface PostmanItemObject {
  name?: string
  item?: PostmanItemObject[]
  request?: PostmanRequestObject
}

export interface PostmanCollectionSchema {
  info?: {
    _postman_id?: string
    name?: string
    description?: string
    schema?: string
  }
  item?: PostmanItemObject[]
}

function parsePostmanUrl(urlInput?: string | PostmanUrlObject): {
  url: string
  params: KeyValuePair[]
  pathVariables: KeyValuePair[]
} {
  if (!urlInput) {
    return { url: '', params: [], pathVariables: [] }
  }

  let rawUrl = ''
  if (typeof urlInput === 'string') {
    rawUrl = urlInput
  } else if (typeof urlInput === 'object' && urlInput.raw) {
    rawUrl = urlInput.raw
  }

  const { baseUrl, params } = parseUrlParams(rawUrl)
  let explicitParams = params

  // If query params are explicitly declared in the postman url object
  if (typeof urlInput === 'object' && Array.isArray(urlInput.query) && urlInput.query.length > 0) {
    explicitParams = urlInput.query.map((q) => ({
      id: createId('param'),
      key: q.key ?? '',
      value: q.value ?? '',
      enabled: q.disabled !== true,
      description: q.description,
    }))
  }

  let pathVariables: KeyValuePair[] = []
  if (typeof urlInput === 'object' && Array.isArray(urlInput.variable) && urlInput.variable.length > 0) {
    pathVariables = urlInput.variable.map((v) => ({
      id: createId('pvar'),
      key: v.key ?? '',
      value: v.value ?? '',
      enabled: v.disabled !== true,
      description: v.description,
    }))
  } else {
    pathVariables = syncPathVariables(rawUrl)
  }

  return { url: baseUrl, params: explicitParams, pathVariables }
}

function parsePostmanHeaders(headersInput?: PostmanRequestObject['header']): KeyValuePair[] {
  if (!Array.isArray(headersInput)) return []
  return headersInput.map((h) => ({
    id: createId('header'),
    key: h.key ?? '',
    value: h.value ?? '',
    enabled: h.disabled !== true,
    description: h.description,
  }))
}

function parsePostmanBody(bodyInput?: PostmanRequestObject['body']): BodyConfig {
  if (!bodyInput) {
    return { type: 'none' }
  }

  const mode = bodyInput.mode
  if (mode === 'raw') {
    const rawText = bodyInput.raw ?? ''
    const isJson = rawText.trim().startsWith('{') || rawText.trim().startsWith('[')
    return {
      type: isJson ? 'json' : 'raw',
      rawText,
    }
  }

  if (mode === 'urlencoded' && Array.isArray(bodyInput.urlencoded)) {
    return {
      type: 'x-www-form-urlencoded',
      formParams: bodyInput.urlencoded.map((f) => ({
        id: createId('form'),
        key: f.key ?? '',
        value: f.value ?? '',
        enabled: f.disabled !== true,
      })),
    }
  }

  if (mode === 'formdata' && Array.isArray(bodyInput.formdata)) {
    return {
      type: 'form-data',
      formDataParams: bodyInput.formdata.map((f) => ({
        id: createId('form'),
        key: f.key ?? '',
        value: (f.type === 'file' ? f.src : f.value) ?? '',
        type: (f.type === 'file' ? 'file' : 'text') as 'text' | 'file',
        enabled: f.disabled !== true,
        description: f.description,
      })),
    }
  }

  return { type: 'none' }
}

function parsePostmanAuth(authInput?: PostmanRequestObject['auth']): AuthConfig {
  if (!authInput || !authInput.type) {
    return { type: 'none' }
  }

  if (authInput.type === 'bearer' && Array.isArray(authInput.bearer)) {
    const tokenObj = authInput.bearer.find((b) => b.key === 'token')
    return {
      type: 'bearer',
      bearerToken: tokenObj?.value ?? '',
    }
  }

  if (authInput.type === 'basic' && Array.isArray(authInput.basic)) {
    const userObj = authInput.basic.find((b) => b.key === 'username')
    const passObj = authInput.basic.find((b) => b.key === 'password')
    return {
      type: 'basic',
      basicUsername: userObj?.value ?? '',
      basicPassword: passObj?.value ?? '',
    }
  }

  return { type: 'none' }
}

function parsePostmanRequest(
  item: PostmanItemObject,
  collectionId: string,
  folderId?: string
): HttpRequest {
  const reqObj = item.request ?? {}
  const { url, params, pathVariables } = parsePostmanUrl(reqObj.url)
  const headers = parsePostmanHeaders(reqObj.header)
  const body = parsePostmanBody(reqObj.body)
  const auth = parsePostmanAuth(reqObj.auth)

  const methodUpper = (reqObj.method ?? 'GET').toUpperCase()
  const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
  const method: HttpMethod = validMethods.includes(methodUpper as HttpMethod)
    ? (methodUpper as HttpMethod)
    : 'GET'

  return {
    id: createId('req'),
    name: item.name ?? 'Untitled Request',
    method,
    url,
    params,
    pathVariables,
    headers,
    body,
    auth,
    collectionId,
    folderId,
    createdAt: Date.now(),
  }
}

/**
 * Imports a Postman v2.1 Collection JSON string into Nodd Collection data structure
 */
export function importPostmanCollection(jsonString: string): Collection {
  let parsed: any
  try {
    parsed = JSON.parse(jsonString)
  } catch (err: any) {
    throw new Error('Invalid JSON format: Could not parse Postman collection.')
  }

  const collectionId = createId('col')
  const collectionName = parsed.info?.name || 'Imported Postman Collection'
  const collectionDescription = parsed.info?.description || undefined

  const collection: Collection = {
    id: collectionId,
    name: collectionName,
    description: collectionDescription,
    folders: [],
    requests: [],
    createdAt: Date.now(),
  }

  const rawItems: PostmanItemObject[] = Array.isArray(parsed.item) ? parsed.item : []

  for (const item of rawItems) {
    // If it has 'item' array, it's a folder / subfolder
    if (Array.isArray(item.item)) {
      const folderId = createId('folder')
      const folder: CollectionFolder = {
        id: folderId,
        name: item.name ?? 'Folder',
        collectionId,
        requests: [],
      }

      // Collect all requests inside this folder
      for (const subItem of item.item) {
        if (subItem.request) {
          folder.requests.push(parsePostmanRequest(subItem, collectionId, folderId))
        }
      }

      collection.folders.push(folder)
    } else if (item.request) {
      // Direct request under collection root
      collection.requests.push(parsePostmanRequest(item, collectionId))
    }
  }

  return collection
}

/**
 * Exports a Nodd Collection to Postman v2.1 schema JSON string
 */
export function exportPostmanCollection(collection: Collection): string {
  const postmanItems: PostmanItemObject[] = []

  // 1. Add root requests
  for (const req of collection.requests) {
    postmanItems.push(serializeHttpRequestToPostman(req))
  }

  // 2. Add folders with their requests
  for (const folder of collection.folders) {
    postmanItems.push({
      name: folder.name,
      item: folder.requests.map((req) => serializeHttpRequestToPostman(req)),
    })
  }

  const schema: PostmanCollectionSchema = {
    info: {
      _postman_id: collection.id,
      name: collection.name,
      description: collection.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: postmanItems,
  }

  return JSON.stringify(schema, null, 2)
}

function serializeHttpRequestToPostman(req: HttpRequest): PostmanItemObject {
  // Construct raw URL with params
  let rawUrl = req.url
  const queryParams = req.params
    .filter((p) => p.enabled && p.key.trim().length > 0)
    .map((p) => ({
      key: p.key,
      value: p.value,
      disabled: !p.enabled,
    }))

  if (queryParams.length > 0) {
    const qString = queryParams.map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`).join('&')
    rawUrl = rawUrl.includes('?') ? `${rawUrl}&${qString}` : `${rawUrl}?${qString}`
  }

  const header = req.headers
    .filter((h) => h.key.trim().length > 0)
    .map((h) => ({
      key: h.key,
      value: h.value,
      disabled: !h.enabled,
    }))

  let body: PostmanRequestObject['body'] | undefined
  if (req.body.type === 'json' || req.body.type === 'raw') {
    body = {
      mode: 'raw',
      raw: req.body.rawText ?? '',
    }
  } else if (req.body.type === 'x-www-form-urlencoded' && req.body.formParams) {
    body = {
      mode: 'urlencoded',
      urlencoded: req.body.formParams.map((f) => ({
        key: f.key,
        value: f.value,
        disabled: !f.enabled,
      })),
    }
  } else if (req.body.type === 'form-data' && req.body.formDataParams) {
    body = {
      mode: 'formdata',
      formdata: req.body.formDataParams.map((f) => ({
        key: f.key,
        value: f.type === 'file' ? undefined : f.value,
        src: f.type === 'file' ? f.value : undefined,
        type: f.type || 'text',
        disabled: !f.enabled,
        description: f.description,
      })),
    }
  }

  let auth: PostmanRequestObject['auth'] | undefined
  if (req.auth.type === 'bearer' && req.auth.bearerToken) {
    auth = {
      type: 'bearer',
      bearer: [{ key: 'token', value: req.auth.bearerToken }],
    }
  } else if (req.auth.type === 'basic') {
    auth = {
      type: 'basic',
      basic: [
        { key: 'username', value: req.auth.basicUsername ?? '' },
        { key: 'password', value: req.auth.basicPassword ?? '' },
      ],
    }
  }

  const variables = (req.pathVariables || []).map((v) => ({
    key: v.key,
    value: v.value,
    disabled: !v.enabled,
    description: v.description,
  }))

  return {
    name: req.name,
    request: {
      method: req.method,
      url: {
        raw: rawUrl,
        query: queryParams,
        ...(variables.length > 0 ? { variable: variables } : {}),
      },
      header,
      body,
      auth,
    },
  }
}
