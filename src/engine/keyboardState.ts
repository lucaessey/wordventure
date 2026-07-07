import type { LetterState, ScoredGuess } from './types'

const RANK: Record<LetterState, number> = {
  unknown: 0,
  gray: 1,
  yellow: 2,
  green: 3,
}

/**
 * Derive the best-known state per letter from all scored guesses so far.
 * Precedence green > yellow > gray > unknown; a letter never downgrades
 * (a duplicate slot scored gray does not erase a known yellow/green).
 *
 * Letters never guessed are absent from the result — treat missing as 'unknown'.
 */
export function keyboardState(guesses: readonly ScoredGuess[]): Record<string, LetterState> {
  const states: Record<string, LetterState> = {}
  for (const { word, feedback } of guesses) {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i]
      const state = feedback[i]
      const current = states[letter] ?? 'unknown'
      if (RANK[state] > RANK[current]) {
        states[letter] = state
      }
    }
  }
  return states
}
