import { describe, expect, it } from 'vitest'
import { validateGuess } from './validateGuess'

const DICTIONARY = ['CRANE', 'STAMP', 'TRAIN']
const CATEGORY = ['MRMIME', 'EEVEE', 'DITTO']

describe('validateGuess', () => {
  it('accepts a word from the English dictionary', () => {
    expect(validateGuess('crane', 5, DICTIONARY, CATEGORY)).toEqual({ valid: true, word: 'CRANE' })
  })

  it('accepts a category-only word not in the dictionary', () => {
    expect(validateGuess('eevee', 5, DICTIONARY, CATEGORY)).toEqual({ valid: true, word: 'EEVEE' })
  })

  it('normalizes the guess before checking (accents, punctuation)', () => {
    expect(validateGuess('Mr. Mime', 6, [], CATEGORY)).toEqual({ valid: true, word: 'MRMIME' })
  })

  it('rejects a word in neither list with not-in-word-list', () => {
    expect(validateGuess('zzzzz', 5, DICTIONARY, CATEGORY)).toEqual({
      valid: false,
      reason: 'not-in-word-list',
    })
  })

  it('rejects a guess of the wrong length', () => {
    expect(validateGuess('crane', 6, DICTIONARY, CATEGORY)).toEqual({
      valid: false,
      reason: 'wrong-length',
    })
  })

  it('rejects input that cannot be normalized (digits, symbols)', () => {
    expect(validateGuess('cr4ne', 5, DICTIONARY, CATEGORY)).toEqual({
      valid: false,
      reason: 'not-in-word-list',
    })
  })
})
