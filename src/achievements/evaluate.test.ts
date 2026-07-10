import { describe, expect, it } from 'vitest'
import { evaluate, type EvalConfig } from './evaluate'
import { emptyProgress, type AchievementEvent, type AchievementProgress } from './types'

const CONFIG: EvalConfig = {
  wordsmithLength: 10,
  aceGuesses: 1,
  infinite: { ascenderLevel: 6, summiteerLevel: 9, hoarderPool: 20 },
  collection: { gamesPlayed: [10, 50, 100], totalWins: [10, 50, 100], adventureCoins: [100, 500, 1000] },
  loyalDays: 7,
  flagshipCategories: ['original', 'pokemon', 'minecraft'],
  allCategoryIds: ['original', 'pokemon', 'minecraft', 'animals'],
}

/** Apply a sequence of events; return final progress and all unlocks seen. */
function run(events: AchievementEvent[], start = emptyProgress()) {
  let progress = start
  const unlocked: { id: string; tier: number }[] = []
  for (const event of events) {
    const result = evaluate(progress, event, CONFIG)
    progress = result.progress
    unlocked.push(...result.unlocked)
  }
  return { progress, unlocked }
}

const normalWin = (over: Partial<Extract<AchievementEvent, { type: 'word-solved' }>> = {}): AchievementEvent => ({
  type: 'word-solved',
  mode: 'normal',
  guessesUsed: 3,
  maxGuesses: 6,
  answerLength: 5,
  categoryId: 'original',
  hadYellow: true,
  ...over,
})

function earnedTiers(p: AchievementProgress, id: string): number[] {
  return p.earned[id] ?? []
}

describe('single-tier skill/onboarding badges (Normal only)', () => {
  it('first win', () => {
    const { unlocked } = run([normalWin()])
    expect(unlocked).toContainEqual({ id: 'first-win', tier: 1 })
  })

  it('Ace on a one-guess win, not otherwise', () => {
    expect(run([normalWin({ guessesUsed: 1 })]).progress.earned['ace']).toEqual([1])
    expect(earnedTiers(run([normalWin({ guessesUsed: 2 })]).progress, 'ace')).toEqual([])
  })

  it('Clutch on the final guess', () => {
    expect(run([normalWin({ guessesUsed: 6, maxGuesses: 6 })]).progress.earned['clutch']).toEqual([1])
  })

  it('Purist only with no yellow tiles', () => {
    expect(run([normalWin({ hadYellow: false })]).progress.earned['purist']).toEqual([1])
    expect(earnedTiers(run([normalWin({ hadYellow: true })]).progress, 'purist')).toEqual([])
  })

  it('Wordsmith at the balance length', () => {
    expect(run([normalWin({ answerLength: 10 })]).progress.earned['wordsmith']).toEqual([1])
    expect(earnedTiers(run([normalWin({ answerLength: 9 })]).progress, 'wordsmith')).toEqual([])
  })

  it('skill badges ignore non-Normal wins', () => {
    const { progress } = run([
      { type: 'word-solved', mode: 'infinite', difficulty: 'easy', guessesUsed: 1, maxGuesses: 6, answerLength: 5, categoryId: 'original', hadYellow: false },
    ])
    expect(earnedTiers(progress, 'ace')).toEqual([])
    expect(earnedTiers(progress, 'purist')).toEqual([])
    expect(earnedTiers(progress, 'first-win')).toEqual([])
  })

  it('solve each flagship category', () => {
    const { unlocked, progress } = run([
      normalWin({ categoryId: 'original' }),
      normalWin({ categoryId: 'pokemon' }),
      normalWin({ categoryId: 'animals' }), // non-flagship, does not complete
    ])
    expect(earnedTiers(progress, 'solve-each-flagship')).toEqual([])
    const done = run([normalWin({ categoryId: 'minecraft' })], progress)
    expect(done.unlocked).toContainEqual({ id: 'solve-each-flagship', tier: 1 })
    expect(unlocked).not.toContainEqual({ id: 'solve-each-flagship', tier: 1 })
  })
})

describe('play every category and Loyal (game-started)', () => {
  it('play every category once', () => {
    const start = (categoryId: string): AchievementEvent => ({ type: 'game-started', mode: 'normal', categoryId, day: '2026-01-01' })
    const { progress } = run([start('original'), start('pokemon'), start('minecraft')])
    expect(earnedTiers(progress, 'play-every-category')).toEqual([])
    const done = run([start('animals')], progress)
    expect(done.unlocked).toContainEqual({ id: 'play-every-category', tier: 1 })
  })

  it('Loyal after playing on the balance number of distinct days', () => {
    const events: AchievementEvent[] = Array.from({ length: 7 }, (_, i) => ({
      type: 'game-started',
      mode: 'normal',
      categoryId: 'original',
      day: `2026-01-0${i + 1}`,
    }))
    const { unlocked } = run(events)
    expect(unlocked).toContainEqual({ id: 'loyal', tier: 1 })
    // Same day repeated does not count
    const sameDay = run(Array.from({ length: 10 }, () => ({ type: 'game-started', mode: 'normal', categoryId: 'original', day: '2026-05-05' }) as AchievementEvent))
    expect(earnedTiers(sameDay.progress, 'loyal')).toEqual([])
  })
})

