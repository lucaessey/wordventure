import { describe, expect, it } from 'vitest'
import {
  addLetter,
  advanceLevel,
  beginLevel,
  isBossLevel,
  lengthForLevel,
  removeLetter,
  startRun,
  submitGuess,
  type AdventureConfig,
  type AdventureRunState,
} from './adventure'
import { balance } from '../data/balance'
import type { CategoryOption } from './categoryTheme'
import type { Category } from './types'

export const TEST_SHOP: AdventureConfig['shop'] = {
  lifePrice: 3,
  hintPrice: 6,
  skipPrice: 50,
  insurance: { firstPrice: 10, rebuyPrice: 20, premium: 2, reviveLives: 4 },
  perkA: { price: 60, upgradePrice: 80, livesPerLevel: 1, upgradedLivesPerLevel: 2 },
  perkB: { price: 60, upgradePrice: 80, guessThreshold: 3, upgradedGuessThreshold: 4 },
}

/** Shared per-difficulty start for test configs: 4 lives all round, no free perks. */
export const TEST_STARTING_LIVES: AdventureConfig['startingLives'] = { easy: 4, normal: 4, hard: 4 }
export const TEST_STARTING_PERKS: AdventureConfig['startingPerks'] = { easy: {}, normal: {}, hard: {} }

// Small campaign: 4 levels, boss at 3 (length 5). Non-boss lengths 3, 3, 4.
const CONFIG: AdventureConfig = {
  levelCount: 4,
  startingLives: TEST_STARTING_LIVES,
  startingPerks: TEST_STARTING_PERKS,
  bossLevels: { '3': 5 },
  nonBossRamp: [3, 3, 4],
  rewards: { level: 10 },
  bossReward: { easy: 25, normal: 20, hard: 15 },
  shop: TEST_SHOP,
}

