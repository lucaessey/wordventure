import type { GuessFeedback } from './types'

/**
 * Score a guess against an answer of equal length using classic Wordle rules.
 *
 * Two passes: greens first, counting the answer's unmatched letters; then
 * yellows left-to-right, each consuming one remaining occurrence of its
 * letter. A letter is marked green/yellow at most as many times as it occurs
 * in the answer, with greens taking priority.
 *
 * Both words must already be normalized (uppercase A-Z) and the same length.
 */
export function scoreGuess(guess: string, answer: string): GuessFeedback {
  if (guess.length !== answer.length) {
    throw new Error(`Guess length ${guess.length} does not match answer length ${answer.length}`)
  }

  const feedback: GuessFeedback = new Array(guess.length).fill('gray')
  const remaining = new Map<string, number>()

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      feedback[i] = 'green'
    } else {
      remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1)
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (feedback[i] === 'green') continue
    const count = remaining.get(guess[i]) ?? 0
    if (count > 0) {
      feedback[i] = 'yellow'
      remaining.set(guess[i], count - 1)
    }
  }

  return feedback
}
