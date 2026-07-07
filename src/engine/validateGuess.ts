import { normalizeWord } from './normalize'
import type { GuessValidation } from './types'

/**
 * Validate a raw typed guess against the union of the English dictionary
 * bucket and the active category's word list for the required length.
 *
 * Invalid guesses cost nothing in any mode — callers must only spend a
 * guess/life/pool unit when `valid` is true.
 */
export function validateGuess(
  rawGuess: string,
  requiredLength: number,
  dictionaryWords: readonly string[],
  categoryWords: readonly string[],
): GuessValidation {
  const word = normalizeWord(rawGuess)
  if (word === null) {
    return { valid: false, reason: 'not-in-word-list' }
  }
  if (word.length !== requiredLength) {
    return { valid: false, reason: 'wrong-length' }
  }
  if (dictionaryWords.includes(word) || categoryWords.includes(word)) {
    return { valid: true, word }
  }
  return { valid: false, reason: 'not-in-word-list' }
}
