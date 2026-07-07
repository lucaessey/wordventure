import { describe, expect, it } from 'vitest'
import {
  emptyHighScores,
  loadHighScores,
  recordRun,
  saveHighScores,
  type StorageLike,
} from './highScores'

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
  }
}

describe('recordRun', () => {
  it('sets a new best and reports the record', () => {
    const { scores, newRecord } = recordRun(emptyHighScores(), 'medium', 5)
    expect(newRecord).toBe(true)
    expect(scores.byDifficulty.medium.bestLevel).toBe(5)
    expect(scores.byDifficulty.easy.bestLevel).toBe(0)
  })

  it('keeps the old best when the run is worse', () => {
    const first = recordRun(emptyHighScores(), 'easy', 7).scores
    const { scores, newRecord } = recordRun(first, 'easy', 3)
    expect(newRecord).toBe(false)
    expect(scores.byDifficulty.easy.bestLevel).toBe(7)
  })

  it('accumulates lifetime levels beaten across runs and difficulties', () => {
    let scores = emptyHighScores()
    scores = recordRun(scores, 'easy', 4).scores
    scores = recordRun(scores, 'hard', 2).scores
    scores = recordRun(scores, 'easy', 1).scores
    expect(scores.totalLevelsBeaten).toBe(7)
  })

  it('a zero-level run is never a record but still counts nothing', () => {
    const { scores, newRecord } = recordRun(emptyHighScores(), 'hard', 0)
    expect(newRecord).toBe(false)
    expect(scores.totalLevelsBeaten).toBe(0)
  })
})

describe('storage wrapper', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage()
    const scores = recordRun(emptyHighScores(), 'medium', 6).scores
    saveHighScores(scores, storage)
    expect(loadHighScores(storage)).toEqual(scores)
  })

  it('returns defaults when nothing is stored', () => {
    expect(loadHighScores(memoryStorage())).toEqual(emptyHighScores())
  })

  it('returns defaults on corrupt JSON', () => {
    const storage = memoryStorage({ 'wordventure.infinite.highScores': '{not json' })
    expect(loadHighScores(storage)).toEqual(emptyHighScores())
  })

  it('repairs partially valid data', () => {
    const storage = memoryStorage({
      'wordventure.infinite.highScores': '{"byDifficulty":{"easy":{"bestLevel":9}},"totalLevelsBeaten":"junk"}',
    })
    const scores = loadHighScores(storage)
    expect(scores.byDifficulty.easy.bestLevel).toBe(9)
    expect(scores.byDifficulty.hard.bestLevel).toBe(0)
    expect(scores.totalLevelsBeaten).toBe(0)
  })

  it('survives a null storage (unavailable localStorage)', () => {
    expect(loadHighScores(null)).toEqual(emptyHighScores())
    expect(() => saveHighScores(emptyHighScores(), null)).not.toThrow()
  })
})
