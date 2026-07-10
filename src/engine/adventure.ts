import { balance } from '../data/balance'
import { pickLevelCategory, type CategoryOption, type CategoryTheme } from './categoryTheme'
import { scoreGuess } from './feedback'
import { selectAnswer } from './selectAnswer'
import { validateGuess } from './validateGuess'
import type { Category, ScoredGuess } from './types'

/**
 * Adventure's own difficulty set — deliberately distinct from Infinite's
 * `Difficulty` (`easy | medium | hard`): the middle tier differs and the two
 * modes' difficulties mean different things.
 */
export type AdventureDifficulty = 'easy' | 'normal' | 'hard'

export interface AdventureConfig {
  levelCount: number
  /** Starting lives per difficulty — lives ARE guesses. */
  startingLives: Record<AdventureDifficulty, number>
  /** Perk tiers a difficulty starts owning for free (no slot consumed). */
  startingPerks: Record<AdventureDifficulty, { perkA?: number; perkB?: number }>
  /** Boss level number (as string key) → word length. */
  bossLevels: Record<string, number>
  /** Word lengths for the non-boss levels in campaign order. */
  nonBossRamp: number[]
  rewards: {
    level: number
  }
  bossReward: Record<AdventureDifficulty, number>
  shop: {
    lifePrice: number
    hintPrice: number
    skipPrice: number
    insurance: {
      firstPrice: number
      rebuyPrice: number
      premium: number
      reviveLives: number
    }
    perkA: {
      price: number
      upgradePrice: number
      livesPerLevel: number
      upgradedLivesPerLevel: number
    }
    perkB: {
      price: number
      upgradePrice: number
      guessThreshold: number
      upgradedGuessThreshold: number
    }
  }
}

/** 0 = not owned, 1 = bought, 2 = upgraded. */
export type PerkLevel = 0 | 1 | 2

export interface ShopState {
  insurance: {
    owned: boolean
    /** Premium paid for the current level — a covered death revives. */
    covered: boolean
    /** A policy has been consumed this run — repurchases cost the rebuy price. */
    everUsed: boolean
  }
  /** Unspent permanent-upgrade slots (one per boss beaten). */
  permanentSlots: number
  perkA: PerkLevel
  perkB: PerkLevel
  hintCredits: number
  /** Hint effects for the current level; cleared on advance. */
  hints: {
    revealed: Array<{ position: number; letter: string }>
    contained: string[]
    eliminated: string[]
  }
}

export function emptyShop(): ShopState {
  return {
    insurance: { owned: false, covered: false, everUsed: false },
    permanentSlots: 0,
    perkA: 0,
    perkB: 0,
    hintCredits: 0,
    hints: { revealed: [], contained: [], eliminated: [] },
  }
}

export type AdventurePhase = 'loading' | 'playing' | 'level-won' | 'revived' | 'run-over' | 'victory'

/**
 * Full state of an Adventure run. Deliberately plain JSON data (the RNG is
 * passed to functions, never stored) so the whole thing can be snapshotted by
 * the storage layer after every guess.
 */
export interface AdventureRunState {
  config: AdventureConfig
  /** Locked for the run; stored in the save. */
  difficulty: AdventureDifficulty
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
  shop: ShopState
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
  difficulty: AdventureDifficulty,
  theme: CategoryTheme,
  categories: readonly CategoryOption[],
  config: AdventureConfig = balance.adventure,
  rng: () => number = Math.random,
): AdventureRunState {
  // Easy starts owning a free perk (no slot consumed) — seed it into the shop
  // so every existing win-trigger and upgrade path applies unchanged.
  const starting = config.startingPerks[difficulty]
  const shop = emptyShop()
  if (starting.perkA) shop.perkA = starting.perkA as PerkLevel
  if (starting.perkB) shop.perkB = starting.perkB as PerkLevel
  return {
    config,
    difficulty,
    theme,
    level: 1,
    lives: config.startingLives[difficulty],
    coins: 0,
    lastReward: 0,
    categoryId: pickLevelCategory(theme, lengthForLevel(config, 1), categories, rng),
    answer: '',
    guesses: [],
    input: '',
    phase: 'loading',
    shop,
  }
}