const CATEGORIES: CategoryOption[] = [
  { id: 'original', lengths: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { id: 'animals', lengths: [3, 4] }, // cannot support the length-5 boss
]

const ANIMALS: Category = {
  id: 'animals',
  displayName: 'Animals',
  minLetters: 3,
  maxLetters: 4,
  wordsByLength: {
    '3': ['CAT', 'DOG'],
    '4': ['LION', 'BEAR'],
  },
}

const ORIGINAL: Category = {
  id: 'original',
  displayName: 'Original',
  minLetters: 3,
  maxLetters: 5,
  wordsByLength: {
    '3': ['THE', 'AND'],
    '4': ['WORD', 'GAME'],
    '5': ['CRANE', 'STAMP'],
  },
}

const DICTIONARY: Record<number, string[]> = {
  3: ['CAT', 'DOG', 'FOX', 'THE', 'AND', 'RAT', 'BAT'],
  4: ['LION', 'BEAR', 'WOLF', 'WORD', 'GAME', 'GOAT'],
  5: ['CRANE', 'STAMP', 'QUIRK', 'BLIMP'],
}

const CATEGORY_DATA: Record<string, Category> = { animals: ANIMALS, original: ORIGINAL }

function playing(lives = CONFIG.startingLives.hard): AdventureRunState {
  let state = startRun('hard', { kind: 'fixed', categoryId: 'animals' }, CATEGORIES, CONFIG, () => 0)
  state = { ...state, lives }
  return beginLevel(state, ANIMALS, () => 0) // answer: CAT
}

function submitWord(state: AdventureRunState, word: string) {
  for (const letter of word) state = addLetter(state, letter)
  const category = CATEGORY_DATA[state.categoryId]
  const bucket = category.wordsByLength[String(state.answer.length)] ?? []
  return submitGuess(state, DICTIONARY[state.answer.length] ?? [], bucket)
}

function winLevel(state: AdventureRunState) {
  return submitWord(state, state.answer).state
}

function nextLevel(state: AdventureRunState) {
  const advanced = advanceLevel(state, CATEGORIES, () => 0)
  if (advanced.phase !== 'loading') return advanced
  return beginLevel(advanced, CATEGORY_DATA[advanced.categoryId], () => 0)
}

describe('campaign structure', () => {
  it('uses boss lengths at boss levels and the ramp elsewhere', () => {
    expect(lengthForLevel(CONFIG, 1)).toBe(3)
    expect(lengthForLevel(CONFIG, 2)).toBe(3)
    expect(lengthForLevel(CONFIG, 3)).toBe(5) // boss
    expect(lengthForLevel(CONFIG, 4)).toBe(4) // third ramp entry
    expect(isBossLevel(CONFIG, 3)).toBe(true)
    expect(isBossLevel(CONFIG, 4)).toBe(false)
  })

  it('maps the real balance config correctly', () => {
    const config = balance.adventure
    expect(lengthForLevel(config, 5)).toBe(10)
    expect(lengthForLevel(config, 10)).toBe(11)
    expect(lengthForLevel(config, 15)).toBe(12)
    expect(lengthForLevel(config, 20)).toBe(13)
    expect(lengthForLevel(config, 25)).toBe(14)
    // Level 6 is the 5th non-boss level → ramp index 4
    expect(lengthForLevel(config, 6)).toBe(config.nonBossRamp[4])
    // Non-boss lengths never decrease across the campaign
    const nonBossLengths = []
    for (let l = 1; l <= config.levelCount; l++) {
      if (!isBossLevel(config, l)) nonBossLengths.push(lengthForLevel(config, l))
    }
    for (let i = 1; i < nonBossLengths.length; i++) {
      expect(nonBossLengths[i]).toBeGreaterThanOrEqual(nonBossLengths[i - 1])
    }
  })

  it('starts with configured lives, no coins, loading phase', () => {
    const state = startRun('hard', { kind: 'random' }, CATEGORIES, CONFIG, () => 0)
    expect(state).toMatchObject({ level: 1, lives: 4, coins: 0, phase: 'loading', difficulty: 'hard' })
  })
})

describe('difficulty', () => {
  // A config with the real per-difficulty starts: Easy/Normal 6, Hard 4; Easy free Perk A.
  const DIFF_CONFIG: AdventureConfig = {
    ...CONFIG,
    startingLives: { easy: 6, normal: 6, hard: 4 },
    startingPerks: { easy: { perkA: 1 }, normal: {}, hard: {} },
  }

  it('seeds per-difficulty starting lives', () => {
    expect(startRun('easy', { kind: 'random' }, CATEGORIES, DIFF_CONFIG, () => 0).lives).toBe(6)
    expect(startRun('normal', { kind: 'random' }, CATEGORIES, DIFF_CONFIG, () => 0).lives).toBe(6)
    expect(startRun('hard', { kind: 'random' }, CATEGORIES, DIFF_CONFIG, () => 0).lives).toBe(4)
  })

  it('Easy begins owning Perk A at base tier, consuming no slot', () => {
    const easy = startRun('easy', { kind: 'random' }, CATEGORIES, DIFF_CONFIG, () => 0)
    expect(easy.shop.perkA).toBe(1)
    expect(easy.shop.permanentSlots).toBe(0)
    expect(easy.difficulty).toBe('easy')
  })

  it('Normal and Hard begin with no perks', () => {
    expect(startRun('normal', { kind: 'random' }, CATEGORIES, DIFF_CONFIG, () => 0).shop.perkA).toBe(0)
    expect(startRun('hard', { kind: 'random' }, CATEGORIES, DIFF_CONFIG, () => 0).shop.perkA).toBe(0)
  })

  it("Easy's free Perk A pays +1 life on the first level win", () => {
    let easy = startRun('easy', { kind: 'fixed', categoryId: 'animals' }, CATEGORIES, DIFF_CONFIG, () => 0)
    easy = beginLevel(easy, ANIMALS, () => 0) // answer CAT, lives 6
    let s = easy
    for (const letter of 'CAT') s = addLetter(s, letter)
    const won = submitGuess(s, DICTIONARY[3], ANIMALS.wordsByLength['3']).state
    // 6 lives - 1 guess + 1 perk life
    expect(won.lives).toBe(6)
    expect(won.phase).toBe('level-won')
  })
})

describe('lives are guesses', () => {
  it('spends a life on a valid wrong guess', () => {
    const { state } = submitWord(playing(), 'DOG')
    expect(state.lives).toBe(3)
    expect(state.phase).toBe('playing')
  })

  it('spends nothing on an invalid guess and keeps input', () => {
    const { state, rejection } = submitWord(playing(), 'ZZZ')
    expect(rejection).toBe('not-in-word-list')
    expect(state.lives).toBe(4)
    expect(state.input).toBe('ZZZ')
  })

  it('ends the run at 0 lives with the level unsolved', () => {
    const { state } = submitWord(playing(1), 'DOG')
    expect(state.phase).toBe('run-over')
    expect(state.lives).toBe(0)
  })

  it('a last-life solve beats the level, then advancing ends the run', () => {
    const won = submitWord(playing(1), 'CAT').state
    expect(won.phase).toBe('level-won')
    expect(won.lives).toBe(0)
    expect(won.coins).toBe(CONFIG.rewards.level) // reward still granted
    const advanced = advanceLevel(won, CATEGORIES, () => 0)
    expect(advanced.phase).toBe('run-over')
  })

  it('accepts no input outside the playing phase', () => {
    const over = submitWord(playing(1), 'DOG').state
    expect(addLetter(over, 'A')).toBe(over)
    expect(removeLetter(over)).toBe(over)
    expect(submitGuess(over, DICTIONARY[3], []).state).toBe(over)
  })
})

describe('coins and progression', () => {
  it('awards the level rate for non-boss and the boss rate for boss levels', () => {
    let state = winLevel(playing()) // level 1 won
    expect(state.coins).toBe(10)
    expect(state.lastReward).toBe(10)
    state = nextLevel(state) // level 2 (animals, 3 letters)
    state = winLevel(state)
    expect(state.coins).toBe(20)
    state = nextLevel(state) // level 3: boss, length 5 → animals can't → original
    expect(state.categoryId).toBe('original')
    expect(state.answer).toHaveLength(5)
    state = winLevel(state)
    expect(state.phase).toBe('level-won')
    // playing() runs on Hard, so the boss pays the Hard rate
    expect(state.coins).toBe(20 + CONFIG.bossReward.hard)
    expect(state.lastReward).toBe(CONFIG.bossReward.hard)
  })

  it('pays the boss reward for the run difficulty', () => {
    // Advance a run of the given difficulty to the boss (level 3) and win it.
    const bossWin = (difficulty: 'easy' | 'normal' | 'hard') => {
      let state = startRun(difficulty, { kind: 'fixed', categoryId: 'animals' }, CATEGORIES, CONFIG, () => 0)
      state = beginLevel(state, ANIMALS, () => 0)
      state = winLevel(state) // level 1
      state = nextLevel(state)
      state = winLevel(state) // level 2
      state = nextLevel(state) // level 3 = boss (original, length 5)
      return winLevel(state)
    }
    expect(bossWin('easy').lastReward).toBe(CONFIG.bossReward.easy)
    expect(bossWin('normal').lastReward).toBe(CONFIG.bossReward.normal)
    expect(bossWin('hard').lastReward).toBe(CONFIG.bossReward.hard)
    // The three rates are distinct
    const { easy, normal, hard } = CONFIG.bossReward
    expect(new Set([easy, normal, hard]).size).toBe(3)
  })

  it('reaches victory on the final level', () => {
    let state = playing()
    state = winLevel(state)
    state = nextLevel(state)
    state = winLevel(state)
    state = nextLevel(state) // boss
    state = winLevel(state)
    state = nextLevel(state) // level 4 (final)
    expect(state.level).toBe(4)
    state = winLevel(state)
    expect(state.phase).toBe('victory')
    expect(state.coins).toBe(10 + 10 + CONFIG.bossReward.hard + 10)
  })

  it('is deterministic under a seeded RNG', () => {
    const run = () => {
      const s = startRun('hard', { kind: 'random' }, CATEGORIES, CONFIG, () => 0.5)
      return beginLevel(s, CATEGORY_DATA[s.categoryId], () => 0.5).answer
    }
    expect(run()).toBe(run())
  })
})

describe('beginLevel restore behavior', () => {
  it('keeps a restored answer instead of re-rolling', () => {
    let state = startRun('hard', { kind: 'fixed', categoryId: 'animals' }, CATEGORIES, CONFIG, () => 0)
    state = { ...state, answer: 'DOG', guesses: [{ word: 'CAT', feedback: ['gray', 'yellow', 'gray'] }] }
    const resumed = beginLevel(state, ANIMALS, () => 0)
    expect(resumed.answer).toBe('DOG')
    expect(resumed.guesses).toHaveLength(1)
    expect(resumed.phase).toBe('playing')
  })
})
