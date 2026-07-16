import { balance } from '../data/balance'
import { pickLevelCategory, type CategoryOption, type CategoryTheme } from './categoryTheme'
import { scoreGuess } from './feedback'
import { selectAnswer } from './selectAnswer'
import { validateGuess } from './validateGuess'
import type { Category, ScoredGuess } from './types'

/**
 * Infinite's difficulty set, as a runtime tuple so the save-storage layer can
 * validate a loaded run against the exact same list the type is built from.
 */
export const INFINITE_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export type Difficulty = (typeof INFINITE_DIFFICULTIES)[number]

/** Theme machinery lives in categoryTheme.ts (shared with Adventure); re-exported for compat. */
export type InfiniteTheme = CategoryTheme
export { pickLevelCategory, FALLBACK_CATEGORY_ID, type CategoryOption } from './categoryTheme'

export interface InfiniteConfig {
  levelCount: number
  startLength: number
  /** Starting banked-guess pool per difficulty. */
  startingPool: Record<Difficulty, number>
  rewards: Record<Difficulty, number>
}

export type InfinitePhase = 'loading' | 'playing' | 'level-won' | 'run-over' | 'victory'

export interface InfiniteRunState {
  config: InfiniteConfig
  difficulty: Difficulty
  theme: InfiniteTheme
  /** 1-based level number. */
  level: number
  pool: number
  /** Levels beaten this run. */
  levelsBeaten: number
  /** Reward granted by the most recent level win (for the "+N guesses!" moment). */
  lastReward: number
  categoryId: string
  answer: string
  guesses: ScoredGuess[]
  input: string
  phase: InfinitePhase
}

export function lengthForLevel(config: InfiniteConfig, level: number): number {
  return config.startLength + level - 1
}

export function startRun(
  difficulty: Difficulty,
  theme: InfiniteTheme,
  categories: readonly CategoryOption[],
  config: InfiniteConfig = balance.infinite,
  rng: () => number = Math.random,
): InfiniteRunState {
  return {
    config,
    difficulty,
    theme,
    level: 1,
    pool: config.startingPool[difficulty],
    levelsBeaten: 0,
    lastReward: 0,
    categoryId: pickLevelCategory(theme, lengthForLevel(config, 1), categories, rng),
    answer: '',
    guesses: [],
    input: '',
    phase: 'loading',
  }
}

/** Begin the current level once its category data is loaded. */
export function beginLevel(
  state: InfiniteRunState,
  category: Category,
  rng: () => number = Math.random,
): InfiniteRunState {
  if (state.phase !== 'loading' || category.id !== state.categoryId) return state
  return {
    ...state,
    answer: selectAnswer(category, lengthForLevel(state.config, state.level), rng),
    guesses: [],
    input: '',
    phase: 'playing',
  }
}

export function addLetter(state: InfiniteRunState, letter: string): InfiniteRunState {
  const upper = letter.toUpperCase()
  if (state.phase !== 'playing' || state.input.length >= state.answer.length) return state
  if (!/^[A-Z]$/.test(upper)) return state
  return { ...state, input: state.input + upper }
}

export function removeLetter(state: InfiniteRunState): InfiniteRunState {
  if (state.phase !== 'playing' || state.input.length === 0) return state
  return { ...state, input: state.input.slice(0, -1) }
}

export type SubmitRejection = 'wrong-length' | 'not-in-word-list'

export interface SubmitResult {
  state: InfiniteRunState
  /** Present when the guess was rejected — the pool was not drained. */
  rejection?: SubmitRejection
}

/**
 * Submit the current input. A valid guess always drains the pool by 1.
 * Solving the level applies the difficulty reward AFTER the drain (winning on
 * the last pooled guess saves the run) and enters the 'level-won' phase — or
 * 'victory' on the final level. An unsolved level with the pool at 0 ends the
 * run. Invalid guesses cost nothing.
 */
export function submitGuess(
  state: InfiniteRunState,
  dictionaryWords: readonly string[],
  categoryWords: readonly string[],
): SubmitResult {
  if (state.phase !== 'playing') return { state }

  const validation = validateGuess(state.input, state.answer.length, dictionaryWords, categoryWords)
  if (!validation.valid) {
    return { state, rejection: validation.reason }
  }

  const scored: ScoredGuess = {
    word: validation.word,
    feedback: scoreGuess(validation.word, state.answer),
  }
  const guesses = [...state.guesses, scored]
  const pool = state.pool - 1

  if (validation.word === state.answer) {
    const levelsBeaten = state.levelsBeaten + 1
    if (state.level >= state.config.levelCount) {
      return { state: { ...state, guesses, pool, levelsBeaten, input: '', phase: 'victory' } }
    }
    const reward = state.config.rewards[state.difficulty]
    return {
      state: {
        ...state,
        guesses,
        pool: pool + reward,
        levelsBeaten,
        lastReward: reward,
        input: '',
        phase: 'level-won',
      },
    }
  }

  if (pool <= 0) {
    return { state: { ...state, guesses, pool: 0, input: '', phase: 'run-over' } }
  }
  return { state: { ...state, guesses, pool, input: '' } }
}

/** Move from the reward moment to the next level (data loads before beginLevel). */
export function advanceLevel(
  state: InfiniteRunState,
  categories: readonly CategoryOption[],
  rng: () => number = Math.random,
): InfiniteRunState {
  if (state.phase !== 'level-won') return state
  const level = state.level + 1
  return {
    ...state,
    level,
    categoryId: pickLevelCategory(state.theme, lengthForLevel(state.config, level), categories, rng),
    answer: '',
    guesses: [],
    input: '',
    phase: 'loading',
  }
}
