import { describe, expect, it } from 'vitest'
import { keyboardState } from './keyboardState'
import { scoreGuess } from './feedback'

describe('keyboardState', () => {
  it('returns an empty record with no guesses', () => {
    expect(keyboardState([])).toEqual({})
  })

  it('reports states from a single scored guess', () => {
    // TRAIN vs STAMP: T yellow, R gray, A green, I gray, N gray
    const states = keyboardState([{ word: 'TRAIN', feedback: scoreGuess('TRAIN', 'STAMP') }])
    expect(states['T']).toBe('yellow')
    expect(states['A']).toBe('green')
    expect(states['R']).toBe('gray')
    expect(states['I']).toBe('gray')
    expect(states['N']).toBe('gray')
    expect(states['Z']).toBeUndefined()
  })

  it('upgrades yellow to green in a later guess', () => {
    const states = keyboardState([
      { word: 'TRAIN', feedback: scoreGuess('TRAIN', 'STAMP') }, // T yellow
      { word: 'STAMP', feedback: scoreGuess('STAMP', 'STAMP') }, // T green
    ])
    expect(states['T']).toBe('green')
  })

  it('does not downgrade yellow when a duplicate slot scores gray', () => {
    // ONION vs CRANE: N yellow at index 1, gray at index 4 — keyboard keeps yellow
    const states = keyboardState([{ word: 'ONION', feedback: scoreGuess('ONION', 'CRANE') }])
    expect(states['N']).toBe('yellow')
  })

  it('does not downgrade across guesses', () => {
    const states = keyboardState([
      { word: 'TRAIN', feedback: scoreGuess('TRAIN', 'STAMP') }, // T yellow
      { word: 'QUIRK', feedback: scoreGuess('QUIRK', 'STAMP') }, // no T in this guess
    ])
    expect(states['T']).toBe('yellow')
  })
})
