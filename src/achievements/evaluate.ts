import { balance } from '../data/balance'
import {
  difficultyTier,
  type AchievementEvent,
  type AchievementProgress,
  type Mode,
} from './types'

/** Thresholds the evaluator needs, plus the full category list for "play every category". */
export interface EvalConfig {
  wordsmithLength: number
  aceGuesses: number
  infinite: { ascenderLevel: number; summiteerLevel: number; hoarderPool: number }
  collection: { gamesPlayed: number[]; totalWins: number[]; adventureCoins: number[] }
  loyalDays: number
  flagshipCategories: string[]
  allCategoryIds: string[]
}

export interface AchievementUnlock {
  id: string
  tier: number
}

export interface EvalResult {
  progress: AchievementProgress
  unlocked: AchievementUnlock[]
}

/** Build the evaluator config from balance.json plus the app's category ids. */
export function buildEvalConfig(allCategoryIds: string[]): EvalConfig {
  const a = balance.achievements
  return {
    wordsmithLength: a.wordsmithLength,
    aceGuesses: a.aceGuesses,
    infinite: { ...a.infinite },
    collection: {
      gamesPlayed: [...a.collection.gamesPlayed],
      totalWins: [...a.collection.totalWins],
      adventureCoins: [...a.collection.adventureCoins],
    },
    loyalDays: a.loyalDays,
    flagshipCategories: [...a.flagshipCategories],
    allCategoryIds,
  }
}

function clone(p: AchievementProgress): AchievementProgress {
  return {
    earned: Object.fromEntries(Object.entries(p.earned).map(([k, v]) => [k, [...v]])),
    counters: { ...p.counters },
    categoriesPlayed: [...p.categoriesPlayed],
    flagshipSolved: [...p.flagshipSolved],
    modesWon: [...p.modesWon],
    daysPlayed: [...p.daysPlayed],
  }
}

function addUnique<T>(arr: T[], value: T): void {
  if (!arr.includes(value)) arr.push(value)
}

/**
 * Fold one event into achievement progress. Pure: returns a new progress and
 * the badge tiers newly unlocked by this event. Re-earning is a no-op, so this
 * is safe to call repeatedly. All thresholds come from `config`.
 */
export function evaluate(
  progress: AchievementProgress,
  event: AchievementEvent,
  config: EvalConfig,
): EvalResult {
  const p = clone(progress)
  const unlocked: AchievementUnlock[] = []

  const earn = (id: string, tier = 1): void => {
    const tiers = p.earned[id] ?? (p.earned[id] = [])
    if (!tiers.includes(tier)) {
      tiers.push(tier)
      tiers.sort((x, y) => x - y)
      unlocked.push({ id, tier })
    }
  }
  const earnVolume = (id: string, value: number, thresholds: number[]): void => {
    thresholds.forEach((t, i) => {
      if (value >= t) earn(id, i + 1)
    })
  }

  switch (event.type) {
    case 'game-started': {
      p.counters.gamesPlayed++
      addUnique(p.daysPlayed, event.day)
      if (event.mode === 'normal' && event.categoryId) addUnique(p.categoriesPlayed, event.categoryId)
      if (
        config.allCategoryIds.length > 0 &&
        config.allCategoryIds.every((c) => p.categoriesPlayed.includes(c))
      ) {
        earn('play-every-category')
      }
      earnVolume('regular', p.counters.gamesPlayed, config.collection.gamesPlayed)
      if (p.daysPlayed.length >= config.loyalDays) earn('loyal')
      break
    }
    case 'word-solved': {
      p.counters.totalWins++
      addUnique(p.modesWon, event.mode)
      earnVolume('champion', p.counters.totalWins, config.collection.totalWins)
      if ((['normal', 'infinite', 'adventure'] as Mode[]).every((m) => p.modesWon.includes(m))) {
        earn('explorer')
      }
      if (event.mode === 'normal') {
        earn('first-win')
        if (event.guessesUsed <= config.aceGuesses) earn('ace')
        if (event.guessesUsed === event.maxGuesses) earn('clutch')
        if (!event.hadYellow) earn('purist')
        if (event.answerLength >= config.wordsmithLength) earn('wordsmith')
        if (event.categoryId && config.flagshipCategories.includes(event.categoryId)) {
          addUnique(p.flagshipSolved, event.categoryId)
          if (config.flagshipCategories.every((c) => p.flagshipSolved.includes(c))) {
            earn('solve-each-flagship')
          }
        }
      }
      break
    }
    case 'game-lost': {
      if (event.answerLength > 1 && event.lastGuessGreens === event.answerLength - 1) earn('oof')
      break
    }
    case 'level-reached': {
      const tier = difficultyTier('infinite', event.difficulty)
      if (tier > 0) {
        if (event.level >= config.infinite.ascenderLevel) earn('ascender', tier)
        if (event.level >= config.infinite.summiteerLevel) earn('summiteer', tier)
      }
      break
    }
    case 'pool-held': {
      const tier = difficultyTier('infinite', event.difficulty)
      if (tier > 0 && event.amount >= config.infinite.hoarderPool) earn('hoarder', tier)
      break
    }
    case 'boss-beaten': {
      const tier = difficultyTier('adventure', event.difficulty)
      if (tier > 0) earn('first-blood', tier)
      break
    }
    case 'coins-earned': {
      p.counters.lifetimeAdventureCoins += event.delta
      earnVolume('rich', p.counters.lifetimeAdventureCoins, config.collection.adventureCoins)
      break
    }
    case 'perks-maxed': {
      const tier = difficultyTier('adventure', event.difficulty)
      if (tier > 0) earn('tycoon', tier)
      break
    }
    case 'run-finished': {
      if (event.mode === 'infinite') {
        const tier = difficultyTier('infinite', event.difficulty)
        if (tier > 0 && event.won) earn('perfect-climb', tier)
      } else {
        const tier = difficultyTier('adventure', event.difficulty)
        if (tier > 0 && event.won) {
          earn('savior', tier)
          if (!event.boughtInsuranceEver) earn('ironman', tier)
          if (event.revivedAndWon) earn('phoenix', tier)
        }
      }
      break
    }
  }

  return { progress: p, unlocked }
}
