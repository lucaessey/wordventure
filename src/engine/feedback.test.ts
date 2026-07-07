import { describe, expect, it } from 'vitest'
import { scoreGuess } from './feedback'

describe('scoreGuess', () => {
  it('marks an exact match all green', () => {
    expect(scoreGuess('CRANE', 'CRANE')).toEqual(['green', 'green', 'green', 'green', 'green'])
  })

  it('marks letters absent from the answer gray', () => {
    expect(scoreGuess('QUIRK', 'STAMP')).toEqual(['gray', 'gray', 'gray', 'gray', 'gray'])
  })

  it('marks misplaced letters yellow and aligned letters green', () => {
    // T is in STAMP at another position; A is aligned at index 2
    expect(scoreGuess('TRAIN', 'STAMP')).toEqual(['yellow', 'gray', 'green', 'gray', 'gray'])
  })

  it('marks only the leftmost duplicate yellow when the answer has one occurrence', () => {
    // Guess has N at 1 and 4, answer CRANE has one N (not aligned with either)
    expect(scoreGuess('ONION', 'CRANE')).toEqual(['gray', 'yellow', 'gray', 'gray', 'gray'])
  })

  it('lets green consume the occurrence before yellow', () => {
    // Answer CRANE has one E; the green E at index 4 consumes it, so the E at index 0 is gray
    expect(scoreGuess('ELITE', 'CRANE')).toEqual(['gray', 'gray', 'gray', 'gray', 'green'])
  })

  it('marks additional occurrences when the answer has the letter multiple times', () => {
    // Answer GEESE has three E's: greens at 1 and 4, and the E at 0 still earns a yellow
    expect(scoreGuess('EERIE', 'GEESE')).toEqual(['yellow', 'green', 'gray', 'gray', 'green'])
  })

  it('handles green plus yellow for a doubled answer letter', () => {
    // Answer LEVEE has E at 1, 3, 4: E green at 3, E yellow at 0, L yellow at 1
    expect(scoreGuess('ELDER', 'LEVEE')).toEqual(['yellow', 'yellow', 'gray', 'green', 'gray'])
  })

  it('throws on mismatched lengths', () => {
    expect(() => scoreGuess('CAT', 'CRANE')).toThrow()
  })

  it('is deterministic', () => {
    const first = scoreGuess('TRAIN', 'STAMP')
    for (let i = 0; i < 10; i++) {
      expect(scoreGuess('TRAIN', 'STAMP')).toEqual(first)
    }
  })
})
