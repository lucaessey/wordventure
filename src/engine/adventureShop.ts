import {
  applyPerkTriggers,
  isBossLevel,
  type AdventureRunState,
  type PerkLevel,
} from './adventure'

/**
 * Pure shop transitions. Every function returns the state unchanged when its
 * preconditions fail (wrong phase, can't afford, no slot, boss next, nothing
 * to reveal) — the UI disables those buttons, and the engine stays safe
 * regardless. Timing rules per DESIGN.md: hints mid-puzzle, everything else
 * only between levels (phase 'level-won').
 */

export function buyLife(state: AdventureRunState): AdventureRunState {
  const price = state.config.shop.lifePrice
  if (state.phase !== 'level-won' || state.coins < price) return state
  return { ...state, coins: state.coins - price, lives: state.lives + 1 }
}

/** Current insurance price: first purchase vs rebuy after a consumed policy. */
export function insurancePrice(state: AdventureRunState): number {
  const { firstPrice, rebuyPrice } = state.config.shop.insurance
  return state.shop.insurance.everUsed ? rebuyPrice : firstPrice
}

export function buyInsurance(state: AdventureRunState): AdventureRunState {
  const price = insurancePrice(state)
  if (state.phase !== 'level-won' || state.shop.insurance.owned || state.coins < price) return state
  // Coverage starts when the next level's premium is paid (charged on advance)
  return {
    ...state,
    coins: state.coins - price,
    shop: { ...state.shop, insurance: { ...state.shop.insurance, owned: true, covered: false } },
  }
}

export function canSkipNext(state: AdventureRunState): boolean {
  const next = state.level + 1
  return (
    state.phase === 'level-won' &&
    next <= state.config.levelCount &&
    !isBossLevel(state.config, next) &&
    state.coins >= state.config.shop.skipPrice
  )
}

/**
 * Skip the next level: no coin reward, but it counts as beaten for
 * permanent-upgrade triggers (Perk A lives; Perk B's threshold trivially
 * holds at 0 guesses). Returns to the shop so purchases can chain.
 */
export function buySkip(state: AdventureRunState): AdventureRunState {
  if (!canSkipNext(state)) return state
  const skipped: AdventureRunState = {
    ...state,
    coins: state.coins - state.config.shop.skipPrice,
    level: state.level + 1,
    lastReward: 0,
    guesses: [],
    input: '',
    answer: '',
  }
  return applyPerkTriggers(skipped, 0)
}

export type Perk = 'A' | 'B'

function perkState(state: AdventureRunState, perk: Perk): PerkLevel {
  return perk === 'A' ? state.shop.perkA : state.shop.perkB
}

function withPerk(state: AdventureRunState, perk: Perk, level: PerkLevel, price: number): AdventureRunState {
  return {
    ...state,
    coins: state.coins - price,
    shop: {
      ...state.shop,
      permanentSlots: state.shop.permanentSlots - 1,
      ...(perk === 'A' ? { perkA: level } : { perkB: level }),
    },
  }
}

export function buyPerk(state: AdventureRunState, perk: Perk): AdventureRunState {
  const price = perk === 'A' ? state.config.shop.perkA.price : state.config.shop.perkB.price
  if (
    state.phase !== 'level-won' ||
    state.shop.permanentSlots < 1 ||
    perkState(state, perk) !== 0 ||
    state.coins < price
  ) {
    return state
  }
  return withPerk(state, perk, 1, price)
}

export function upgradePerk(state: AdventureRunState, perk: Perk): AdventureRunState {
  const price =
    perk === 'A' ? state.config.shop.perkA.upgradePrice : state.config.shop.perkB.upgradePrice
  if (
    state.phase !== 'level-won' ||
    state.shop.permanentSlots < 1 ||
    perkState(state, perk) !== 1 ||
    state.coins < price
  ) {
    return state
  }
  return withPerk(state, perk, 2, price)
}

export type HintType = 'reveal-position' | 'reveal-contained' | 'eliminate-wrong'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** Answer positions already known green from guesses or prior hints. */
function knownPositions(state: AdventureRunState): Set<number> {
  const known = new Set<number>(state.shop.hints.revealed.map((r) => r.position))
  for (const { feedback } of state.guesses) {
    feedback.forEach((tile, i) => {
      if (tile === 'green') known.add(i)
    })
  }
  return known
}

/** Letters already known to be in the answer (green/yellow scores or hints). */
function knownContained(state: AdventureRunState): Set<string> {
  const known = new Set<string>([
    ...state.shop.hints.contained,
    ...state.shop.hints.revealed.map((r) => r.letter),
  ])
  for (const { word, feedback } of state.guesses) {
    feedback.forEach((tile, i) => {
      if (tile === 'green' || tile === 'yellow') known.add(word[i])
    })
  }
  return known
}

/** Wrong letters the player already knows about (gray-scored or eliminated). */
function knownAbsent(state: AdventureRunState): Set<string> {
  const known = new Set<string>(state.shop.hints.eliminated)
  const inAnswer = new Set(state.answer.split(''))
  for (const { word } of state.guesses) {
    for (const letter of word) {
      if (!inAnswer.has(letter)) known.add(letter)
    }
  }
  return known
}

/**
 * Use a hint of the chosen type. Free credits are spent before coins. Hints
 * only ever reveal information the player does not already have; when there
 * is nothing left for the chosen type, this is a no-op and nothing is charged.
 */
export function useHint(
  state: AdventureRunState,
  type: HintType,
  rng: () => number = Math.random,
): AdventureRunState {
  const price = state.config.shop.hintPrice
  const hasCredit = state.shop.hintCredits > 0
  if (state.phase !== 'playing' || (!hasCredit && state.coins < price)) return state

  let hints = state.shop.hints
  if (type === 'reveal-position') {
    const known = knownPositions(state)
    const candidates = state.answer
      .split('')
      .map((letter, position) => ({ letter, position }))
      .filter(({ position }) => !known.has(position))
    if (candidates.length === 0) return state
    const pick = candidates[Math.floor(rng() * candidates.length)]
    hints = { ...hints, revealed: [...hints.revealed, pick] }
  } else if (type === 'reveal-contained') {
    const known = knownContained(state)
    const candidates = [...new Set(state.answer.split(''))].filter((l) => !known.has(l))
    if (candidates.length === 0) return state
    const pick = candidates[Math.floor(rng() * candidates.length)]
    hints = { ...hints, contained: [...hints.contained, pick] }
  } else {
    const known = knownAbsent(state)
    const inAnswer = new Set(state.answer.split(''))
    const remaining = ALPHABET.filter((l) => !inAnswer.has(l) && !known.has(l))
    if (remaining.length === 0) return state
    hints = { ...hints, eliminated: [...hints.eliminated, ...remaining] }
  }

  return {
    ...state,
    coins: hasCredit ? state.coins : state.coins - price,
    shop: {
      ...state.shop,
      hintCredits: hasCredit ? state.shop.hintCredits - 1 : state.shop.hintCredits,
      hints,
    },
  }
}

/** Whether the given hint type has anything left to reveal (for UI disabling). */
export function hintAvailable(state: AdventureRunState, type: HintType): boolean {
  if (type === 'reveal-position') return knownPositions(state).size < state.answer.length
  if (type === 'reveal-contained') {
    return [...new Set(state.answer.split(''))].some((l) => !knownContained(state).has(l))
  }
  const known = knownAbsent(state)
  const inAnswer = new Set(state.answer.split(''))
  return ALPHABET.some((l) => !inAnswer.has(l) && !known.has(l))
}