describe('Explorer', () => {
  it('unlocks after a win in all three modes', () => {
    const { progress } = run([
      normalWin(),
      { type: 'word-solved', mode: 'infinite', difficulty: 'easy', guessesUsed: 2, maxGuesses: 0, answerLength: 4, hadYellow: true },
    ])
    expect(earnedTiers(progress, 'explorer')).toEqual([])
    const done = run([{ type: 'word-solved', mode: 'adventure', difficulty: 'normal', guessesUsed: 2, maxGuesses: 0, answerLength: 5, hadYellow: true }], progress)
    expect(done.unlocked).toContainEqual({ id: 'explorer', tier: 1 })
  })
})

describe('difficulty-tiered badges (exact tier, non-stacking)', () => {
  it('Infinite Ascender: tier by difficulty, only the exact tier', () => {
    // Easy → tier 1
    expect(run([{ type: 'level-reached', difficulty: 'easy', level: 6 }]).progress.earned['ascender']).toEqual([1])
    // Medium → tier 2 only (not 1)
    expect(run([{ type: 'level-reached', difficulty: 'medium', level: 6 }]).progress.earned['ascender']).toEqual([2])
    // Hard → tier 3 only
    expect(run([{ type: 'level-reached', difficulty: 'hard', level: 6 }]).progress.earned['ascender']).toEqual([3])
  })

  it('below the level target earns nothing', () => {
    expect(earnedTiers(run([{ type: 'level-reached', difficulty: 'hard', level: 5 }]).progress, 'ascender')).toEqual([])
  })

  it('Hoarder by Infinite difficulty', () => {
    expect(run([{ type: 'pool-held', difficulty: 'medium', amount: 20 }]).progress.earned['hoarder']).toEqual([2])
    expect(earnedTiers(run([{ type: 'pool-held', difficulty: 'medium', amount: 19 }]).progress, 'hoarder')).toEqual([])
  })

  it('Adventure First Blood and Savior by difficulty', () => {
    expect(run([{ type: 'boss-beaten', difficulty: 'normal' }]).progress.earned['first-blood']).toEqual([2])
    expect(run([{ type: 'boss-beaten', difficulty: 'hard' }]).progress.earned['first-blood']).toEqual([3])
    expect(run([{ type: 'run-finished', mode: 'adventure', difficulty: 'easy', won: true }]).progress.earned['savior']).toEqual([1])
  })

  it('Ironman and Phoenix only under their conditions', () => {
    const clean = run([{ type: 'run-finished', mode: 'adventure', difficulty: 'hard', won: true, boughtInsuranceEver: false }]).progress
    expect(clean.earned['ironman']).toEqual([3])
    expect(earnedTiers(clean, 'phoenix')).toEqual([])
    const insured = run([{ type: 'run-finished', mode: 'adventure', difficulty: 'hard', won: true, boughtInsuranceEver: true, revivedAndWon: true }]).progress
    expect(earnedTiers(insured, 'ironman')).toEqual([])
    expect(insured.earned['phoenix']).toEqual([3])
  })

  it('Tycoon and Perfect Climb by difficulty', () => {
    expect(run([{ type: 'perks-maxed', difficulty: 'normal' }]).progress.earned['tycoon']).toEqual([2])
    expect(run([{ type: 'run-finished', mode: 'infinite', difficulty: 'hard', won: true }]).progress.earned['perfect-climb']).toEqual([3])
  })

  it('accumulates distinct tiers across difficulties without stacking', () => {
    const { progress } = run([
      { type: 'boss-beaten', difficulty: 'easy' },
      { type: 'boss-beaten', difficulty: 'hard' },
    ])
    expect(progress.earned['first-blood']).toEqual([1, 3]) // no tier 2
  })
})

describe('volume-tiered Collection badges', () => {
  it('Regular awards crossed tiers cumulatively', () => {
    const events: AchievementEvent[] = Array.from({ length: 50 }, (_, i) => ({ type: 'game-started', mode: 'normal', categoryId: 'original', day: `d${i}` }))
    const { progress } = run(events)
    expect(progress.earned['regular']).toEqual([1, 2]) // 10 and 50 crossed, not 100
  })

  it('Rich by lifetime Adventure coins (deltas accumulate)', () => {
    expect(run([{ type: 'coins-earned', delta: 100 }]).progress.earned['rich']).toEqual([1])
    // Accumulates across events
    expect(run([{ type: 'coins-earned', delta: 60 }, { type: 'coins-earned', delta: 50 }]).progress.earned['rich']).toEqual([1])
    expect(run([{ type: 'coins-earned', delta: 1000 }]).progress.earned['rich']).toEqual([1, 2, 3])
  })
})

describe('Fun (hidden) Oof', () => {
  it('unlocks on a last guess one letter away', () => {
    expect(run([{ type: 'game-lost', mode: 'normal', answerLength: 5, lastGuessGreens: 4 }]).progress.earned['oof']).toEqual([1])
    expect(earnedTiers(run([{ type: 'game-lost', mode: 'normal', answerLength: 5, lastGuessGreens: 3 }]).progress, 'oof')).toEqual([])
  })
})

describe('idempotency and thresholds', () => {
  it('re-earning is a no-op (no duplicate unlock)', () => {
    const first = run([normalWin({ guessesUsed: 1 })])
    const second = evaluate(first.progress, normalWin({ guessesUsed: 1 }), CONFIG)
    expect(second.unlocked).toEqual([])
    expect(second.progress.earned['ace']).toEqual([1])
  })

  it('reads thresholds from config (not hardcoded)', () => {
    const loose: EvalConfig = { ...CONFIG, wordsmithLength: 4 }
    const { progress } = { progress: evaluate(emptyProgress(), normalWin({ answerLength: 4 }), loose).progress }
    expect(progress.earned['wordsmith']).toEqual([1])
  })
})
