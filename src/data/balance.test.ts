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

  it('exposes a consistent Adventure campaign shape', () => {
    const { levelCount, startingLives, bossLevels, nonBossRamp, rewards } = balance.adventure
    expect(startingLives).toBeGreaterThan(0)
    expect(rewards.boss).toBeGreaterThan(rewards.level)

    const bossEntries = Object.entries(bossLevels)
    expect(bossEntries).toHaveLength(5)
    expect(nonBossRamp).toHaveLength(levelCount - bossEntries.length)

    for (const [level, length] of bossEntries) {
      expect(Number(level)).toBeGreaterThanOrEqual(1)
      expect(Number(level)).toBeLessThanOrEqual(levelCount)
      expect(length).toBeGreaterThanOrEqual(3)
      expect(length).toBeLessThanOrEqual(14)
    }
    for (const length of nonBossRamp) {
      expect(length).toBeGreaterThanOrEqual(3)
      expect(length).toBeLessThanOrEqual(14)
    }
  })
})
