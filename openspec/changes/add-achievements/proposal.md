## Why

An achievements/badges system gives players goals beyond a single round and a reason to explore every mode, category, and difficulty. It's a natural fit for the existing event-rich gameplay: wins, level counts, boss kills, coins, and run outcomes are all already computed by the modes, so a badge layer can listen to them without touching the tested game engines. A Trophy Room surfaces the collection and makes progress visible.

## What Changes

- Add an **achievements** system: a catalog of badges tracked in localStorage, unlocked by events the game already fires (game won, guesses used, level reached, boss beaten, coins earned, run finished). No changes to the pure engines — the view layer emits achievement events at points where it already knows the outcome.
- Three achievement kinds: **single-tier**, **difficulty-tiered** (I/II/III), and **volume-tiered** (I/II/III), per the rules below.
- Ship the **starter set** across seven groups: Onboarding, Skill (both Normal-only), Explorer, Infinite, Adventure, Collection, and Fun (hidden).
- Add a **Trophy Room** screen listing all achievements (earned highlighted; locked with how-to-earn; tiered showing which of I/II/III are earned; hidden shown as "???" until unlocked), opened by a 🏆 icon in the home screen's top-left.
- Add an **unlock toast** shown on any screen when a badge is earned.
- All thresholds/amounts live in `balance.json` under a new `achievements` block (reusing existing values like `normal.guessCount`, `infinite.levelCount`, `adventure.levelCount` where they already exist).

### Difficulty-tiered rules

Tier I only on the mode's easiest difficulty, Tier II only on its middle, Tier III only on its hardest — **Infinite → Easy/Medium/Hard**, **Adventure → Easy/Normal/Hard**. Tiers do not stack (Hard earns Tier III only). Difficulty-locked feats stay single-tier.

### Volume-tiered rules

By amount: games played and total wins 10/50/100; lifetime Adventure coins 100/500/1000.

## Capabilities

### New Capabilities

- `achievements`: the catalog, event-driven tracking and persistence, the three kinds and tier rules, mode restrictions, hidden badges, the starter set, the Trophy Room contents, and the unlock toast.

### Modified Capabilities

- `app-shell`: the home screen gains the top-left 🏆 icon (not conflicting with any back button) and navigation to the Trophy Room.

## Impact

- New code: `src/data/achievements.ts` (catalog), `src/data/balance.json` `achievements` block, `src/achievements/` (pure evaluation engine + tests, and a localStorage store), a global unlock-toast component, `src/screens/TrophyRoomScreen.tsx`, and the 🏆 home entry point.
- Modified code (wiring only, no logic change): the Normal/Infinite/Adventure screens emit achievement events at existing outcome points; `App.tsx` gains the Trophy Room screen and the home trophy icon; `HomeScreen` renders the icon.
- No changes to gameplay, economy values, word data, or the pure engines. Scope is achievements + the Trophy Room only.

## Open Questions (please confirm during review)

1. **Infinite "Tier II" difficulty**: the difficulty-tiered rule names Tier II "Normal", but Infinite's middle difficulty is **Medium** (Infinite has no Normal). Proposed: Tier II = each mode's middle difficulty (Infinite Medium, Adventure Normal). DESIGN.md reflects this.
2. **Flagship categories** (Onboarding "Solve a word in each flagship category"): proposed default = the six original launch categories (Original, Pokemon, Minecraft, Brawl Stars, Animals, Countries), stored as a configurable list so it's not hardcoded. "Play every category once" covers all twelve.
3. **Tycoon "own every permanent upgrade at once"**: proposed = holding both Perk A and Perk B at their **max (upgraded) tier** simultaneously in one run.
4. **Oof "one letter away on your last guess"**: proposed = a loss whose final guess scored all-but-one letter green (length − 1 greens). Applies wherever a guess-based loss has a definable final guess (primarily Normal; also Infinite/Adventure when the pool/lives run out on such a guess).
5. **Collection scope**: Regular (games played) and Champion (total wins) count across all modes; Rich counts Adventure coins only. Confirm "games played" counts every round started (any mode).
