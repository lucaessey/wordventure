# Wordventure — Design Document

Wordventure is a Wordle-derived progressive web app, built as a father-son project. This document is settled and is the source of truth for the game's design.

## Technical conventions

- Stack: Vite + React + TypeScript. PWA via `vite-plugin-pwa`. Deployed to GitHub Pages via GitHub Actions.
- Architecture: all game logic (guess validation, coloring, pool/lives/economy math) lives in pure TypeScript modules with unit tests (Vitest), completely separate from React components. React is a thin view layer.
- All tunable numbers (prices, payouts, pool sizes, guess counts, boss lengths, level counts) live in a single `src/data/balance.json`. No magic numbers in code. Specs reference named balance values.
- Word data: static JSON files in `src/data/categories/`, generated at build/authoring time and committed to the repo. Never fetched from an API at runtime. The app is fully offline-capable.
- Persistence: `localStorage` only. No backend, no accounts.
- Word normalization: all words stored and compared as uppercase A–Z only. Multi-word or accented entries are normalized (strip spaces, hyphens, apostrophes, accents) or excluded if they contain digits or other characters.

## Word data model

- Each category file: `{ id, displayName, minLetters, maxLetters, wordsByLength: { "4": [...], "5": [...] } }`.
- Launch categories: Original, Pokemon, Minecraft, Brawl Stars, Animals, Countries, Food, Sports, Movies & TV, Dragon Ball, Nintendo Switch, Music. Each category has its own letter range based on what its word list can support (e.g., Brawl Stars might be 4–8; Original 4–14).
  - Food: broad mix of foods, dishes, fruits, vegetables, and snacks; generic only, no brands. Range 3–10 letters, 20+ words per length. Multi-word dishes are normalized to letters-only (e.g. HOTDOG) or excluded.
  - Sports: the activities themselves (SKI, GOLF, RUGBY, SOCCER, HOCKEY, LACROSSE), not teams. Naturally small; declared range 3–10, including every real entry rather than padding with obscure ones.
  - Movies & TV: single-word titles kids/teens actually recognize (FROZEN, MOANA, ENCANTO, BLUEY, WEDNESDAY, POKEMON). Skip multi-word titles rather than mashing them together. Range 4–10; naturally smaller — include real recognizable titles rather than padding with obscure films.
  - Dragon Ball: character names (GOKU, VEGETA, GOHAN, PICCOLO, FRIEZA, TRUNKS, CELL, BROLY, KRILLIN, BULMA). Range 3–10, 15+ per length where the source allows.
  - Nintendo Switch: Switch game titles and franchises as single words (MARIO, ZELDA, KIRBY, SPLATOON, METROID, PIKMIN, BAYONETTA). Single-word entries only. Range 4–10.
  - Music: single-word artist names (DRAKE, ADELE, EMINEM, QUEEN, ABBA, RIHANNA, BEYONCE, SIA, LORDE, USHER) and single-word song titles (HELLO, HALO, FLOWERS, THRILLER, ROAR, HUMBLE), mixed together. Single-word entries only — skip multi-word artists/titles rather than mashing them. Strip accents/apostrophes/punctuation (BEYONCÉ → BEYONCE, P!NK → PINK). Favor durable, widely recognized names over this-month's chart hits, with a few current ones mixed in. Range 3–10.
- A shared English guess dictionary, bucketed by length (3–14 letters), from a public-domain word list.
- Valid guess rule (all modes): a guess is valid if it appears in the English dictionary OR the active category's word list (union). Invalid guesses are rejected with a "not in word list" shake and do not consume a guess/life.
- Answers are always drawn from the active category's list.

## Guess engine (core, shared by all modes)

- Classic Wordle feedback: green (correct letter, correct position), yellow (in word, wrong position), gray (not in word), with standard duplicate-letter handling (a letter is only marked yellow/green as many times as it occurs in the answer).
- On-screen keyboard reflects best-known state per letter.
- Pure functions, fully unit-tested, no UI dependencies.

## Mode 1 — Normal

- Home screen: all categories as boxes in a scrollable grid.
- Player picks category, then word length within that category's range.
- Fixed 6 guesses. No daily word — every game draws a random word on demand. Unlimited replays.

## Mode 2 — Infinite

