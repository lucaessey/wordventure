/** A word category as stored in src/data/categories/<id>.json. */
export interface Category {
  id: string
  displayName: string
  minLetters: number
  maxLetters: number
  /** Keys are word lengths as strings ("4", "5", ...); values are normalized words. */
  wordsByLength: Record<string, string[]>
}

/** Feedback for a single tile of a scored guess. */
export type TileState = 'green' | 'yellow' | 'gray'

/** Best-known keyboard state for a letter; includes 'unknown' for unguessed letters. */
export type LetterState = TileState | 'unknown'

/** Per-position feedback for one guess, same length as the guess. */
export type GuessFeedback = TileState[]

/** A guess together with its scored feedback. */
export interface ScoredGuess {
  word: string
  feedback: GuessFeedback
}

/** Result of validating a raw typed guess. */
export type GuessValidation =
  | { valid: true; word: string }
  | { valid: false; reason: 'wrong-length' | 'not-in-word-list' }
