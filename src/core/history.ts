import fs from 'fs'
import path from 'path'
import os from 'os'
import type { HistoryEntry } from './types'

export function noddDir(): string {
  const override = typeof process !== 'undefined' ? process.env.NODD_HOME : undefined
  const dir = override && override.length > 0 ? override : path.join(os.homedir(), '.nodd')
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true })
    } catch {
      // ignore
    }
  }
  return dir
}

function getHistoryFilePath(): string {
  return path.join(noddDir(), 'history.json')
}

export function loadHistory(): HistoryEntry[] {
  try {
    const file = getHistoryFilePath()
    if (!fs.existsSync(file)) return []
    const content = fs.readFileSync(file, 'utf8')
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && item.request && typeof item.request.url === 'string')
    }
    return []
  } catch {
    return []
  }
}

export function saveHistoryEntry(entry: HistoryEntry): void {
  try {
    const list = loadHistory()
    list.unshift(entry)
    // keep up to 100 recent requests
    const trimmed = list.slice(0, 100)
    fs.writeFileSync(getHistoryFilePath(), JSON.stringify(trimmed, null, 2), 'utf8')
  } catch {
    // ignore
  }
}

export function removeHistoryEntry(id: string): void {
  try {
    const list = loadHistory().filter((i) => i.id !== id)
    fs.writeFileSync(getHistoryFilePath(), JSON.stringify(list, null, 2), 'utf8')
  } catch {
    // ignore
  }
}

export function clearHistory(): void {
  try {
    const file = getHistoryFilePath()
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
    }
  } catch {
    // ignore
  }
}
