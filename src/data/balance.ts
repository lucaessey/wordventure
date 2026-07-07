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
}

export const balance: Balance = balanceData
