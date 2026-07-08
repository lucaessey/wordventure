## Why

Adventure core is live but nearly unwinnable by design: 4 lives for a 25-level campaign, with coins piling up and nothing to spend them on. This final change from the DESIGN.md sequence adds the economy's spending side — lives, hints, level skips, insurance, and permanent upgrades — turning Adventure into the winnable roguelite it was designed to be, and completing the game.

## What Changes

All prices and values below are balance.json entries (provisional — tune in playtesting):

- **Between-levels shop** on the level-won screen: buy +1 life ($3), skip the next level ($50), insurance, and permanent upgrades. Per DESIGN.md timing rules, only hints may be bought mid-puzzle.
- **Hints** ($6, type chosen at time of use, mid-puzzle): (a) reveal a correct letter in its position, (b) reveal a letter that is in the word, (c) remove wrong letters from the keyboard.
- **Level skips**: cannot skip boss levels; a skipped level pays no coin reward but counts as "beaten" for permanent-upgrade triggers.
- **Insurance**: first-ever purchase $10; a $2 premium is charged every level; if the premium can't be paid, coverage lapses for that level (death is final). Dying with active coverage revives you with 4 lives and consumes the policy; rebuying after use costs $20.
- **Permanent upgrades**: each boss beaten unlocks one purchase/upgrade slot. Perk A: +1 life every level beaten ($60), upgradable to +2 ($80). Perk B: a free hint for every level beaten in ≤3 guesses ($60), upgradable to ≤4 guesses ($80).
- Run state grows to carry shop state (insurance, perks, slots, hint credits, hint effects) — all inside the existing after-every-guess save snapshot. Old saves fail shape validation and are discarded (acceptable pre-release).

## Capabilities

### New Capabilities

- `adventure-shop`: The shop and its timing rules, life purchases, hints, level skips, insurance, and permanent upgrades.

### Modified Capabilities

- `adventure-core`: The "Lives are guesses" requirement gains the insurance exception — reaching 0 lives ends the run *unless* active coverage revives you.

## Impact

- New code: `src/engine/adventureShop.ts` (pure purchase/hint/skip/insurance/perk transitions + tests), shop and hint UI in the Adventure run screen.
- Modified code: `src/engine/adventure.ts` (`AdventureRunState` gains a `shop` field; win applies perk effects; death checks insurance; advance charges premiums), `adventureSave.ts` validation, `balance.json`/`balance.ts` (`adventure.shop` block), run-screen overlays, `Keyboard`/`keyboardState` merge for hint-eliminated letters.
- No new dependencies. Normal and Infinite untouched.
- This completes the five-change sequence from DESIGN.md.
