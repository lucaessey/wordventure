import { describe, expect, it } from 'vitest'
import { clearRun, loadRun, saveRun } from './adventureSave'
import { startRun, submitGuess, addLetter, beginLevel } from '../engine/adventure'
import {
  TEST_BOSS_REWARD,
  TEST_LIFE_TAX,
  TEST_LIFE_TAX_RAMP,
  TEST_SHOP,
  TEST_STARTING_LIVES,
  TEST_STARTING_PERKS,
} from '../engine/adventure.test'
import type { StorageLike } from './highScores'
import type { Category } from '../engine/types'

function memoryStorage(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial }
  const storage: StorageLike = {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
  }
  return { storage, data }
}

const ANIMALS: Category = {
  id: 'animals',
  displayName: 'Animals',
  minLetters: 3,
  maxLetters: 3,
  wordsByLength: { '3': ['CAT', 'DOG'] },
}

function midPuzzleRun() {
  let run = startRun(
    'hard',
    { kind: 'fixed', categoryId: 'animals' },
    [{ id: 'animals', lengths: [3] }, { id: 'original', lengths: [3] }],
    {
      levelCount: 4,
      startingLives: TEST_STARTING_LIVES,
      startingPerks: TEST_STARTING_PERKS,
      lifeTaxPerRound: TEST_LIFE_TAX,
      lifeTaxRamp: TEST_LIFE_TAX_RAMP,
      bossLevels: { '3': 5 },
      nonBossRamp: [3, 3, 4],
      rewards: { level: 10 },
      bossReward: TEST_BOSS_REWARD,
      shop: TEST_SHOP,
    },
    () => 0,
  )
  run = beginLevel(run, ANIMALS, () => 0) // answer CAT
  for (const letter of 'DOG') run = addLetter(run, letter)
  return submitGuess(run, ['DOG', 'CAT'], ANIMALS.wordsByLength['3']).state
}

describe('adventure save', () => {
  it('round-trips a mid-puzzle run exactly', () => {
    const { storage } = memoryStorage()
    const run = midPuzzleRun()
    expect(run.guesses).toHaveLength(1) // one scored guess in the snapshot
    saveRun(run, 0, storage)
    expect(loadRun(0, storage)).toEqual(run)
  })

  it('returns null when nothing is saved', () => {
    const { storage } = memoryStorage()
    expect(loadRun(0, storage)).toBeNull()
  })

  it('rejects corrupt JSON', () => {
    const { storage } = memoryStorage({ 'wordventure.adventure.run': '{oops' })
    expect(loadRun(0, storage)).toBeNull()
  })

  it('rejects wrong-shaped saves', () => {
    const { storage } = memoryStorage({
      'wordventure.adventure.run': JSON.stringify({ level: 'three', lives: 2 }),
    })
    expect(loadRun(0, storage)).toBeNull()
  })

  it('round-trips shop state exactly', () => {
    const { storage } = memoryStorage()
    const base = midPuzzleRun()
    const run = {
      ...base,
      coins: 47,
      shop: {
        insurance: { owned: true, covered: true, everUsed: true },
        permanentSlots: 1,
        perkA: 2 as const,
        perkB: 1 as const,
        hintCredits: 3,
        hints: {
          revealed: [{ position: 1, letter: 'A' }],
          contained: ['T'],
          eliminated: ['Q', 'Z'],
        },
      },
    }
    saveRun(run, 0, storage)
    expect(loadRun(0, storage)).toEqual(run)
  })

  it('rejects a pre-shop save (no shop field)', () => {
    const { shop: _shop, ...oldSave } = midPuzzleRun()
    const { storage } = memoryStorage({ 'wordventure.adventure.run': JSON.stringify(oldSave) })
    expect(loadRun(0, storage)).toBeNull()
  })

  it('preserves difficulty across a round-trip', () => {
    const { storage } = memoryStorage()
    const run = { ...midPuzzleRun(), difficulty: 'easy' as const }
    saveRun(run, 0, storage)
    expect(loadRun(0, storage)?.difficulty).toBe('easy')
  })

  it('rejects a pre-difficulty save (no difficulty field)', () => {
    const { difficulty: _difficulty, ...oldSave } = midPuzzleRun()
    const { storage } = memoryStorage({ 'wordventure.adventure.run': JSON.stringify(oldSave) })
    expect(loadRun(0, storage)).toBeNull()
  })

  it('rejects saves with an unknown phase', () => {
    const bad = { ...midPuzzleRun(), phase: 'shopping' }
    const { storage } = memoryStorage({ 'wordventure.adventure.run': JSON.stringify(bad) })
    expect(loadRun(0, storage)).toBeNull()
  })

  it('clears the save', () => {
    const { storage, data } = memoryStorage()
    saveRun(midPuzzleRun(), 0, storage)
    clearRun(0, storage)
    expect(data['wordventure.adventure.run']).toBeUndefined()
    expect(loadRun(0, storage)).toBeNull()
  })

  it('survives a null storage', () => {
    expect(loadRun(0, null)).toBeNull()
    expect(() => saveRun(midPuzzleRun(), 0, null)).not.toThrow()
    expect(() => clearRun(0, null)).not.toThrow()
  })
})

describe('adventure save slots', () => {
  it('persists two runs independently across slots', () => {
    const { storage } = memoryStorage()
    const runA = { ...midPuzzleRun(), coins: 11 }
    const runB = { ...midPuzzleRun(), coins: 22, difficulty: 'easy' as const }
    saveRun(runA, 0, storage)
    saveRun(runB, 1, storage)
    expect(loadRun(0, storage)).toEqual(runA)
    expect(loadRun(1, storage)).toEqual(runB)
  })

  it('slot 0 uses the legacy single-save key so a pre-existing run appears as slot 1', () => {
    const { storage, data } = memoryStorage()
    saveRun(midPuzzleRun(), 0, storage)
    expect(data['wordventure.adventure.run']).toBeDefined()
    expect(loadRun(0, storage)).not.toBeNull()
  })

  it('clearing one slot leaves the other intact', () => {
    const { storage } = memoryStorage()
    saveRun(midPuzzleRun(), 0, storage)
    saveRun(midPuzzleRun(), 1, storage)
    clearRun(0, storage)
    expect(loadRun(0, storage)).toBeNull()
    expect(loadRun(1, storage)).not.toBeNull()
  })

  it('an out-of-range slot is a safe no-op', () => {
    const { storage } = memoryStorage()
    expect(() => saveRun(midPuzzleRun(), 5, storage)).not.toThrow()
    expect(loadRun(5, storage)).toBeNull()
    expect(() => clearRun(5, storage)).not.toThrow()
  })

  it('resumes every difficulty, including Extra Hard and Super Hard', () => {
    for (const difficulty of ['easy', 'normal', 'hard', 'extraHard', 'superHard'] as const) {
      const { storage } = memoryStorage()
      const run = { ...midPuzzleRun(), difficulty }
      saveRun(run, 0, storage)
      expect(loadRun(0, storage)?.difficulty).toBe(difficulty)
    }
  })
})
