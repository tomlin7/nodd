import fs from 'fs'
import path from 'path'
import { noddDir } from './history'
import type { Collection, HttpRequest } from './types'
import { createId } from './url'

function getCollectionsFilePath(): string {
  return path.join(noddDir(), 'collections.json')
}

export function createDefaultCollection(): Collection {
  return {
    id: createId('col'),
    name: 'Quickstart API',
    description: 'Sample requests using JSONPlaceholder and HTTPBin',
    createdAt: Date.now(),
    folders: [
      {
        id: createId('folder'),
        name: 'Users',
        collectionId: '',
        requests: [
          {
            id: createId('req'),
            name: 'Get All Users',
            method: 'GET',
            url: 'https://jsonplaceholder.typicode.com/users',
            params: [
              { id: createId('param'), key: '_limit', value: '5', enabled: true },
            ],
            headers: [
              { id: createId('header'), key: 'Accept', value: 'application/json', enabled: true },
            ],
            body: { type: 'none' },
            auth: { type: 'none' },
          },
          {
            id: createId('req'),
            name: 'Create User',
            method: 'POST',
            url: 'https://jsonplaceholder.typicode.com/users',
            params: [],
            headers: [
              { id: createId('header'), key: 'Content-Type', value: 'application/json', enabled: true },
            ],
            body: {
              type: 'json',
              rawText: JSON.stringify({ name: 'Ada Lovelace', username: 'ada', email: 'ada@example.com' }, null, 2),
            },
            auth: { type: 'none' },
          },
        ],
      },
    ],
    requests: [
      {
        id: createId('req'),
        name: 'HTTP Echo Headers',
        method: 'GET',
        url: 'https://httpbin.org/headers',
        params: [],
        headers: [
          { id: createId('header'), key: 'User-Agent', value: 'Nodd/0.1.0', enabled: true },
        ],
        body: { type: 'none' },
        auth: { type: 'none' },
      },
    ],
  }
}

export function loadCollections(): Collection[] {
  try {
    const file = getCollectionsFilePath()
    if (!fs.existsSync(file)) {
      const initial = [createDefaultCollection()]
      saveCollections(initial)
      return initial
    }
    const content = fs.readFileSync(file, 'utf8')
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    const seeded = [createDefaultCollection()]
    saveCollections(seeded)
    return seeded
  } catch {
    return [createDefaultCollection()]
  }
}

export function saveCollections(collections: Collection[]): void {
  try {
    fs.writeFileSync(getCollectionsFilePath(), JSON.stringify(collections, null, 2), 'utf8')
  } catch {
    // ignore
  }
}
