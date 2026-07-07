import { describe, expect, it } from 'vitest'
import { addLetter, removeLetter, startRound, submitGuess } from './round'

const DICTIONARY = ['CRANE', 'STAMP', 'TRAIN', 'QUIRK', 'ELITE']
const CATEGORY = ['EEVEE']

function typed(word: string, maxGuesses = 6) {
  let state = startRound('CRANE', maxGuesses)
  for (const letter of word) state = addLetter(state, letter)
  return state
}

describe('round', () => {
  it('starts empty and playing', () => {
    const state = startRound('CRANE', 6)
    expect(state).toMatchObject({ guesses: [], input: '', status: 'playing', maxGuesses: 6 })
  })

  it('adds letters up to the word length and ignores extras', () => {
    let state = typed('crane')
    expect(state.input).toBe('CRANE')
    state = addLetter(state, 'X')
    expect(state.input).toBe('CRANE')
  })

  it('ignores non-letter input', () => {
    const state = addLetter(startRound('CRANE', 6), '3')
    expect(state.input).toBe('')
  })

  it('removes letters and stops at empty', () => {
    let state = removeLetter(typed('cat'))
    expect(state.input).toBe('CA')
    state = removeLetter(removeLetter(removeLetter(state)))
    expect(state.input).toBe('')
  })

  it('wins on the correct guess', () => {
    const { state, rejection } = submitGuess(typed('crane'), DICTIONARY, CATEGORY)
    expect(rejection).toBeUndefined()
    expect(state.status).toBe('won')
    expect(state.guesses).toHaveLength(1)
    expect(state.guesses[0].feedback).toEqual(['green', 'green', 'green', 'green', 'green'])
  })

  it('loses after maxGuesses wrong guesses', () => {
    let state = startRound('CRANE', 2)
    for (const word of ['STAMP', 'QUIRK']) {
      for (const letter of word) state = addLetter(state, letter)
      state = submitGuess(state, DICTIONARY, CATEGORY).state
    }
    expect(state.status).toBe('lost')
    expect(state.guesses).toHaveLength(2)
  })

  it('rejects an unknown word at no cost and keeps the typed letters', () => {
    const before = typed('zzzzz')
    const { state, rejection } = submitGuess(before, DICTIONARY, CATEGORY)
    expect(rejection).toBe('not-in-word-list')
    expect(state.guesses).toHaveLength(0)
    expect(state.input).toBe('ZZZZZ')
    expect(state.status).toBe('playing')
  })

  it('accepts a category-only word', () => {
    const { state, rejection } = submitGuess(typed('eevee'), DICTIONARY, CATEGORY)
    expect(rejection).toBeUndefined()
    expect(state.guesses).toHaveLength(1)
  })

  it('rejects an incomplete word with wrong-length', () => {
    const { state, rejection } = submitGuess(typed('cat'), DICTIONARY, CATEGORY)
    expect(rejection).toBe('wrong-length')
    expect(state.input).toBe('CAT')
  })

  it('accepts no input after the round ends', () => {
    const won = submitGuess(typed('crane'), DICTIONARY, CATEGORY).state
    expect(addLetter(won, 'A')).toBe(won)
    expect(removeLetter(won)).toBe(won)
    expect(submitGuess(won, DICTIONARY, CATEGORY).state).toBe(won)
  })
})
