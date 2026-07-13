## Context

Adventure has three difficulties (`AdventureDifficulty = 'easy' | 'normal' | 'hard'`) that vary only the starting position (lives + Easy's free perk), all read from `balance.json`. The run engine (`adventure.ts`) is pure and tested; `submitGuess` handles the win/lose/reward transitions and already reads per-difficulty values (`startingLives[difficulty]`, `bossReward[difficulty]`). The difficulty is on the run state and in the save. Extra Hard is a fourth difficulty that reuses Hard's setup and adds one new rule — a per-round life tax — so the engine change is a single, additive step keyed by difficulty.

## Goals / Non-Goals

**Goals:**

- Extra Hard selectable on the picker; identical to Hard except a per-round life tax.
- Tax charged at end of a completed round, floored at 1, never run-ending by itself.
- All values (starting lives, tax) in `balance.json`; tax tunable per difficulty.
- Stats tracked separately for Extra Hard, like the others.

**Non-Goals:**

- No change to the achievement tier system (no auto Tier IV; "on Hard" stays Hard).
- No change to economy, insurance, bosses, skips, shop, or other modes.
- No Extra-Hard-specific achievements (a possible later change).

## Decisions

### Balance shape

- `adventure.startingLives.extraHard = 4`, `adventure.startingPerks.extraHard = {}`, `adventure.bossReward.extraHard = 15` (extend the existing per-difficulty records).
- New `adventure.lifeTaxPerRound` — a per-difficulty record `{ easy: 0, normal: 0, hard: 0, extraHard: 1 }`. Making it per-difficulty (rather than a lone `extraHard` scalar) lets `submitGuess` read `config.lifeTaxPerRound[difficulty]` uniformly with no special-casing, and lets a future difficulty tax without new code. Provisional — tune in playtesting.

### Engine: apply the tax at round completion

`AdventureDifficulty` gains `'extraHard'`. In `submitGuess`, when a guess solves the level (the win branch that produces `level-won` or `victory`), after the existing reward/perk handling apply the tax:

```
const tax = state.config.lifeTaxPerRound[difficulty]
lives = lives > 0 ? Math.max(1, lives - tax) : lives
```

Placement notes:
- The tax is applied to the *post-winning-guess* life total, which is "the end of the round, after the level is completed." The level-won reward overlay then shows the post-tax lives.
- `lives > 0 ? … : lives` preserves Hard's last-life-solve behavior: a solve that spent the final life leaves 0 lives, the tax leaves it at 0, and `advanceLevel` ends the run as today. The floor-at-1 only protects life totals that were ≥1, so the tax alone never ends a run.
- For Easy/Normal/Hard the tax is 0, so `Math.max(1, lives - 0) = lives` (when lives ≥ 1) — a no-op. Existing difficulties are unaffected.
- Skips (`buySkip` in `adventureShop.ts`) are not routed through `submitGuess`, so a skipped level is not taxed (see open question).

### Save/resume

`difficulty` already round-trips through the save and its validator accepts any string difficulty; `'extraHard'` needs no storage change. Starting lives and the tax are config-derived, so a resumed Extra Hard run behaves identically.

### UI

`AdventureSetupScreen` gains a fourth difficulty chip. The existing chip blurbs are built from balance values; Extra Hard's blurb reads its starting lives and adds a "−1 life each round" note derived from `lifeTaxPerRound.extraHard` (no hardcoded text numbers). The run screen already shows the difficulty label; "Extra Hard" flows through unchanged.

### Achievements: type-only touch, tiers unchanged

`AdventureRunScreen` emits achievement events carrying `run.difficulty`, so the achievements `Difficulty` union must include `'extraHard'` to type-check. That is the *only* achievements change. The tier mapping (`difficultyTier`) is **not** extended: `'extraHard'` is absent from the adventure order `['easy','normal','hard']`, so it resolves to tier 0 and the evaluator's `tier > 0` guard means Extra Hard earns no difficulty-tiered Adventure badges — no Tier IV, and it does not earn Hard's Tier III. Non-tiered badges (Explorer, Champion, Rich, Regular) still count for Extra Hard because they are not difficulty-keyed. This satisfies "do not change the tiered system."

## Risks / Trade-offs

- [Tax floor resurrecting a 0-life solve] → Avoided by the `lives > 0 ? … : lives` guard; Hard's last-life-solve run-over is preserved. Covered by a test.
- [Existing difficulties accidentally taxed] → `lifeTaxPerRound` is 0 for easy/normal/hard and the max-with-1 is a no-op at those values; a test asserts a Hard win loses no extra life.
- [Adding a difficulty ripples into tests] → The `AdventureConfig` fixtures gain `lifeTaxPerRound` and `extraHard` keys; a compile error would surface any miss. The achievements union widening is inert for tiers.

## Open Questions

Carried from the proposal: (1) the last-life-solve interaction (proposed: run still ends, tax does not resurrect 0 lives); (2) whether a purchased skip is taxed (proposed: no). Both are provisional and localized (one guard / one call site) if you decide differently.
