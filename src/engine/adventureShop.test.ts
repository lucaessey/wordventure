import { describe, expect, it } from 'vitest'
import {
  advanceLevel,
  emptyShop,
  resumePlay,
  startRun,
  submitGuess,
  type AdventureConfig,
  type AdventureRunState,
} from './adventure'
import { TEST_BOSS_REWARD, TEST_LIFE_TAX, TEST_SHOP, TEST_STARTING_LIVES, TEST_STARTING_PERKS } from './adventure.test'
import {
  buyInsurance,
  buyLife,
  buyPerk,
  buySkip,
  canSkipNext,
  hintAvailable,
  insurancePrice,
  upgradePerk,
  useHint,
} from './adventureShop'
// 6 levels, boss at 3. Non-boss lengths all 3 for simple fixtures.
const CONFIG: AdventureConfig = {
  levelCount: 6,
  startingLives: TEST_STARTING_LIVES,
  startingPerks: TEST_STARTING_PERKS,
  lifeTaxPerRound: TEST_LIFE_TAX,
  bossLevels: { '3': 5 },
  nonBossRamp: [3, 3, 3, 3, 3],
  rewards: { level: 10 },
  bossReward: TEST_BOSS_REWARD,
  shop: TEST_SHOP,
}

const CATEGORIES = [{ id: 'original', lengths: [3, 4, 5] }]
const DICTIONARY = ['CAT', 'DOG', 'FOX', 'RAT', 'BAT']

function baseState(overrides: Partial<AdventureRunState> = {}): AdventureRunState {
  return {
    config: CONFIG,
    difficulty: 'hard',
    theme: { kind: 'random' },
    level: 1,
    lives: 2,
    coins: 100,
    lastReward: 10,
    categoryId: 'original',
    answer: 'CAT',
    guesses: [],
    input: '',
    phase: 'level-won',
    shop: emptyShop(),
    ...overrides,
  }
}

function playing(overrides: Partial<AdventureRunState> = {}): AdventureRunState {
  return baseState({ phase: 'playing', ...overrides })
}

function guess(state: AdventureRunState, word: string) {
  let s = state
  for (const letter of word) s = { ...s, input: s.input + letter }
  return submitGuess(s, DICTIONARY, [])
}

describe('buyLife', () => {
  it('trades coins for a life between levels', () => {
    const state = buyLife(baseState())
    expect(state.lives).toBe(3)
    expect(state.coins).toBe(100 - TEST_SHOP.lifePrice)
  })

  it('refuses mid-puzzle and when broke', () => {
    expect(buyLife(playing())).toEqual(playing())
    const broke = baseState({ coins: TEST_SHOP.lifePrice - 1 })
    expect(buyLife(broke)).toBe(broke)
  })
})

describe('insurance', () => {
  it('first purchase costs firstPrice and starts uncovered', () => {
    const state = buyInsurance(baseState())
    expect(state.coins).toBe(100 - TEST_SHOP.insurance.firstPrice)
    expect(state.shop.insurance).toEqual({ owned: true, covered: false, everUsed: false })
  })

  it('cannot double-buy', () => {
    const insured = buyInsurance(baseState())
    expect(buyInsurance(insured)).toBe(insured)
  })

  it('rebuy after a consumed policy costs rebuyPrice', () => {
    const used = baseState({ shop: { ...emptyShop(), insurance: { owned: false, covered: false, everUsed: true } } })
    expect(insurancePrice(used)).toBe(TEST_SHOP.insurance.rebuyPrice)
    const rebought = buyInsurance(used)
    expect(rebought.coins).toBe(100 - TEST_SHOP.insurance.rebuyPrice)
  })

  it('advance charges the premium and covers the level', () => {
    const insured = buyInsurance(baseState())
    const advanced = advanceLevel(insured, CATEGORIES, () => 0)
    expect(advanced.level).toBe(2)
    expect(advanced.coins).toBe(100 - TEST_SHOP.insurance.firstPrice - TEST_SHOP.insurance.premium)
    expect(advanced.shop.insurance.covered).toBe(true)
  })

  it('an unaffordable premium lapses coverage without charging', () => {
    const insured = buyInsurance(baseState({ coins: TEST_SHOP.insurance.firstPrice + 1 }))
    const advanced = advanceLevel(insured, CATEGORIES, () => 0)
    expect(advanced.coins).toBe(1)
    expect(advanced.shop.insurance.covered).toBe(false)
    expect(advanced.shop.insurance.owned).toBe(true)
  })

  it('a covered death revives on the same puzzle and consumes the policy', () => {
    const covered = playing({
      lives: 1,
      shop: { ...emptyShop(), insurance: { owned: true, covered: true, everUsed: false } },
    })
    const { state } = guess(covered, 'DOG')
    expect(state.phase).toBe('revived')
    expect(state.lives).toBe(TEST_SHOP.insurance.reviveLives)
    expect(state.answer).toBe('CAT')
    expect(state.guesses).toHaveLength(1)
    expect(state.shop.insurance).toEqual({ owned: false, covered: false, everUsed: true })
    expect(resumePlay(state).phase).toBe('playing')
  })

  it('a lapsed death is final', () => {
    const lapsed = playing({
      lives: 1,
      shop: { ...emptyShop(), insurance: { owned: true, covered: false, everUsed: false } },
    })
    expect(guess(lapsed, 'DOG').state.phase).toBe('run-over')
  })

  it('advancing with 0 lives while covered revives into the next level', () => {
    const won = baseState({
      lives: 0,
      shop: { ...emptyShop(), insurance: { owned: true, covered: true, everUsed: false } },
    })
    const advanced = advanceLevel(won, CATEGORIES, () => 0)
    expect(advanced.phase).toBe('loading')
    expect(advanced.level).toBe(2)
    expect(advanced.lives).toBe(TEST_SHOP.insurance.reviveLives)
    expect(advanced.shop.insurance.owned).toBe(false)
    expect(advanced.shop.insurance.everUsed).toBe(true)
  })
})

