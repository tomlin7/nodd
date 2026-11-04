import fs from 'fs'
import path from 'path'
import { noddDir } from './history'
import type { ClientSettings } from './types'

function getPreferencesFilePath(): string {
  return path.join(noddDir(), 'preferences.json')
}

export const DEFAULT_SETTINGS: ClientSettings = {
  timeoutMs: 30000,
  followRedirects: true,
  validateSsl: true,
  defaultHeaders: [
    { id: 'def_1', key: 'User-Agent', value: 'Nodd/0.1.0', enabled: true },
  ],
}

export function loadSettings(): ClientSettings {
  try {
    const file = getPreferencesFilePath()
    if (!fs.existsSync(file)) {
      return DEFAULT_SETTINGS
    }
    const content = fs.readFileSync(file, 'utf8')
    const parsed = JSON.parse(content)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: ClientSettings): void {
  try {
    fs.writeFileSync(getPreferencesFilePath(), JSON.stringify(settings, null, 2), 'utf8')
  } catch {
    // ignore
  }
}
