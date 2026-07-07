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
- Launch categories: Original, Pokemon, Minecraft, Brawl Stars, Animals, Countries. Each category has its own letter range based on what its word list can support (e.g., Brawl Stars might be 4–8; Original 4–14).
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
- Lives ARE guesses: start with 4 lives; every guess spent subtracts one life. Reach 0 without insurance → run over → full restart from level 1. No checkpoints.
- Save/resume: full run state (level, lives, coins, upgrades, insurance, current puzzle and guesses) snapshots to localStorage after EVERY guess.
- Category options: all categories mixed, one category, or a custom subset.

### Economy (all values in balance.json)

- Earn: +$10 per level beaten, +$50 per boss beaten.
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

## Planned OpenSpec change sequence

1. `add-word-data-and-guess-engine` — data schema, dictionaries, pure guess engine with tests. No UI.
2. `add-normal-mode` — first playable; includes app shell, home screen, and GitHub Pages deploy.
3. `add-infinite-mode`
4. `add-adventure-core` — run loop, lives, coins, bosses, save/resume.
5. `add-adventure-shop` — hints, insurance, permanent upgrades.

## Open items (mark as "tune in playtesting" where they appear in specs)

- Non-boss word-length ramp in Adventure.
- Story dressing (taunt lines from the rival company before bosses) — desired but not designed; leave a seam for it.
- All balance.json values are provisional and will be tuned by playing.