/** Lives granted per level beaten by Perk A at its current level. */
export function perkALivesPerLevel(state: AdventureRunState): number {
  const { livesPerLevel, upgradedLivesPerLevel } = state.config.shop.perkA
  return state.shop.perkA === 2 ? upgradedLivesPerLevel : state.shop.perkA === 1 ? livesPerLevel : 0
}

/** Guess threshold for Perk B's free hint, or null when the perk is not owned. */
export function perkBThreshold(state: AdventureRunState): number | null {
  const { guessThreshold, upgradedGuessThreshold } = state.config.shop.perkB
  return state.shop.perkB === 2 ? upgradedGuessThreshold : state.shop.perkB === 1 ? guessThreshold : null
}

/** Perk payouts for a level that counts as beaten with `guessesUsed` guesses. */
export function applyPerkTriggers(state: AdventureRunState, guessesUsed: number): AdventureRunState {
  const bonusLives = perkALivesPerLevel(state)
  const threshold = perkBThreshold(state)
  const bonusCredit = threshold !== null && guessesUsed <= threshold ? 1 : 0
  if (bonusLives === 0 && bonusCredit === 0) return state
  return {
    ...state,
    lives: state.lives + bonusLives,
    shop: { ...state.shop, hintCredits: state.shop.hintCredits + bonusCredit },
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
    const boss = isBossLevel(state.config, state.level)
    const reward = boss
      ? state.config.bossReward[state.difficulty]
      : state.config.rewards.level
    const coins = state.coins + reward
    if (state.level >= state.config.levelCount) {
      return { state: { ...state, guesses, lives, coins, lastReward: reward, input: '', phase: 'victory' } }
    }
    let won: AdventureRunState = {
      ...state,
      guesses,
      lives,
      coins,
      lastReward: reward,
      input: '',
      phase: 'level-won',
    }
    won = applyPerkTriggers(won, guesses.length)
    if (boss) {
      won = { ...won, shop: { ...won.shop, permanentSlots: won.shop.permanentSlots + 1 } }
    }
    return { state: won }
  }

  if (lives <= 0) {
    return { state: settleDeath({ ...state, guesses, lives: 0, input: '' }) }
  }
  return { state: { ...state, guesses, lives, input: '' } }
}

/** Death resolution: a covered policy revives on the same puzzle and is consumed. */
function settleDeath(state: AdventureRunState): AdventureRunState {
  const { insurance } = state.shop
  if (insurance.owned && insurance.covered) {
    return {
      ...state,
      lives: state.config.shop.insurance.reviveLives,
      phase: 'revived',
      shop: {
        ...state.shop,
        insurance: { owned: false, covered: false, everUsed: true },
      },
    }
  }
  return { ...state, phase: 'run-over' }
}

/** Dismiss the insurance-revive moment and keep playing the same puzzle. */
export function resumePlay(state: AdventureRunState): AdventureRunState {
  if (state.phase !== 'revived') return state
  return { ...state, phase: 'playing' }
}

/**
 * Move from the reward moment to the next level. Lives carry over; advancing
 * with 0 lives is a death (covered insurance revives, otherwise run over)
 * rather than presenting a puzzle that cannot legally be guessed at.
 * While a policy is owned, the premium is charged as the new level begins;
 * an unaffordable premium lapses coverage for that level only.
 */
export function advanceLevel(
  state: AdventureRunState,
  categories: readonly CategoryOption[],
  rng: () => number = Math.random,
): AdventureRunState {
  if (state.phase !== 'level-won') return state
  if (state.lives <= 0) {
    const settled = settleDeath(state)
    if (settled.phase === 'run-over') return settled
    // Revived mid-advance: fall through and advance with the revived lives
    state = { ...settled, phase: 'level-won' }
  }

  let shop = { ...state.shop, hints: { revealed: [], contained: [], eliminated: [] } }
  let coins = state.coins
  if (shop.insurance.owned) {
    const premium = state.config.shop.insurance.premium
    if (coins >= premium) {
      coins -= premium
      shop = { ...shop, insurance: { ...shop.insurance, covered: true } }
    } else {
      shop = { ...shop, insurance: { ...shop.insurance, covered: false } }
    }
  }

  const level = state.level + 1
  return {
    ...state,
    level,
    coins,
    shop,
    categoryId: pickLevelCategory(state.theme, lengthForLevel(state.config, level), categories, rng),
    answer: '',
    guesses: [],
    input: '',
    phase: 'loading',
  }
}
