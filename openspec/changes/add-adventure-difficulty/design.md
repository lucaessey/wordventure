## Context

Adventure is feature-complete (core + shop, both implemented; the shop change is pending archive). DESIGN.md now defines three Adventure difficulties that vary only the starting position: lives (6/6/4) and Easy's free base-tier Perk A. Everything else — economy, insurance, bosses, skips, shop timing, slots — is explicitly identical across difficulties. The run state already snapshots wholesale to localStorage, and the engine's `startRun` already parameterizes everything this change touches.

## Goals / Non-Goals

**Goals:**

- Difficulty picker on the Adventure new-run screen; locked per run; in the save; resume bypasses the picker.
- Per-difficulty starting lives and Easy's free perk from balance.json.
- Free Perk A on Easy consumes no slot and upgrades normally.

**Non-Goals:**

- No difficulty-based scaling of prices, rewards, ramps, or boss lengths.
- No Adventure completion stats in this change — only the standing rule that any future stats are per-difficulty.
- No save migration (pre-release stance: old saves are discarded by validation).

## Decisions

### Difficulty type and naming

`AdventureDifficulty = 'easy' | 'normal' | 'hard'` in `adventure.ts` — deliberately its own type, not Infinite's `Difficulty` (`easy | medium | hard`): the middle tiers have different names, and the two modes' difficulties mean different things. UI labels: Easy / Normal / Hard with blurbs derived from balance values (starting lives, free perk).

### Balance shape

```json
"adventure": {
  "startingLives": { "easy": 6, "normal": 6, "hard": 4 },
  "startingPerks": { "easy": { "perkA": 1 }, "normal": {}, "hard": {} },
  ...
}
```

`startingLives` changes from a number to a per-difficulty record (breaking, internal). `startingPerks` maps difficulty → starting perk levels — expressed generally (a record of perk → tier) so playtesting can hand Easy other starters without schema changes. Insurance's `reviveLives` stays a single value (revive strength is not difficulty-scaled in the design).

### Engine

`startRun(difficulty, theme, categories, config?, rng?)` — difficulty becomes the first parameter and lands in `AdventureRunState.difficulty`. Seeding: `lives = config.startingLives[difficulty]`; `shop.perkA = config.startingPerks[difficulty]?.perkA ?? 0`. That is the *entire* engine change: the free perk is just a run that starts with `perkA: 1`, so the existing win-trigger and upgrade paths apply untouched. The no-slot rule falls out for free too — `permanentSlots` starts at 0 and `buyPerk`/`upgradePerk` never refund slots for pre-owned perks; a test pins that upgrading Easy's free perk still requires a boss slot plus $80, and that buying Perk A fresh on Easy is impossible (already owned).

### Save/resume

`difficulty` joins the validated fields in `adventureSave.ts` (string, one of the three). Old saves lack it → rejected → fresh campaign, consistent with every prior shape change. The Continue card adds the difficulty label so players know which run they're resuming; the picker only renders for new runs (Continue's path never touches it — already true structurally, since Continue passes the saved state straight to the run screen).

### UI

Setup screen: a difficulty chip row (same pattern as Infinite's) above the category options, defaulting to Normal; blurbs like "6 lives · free bonus-lives perk" / "6 lives" / "4 lives" built from balance values. Run screen: the header strip's level segment gains the difficulty (e.g. "Easy · Level 3/25") — small, always visible, no new chrome.

### Spec-delta sequencing

This change MODIFIES requirements that `add-adventure-shop`'s still-unsynced deltas also touch ("Lives are guesses") or create ("Permanent upgrades"). The deltas here are therefore written against the post-shop text, and `add-adventure-shop` MUST be archived/synced before this change is. (Both are implemented-in-order anyway; this just pins the archive order.)

## Risks / Trade-offs

- [Two similarly-named difficulty types (Infinite's and Adventure's) could confuse contributors] → Distinct type names, distinct modules, and the UI never mixes them; a comment on each points at the other.
- [Free Perk A on Easy weakens the shop's first big purchase decision] → Intended: Easy is for the younger player. Values are balance entries if playtesting says otherwise.
- [Another breaking save shape] → Same pre-release discard-on-validation stance as the shop change; after launch we'd need versioned saves, noted for the future.

## Open Questions

- Whether Normal's 6 lives makes Hard's 4 feel pointless or perfect — playtesting call; both are single balance numbers.