describe('skip', () => {
  it('passes the next level with no reward but perk triggers', () => {
    const withPerks = baseState({ shop: { ...emptyShop(), perkA: 1, perkB: 1 } })
    const state = buySkip(withPerks)
    expect(state.level).toBe(2)
    expect(state.phase).toBe('level-won')
    expect(state.coins).toBe(100 - TEST_SHOP.skipPrice) // no coin reward for the skip
    expect(state.lastReward).toBe(0)
    expect(state.lives).toBe(2 + TEST_SHOP.perkA.livesPerLevel)
    expect(state.shop.hintCredits).toBe(1) // 0 guesses ≤ threshold
  })

  it('cannot skip into a boss level', () => {
    const beforeBoss = baseState({ level: 2 }) // next is boss level 3
    expect(canSkipNext(beforeBoss)).toBe(false)
    expect(buySkip(beforeBoss)).toBe(beforeBoss)
  })

  it('cannot skip when broke or mid-puzzle', () => {
    expect(buySkip(baseState({ coins: TEST_SHOP.skipPrice - 1 }))).toEqual(
      baseState({ coins: TEST_SHOP.skipPrice - 1 }),
    )
    expect(buySkip(playing())).toEqual(playing())
  })
})

describe('permanent upgrades', () => {
  it('a boss win grants a slot', () => {
    const bossLevel = playing({ level: 3, answer: 'CRANE', lives: 4 })
    let s = bossLevel
    for (const letter of 'CRANE') s = { ...s, input: s.input + letter }
    const { state } = submitGuess(s, ['CRANE'], [])
    expect(state.phase).toBe('level-won')
    expect(state.shop.permanentSlots).toBe(1)
    // baseState runs on Hard, so the boss pays the Hard rate
    expect(state.coins).toBe(100 + CONFIG.bossReward.hard)
  })

  it('buying a perk consumes a slot and coins', () => {
    const slotted = baseState({ shop: { ...emptyShop(), permanentSlots: 1 } })
    const state = buyPerk(slotted, 'A')
    expect(state.shop.perkA).toBe(1)
    expect(state.shop.permanentSlots).toBe(0)
    expect(state.coins).toBe(100 - TEST_SHOP.perkA.price)
  })

  it('no slot means no purchase, regardless of coins', () => {
    const noSlot = baseState({ coins: 1000 })
    expect(buyPerk(noSlot, 'A')).toBe(noSlot)
  })

  it('upgrade requires owning the perk and a slot', () => {
    const owned = baseState({ shop: { ...emptyShop(), perkB: 1, permanentSlots: 1 } })
    const upgraded = upgradePerk(owned, 'B')
    expect(upgraded.shop.perkB).toBe(2)
    expect(upgraded.coins).toBe(100 - TEST_SHOP.perkB.upgradePrice)
    const notOwned = baseState({ shop: { ...emptyShop(), permanentSlots: 1 } })
    expect(upgradePerk(notOwned, 'B')).toBe(notOwned)
  })

  it("buying Perk A is a no-op when it is already owned (e.g. Easy's free perk)", () => {
    // Easy-style start: Perk A owned, no slot spent
    const easyStart = baseState({ difficulty: 'easy', shop: { ...emptyShop(), perkA: 1 } })
    expect(buyPerk(easyStart, 'A')).toBe(easyStart)
  })

  it("upgrading Easy's free Perk A still needs a boss slot and $80", () => {
    // No slot yet → upgrade unavailable despite plenty of coins
    const noSlot = baseState({ difficulty: 'easy', coins: 1000, shop: { ...emptyShop(), perkA: 1 } })
    expect(upgradePerk(noSlot, 'A')).toBe(noSlot)
    // After a boss (one slot) with $80 → upgrade goes through normally
    const withSlot = baseState({ difficulty: 'easy', shop: { ...emptyShop(), perkA: 1, permanentSlots: 1 } })
    const upgraded = upgradePerk(withSlot, 'A')
    expect(upgraded.shop.perkA).toBe(2)
    expect(upgraded.shop.permanentSlots).toBe(0)
    expect(upgraded.coins).toBe(100 - TEST_SHOP.perkA.upgradePrice)
  })

  it('Perk A pays lives on a level win', () => {
    const perked = playing({ shop: { ...emptyShop(), perkA: 2 } })
    const { state } = guess(perked, 'CAT')
    // 2 lives - 1 guess + 2 upgraded perk lives
    expect(state.lives).toBe(2 - 1 + TEST_SHOP.perkA.upgradedLivesPerLevel)
  })

  it('Perk B pays a credit only within its threshold', () => {
    const perked = playing({ shop: { ...emptyShop(), perkB: 1 }, lives: 10 })
    // Waste 3 guesses, win on the 4th: over the base threshold of 3
    let state = perked
    for (const word of ['DOG', 'FOX', 'RAT']) state = guess(state, word).state
    const slow = guess(state, 'CAT').state
    expect(slow.shop.hintCredits).toBe(0)
    // Upgraded threshold of 4 catches the same pace
    const upgraded = guess(
      { ...state, shop: { ...state.shop, perkB: 2 } },
      'CAT',
    ).state
    expect(upgraded.shop.hintCredits).toBe(1)
  })
})

