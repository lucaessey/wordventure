## Context

Adventure's coin economy currently pays `adventure.rewards.level` ($10) for a non-boss level and a flat `adventure.rewards.boss` ($50) for a boss, both from `AdventureConfig`. The engine's `submitGuess` reads `state.config.rewards.boss` on a boss win. The run state already carries the chosen `difficulty` (from the difficulty-modes change), so a per-difficulty boss reward needs no new state — only a difficulty-keyed lookup. Playtesting flagged the flat $50 as too rich mid-game.

## Goals / Non-Goals

**Goals:**

- Boss reward varies by Adventure difficulty (Easy $25 / Normal $20 / Hard $15), from balance.json.
- The flat $50 boss reward is removed entirely — no fallback, no dual source.
- Non-boss level reward stays $10, identical across difficulties.

**Non-Goals:**

- No change to boss placement, word lengths, skip rules, slot unlocks, or perk triggers.
- No change to the non-boss reward or any other economy value (life/hint/skip prices, insurance, perks).
- No change to the other modes.

## Decisions

### Balance shape

Add a top-level `adventure.bossReward` keyed by difficulty, matching the requested path `adventure.bossReward.easy/normal/hard`:

```json
"adventure": {
  ...
  "rewards": { "level": 10 },
  "bossReward": { "easy": 25, "normal": 20, "hard": 15 },
  ...
}
```

`adventure.rewards.boss` is removed. `adventure.rewards` keeps only `level` (kept as-is rather than folded into `bossReward` so the non-boss reward's balance path is unchanged and the diff stays minimal). Values are provisional — tune in playtesting.

### Engine

`AdventureConfig` in `adventure.ts` drops `rewards.boss` and gains `bossReward: Record<AdventureDifficulty, number>`. In `submitGuess`, the boss branch changes from `state.config.rewards.boss` to `state.config.bossReward[state.difficulty]`. That is the entire logic change — `difficulty` is already on the run state, and the reward is applied exactly where it is today (added to coins, set as `lastReward` for the win overlay). Non-boss wins continue to use `state.config.rewards.level`.

### Tests

- `AdventureConfig` fixtures in `adventure.test.ts` and `adventureShop.test.ts` (`rewards: { level, boss }`) become `rewards: { level }` + `bossReward: { easy, normal, hard }`. Existing boss-win assertions that expect `+50` are updated to the fixture's per-difficulty value for the run's difficulty (the fixtures run on `'hard'` in most cases — the assertions follow the fixture values, not the production numbers).
- Add an engine test asserting a boss win pays the difficulty-appropriate amount (e.g. an Easy run's boss pays `bossReward.easy`, a Hard run's pays `bossReward.hard`).
- `balance.test.ts`: the current `rewards.boss > rewards.level` assertion is replaced with checks that `bossReward` has all three difficulties as positive numbers and that `rewards.level` is positive.

## Risks / Trade-offs

- [Removing `rewards.boss` breaks any reference to it] → Only `adventure.ts` and the tests reference it; all are updated in this change. A compile error would surface any missed reference immediately.
- [Asymmetric shape (`rewards.level` scalar vs `bossReward` map)] → Accepted to keep the requested `adventure.bossReward.*` path and a minimal diff; the non-boss reward is genuinely flat across difficulties so it doesn't need a map.
- [Economy rebalance downstream] → Lowering boss income (from $50 to $15–25) tightens the mid-game; this is the intent. Other prices are unchanged, so nothing else needs to move now — further tuning happens by playing.

## Open Questions

- The three values ($25/$20/$15) are provisional balance numbers, tuned by playing — the spec pins the mechanic (per-difficulty, from `adventure.bossReward`), not the exact amounts.
