## Context

Adventure now has four difficulties (`AdventureDifficulty = 'easy' | 'normal' | 'hard' | 'extraHard'`). Extra Hard added a flat per-round life tax read from `adventure.lifeTaxPerRound[difficulty]` and applied in `submitGuess` when a level is solved. Super Hard is a fifth difficulty that reuses Hard's setup but makes the tax *scale by level*. The engine (`adventure.ts`) is pure and tested; `submitGuess` already computes the tax at round completion and floors it at 1. The only genuinely new concept is a level-dependent tax amount.

## Goals / Non-Goals

**Goals:**

- Super Hard selectable on the picker; identical to Hard except a *scaling* per-round life tax (1 → 2 → 3 by level bracket).
- Tax charged at end of a completed round, floored at 1, never run-ending by itself (identical rule to Extra Hard).
- The scaling ramp lives in `balance.json`, tunable, with no magic numbers in code.
- Extra Hard's flat tax stays exactly as shipped.
- Stats tracked separately for Super Hard, like the others.

**Non-Goals:**

- No change to the achievement tier system (no auto Tier IV/V; "on Hard" stays Hard).
- No change to economy, insurance, bosses, skips, shop, or other modes.
- No Super-Hard-specific achievements (a possible later change).

## Decisions

### Balance shape — add a ramp alongside the flat tax

- Extend the existing per-difficulty records: `startingLives.superHard = 4`, `startingPerks.superHard = {}`, `bossReward.superHard = 15`, `lifeTaxPerRound.superHard = 0`.
- Add `adventure.lifeTaxRamp` — a per-difficulty record of level brackets, `Record<AdventureDifficulty, Array<{ throughLevel: number; tax: number }>>`. Existing difficulties get `[]`; Super Hard gets `[{throughLevel:10,tax:1},{throughLevel:17,tax:2},{throughLevel:25,tax:3}]`. Brackets are ascending by `throughLevel`.

Why a ramp record rather than reworking `lifeTaxPerRound`: it is purely additive. Extra Hard's flat tax is untouched, no existing fixture value changes meaning, and a future difficulty can pick either a flat tax or a ramp with no new engine code.

### Engine: resolve the tax by level

Add a pure helper:

```
export function roundLifeTax(config, difficulty, level): number {
  const ramp = config.lifeTaxRamp[difficulty]
  for (const b of ramp) if (level <= b.throughLevel) return b.tax
  if (ramp.length > 0) return ramp[ramp.length - 1].tax // hold the top rate past the last bracket
  return config.lifeTaxPerRound[difficulty]               // no ramp → flat tax
}
```

`submitGuess` replaces its `const tax = config.lifeTaxPerRound[difficulty]` with `const tax = roundLifeTax(config, difficulty, state.level)`. Everything downstream (the `applyTax` floor-at-1 helper, the victory and level-won branches, boss handling) is unchanged. The bracket is chosen by `state.level` — the level just completed — so completing level 10 taxes 1, level 11 taxes 2, level 18 taxes 3.

Placement/behavior notes:
- For Easy/Normal/Hard the ramp is `[]` and the flat tax is 0, so `roundLifeTax` returns 0 — an exact no-op, no behavior change.
- For Extra Hard the ramp is `[]` and the flat tax is 1 — identical to today.
- The floor-at-1 guard (`lives > 0 ? Math.max(1, lives - tax) : lives`) still preserves the last-life-solve run-over, even when the tax is 2 or 3.
- Skips are not routed through `submitGuess`, so a skipped level is not taxed (unchanged).

### Save/resume

`difficulty` already round-trips and the validator accepts any string; `'superHard'` needs no storage change. The ramp is config-derived, so a resumed Super Hard run behaves identically.

### UI

`AdventureSetupScreen` gains a fifth chip. The blurb helper reads balance: when a difficulty has a non-empty `lifeTaxRamp`, it shows the tax range (e.g. "−1–3 lives each round (scales up)") computed from the ramp's min/max tax; otherwise it falls back to the flat `−N life each round` note. `AdventureRunScreen`'s difficulty label map gains `superHard: 'Super Hard'`.

### Achievements: type-only touch, tiers unchanged

The achievements `Difficulty` union gains `'superHard'` so events carrying `run.difficulty` type-check. That is the *only* achievements change. `difficultyTier`'s adventure order stays `['easy','normal','hard']`, so `'superHard'` resolves to tier 0 and earns no difficulty-tiered Adventure badges (no Tier IV/V, and it does not earn Hard's Tier III). Non-tiered badges (Explorer, Champion, Rich, Regular) still count.

## Risks / Trade-offs

- [Tax range 2–3 ending a run] → The floor-at-1 guard clamps any tax to leave ≥1 life on a positive total; a test asserts finishing at 1 life with a tax-3 bracket stays at 1.
- [Bracket boundary off-by-one] → `level <= throughLevel` with ascending brackets makes 10→tax1, 11→tax2, 17→tax2, 18→tax3, 25→tax3; tests pin these boundaries.
- [Adding a difficulty ripples into fixtures] → `AdventureConfig` fixtures gain `lifeTaxRamp` and `superHard` keys; a compile error surfaces any miss.

## Open Questions

Resolved by the Extra Hard change: last-life-solve still ends the run (tax does not resurrect 0 lives); purchased skips are not taxed. Both remain localized if changed later.
