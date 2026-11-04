import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

describe('version', () => {
  it('stays on 0.x with minor and patch in 0..255', () => {
    const pkgPath = path.join(import.meta.dir, '..', '..', 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { version: string }
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/)
    const [major, minor, patch] = pkg.version.split('.').map((part) => Number(part))
    expect(Number.isInteger(major)).toBe(true)
    expect(Number.isInteger(minor)).toBe(true)
    expect(Number.isInteger(patch)).toBe(true)
    expect(major).toBe(0)
    expect(minor).toBeGreaterThanOrEqual(0)
    expect(minor).toBeLessThanOrEqual(255)
    expect(patch).toBeGreaterThanOrEqual(0)
    expect(patch).toBeLessThanOrEqual(255)
  })
})
