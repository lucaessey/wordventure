import { categories } from '../data/load'
import type { StorageLike } from '../storage/highScores'
import { buildEvalConfig, evaluate, type AchievementUnlock } from './evaluate'
import { emptyProgress, type AchievementEvent, type AchievementProgress } from './types'

const STORAGE_KEY = 'wordventure.achievements'

function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

/** Shape validation: an unrecognized save is discarded, never misread. */
function isValidProgress(value: unknown): value is AchievementProgress {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  const c = p.counters as Record<string, unknown> | undefined
  return (
    typeof p.earned === 'object' &&
    p.earned !== null &&
    typeof c === 'object' &&
    c !== null &&
    typeof c.gamesPlayed === 'number' &&
    typeof c.totalWins === 'number' &&
    typeof c.lifetimeAdventureCoins === 'number' &&
    Array.isArray(p.categoriesPlayed) &&
    Array.isArray(p.flagshipSolved) &&
    Array.isArray(p.modesWon) &&
    Array.isArray(p.daysPlayed)
  )
}

export function loadProgress(storage: StorageLike | null = defaultStorage()): AchievementProgress {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    const parsed: unknown = JSON.parse(raw)
    return isValidProgress(parsed) ? parsed : emptyProgress()
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(
  progress: AchievementProgress,
  storage: StorageLike | null = defaultStorage(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Private mode / quota — progress just does not persist
  }
}

type Subscriber = (unlocks: AchievementUnlock[]) => void
const subscribers = new Set<Subscriber>()

/** Subscribe to achievement unlocks (for the global toast). Returns an unsubscribe fn. */
export function subscribeToUnlocks(fn: Subscriber): () => void {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/** Local calendar day (YYYY-MM-DD) for day-based badges. */
export function todayString(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Record one gameplay event: load → evaluate → save → notify. Returns the badge
 * tiers newly unlocked (also delivered to subscribers for the toast).
 */
export function recordEvent(
  event: AchievementEvent,
  storage: StorageLike | null = defaultStorage(),
): AchievementUnlock[] {
  const config = buildEvalConfig(categories.map((c) => c.id))
  const { progress, unlocked } = evaluate(loadProgress(storage), event, config)
  saveProgress(progress, storage)
  if (unlocked.length > 0) {
    for (const fn of subscribers) fn(unlocked)
  }
  return unlocked
}
