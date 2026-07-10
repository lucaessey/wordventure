import type { AchievementDef } from '../achievements/types'
import { balance } from './balance'

const a = balance.achievements

/**
 * The badge catalog: static metadata only. Unlock criteria live in the pure
 * evaluator (keyed by id). Threshold numbers in the how-to text come from
 * balance.json so nothing is hardcoded here.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  // --- Onboarding (Normal only) --------------------------------------------
  { id: 'first-win', group: 'onboarding', kind: 'single', hidden: false, modeRestriction: 'normal', name: 'First win', howTo: 'Win your first Normal game.' },
  { id: 'play-every-category', group: 'onboarding', kind: 'single', hidden: false, modeRestriction: 'normal', name: 'Globetrotter', howTo: 'Start a game in every category.' },
  { id: 'solve-each-flagship', group: 'onboarding', kind: 'single', hidden: false, modeRestriction: 'normal', name: 'Flagship Scholar', howTo: 'Win a game in each flagship category.' },

  // --- Skill (Normal only) --------------------------------------------------
  { id: 'ace', group: 'skill', kind: 'single', hidden: false, modeRestriction: 'normal', name: 'Ace', howTo: `Win in ${a.aceGuesses} guess.` },
  { id: 'clutch', group: 'skill', kind: 'single', hidden: false, modeRestriction: 'normal', name: 'Clutch', howTo: 'Win on your final guess.' },
  { id: 'purist', group: 'skill', kind: 'single', hidden: false, modeRestriction: 'normal', name: 'Purist', howTo: 'Win with no yellow tiles.' },
  { id: 'wordsmith', group: 'skill', kind: 'single', hidden: false, modeRestriction: 'normal', name: 'Wordsmith', howTo: `Win a word of ${a.wordsmithLength}+ letters.` },

  // --- Explorer -------------------------------------------------------------
  { id: 'explorer', group: 'explorer', kind: 'single', hidden: false, name: 'Explorer', howTo: 'Win in every mode: Normal, Infinite, and Adventure.' },

  // --- Infinite (difficulty-tiered) ----------------------------------------
  { id: 'ascender', group: 'infinite', kind: 'difficulty-tiered', hidden: false, name: 'Ascender', howTo: `Reach level ${a.infinite.ascenderLevel} in Infinite.` },
  { id: 'summiteer', group: 'infinite', kind: 'difficulty-tiered', hidden: false, name: 'Summiteer', howTo: `Reach level ${a.infinite.summiteerLevel} in Infinite.` },
  { id: 'perfect-climb', group: 'infinite', kind: 'difficulty-tiered', hidden: false, name: 'Perfect Climb', howTo: `Clear all ${balance.infinite.levelCount} Infinite levels.` },
  { id: 'hoarder', group: 'infinite', kind: 'difficulty-tiered', hidden: false, name: 'Hoarder', howTo: `Hold ${a.infinite.hoarderPool}+ banked guesses at once.` },

  // --- Adventure (difficulty-tiered) ---------------------------------------
  { id: 'first-blood', group: 'adventure', kind: 'difficulty-tiered', hidden: false, name: 'First Blood', howTo: 'Beat your first boss.' },
  { id: 'savior', group: 'adventure', kind: 'difficulty-tiered', hidden: false, name: 'Savior', howTo: `Finish the campaign (beat level ${balance.adventure.levelCount}).` },
  { id: 'ironman', group: 'adventure', kind: 'difficulty-tiered', hidden: false, name: 'Ironman', howTo: 'Finish a run without ever buying insurance.' },
  { id: 'phoenix', group: 'adventure', kind: 'difficulty-tiered', hidden: false, name: 'Phoenix', howTo: 'Revive from insurance and go on to win the run.' },
  { id: 'tycoon', group: 'adventure', kind: 'difficulty-tiered', hidden: false, name: 'Tycoon', howTo: 'Own every permanent upgrade at once.' },

  // --- Collection (volume-tiered) ------------------------------------------
  { id: 'regular', group: 'collection', kind: 'volume-tiered', hidden: false, name: 'Regular', howTo: `Play ${a.collection.gamesPlayed.join(' / ')} games.` },
  { id: 'champion', group: 'collection', kind: 'volume-tiered', hidden: false, name: 'Champion', howTo: `Win ${a.collection.totalWins.join(' / ')} times.` },
  { id: 'rich', group: 'collection', kind: 'volume-tiered', hidden: false, name: 'Rich', howTo: `Bank ${a.collection.adventureCoins.join(' / ')} lifetime Adventure coins.` },

  // --- Fun (hidden) ---------------------------------------------------------
  { id: 'oof', group: 'fun', kind: 'single', hidden: true, name: 'Oof', howTo: 'Lose with the answer one letter away on your last guess.' },
  { id: 'loyal', group: 'fun', kind: 'single', hidden: true, name: 'Loyal', howTo: `Play on ${a.loyalDays} different days.` },
]

/** Display order of the groups in the Trophy Room. */
export const GROUP_ORDER: AchievementDef['group'][] = [
  'onboarding',
  'skill',
  'explorer',
  'infinite',
  'adventure',
  'collection',
  'fun',
]

export const GROUP_LABELS: Record<AchievementDef['group'], string> = {
  onboarding: 'Onboarding',
  skill: 'Skill',
  explorer: 'Explorer',
  infinite: 'Infinite',
  adventure: 'Adventure',
  collection: 'Collection',
  fun: 'Fun',
}
