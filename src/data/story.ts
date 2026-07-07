/**
 * Story dressing for Adventure mode — the seam for the rival-company
 * narrative (open item in DESIGN.md). Placeholder lines for now: when the
 * real story gets written, only this file changes.
 */

import { balance } from './balance'

export const STORY_INTRO = `The Daily Word-Search is buying out your Wordle company! Beat all ${balance.adventure.levelCount} levels to save it from bankruptcy.`

/** Taunt shown before each boss, keyed by boss level number. */
const BOSS_TAUNTS: Record<string, string> = {
  '5': '"A word-search finds words without thinking. Can you?" — Junior Editor, The Daily Word-Search',
  '10': '"Our puzzles print themselves. Your little company is obsolete." — Circulation Manager',
  '15': '"Halfway? Adorable. The presses are already rolling." — Head of Puzzles',
  '20': '"I\'ve already measured your office for my corner desk." — Vice President',
  '25': '"One last word, then your company is MINE." — The Rival CEO',
}

const GENERIC_TAUNT = '"You won\'t get past this one." — The Daily Word-Search'

export function tauntForLevel(level: number): string {
  return BOSS_TAUNTS[String(level)] ?? GENERIC_TAUNT
}
