import { describe, expect, it } from 'vitest'
import { loadProgress, recordEvent, saveProgress, subscribeToUnlocks, todayString } from './store'
import { emptyProgress, type AchievementEvent } from './types'
import type { StorageLike } from '../storage/highScores'

function memoryStorage(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial }
  const storage: StorageLike = {
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v
    },
    removeItem: (k) => {
      delete data[k]
    },
  }
  return { storage, data }
}

const normalAce: AchievementEvent = {
  type: 'word-solved',
  mode: 'normal',
  guessesUsed: 1,
  maxGuesses: 6,
  answerLength: 5,
  categoryId: 'original',
  hadYellow: false,
}

describe('achievements store', () => {
  it('returns empty progress when nothing is stored', () => {
    expect(loadProgress(memoryStorage().storage)).toEqual(emptyProgress())
  })

  it('round-trips progress', () => {
    const { storage } = memoryStorage()
    const p = emptyProgress()
    p.counters.totalWins = 3
    p.earned['first-win'] = [1]
    saveProgress(p, storage)
    expect(loadProgress(storage)).toEqual(p)
  })

  it('discards corrupt data', () => {
    expect(loadProgress(memoryStorage({ 'wordventure.achievements': '{oops' }).storage)).toEqual(emptyProgress())
  })

  it('discards wrong-shaped data', () => {
    const { storage } = memoryStorage({ 'wordventure.achievements': JSON.stringify({ earned: {} }) })
    expect(loadProgress(storage)).toEqual(emptyProgress())
  })

  it('recordEvent persists and returns new unlocks', () => {
    const { storage } = memoryStorage()
    const unlocked = recordEvent(normalAce, storage)
    expect(unlocked).toContainEqual({ id: 'ace', tier: 1 })
    expect(loadProgress(storage).earned['ace']).toEqual([1])
    // Re-recording surfaces nothing new
    expect(recordEvent(normalAce, storage)).toEqual([])
  })

  it('notifies subscribers on unlock', () => {
    const { storage } = memoryStorage()
    const seen: string[] = []
    const unsub = subscribeToUnlocks((unlocks) => seen.push(...unlocks.map((u) => u.id)))
    recordEvent(normalAce, storage)
    unsub()
    recordEvent({ ...normalAce, guessesUsed: 3 }, storage) // no new unlock after unsub anyway
    expect(seen).toContain('ace')
  })

  it('survives null storage', () => {
    expect(loadProgress(null)).toEqual(emptyProgress())
    expect(() => saveProgress(emptyProgress(), null)).not.toThrow()
  })

  it('todayString formats a local date', () => {
    expect(todayString(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
