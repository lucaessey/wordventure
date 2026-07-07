/**
 * Infinite mode high scores, persisted to a single localStorage key.
 * Pure update logic (recordRun) is separated from the storage wrapper so it
 * can be unit-tested without a DOM.
 */

import type { Difficulty } from '../engine/infinite'

export interface HighScores {
  byDifficulty: Record<Difficulty, { bestLevel: number }>
  totalLevelsBeaten: number
}

const STORAGE_KEY = 'wordventure.infinite.highScores'

export function emptyHighScores(): HighScores {
  return {
    byDifficulty: {
      easy: { bestLevel: 0 },
      medium: { bestLevel: 0 },
      hard: { bestLevel: 0 },
    },
    totalLevelsBeaten: 0,
  }
}

export interface RunRecord {
  scores: HighScores
  /** True when this run set a new best level for its difficulty. */
  newRecord: boolean
}

/** Fold one finished run into the scores. `levelsBeaten` is this run's tally. */
export function recordRun(
  scores: HighScores,
  difficulty: Difficulty,
  levelsBeaten: number,
): RunRecord {
  const best = scores.byDifficulty[difficulty].bestLevel
  const newRecord = levelsBeaten > best
  return {
    scores: {
      byDifficulty: {
        ...scores.byDifficulty,
        [difficulty]: { bestLevel: Math.max(best, levelsBeaten) },
      },
      totalLevelsBeaten: scores.totalLevelsBeaten + levelsBeaten,
    },
    newRecord,
  }
}

/** Minimal Storage surface so tests can pass an in-memory stub. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

export function loadHighScores(storage: StorageLike | null = defaultStorage()): HighScores {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return emptyHighScores()
    const parsed = JSON.parse(raw) as HighScores
    const empty = emptyHighScores()
    // Merge over defaults so missing/corrupt fields fall back safely
    return {
      byDifficulty: {
        easy: { bestLevel: Number(parsed.byDifficulty?.easy?.bestLevel) || 0 },
        medium: { bestLevel: Number(parsed.byDifficulty?.medium?.bestLevel) || 0 },
        hard: { bestLevel: Number(parsed.byDifficulty?.hard?.bestLevel) || 0 },
      },
      totalLevelsBeaten: Number(parsed.totalLevelsBeaten) || empty.totalLevelsBeaten,
    }
  } catch {
    return emptyHighScores()
  }
}

export function saveHighScores(
  scores: HighScores,
  storage: StorageLike | null = defaultStorage(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(scores))
  } catch {
    // Private mode or quota — high scores just don't persist
  }
}
