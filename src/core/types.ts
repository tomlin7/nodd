export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export interface KeyValuePair {
  id: string
  key: string
  value: string
  enabled: boolean
  description?: string
}

export interface FormDataParam extends KeyValuePair {
  type?: 'text' | 'file'
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey'

export interface AuthConfig {
  type: AuthType
  bearerToken?: string
  basicUsername?: string
  basicPassword?: string
  apiKeyKey?: string
  apiKeyValue?: string
  apiKeyIn?: 'header' | 'query'
}

export type BodyType = 'none' | 'json' | 'raw' | 'x-www-form-urlencoded' | 'form-data'

export interface BodyConfig {
  type: BodyType
  rawText?: string
  formParams?: KeyValuePair[]
  formDataParams?: FormDataParam[]
}

export type AssertionType =
  | 'status_code'
  | 'response_time'
  | 'body_contains'
  | 'json_path_exists'

export interface RequestAssertion {
  id: string
  type: AssertionType
  expected: string
  enabled: boolean
}

export interface AssertionResult {
  assertion: RequestAssertion
  passed: boolean
  message: string
  actual: string
}

export interface HttpRequest {
  id: string
  name: string
  method: HttpMethod
  url: string
  params: KeyValuePair[]
  pathVariables?: KeyValuePair[]
  headers: KeyValuePair[]
  body: BodyConfig
  auth: AuthConfig
  assertions?: RequestAssertion[]
  collectionId?: string
  folderId?: string
  createdAt?: number
  updatedAt?: number
}

export interface HttpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  sizeBytes: number
  timeMs: number
  error?: string
  timestamp: number
}

export interface WorkspaceTab {
  id: string
  request: HttpRequest
  initialSnapshot: string
  response: HttpResponse | null
  isLoading: boolean
}

export interface Environment {
  id: string
  name: string
  variables: Record<string, string>
}

export interface CollectionFolder {
  id: string
  name: string
  collectionId: string
  requests: HttpRequest[]
}

export interface Collection {
  id: string
  name: string
  description?: string
  folders: CollectionFolder[]
  requests: HttpRequest[]
  createdAt: number
}

export interface HistoryEntry {
  id: string
  request: HttpRequest
  response?: HttpResponse
  timestamp: number
}

export interface ClientSettings {
  timeoutMs: number
  followRedirects: boolean
  validateSsl: boolean
  defaultHeaders: KeyValuePair[]
}