describe('hints', () => {
  it('reveal-position reveals an unknown position for coins', () => {
    const state = useHint(playing(), 'reveal-position', () => 0)
    expect(state.shop.hints.revealed).toEqual([{ position: 0, letter: 'C' }])
    expect(state.coins).toBe(100 - TEST_SHOP.hintPrice)
  })

  it('never repeats a known position', () => {
    let state = useHint(playing(), 'reveal-position', () => 0) // position 0
    state = useHint(state, 'reveal-position', () => 0) // rng 0 again → next candidate
    expect(state.shop.hints.revealed.map((r) => r.position).sort()).toEqual([0, 1])
  })

  it('reveal-contained skips letters already known from guesses', () => {
    // Guess DOG vs CAT: all gray. Guess BAT vs CAT: A green, T green → A, T known
    let state = playing({ lives: 10 })
    state = guess(state, 'BAT').state
    const hinted = useHint(state, 'reveal-contained', () => 0)
    expect(hinted.shop.hints.contained).toEqual(['C']) // only unknown letter left
  })

  it('eliminate-wrong removes all absent letters not already gray', () => {
    let state = playing({ lives: 10 })
    state = guess(state, 'DOG').state // D, O, G now known gray
    const hinted = useHint(state, 'eliminate-wrong', () => 0)
    expect(hinted.shop.hints.eliminated).toHaveLength(26 - 3 /* CAT */ - 3 /* DOG */)
    expect(hinted.shop.hints.eliminated).not.toContain('D')
    expect(hinted.shop.hints.eliminated).not.toContain('A')
  })

  it('a hint with nothing to reveal is a free no-op', () => {
    const allEliminated = useHint(playing(), 'eliminate-wrong', () => 0)
    const again = useHint(allEliminated, 'eliminate-wrong', () => 0)
    expect(again).toBe(allEliminated)
    expect(hintAvailable(allEliminated, 'eliminate-wrong')).toBe(false)
  })

  it('credits are spent before coins', () => {
    const credited = playing({ shop: { ...emptyShop(), hintCredits: 2 } })
    const state = useHint(credited, 'reveal-position', () => 0)
    expect(state.coins).toBe(100)
    expect(state.shop.hintCredits).toBe(1)
  })

  it('refuses when broke with no credits, or between levels', () => {
    const broke = playing({ coins: 0 })
    expect(useHint(broke, 'reveal-position', () => 0)).toBe(broke)
    const won = baseState()
    expect(useHint(won, 'reveal-position', () => 0)).toBe(won)
  })

  it('hints cost no lives', () => {
    const state = useHint(playing(), 'reveal-contained', () => 0)
    expect(state.lives).toBe(2)
  })
})

describe('hint state lifecycle', () => {
  it('clears hint effects on advance but keeps credits', () => {
    let state = playing({ shop: { ...emptyShop(), hintCredits: 3 } })
    state = useHint(state, 'reveal-position', () => 0)
    const won = guess(state, 'CAT').state
    const advanced = advanceLevel(won, CATEGORIES, () => 0)
    expect(advanced.shop.hints).toEqual({ revealed: [], contained: [], eliminated: [] })
    expect(advanced.shop.hintCredits).toBe(2)
  })

  it('startRun on Normal/Hard seeds an empty shop', () => {
    const run = startRun('hard', { kind: 'random' }, CATEGORIES, CONFIG, () => 0)
    expect(run.shop).toEqual(emptyShop())
  })
})
