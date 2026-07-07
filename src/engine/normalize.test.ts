import { describe, expect, it } from 'vitest'
import { normalizeWord } from './normalize'

describe('normalizeWord', () => {
  it('uppercases plain words', () => {
    expect(normalizeWord('crane')).toBe('CRANE')
  })

  it('strips spaces and periods: "Mr. Mime" -> "MRMIME"', () => {
    expect(normalizeWord('Mr. Mime')).toBe('MRMIME')
  })

  it('removes accents: "Poké Ball" -> "POKEBALL"', () => {
    expect(normalizeWord('Poké Ball')).toBe('POKEBALL')
  })

  it('strips hyphens: "sea-horse" -> "SEAHORSE"', () => {
    expect(normalizeWord('sea-horse')).toBe('SEAHORSE')
  })

  it('strips apostrophes, including typographic ones', () => {
    expect(normalizeWord("Farfetch'd")).toBe('FARFETCHD')
    expect(normalizeWord('Farfetch’d')).toBe('FARFETCHD')
  })

  it('rejects entries containing digits: "Porygon2" -> null', () => {
    expect(normalizeWord('Porygon2')).toBeNull()
  })

  it('rejects entries with symbols that cannot be stripped', () => {
    expect(normalizeWord('Larry & Lawrie')).toBeNull()
    expect(normalizeWord('R@t')).toBeNull()
  })

  it('rejects entries that normalize to the empty string', () => {
    expect(normalizeWord('')).toBeNull()
    expect(normalizeWord('---')).toBeNull()
    expect(normalizeWord('  ')).toBeNull()
  })
})
