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
    const { levelCount, startingLives, startingPerks, bossLevels, nonBossRamp, rewards, bossReward } =
      balance.adventure
    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      expect(startingLives[difficulty]).toBeGreaterThan(0)
      // Starting perk tiers, when present, are valid perk levels (1 = base, 2 = upgraded)
      for (const tier of Object.values(startingPerks[difficulty])) {
        expect([1, 2]).toContain(tier)
      }
      // Boss reward is a positive per-difficulty value
      expect(bossReward[difficulty]).toBeGreaterThan(0)
    }
    expect(rewards.level).toBeGreaterThan(0)

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

  it('exposes a consistent Adventure shop shape', () => {
    const { lifePrice, hintPrice, skipPrice, insurance, perkA, perkB } = balance.adventure.shop
    for (const price of [lifePrice, hintPrice, skipPrice]) {
      expect(price).toBeGreaterThan(0)
    }
    expect(insurance.rebuyPrice).toBeGreaterThan(insurance.firstPrice)
    expect(insurance.premium).toBeGreaterThan(0)
    expect(insurance.reviveLives).toBeGreaterThan(0)
    expect(perkA.upgradedLivesPerLevel).toBeGreaterThan(perkA.livesPerLevel)
    expect(perkB.upgradedGuessThreshold).toBeGreaterThan(perkB.guessThreshold)
  })
})
