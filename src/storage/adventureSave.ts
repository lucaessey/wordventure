import { ADVENTURE_DIFFICULTIES, type AdventureRunState } from '../engine/adventure'
import type { StorageLike } from './highScores'

/**
 * Adventure save/resume: the whole run state snapshots to a per-slot
 * localStorage key after every guess. The answer is stored in plain text —
 * cheatable via DevTools, which is fine for this project.
 *
 * There are two independent slots. Slot 0 keeps the original single-save key
 * so a pre-existing run appears as slot 1 with no migration; slot 1 uses a
 * new key.
 */

const SLOT_KEYS = ['wordventure.adventure.run', 'wordventure.adventure.run.2'] as const

/** Number of independent Adventure save slots. */
export const SAVE_SLOTS = SLOT_KEYS.length

const PHASES = ['loading', 'playing', 'level-won', 'revived', 'run-over', 'victory']
// Validated against the engine's own list so the two can never drift apart.
const DIFFICULTIES: readonly string[] = ADVENTURE_DIFFICULTIES

function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

/** Shape validation: a save we don't recognize is discarded, never misread. */
function isValidRun(value: unknown): value is AdventureRunState {
  if (typeof value !== 'object' || value === null) return false
  const run = value as Record<string, unknown>
  const config = run.config as Record<string, unknown> | undefined
  return (
    typeof run.level === 'number' &&
    typeof run.lives === 'number' &&
    typeof run.coins === 'number' &&
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
    Array.isArray(config.nonBossRamp) &&
    typeof run.theme === 'object' &&
    run.theme !== null &&
    isValidShop(run.shop)
  )
}

function isValidShop(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const shop = value as Record<string, unknown>
  const insurance = shop.insurance as Record<string, unknown> | undefined
  const hints = shop.hints as Record<string, unknown> | undefined
  return (
    typeof insurance === 'object' &&
    insurance !== null &&
    typeof insurance.owned === 'boolean' &&
    typeof insurance.covered === 'boolean' &&
    typeof insurance.everUsed === 'boolean' &&
    typeof shop.permanentSlots === 'number' &&
    typeof shop.perkA === 'number' &&
    typeof shop.perkB === 'number' &&
    typeof shop.hintCredits === 'number' &&
    typeof hints === 'object' &&
    hints !== null &&
    Array.isArray(hints.revealed) &&
    Array.isArray(hints.contained) &&
    Array.isArray(hints.eliminated)
  )
}

export function saveRun(
  run: AdventureRunState,
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
): AdventureRunState | null {
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
