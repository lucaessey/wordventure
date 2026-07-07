import { describe, expect, it } from 'vitest'
import { selectAnswer } from './selectAnswer'
import type { Category } from './types'

const CATEGORY: Category = {
  id: 'test',
  displayName: 'Test',
  minLetters: 3,
  maxLetters: 5,
  wordsByLength: {
    '3': ['CAT', 'DOG', 'FOX'],
    '5': ['CRANE', 'STAMP'],
  },
}

/** Simple deterministic LCG so tests do not depend on Math.random. */
function seededRng(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe('selectAnswer', () => {
  it('returns a word from the requested length bucket', () => {
    for (let i = 0; i < 50; i++) {
      expect(CATEGORY.wordsByLength['3']).toContain(selectAnswer(CATEGORY, 3))
    }
  })

  it('is deterministic under an injected seeded RNG', () => {
    expect(selectAnswer(CATEGORY, 3, seededRng(42))).toBe(selectAnswer(CATEGORY, 3, seededRng(42)))
    expect(selectAnswer(CATEGORY, 5, seededRng(7))).toBe(selectAnswer(CATEGORY, 5, seededRng(7)))
  })

  it('reaches every word in the bucket across draws', () => {
    const rng = seededRng(42)
    const seen = new Set<string>()
    for (let i = 0; i < 100; i++) {
      seen.add(selectAnswer(CATEGORY, 3, rng))
    }
    expect([...seen].sort()).toEqual(['CAT', 'DOG', 'FOX'])
  })

  it('throws for a length the category does not support', () => {
    expect(() => selectAnswer(CATEGORY, 4)).toThrow()
  })
})
