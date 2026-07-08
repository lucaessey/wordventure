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
    /** Guess pool at the start of a run. */
    startingPool: number
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
    /** Lives at the start of a run — lives ARE guesses. */
    startingLives: number
    /** Boss level number → word length. Design-fixed; do not retune casually. */
    bossLevels: Record<string, number>
    /** Word lengths for the non-boss levels in campaign order. Tune in playtesting. */
    nonBossRamp: number[]
    /** Coins earned for beating a level / a boss. */
    rewards: {
      level: number
      boss: number
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
}

export const balance: Balance = balanceData
