import { describe, expect, it } from 'vitest'
import {
  addLetter,
  advanceLevel,
  beginLevel,
  lengthForLevel,
  pickLevelCategory,
  removeLetter,
  startRun,
  submitGuess,
  type CategoryOption,
  type InfiniteConfig,
  type InfiniteRunState,
} from './infinite'
import { balance } from '../data/balance'
import type { Category } from './types'

const CONFIG: InfiniteConfig = {
  levelCount: 3,
  startLength: 3,
  startingPool: 2,
  rewards: { easy: 4, medium: 3, hard: 2 },
}

const CATEGORIES: CategoryOption[] = [
  { id: 'original', lengths: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { id: 'animals', lengths: [3, 4, 5] },
  { id: 'brawl-stars', lengths: [3] },
]

const ANIMALS: Category = {
  id: 'animals',
  displayName: 'Animals',
  minLetters: 3,
  maxLetters: 5,
  wordsByLength: {
    '3': ['CAT', 'DOG'],
    '4': ['LION', 'BEAR'],
    '5': ['HORSE', 'MOUSE'],
  },
}

const DICTIONARY: Record<number, string[]> = {
  3: ['CAT', 'DOG', 'FOX', 'BAT', 'RAT'],
  4: ['LION', 'BEAR', 'WOLF', 'GOAT'],
  5: ['HORSE', 'MOUSE', 'CRANE', 'STAMP'],
}

function seededRng(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/** Start an animals-fixed run and begin level 1 with a known answer. */
function playingState(pool = CONFIG.startingPool): InfiniteRunState {
  let state = startRun('easy', { kind: 'fixed', categoryId: 'animals' }, CATEGORIES, CONFIG, () => 0)
  state = { ...state, pool }
  // rng () => 0 picks the first bucket word: CAT
  return beginLevel(state, ANIMALS, () => 0)
}

function submitWord(state: InfiniteRunState, word: string) {
  for (const letter of word) state = addLetter(state, letter)
  const bucket = ANIMALS.wordsByLength[String(state.answer.length)] ?? []
  return submitGuess(state, DICTIONARY[state.answer.length] ?? [], bucket)
}

describe('startRun and beginLevel', () => {
  it('starts at level 1 with the configured pool, loading phase', () => {
    const state = startRun('hard', { kind: 'random' }, CATEGORIES, CONFIG, () => 0)
    expect(state).toMatchObject({ level: 1, pool: 2, levelsBeaten: 0, phase: 'loading' })
  })

  it('beginLevel draws the answer at the level length and enters playing', () => {
    const state = playingState()
    expect(state.phase).toBe('playing')
    expect(state.answer).toBe('CAT')
  })

  it('beginLevel ignores a category that does not match the picked id', () => {
    const state = startRun('easy', { kind: 'fixed', categoryId: 'animals' }, CATEGORIES, CONFIG, () => 0)
    const wrong: Category = { ...ANIMALS, id: 'original' }
    expect(beginLevel(state, wrong, () => 0)).toBe(state)
  })
})

describe('pool economy', () => {
  it('drains 1 on a valid wrong guess', () => {
    const { state, rejection } = submitWord(playingState(), 'DOG')
    expect(rejection).toBeUndefined()
    expect(state.pool).toBe(CONFIG.startingPool - 1)
    expect(state.phase).toBe('playing')
  })

  it('costs nothing on an invalid guess and keeps the input', () => {
    const { state, rejection } = submitWord(playingState(), 'ZZZ')
    expect(rejection).toBe('not-in-word-list')
    expect(state.pool).toBe(CONFIG.startingPool)
    expect(state.input).toBe('ZZZ')
  })

  it('rejects a short guess as wrong-length at no cost', () => {
    let state = playingState()
    state = addLetter(state, 'C')
    const result = submitGuess(state, DICTIONARY[3], ANIMALS.wordsByLength['3'])
    expect(result.rejection).toBe('wrong-length')
    expect(result.state.pool).toBe(CONFIG.startingPool)
  })

  it('applies the reward after the drain and enters level-won', () => {
    const { state } = submitWord(playingState(), 'CAT')
    expect(state.phase).toBe('level-won')
    expect(state.pool).toBe(CONFIG.startingPool - 1 + CONFIG.rewards.easy)
    expect(state.levelsBeaten).toBe(1)
    expect(state.lastReward).toBe(CONFIG.rewards.easy)
  })

  it('winning on the last pooled guess saves the run', () => {
    const { state } = submitWord(playingState(1), 'CAT')
    expect(state.phase).toBe('level-won')
    expect(state.pool).toBe(CONFIG.rewards.easy)
  })

  it('ends the run when the pool empties unsolved', () => {
    const { state } = submitWord(playingState(1), 'DOG')
    expect(state.phase).toBe('run-over')
    expect(state.pool).toBe(0)
  })

  it('accepts no input outside the playing phase', () => {
    const over = submitWord(playingState(1), 'DOG').state
    expect(addLetter(over, 'A')).toBe(over)
    expect(removeLetter(over)).toBe(over)
    expect(submitGuess(over, DICTIONARY[3], []).state).toBe(over)
  })
})

describe('level progression', () => {
  it('advances with word length growing by one', () => {
    const won = submitWord(playingState(), 'CAT').state
    const next = advanceLevel(won, CATEGORIES, () => 0)
    expect(next).toMatchObject({ level: 2, phase: 'loading', guesses: [], answer: '' })
    expect(lengthForLevel(CONFIG, next.level)).toBe(4)
  })

  it('reaches victory on beating the final level', () => {
    // Level 1: CAT (3), level 2: LION (4), level 3: HORSE (5) — levelCount is 3
    let state = playingState()
    state = submitWord(state, 'CAT').state
    state = beginLevel(advanceLevel(state, CATEGORIES, () => 0), ANIMALS, () => 0)
    expect(state.answer).toBe('LION')
    state = submitWord(state, 'LION').state
    state = beginLevel(advanceLevel(state, CATEGORIES, () => 0), ANIMALS, () => 0)
    expect(state.answer).toBe('HORSE')
    const finalPool = state.pool
    state = submitWord(state, 'HORSE').state
    expect(state.phase).toBe('victory')
    expect(state.levelsBeaten).toBe(3)
    expect(state.pool).toBe(finalPool - 1) // no reward after the final level
  })

  it('the real balance ramp ends exactly at 14 letters', () => {
    expect(lengthForLevel(balance.infinite, balance.infinite.levelCount)).toBe(14)
  })
})

describe('pickLevelCategory', () => {
  it('keeps a fixed category while it supports the length', () => {
    expect(pickLevelCategory({ kind: 'fixed', categoryId: 'animals' }, 5, CATEGORIES)).toBe('animals')
  })

  it('falls back to Original when the fixed category cannot support the length', () => {
    expect(pickLevelCategory({ kind: 'fixed', categoryId: 'animals' }, 6, CATEGORIES)).toBe('original')
  })

  it('draws random picks only from categories supporting the length', () => {
    const rng = seededRng(7)
    for (let i = 0; i < 50; i++) {
      const id = pickLevelCategory({ kind: 'random' }, 4, CATEGORIES, rng)
      expect(['original', 'animals']).toContain(id) // brawl-stars maxes out at 3
    }
  })

  it('restricts custom themes to the chosen subset', () => {
    const theme = { kind: 'custom' as const, categoryIds: ['animals', 'brawl-stars'] }
    const rng = seededRng(3)
    for (let i = 0; i < 50; i++) {
      expect(pickLevelCategory(theme, 3, CATEGORIES, rng)).not.toBe('original')
    }
  })

  it('falls back to Original when no custom category supports the length', () => {
    const theme = { kind: 'custom' as const, categoryIds: ['animals', 'brawl-stars'] }
    expect(pickLevelCategory(theme, 9, CATEGORIES)).toBe('original')
  })

  it('is deterministic under a seeded RNG', () => {
    const pick = () => pickLevelCategory({ kind: 'random' }, 3, CATEGORIES, seededRng(42))
    expect(pick()).toBe(pick())
  })
})
