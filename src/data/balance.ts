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
}

export const balance: Balance = balanceData