- 12 levels. Word length starts at 3 and increases by 1 per level, ending at 14.
- Banked guess pool: start with 4 guesses. Every guess made (any level) drains the pool. Beating a level adds guesses by difficulty: Easy +4, Medium +3, Hard +2. Run ends when the pool hits 0. The pool is the run's health bar: display it prominently at all times, and show a "+N guesses!" reward moment on level completion.
- Theme options: one fixed category, random category each level, or a custom subset of categories. Current category is always shown at the top of the screen. At high letter counts, only categories whose range supports that length are eligible; fall back to Original if none.
- High score: best level reached, tracked separately per difficulty. Also track lifetime total levels beaten.

## Mode 3 — Adventure (roguelite)

Theme: save your Wordle company from bankruptcy at the hands of a rival word-search magazine company.

- Campaign: 25 levels. Boss levels at 5, 10, 15, 20, 25 with word lengths 10, 11, 12, 13, 14. Level 25 is the final showdown. Non-boss word lengths: ramp upward across the campaign (exact ramp is a balance.json value, tune in playtesting).
- Lives ARE guesses: start with the difficulty's starting lives (see Difficulty modes); every guess spent subtracts one life. Reach 0 without insurance → run over → full restart from level 1. No checkpoints.
- Save/resume: full run state (difficulty, level, lives, coins, upgrades, insurance, current puzzle and guesses) snapshots to localStorage after EVERY guess.
- Category options: all categories mixed, one category, or a custom subset.

### Difficulty modes

Four difficulties, chosen when starting a new run:

- EASY: start with 6 lives. The player begins the run already owning permanent upgrade Perk A at its base tier (+1 life every level beaten), for free. This free perk does NOT consume a boss-unlock slot, and it CAN still be upgraded to +2 lives for $80 as normal once a slot is available.
- NORMAL: start with 6 lives. Everything else exactly as the original design (no free perks).
- HARD: the original design unchanged — start with 4 lives, no free perks.
- EXTRA HARD: identical to Hard in every way (start with 4 lives, guesses subtract lives, no free perks, boss reward $15) EXCEPT for a per-round life tax (below).

**Per-round life tax (Extra Hard only):** after finishing each round, the player loses 1 life. This applies to EVERY round, including boss rounds. The tax is charged at the END of the round, after the level is completed, not before. The tax cannot reduce the player below 1 life — it floors at 1: a player who finishes a round at 1 life keeps that 1 life and proceeds. The per-round tax by itself can never end a run; only spending the last life on a guess mid-puzzle ends a run (the last-life-solve rule, identical to Hard, is unchanged).

Rules that apply to all difficulties:

- Difficulty is locked for the duration of a run; it cannot be changed mid-run. It is stored in the run's save state.
- All other Adventure rules (economy, insurance, bosses, skips, shop timing, permanent unlock slots) are identical across difficulties. Extra Hard's only difference from Hard is the per-round life tax.
- Starting lives per difficulty, Easy's starting perk, and the per-round life tax are defined in balance.json (e.g. `adventure.startingLives.easy/normal/hard/extraHard`, `adventure.startingPerks.easy`, `adventure.lifeTaxPerRound.extraHard`), not hardcoded, so the tax amount can be tuned later.
- Any completion stats or records for Adventure are tracked per difficulty (including Extra Hard as its own difficulty), like Infinite mode's high scores.
- The difficulty picker appears on the Adventure new-run screen; resuming a saved run bypasses the picker.

Achievements are unchanged by Extra Hard: the difficulty-tiered achievement tiers stay Tier I = Easy, II = Normal, III = Hard — no Tier IV is auto-generated for Extra Hard, and "on Hard" difficulty-locked achievements remain about Hard. (Extra-Hard-specific achievements may be added later as a separate change.)

### Economy (all values in balance.json)

- Earn: +$10 per non-boss level beaten (same across all difficulties). Boss reward varies by difficulty (`adventure.bossReward.easy/normal/hard/extraHard`): Easy +$25, Normal +$20, Hard +$15, Extra Hard +$15.
- Buy: +1 life $3; hint $6; level skip $50.
- Skips: cannot skip boss levels; a skipped level pays no reward but counts as "beaten" for permanent-upgrade triggers.
- Hints ($6 each, player picks type at time of use): (a) reveal a correct letter in its position, (b) reveal a letter that is in the word, (c) remove wrong letters from the keyboard.
- Shop timing: hints may be bought mid-puzzle; everything else (lives, skips, insurance, permanents) only between levels.

### Insurance

- First-ever purchase: $10. Premium: $2 charged every round. If the premium can't be paid, coverage lapses for that round (death is final that round).
- On death with active coverage: revive with 4 lives; the policy is consumed. Rebuying after use costs $20.

### Permanent upgrades

