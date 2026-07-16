import { describe, expect, it } from 'vitest'
import { clearRun, loadRun, saveRun } from './infiniteSave'
import { addLetter, beginLevel, startRun, submitGuess, type InfiniteConfig } from '../engine/infinite'
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

const CONFIG: InfiniteConfig = {
  levelCount: 3,
  startLength: 3,
  startingPool: { easy: 6, medium: 4, hard: 4 },
  rewards: { easy: 4, medium: 3, hard: 2 },
}

const ANIMALS: Category = {
  id: 'animals',
  displayName: 'Animals',
  minLetters: 3,
  maxLetters: 3,
  wordsByLength: { '3': ['CAT', 'DOG'] },
}

/** A mid-level Infinite run: level 1, one scored wrong guess in the snapshot. */
function midRun() {
  let run = startRun(
    'easy',
    { kind: 'fixed', categoryId: 'animals' },
    [{ id: 'animals', lengths: [3] }, { id: 'original', lengths: [3] }],
    CONFIG,
    () => 0,
  )
  run = beginLevel(run, ANIMALS, () => 0) // answer CAT
  for (const letter of 'DOG') run = addLetter(run, letter)
  return submitGuess(run, ['DOG', 'CAT'], ANIMALS.wordsByLength['3']).state
}

describe('infinite save', () => {
  it('round-trips a mid-level run exactly', () => {
    const { storage } = memoryStorage()
    const run = midRun()
    expect(run.guesses).toHaveLength(1)
    saveRun(run, 0, storage)
    expect(loadRun(0, storage)).toEqual(run)
  })

  it('returns null when nothing is saved', () => {
    const { storage } = memoryStorage()
    expect(loadRun(0, storage)).toBeNull()
  })

  it('rejects corrupt JSON', () => {
    const { storage } = memoryStorage({ 'wordventure.infinite.run': '{oops' })
    expect(loadRun(0, storage)).toBeNull()
  })

  it('rejects wrong-shaped saves', () => {
    const { storage } = memoryStorage({
      'wordventure.infinite.run': JSON.stringify({ level: 'three', pool: 2 }),
    })
    expect(loadRun(0, storage)).toBeNull()
  })

  it('rejects a save with an unknown difficulty', () => {
    const bad = { ...midRun(), difficulty: 'extreme' }
    const { storage } = memoryStorage({ 'wordventure.infinite.run': JSON.stringify(bad) })
    expect(loadRun(0, storage)).toBeNull()
  })

  it('preserves difficulty and pool across a round-trip', () => {
    const { storage } = memoryStorage()
    const run = { ...midRun(), difficulty: 'hard' as const, pool: 3 }
    saveRun(run, 0, storage)
    const loaded = loadRun(0, storage)
    expect(loaded?.difficulty).toBe('hard')
    expect(loaded?.pool).toBe(3)
  })

  it('survives a null storage', () => {
    expect(loadRun(0, null)).toBeNull()
    expect(() => saveRun(midRun(), 0, null)).not.toThrow()
    expect(() => clearRun(0, null)).not.toThrow()
  })
})

describe('infinite save slots', () => {
  it('persists two runs independently across slots', () => {
    const { storage } = memoryStorage()
    const runA = { ...midRun(), pool: 5 }
    const runB = { ...midRun(), pool: 2, difficulty: 'hard' as const }
    saveRun(runA, 0, storage)
    saveRun(runB, 1, storage)
    expect(loadRun(0, storage)).toEqual(runA)
    expect(loadRun(1, storage)).toEqual(runB)
  })

  it('clearing one slot leaves the other intact', () => {
    const { storage } = memoryStorage()
    saveRun(midRun(), 0, storage)
    saveRun(midRun(), 1, storage)
    clearRun(0, storage)
    expect(loadRun(0, storage)).toBeNull()
    expect(loadRun(1, storage)).not.toBeNull()
  })

  it('an out-of-range slot is a safe no-op', () => {
    const { storage } = memoryStorage()
    expect(() => saveRun(midRun(), 5, storage)).not.toThrow()
    expect(loadRun(5, storage)).toBeNull()
    expect(() => clearRun(5, storage)).not.toThrow()
  })
})
