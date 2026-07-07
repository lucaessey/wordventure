# Project Context

## Purpose

Wordventure — a Wordle-derived progressive web app with three modes (Normal, Infinite, Adventure roguelite), built as a father-son project. The settled design lives in [DESIGN.md](../DESIGN.md) at the repo root; it is the source of truth for game rules and the planned change sequence.

## Tech Stack

- Vite + React + TypeScript
- PWA via `vite-plugin-pwa` (fully offline-capable)
- Unit tests with Vitest
- Deployed to GitHub Pages via GitHub Actions
- No backend, no accounts

## Project Conventions

### Architecture

- All game logic (guess validation, coloring, pool/lives/economy math) lives in **pure TypeScript modules** with Vitest unit tests, completely separate from React components. React is a thin view layer.
- Persistence is `localStorage` only.

### Balance values

- All tunable numbers (prices, payouts, pool sizes, guess counts, boss lengths, level counts) live in a single `src/data/balance.json`. **No magic numbers in code.** Specs reference named balance values rather than hard-coding numbers.
- All balance values are provisional and will be tuned in playtesting.

### Word data

- Static JSON files in `src/data/categories/`, generated at build/authoring time and committed to the repo. Never fetched from an API at runtime.
- Each category file: `{ id, displayName, minLetters, maxLetters, wordsByLength: { "4": [...], "5": [...] } }`.
- A shared English guess dictionary, bucketed by length (3–14 letters), from a public-domain word list.
- Valid guess rule (all modes): a guess is valid if it appears in the English dictionary OR the active category's word list (union). Answers are always drawn from the active category's list.

### Word normalization

- All words stored and compared as uppercase A–Z only.
- Multi-word or accented entries are normalized (strip spaces, hyphens, apostrophes, accents) or excluded if they contain digits or other characters.

## Planned change sequence

1. `add-word-data-and-guess-engine` — data schema, dictionaries, pure guess engine with tests. No UI.
2. `add-normal-mode` — first playable; includes app shell, home screen, and GitHub Pages deploy.
3. `add-infinite-mode`
4. `add-adventure-core` — run loop, lives, coins, bosses, save/resume.
5. `add-adventure-shop` — hints, insurance, permanent upgrades.

## Open items

Mark these as "tune in playtesting" where they appear in specs:

- Non-boss word-length ramp in Adventure.
- Story dressing (taunt lines from the rival company before bosses) — desired but not designed; leave a seam for it.
- All balance.json values.
