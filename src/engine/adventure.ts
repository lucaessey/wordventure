import { balance } from '../data/balance'
import { pickLevelCategory, type CategoryOption, type CategoryTheme } from './categoryTheme'
import { scoreGuess } from './feedback'
import { selectAnswer } from './selectAnswer'
import { validateGuess } from './validateGuess'
import type { Category, ScoredGuess } from './types'

export interface AdventureConfig {
  levelCount: number
  startingLives: number
  /** Boss level number (as string key) → word length. */
  bossLevels: Record<string, number>
  /** Word lengths for the non-boss levels in campaign order. */
  nonBossRamp: number[]
  rewards: {
    level: number
    boss: number
  }
}

export type AdventurePhase = 'loading' | 'playing' | 'level-won' | 'run-over' | 'victory'

/**
 * Full state of an Adventure run. Deliberately plain JSON data (the RNG is
 * passed to functions, never stored) so the whole thing can be snapshotted by
 * the storage layer after every guess.
 */
export interface AdventureRunState {
  config: AdventureConfig
  theme: CategoryTheme
  /** 1-based level number. */
  level: number
  /** Lives ARE guesses: every valid guess spends one. */
  lives: number
  coins: number
  /** Coins granted by the most recent win (for the reward overlay). */
  lastReward: number
  categoryId: string
  answer: string
  guesses: ScoredGuess[]
  input: string
  phase: AdventurePhase
}

export function isBossLevel(config: AdventureConfig, level: number): boolean {
  return String(level) in config.bossLevels
}

/** Boss levels use their design-fixed lengths; other levels follow the ramp. */
export function lengthForLevel(config: AdventureConfig, level: number): number {
  const bossLength = config.bossLevels[String(level)]
  if (bossLength !== undefined) return bossLength
  let rampIndex = 0
  for (let l = 1; l < level; l++) {
    if (!isBossLevel(config, l)) rampIndex++
  }
  return config.nonBossRamp[rampIndex]
}

export function startRun(
  theme: CategoryTheme,
  categories: readonly CategoryOption[],
  config: AdventureConfig = balance.adventure,
  rng: () => number = Math.random,
): AdventureRunState {
  return {
    config,
    theme,
    level: 1,
    lives: config.startingLives,
    coins: 0,
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
  state: AdventureRunState,
  category: Category,
  rng: () => number = Math.random,
): AdventureRunState {
  if (state.phase !== 'loading' || category.id !== state.categoryId) return state
  // A restored mid-puzzle save already has its answer — never re-roll it
  if (state.answer !== '') return { ...state, phase: 'playing' }
  return {
    ...state,
    answer: selectAnswer(category, lengthForLevel(state.config, state.level), rng),
    guesses: [],
    input: '',
    phase: 'playing',
  }
}

export function addLetter(state: AdventureRunState, letter: string): AdventureRunState {
  const upper = letter.toUpperCase()
  if (state.phase !== 'playing' || state.input.length >= state.answer.length) return state
  if (!/^[A-Z]$/.test(upper)) return state
  return { ...state, input: state.input + upper }
}

export function removeLetter(state: AdventureRunState): AdventureRunState {
  if (state.phase !== 'playing' || state.input.length === 0) return state
  return { ...state, input: state.input.slice(0, -1) }
}

export type SubmitRejection = 'wrong-length' | 'not-in-word-list'

export interface SubmitResult {
  state: AdventureRunState
  /** Present when the guess was rejected — no life was spent. */
  rejection?: SubmitRejection
}

/**
 * Submit the current input. A valid guess always spends one life. Solving the
 * level awards coins (boss rate on boss levels) and enters 'level-won' — or
 * 'victory' on the final level. An unsolved level with 0 lives left ends the
 * run. Invalid guesses cost nothing.
 */
export function submitGuess(
  state: AdventureRunState,
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
  const lives = state.lives - 1

  if (validation.word === state.answer) {
    const reward = isBossLevel(state.config, state.level)
      ? state.config.rewards.boss
      : state.config.rewards.level
    const coins = state.coins + reward
    const phase = state.level >= state.config.levelCount ? 'victory' : 'level-won'
    return {
      state: { ...state, guesses, lives, coins, lastReward: reward, input: '', phase },
    }
  }

  if (lives <= 0) {
    return { state: { ...state, guesses, lives: 0, input: '', phase: 'run-over' } }
  }
  return { state: { ...state, guesses, lives, input: '' } }
}

/**
 * Move from the reward moment to the next level. Lives carry over; advancing
 * with 0 lives ends the run immediately rather than presenting a puzzle that
 * cannot legally be guessed at.
 */
export function advanceLevel(
  state: AdventureRunState,
  categories: readonly CategoryOption[],
  rng: () => number = Math.random,
): AdventureRunState {
  if (state.phase !== 'level-won') return state
  if (state.lives <= 0) {
    return { ...state, phase: 'run-over' }
  }
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
