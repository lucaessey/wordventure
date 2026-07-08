import type { AdventureRunState } from '../engine/adventure'
import type { StorageLike } from './highScores'

/**
 * Adventure save/resume: the whole run state snapshots to one localStorage
 * key after every guess. The answer is stored in plain text — cheatable via
 * DevTools, which is fine for this project.
 */

const STORAGE_KEY = 'wordventure.adventure.run'

const PHASES = ['loading', 'playing', 'level-won', 'revived', 'run-over', 'victory']

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
  storage: StorageLike | null = defaultStorage(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(run))
  } catch {
    // Private mode or quota — the run just is not resumable
  }
}

export function loadRun(storage: StorageLike | null = defaultStorage()): AdventureRunState | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidRun(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function clearRun(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem?.(STORAGE_KEY)
  } catch {
    // Nothing to do
  }
}
