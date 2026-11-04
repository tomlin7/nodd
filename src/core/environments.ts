import fs from 'fs'
import path from 'path'
import { noddDir } from './history'
import type { Environment } from './types'
import { createId } from './url'

function getEnvironmentsFilePath(): string {
  return path.join(noddDir(), 'environments.json')
}

export function createDefaultEnvironments(): Environment[] {
  return [
    {
      id: createId('env'),
      name: 'Development',
      variables: {
        baseUrl: 'https://jsonplaceholder.typicode.com',
        apiKey: 'dev-key-123',
      },
    },
    {
      id: createId('env'),
      name: 'Staging',
      variables: {
        baseUrl: 'https://jsonplaceholder.typicode.com',
        apiKey: 'staging-key-456',
      },
    },
    {
      id: createId('env'),
      name: 'Production',
      variables: {
        baseUrl: 'https://jsonplaceholder.typicode.com',
        apiKey: 'prod-key-789',
      },
    },
  ]
}

export function loadEnvironments(): Environment[] {
  try {
    const file = getEnvironmentsFilePath()
    if (!fs.existsSync(file)) {
      const initial = createDefaultEnvironments()
      saveEnvironments(initial)
      return initial
    }
    const content = fs.readFileSync(file, 'utf8')
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    const seeded = createDefaultEnvironments()
    saveEnvironments(seeded)
    return seeded
  } catch {
    return createDefaultEnvironments()
  }
}

export function saveEnvironments(environments: Environment[]): void {
  try {
    fs.writeFileSync(getEnvironmentsFilePath(), JSON.stringify(environments, null, 2), 'utf8')
  } catch {
    // ignore
  }
}
