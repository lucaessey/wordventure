import { scoreGuess } from './feedback'
import { validateGuess } from './validateGuess'
import type { ScoredGuess } from './types'

export type RoundStatus = 'playing' | 'won' | 'lost'

/** Immutable state of one puzzle round, advanced by the pure functions below. */
export interface RoundState {
  answer: string
  maxGuesses: number
  guesses: ScoredGuess[]
  /** Letters typed for the next guess, not yet submitted. */
  input: string
  status: RoundStatus
}

export type SubmitRejection = 'wrong-length' | 'not-in-word-list'

export interface SubmitResult {
  state: RoundState
  /** Present when the guess was rejected — nothing was consumed. */
  rejection?: SubmitRejection
}

export function startRound(answer: string, maxGuesses: number): RoundState {
  return { answer, maxGuesses, guesses: [], input: '', status: 'playing' }
}

/** Append a letter to the input; ignored when the round is over or the row is full. */
export function addLetter(state: RoundState, letter: string): RoundState {
  const upper = letter.toUpperCase()
  if (state.status !== 'playing' || state.input.length >= state.answer.length) return state
  if (!/^[A-Z]$/.test(upper)) return state
  return { ...state, input: state.input + upper }
}

export function removeLetter(state: RoundState): RoundState {
  if (state.status !== 'playing' || state.input.length === 0) return state
  return { ...state, input: state.input.slice(0, -1) }
}

/**
 * Submit the current input. Invalid guesses return a rejection, keep the typed
 * letters for editing, and consume nothing. Valid guesses are scored and the
 * round ends when the answer is found or the last guess is spent.
 */
export function submitGuess(
  state: RoundState,
  dictionaryWords: readonly string[],
  categoryWords: readonly string[],
): SubmitResult {
  if (state.status !== 'playing') return { state }

  const validation = validateGuess(state.input, state.answer.length, dictionaryWords, categoryWords)
  if (!validation.valid) {
    return { state, rejection: validation.reason }
  }

  const scored: ScoredGuess = {
    word: validation.word,
    feedback: scoreGuess(validation.word, state.answer),
  }
  const guesses = [...state.guesses, scored]
  const status: RoundStatus =
    validation.word === state.answer ? 'won' : guesses.length >= state.maxGuesses ? 'lost' : 'playing'

  return { state: { ...state, guesses, input: '', status } }
}
