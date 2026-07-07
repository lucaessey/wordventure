import { describe, expect, it } from 'vitest'
import { balance } from './balance'

describe('balance', () => {
  it('exposes the Normal mode guess count', () => {
    expect(balance.normal.guessCount).toBeGreaterThan(0)
    expect(Number.isInteger(balance.normal.guessCount)).toBe(true)
  })

  it('exposes the Infinite mode values', () => {
    const { levelCount, startLength, startingPool, rewards } = balance.infinite
    expect(levelCount).toBeGreaterThan(0)
    expect(startingPool).toBeGreaterThan(0)
    expect(rewards.easy).toBeGreaterThanOrEqual(rewards.medium)
    expect(rewards.medium).toBeGreaterThanOrEqual(rewards.hard)
    // The final level's word length must stay within the dictionary range (3-14)
    expect(startLength + levelCount - 1).toBeLessThanOrEqual(14)
  })
})
