import { INFINITE_DIFFICULTIES, type InfiniteRunState } from '../engine/infinite'
import type { StorageLike } from './highScores'

/**
 * Infinite save/resume: the whole run state snapshots to a per-slot
 * localStorage key after every guess. The answer is stored in plain text —
 * cheatable via DevTools, which is fine for this project.
 *
 * There are two independent slots, each with its own key.
 */

const SLOT_KEYS = ['wordventure.infinite.run', 'wordventure.infinite.run.2'] as const

/** Number of independent Infinite save slots. */
export const SAVE_SLOTS = SLOT_KEYS.length

const PHASES = ['loading', 'playing', 'level-won', 'run-over', 'victory']
// Validated against the engine's own list so the two can never drift apart.
const DIFFICULTIES: readonly string[] = INFINITE_DIFFICULTIES

function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

/** Shape validation: a save we don't recognize is discarded, never misread. */
function isValidRun(value: unknown): value is InfiniteRunState {
  if (typeof value !== 'object' || value === null) return false
  const run = value as Record<string, unknown>
  const config = run.config as Record<string, unknown> | undefined
  return (
    typeof run.level === 'number' &&
    typeof run.pool === 'number' &&
    typeof run.levelsBeaten === 'number' &&
    typeof run.answer === 'string' &&
    typeof run.categoryId === 'string' &&
    Array.isArray(run.guesses) &&
    typeof run.input === 'string' &&
    typeof run.phase === 'string' &&
    PHASES.includes(run.phase) &&
    typeof run.difficulty === 'string' &&
    DIFFICULTIES.includes(run.difficulty) &&
    typeof config === 'object' &&
    config !== null &&
    typeof config.levelCount === 'number' &&
    typeof run.theme === 'object' &&
    run.theme !== null
  )
}

export function saveRun(
  run: InfiniteRunState,
  slot = 0,
  storage: StorageLike | null = defaultStorage(),
): void {
  const key = SLOT_KEYS[slot]
  if (!key) return
  try {
    storage?.setItem(key, JSON.stringify(run))
  } catch {
    // Private mode or quota — the run just is not resumable
  }
}

export function loadRun(
  slot = 0,
  storage: StorageLike | null = defaultStorage(),
): InfiniteRunState | null {
  const key = SLOT_KEYS[slot]
  if (!key) return null
  try {
    const raw = storage?.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidRun(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function clearRun(slot = 0, storage: StorageLike | null = defaultStorage()): void {
  const key = SLOT_KEYS[slot]
  if (!key) return
  try {
    storage?.removeItem?.(key)
  } catch {
    // Nothing to do
  }
}