- Unlock: each boss beaten unlocks one permanent purchase/upgrade slot.
- Perk A: +1 life every level beaten, $60. Upgrade: +2 lives per level, $80.
- Perk B: free hint every level beaten in ≤3 guesses, $60. Upgrade: trigger becomes ≤4 guesses, $80.

## Achievements & Trophy Room

A badge system that rewards milestones across all modes, viewed in a Trophy Room.

### System

- Achievements are tracked in `localStorage`, driven by events the game already produces (game won, guesses used, level reached, boss beaten, coins earned, run finished, etc.). No new game-engine logic — the pure engines are unchanged; the achievement tracker only listens to existing gameplay events emitted by the view layer.
- Three kinds of achievement: **single-tier**, **difficulty-tiered** (I/II/III), and **volume-tiered** (I/II/III).
- All thresholds/amounts live in `balance.json`, not hardcoded.

### Difficulty-tiered rules (Infinite and Adventure)

- Tier I is earned only on the mode's easiest difficulty, Tier II only on its middle difficulty, Tier III only on its hardest. Concretely: **Infinite → Easy / Medium / Hard**; **Adventure → Easy / Normal / Hard** (Infinite's middle tier is Medium, since Infinite has no "Normal").
- Tiers do NOT stack: doing the feat on the hardest difficulty earns Tier III only, not I and II. Each tier must be earned on its exact difficulty.
- An achievement already locked to a specific difficulty (e.g. "clear on Hard") stays single-tier with no tiers.

### Volume-tiered rules (Collection)

- Tiers are by amount, not difficulty: Tier I / II / III. Games played and total wins: 10 / 50 / 100. Lifetime Adventure coins: 100 / 500 / 1000.

### Mode restrictions

- Onboarding and Skill achievements can only be earned in Normal mode.
- Exception: "Win in every mode" is its own single-tier **Explorer** achievement, not part of Onboarding.

### Starter achievement set

**Onboarding** (Normal only, single-tier): First win; Play every category once; Solve a word in each flagship category.

**Skill** (Normal only, single-tier): Ace (win in 1 guess); Clutch (win on the final guess); Purist (win with no yellow tiles — every guess only green/gray); Wordsmith (win a 10+ letter word).

**Explorer** (single-tier): Win in every mode (Normal, Infinite, Adventure).

**Infinite** (difficulty-tiered I/II/III unless noted): Ascender (reach level 6); Summiteer (reach level 9); Perfect Climb (clear all 12 levels); Hoarder (hold 20+ banked guesses at once).

**Adventure** (difficulty-tiered I/II/III unless noted): First Blood (beat your first boss); Savior (finish the campaign — beat level 25); Ironman (finish a run without ever buying insurance); Phoenix (revive from insurance and go on to win the run); Tycoon (own every permanent upgrade at once).

**Collection** (volume-tiered I/II/III): Regular (games played 10/50/100); Champion (total wins 10/50/100); Rich (lifetime Adventure coins 100/500/1000).

**Fun** (single-tier, HIDDEN — shown as "???" until earned): Oof (lose with the answer one letter away on your last guess); Loyal (play on 7 different days).

### Trophy Room

- A trophy icon (🏆) sits in the TOP-LEFT of the home screen and opens the Trophy Room. It must not overlap or conflict with a back button or other top-left navigation: on screens where a back button occupies the top-left, the trophy icon is placed elsewhere or omitted there. The home screen is the primary place it appears.
- The Trophy Room is the achievements screen: it lists ALL achievements, earned and locked. Earned ones are highlighted; locked ones show their name and how to earn them; tiered ones show which tiers (I/II/III) are earned vs still locked; hidden ones show "???" until unlocked.
- A small toast/notification appears when an achievement unlocks, regardless of which screen the player is on.

## Planned OpenSpec change sequence

1. `add-word-data-and-guess-engine` — data schema, dictionaries, pure guess engine with tests. No UI.
2. `add-normal-mode` — first playable; includes app shell, home screen, and GitHub Pages deploy.
3. `add-infinite-mode`
4. `add-adventure-core` — run loop, lives, coins, bosses, save/resume.
5. `add-adventure-shop` — hints, insurance, permanent upgrades.
6. `add-adventure-difficulty` — Easy/Normal/Hard difficulty modes for Adventure.

## Open items (mark as "tune in playtesting" where they appear in specs)

- Non-boss word-length ramp in Adventure.
- Story dressing (taunt lines from the rival company before bosses) — desired but not designed; leave a seam for it.
- All balance.json values are provisional and will be tuned by playing.
