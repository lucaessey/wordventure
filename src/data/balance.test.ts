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
    const {
      levelCount,
      startingLives,
      startingPerks,
      bossLevels,
      nonBossRamp,
      rewards,
      bossReward,
      lifeTaxPerRound,
      lifeTaxRamp,
    } = balance.adventure
    for (const difficulty of ['easy', 'normal', 'hard', 'extraHard', 'superHard'] as const) {
      expect(startingLives[difficulty]).toBeGreaterThan(0)
      // Starting perk tiers, when present, are valid perk levels (1 = base, 2 = upgraded)
      for (const tier of Object.values(startingPerks[difficulty])) {
        expect([1, 2]).toContain(tier)
      }
      // Boss reward is a positive per-difficulty value
      expect(bossReward[difficulty]).toBeGreaterThan(0)
    }
    // Extra Hard mirrors Hard's start and taxes a flat life each round via lifeTaxPerRound
    expect(startingLives.extraHard).toBe(startingLives.hard)
    expect(bossReward.extraHard).toBe(bossReward.hard)
    expect(lifeTaxPerRound.extraHard).toBeGreaterThan(0)
    expect(lifeTaxRamp.extraHard).toEqual([]) // flat tax, no ramp
    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      expect(lifeTaxPerRound[difficulty]).toBe(0)
      expect(lifeTaxRamp[difficulty]).toEqual([])
    }
    // Super Hard mirrors Hard's start but scales the tax up by level via lifeTaxRamp
    expect(startingLives.superHard).toBe(startingLives.hard)
    expect(bossReward.superHard).toBe(bossReward.hard)
    expect(lifeTaxPerRound.superHard).toBe(0) // ramp-driven, not flat
    const ramp = lifeTaxRamp.superHard
    expect(ramp.length).toBeGreaterThan(1)
    // Brackets ascend by throughLevel and by tax, and cover the full campaign
    for (let i = 1; i < ramp.length; i++) {
      expect(ramp[i].throughLevel).toBeGreaterThan(ramp[i - 1].throughLevel)
      expect(ramp[i].tax).toBeGreaterThan(ramp[i - 1].tax)
    }
    expect(ramp[0].tax).toBeGreaterThan(0)
    expect(ramp[ramp.length - 1].throughLevel).toBe(levelCount)
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

  it('exposes consistent achievement thresholds', () => {
    const a = balance.achievements
    expect(a.wordsmithLength).toBeGreaterThan(0)
    expect(a.aceGuesses).toBeGreaterThan(0)
    expect(a.infinite.summiteerLevel).toBeGreaterThan(a.infinite.ascenderLevel)
    expect(a.infinite.hoarderPool).toBeGreaterThan(0)
    expect(a.loyalDays).toBeGreaterThan(0)
    expect(a.flagshipCategories.length).toBeGreaterThan(0)
    // Volume tiers are ascending triples
    for (const tiers of [a.collection.gamesPlayed, a.collection.totalWins, a.collection.adventureCoins]) {
      expect(tiers).toHaveLength(3)
      expect(tiers[0]).toBeLessThan(tiers[1])
      expect(tiers[1]).toBeLessThan(tiers[2])
    }
  })
})
