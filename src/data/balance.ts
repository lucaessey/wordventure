import balanceData from './balance.json'

/**
 * All tunable gameplay numbers live in balance.json (project convention: no
 * magic numbers in code). Values are provisional — tune in playtesting.
 */
export interface Balance {
  normal: {
    /** Fixed guesses per Normal game. */
    guessCount: number
  }
  infinite: {
    /** Levels per run; word length ramps one per level. */
    levelCount: number
    /** Word length at level 1. */
    startLength: number
    /** Guess pool at the start of a run, per difficulty. */
    startingPool: {
      easy: number
      medium: number
      hard: number
    }
    /** Pool guesses awarded for beating a level, per difficulty. */
    rewards: {
      easy: number
      medium: number
      hard: number
    }
  }
  adventure: {
    /** Campaign length. */
    levelCount: number
    /** Lives at the start of a run, per difficulty — lives ARE guesses. */
    startingLives: {
      easy: number
      normal: number
      hard: number
      extraHard: number
      superHard: number
    }
    /** Perk tiers a difficulty starts owning for free (no slot consumed). */
    startingPerks: {
      easy: { perkA?: number; perkB?: number }
      normal: { perkA?: number; perkB?: number }
      hard: { perkA?: number; perkB?: number }
      extraHard: { perkA?: number; perkB?: number }
      superHard: { perkA?: number; perkB?: number }
    }
    /** Flat lives lost at the end of each completed round, per difficulty (Extra Hard's tax). */
    lifeTaxPerRound: {
      easy: number
      normal: number
      hard: number
      extraHard: number
      superHard: number
    }
    /**
     * Level-scaled per-round life tax, per difficulty: an ascending list of
     * `{ throughLevel, tax }` brackets. A non-empty ramp overrides the flat
     * `lifeTaxPerRound`; an empty ramp falls back to it. (Super Hard's tax.)
     */
    lifeTaxRamp: {
      easy: Array<{ throughLevel: number; tax: number }>
      normal: Array<{ throughLevel: number; tax: number }>
      hard: Array<{ throughLevel: number; tax: number }>
      extraHard: Array<{ throughLevel: number; tax: number }>
      superHard: Array<{ throughLevel: number; tax: number }>
    }
    /** Boss level number → word length. Design-fixed; do not retune casually. */
    bossLevels: Record<string, number>
    /** Word lengths for the non-boss levels in campaign order. Tune in playtesting. */
    nonBossRamp: number[]
    /** Coins earned for beating a non-boss level (flat across difficulties). */
    rewards: {
      level: number
    }
    /** Coins earned for beating a boss, per difficulty. */
    bossReward: {
      easy: number
      normal: number
      hard: number
      extraHard: number
      superHard: number
    }
    shop: {
      lifePrice: number
      hintPrice: number
      skipPrice: number
      insurance: {
        /** First purchase in a run, before any policy has been consumed. */
        firstPrice: number
        /** Repurchase price after a policy has been consumed this run. */
        rebuyPrice: number
        /** Charged as each level begins while a policy is owned. */
        premium: number
        /** Lives granted by a covered revive. */
        reviveLives: number
      }
      perkA: {
        price: number
        upgradePrice: number
        livesPerLevel: number
        upgradedLivesPerLevel: number
      }
      perkB: {
        price: number
        upgradePrice: number
        guessThreshold: number
        upgradedGuessThreshold: number
      }
    }
  }
  /** Achievement thresholds — all tunable, no hardcoded numbers in badge logic. */
  achievements: {
    /** Wordsmith: win a word this long or longer. */
    wordsmithLength: number
    /** Ace: win in this many guesses. */
    aceGuesses: number
    infinite: {
      ascenderLevel: number
      summiteerLevel: number
      /** Hoarder: hold this many banked guesses at once. */
      hoarderPool: number
    }
    /** Volume-tier thresholds (I/II/III), ascending. */
    collection: {
      gamesPlayed: number[]
      totalWins: number[]
      adventureCoins: number[]
    }
    /** Loyal: play on this many distinct days. */
    loyalDays: number
    /** Category ids that count as "flagship" for the solve-each-flagship badge. */
    flagshipCategories: string[]
  }
}

export const balance: Balance = balanceData
