import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Project convention: the engine is pure TypeScript with no UI or storage
 * dependencies. This test fails if any non-test engine module imports React,
 * touches the DOM, or uses localStorage.
 */
const ENGINE_DIR = import.meta.dirname

const FORBIDDEN = [
  /from\s+['"]react/,
  /from\s+['"]react-dom/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bdocument\./,
  /\bwindow\./,
]

describe('engine purity', () => {
  const modules = readdirSync(ENGINE_DIR).filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
  )

  it('has engine modules to check', () => {
    expect(modules.length).toBeGreaterThan(0)
  })

  for (const file of modules) {
    it(`${file} has no React, DOM, or storage dependencies`, () => {
      const source = readFileSync(join(ENGINE_DIR, file), 'utf8')
      for (const pattern of FORBIDDEN) {
        expect(source).not.toMatch(pattern)
      }
    })
  }
})
