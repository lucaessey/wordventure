/** The three game modes achievements can come from. */
export type Mode = 'normal' | 'infinite' | 'adventure'

/** Union of every difficulty across modes (Infinite: easy/medium/hard; Adventure: easy/normal/hard/extraHard/superHard). */
export type Difficulty = 'easy' | 'medium' | 'normal' | 'hard' | 'extraHard' | 'superHard'

export type AchievementGroup =
  | 'onboarding'
  | 'skill'
  | 'explorer'
  | 'infinite'
  | 'adventure'
  | 'collection'
  | 'fun'

export type AchievementKind = 'single' | 'difficulty-tiered' | 'volume-tiered'

/** Static metadata for one badge (criteria logic lives in the evaluator, keyed by id). */
export interface AchievementDef {
  id: string
  group: AchievementGroup
  kind: AchievementKind
  hidden: boolean
  /** When set, only events from this mode count toward the badge. */
  modeRestriction?: Mode
  name: string
  /** Shown in the Trophy Room for locked (non-hidden) badges. */
  howTo: string
}

/**
 * Events emitted by the view layer at outcome points it already reaches. These
 * are plain facts (no game logic) — the achievements engine folds them in.
 */
export type AchievementEvent =
  | { type: 'game-started'; mode: Mode; categoryId?: string; day: string }
  | {
      type: 'word-solved'
      mode: Mode
      difficulty?: Difficulty
      guessesUsed: number
      maxGuesses: number
      answerLength: number
      categoryId?: string
      hadYellow: boolean
    }
  | { type: 'game-lost'; mode: Mode; answerLength: number; lastGuessGreens: number }
  | { type: 'level-reached'; difficulty: Difficulty; level: number }
  | { type: 'pool-held'; difficulty: Difficulty; amount: number }
  | { type: 'boss-beaten'; difficulty: Difficulty }
  | { type: 'coins-earned'; delta: number }
  | { type: 'perks-maxed'; difficulty: Difficulty }
  | {
      type: 'run-finished'
      mode: 'infinite' | 'adventure'
      difficulty: Difficulty
      won: boolean
      boughtInsuranceEver?: boolean
      revivedAndWon?: boolean
    }

/**
 * Persisted achievement state. `earned` maps a badge id to the tier numbers
 * earned (single-tier badges use [1]; tiered badges hold a subset of [1,2,3]).
 */
export interface AchievementProgress {
  earned: Record<string, number[]>
  counters: {
    gamesPlayed: number
    totalWins: number
    lifetimeAdventureCoins: number
  }
  categoriesPlayed: string[]
  flagshipSolved: string[]
  modesWon: Mode[]
  daysPlayed: string[]
}

export function emptyProgress(): AchievementProgress {
  return {
    earned: {},
    counters: { gamesPlayed: 0, totalWins: 0, lifetimeAdventureCoins: 0 },
    categoriesPlayed: [],
    flagshipSolved: [],
    modesWon: [],
    daysPlayed: [],
  }
}

/**
 * Tier number (1/2/3) for a difficulty within its mode's ascending difficulty
 * order. Infinite: easy=1, medium=2, hard=3. Adventure: easy=1, normal=2,
 * hard=3. (Reconciles the "Tier II = Normal" rule with Infinite's Medium.)
 */
export function difficultyTier(mode: 'infinite' | 'adventure', difficulty: Difficulty): number {
  const order: Record<'infinite' | 'adventure', Difficulty[]> = {
    infinite: ['easy', 'medium', 'hard'],
    adventure: ['easy', 'normal', 'hard'],
  }
  return order[mode].indexOf(difficulty) + 1
}
