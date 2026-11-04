import { describe, expect, it } from 'vitest'
import type { Environment } from '../core/types'
import { interpolateString } from '../core/variables'

describe('Environment Logic & Management', () => {
  const sampleEnvironments: Environment[] = [
    {
      id: 'env_dev',
      name: 'Development',
      variables: {
        baseUrl: 'http://localhost:3000',
        apiKey: 'dev_secret_key_123',
        apiVersion: 'v1',
      },
    },
    {
      id: 'env_prod',
      name: 'Production',
      variables: {
        baseUrl: 'https://api.production.com',
        apiKey: 'prod_secret_token_999',
        apiVersion: 'v2',
      },
    },
  ]

  it('correctly resolves variables from active environment', () => {
    const dev = sampleEnvironments[0]
    const prod = sampleEnvironments[1]

    const template = '{{baseUrl}}/{{apiVersion}}/users?key={{apiKey}}'
    expect(interpolateString(template, dev.variables)).toBe('http://localhost:3000/v1/users?key=dev_secret_key_123')
    expect(interpolateString(template, prod.variables)).toBe('https://api.production.com/v2/users?key=prod_secret_token_999')
  })

  it('handles missing variables without crashing', () => {
    const dev = sampleEnvironments[0]
    const template = '{{baseUrl}}/{{unknownVar}}'
    expect(interpolateString(template, dev.variables)).toBe('http://localhost:3000/{{unknownVar}}')
  })

  it('handles null or empty variables safely', () => {
    const template = '{{baseUrl}}/users'
    expect(interpolateString(template, undefined)).toBe('{{baseUrl}}/users')
  })

  it('updates environment variables dictionary immutably', () => {
    const dev = sampleEnvironments[0]
    const nextVars = { ...dev.variables, newKey: 'newValue' }
    const updatedDev = { ...dev, variables: nextVars }

    expect(updatedDev.variables.newKey).toBe('newValue')
    expect(dev.variables.newKey).toBeUndefined()
  })

  it('deletes variable key from environment', () => {
    const dev = sampleEnvironments[0]
    const nextVars = { ...dev.variables }
    delete nextVars.apiKey
    const updatedDev = { ...dev, variables: nextVars }

    expect(updatedDev.variables.apiKey).toBeUndefined()
    expect(updatedDev.variables.baseUrl).toBe('http://localhost:3000')
  })
})
