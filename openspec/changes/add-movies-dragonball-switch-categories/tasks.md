## 1. Word lists

- [x] 1.1 Author `scripts/wordlists/movies-tv.txt`: single-word, kid/teen-recognizable screen titles, 4–10 letters, no multi-word titles (skip them); curated-complete, not padded
- [x] 1.2 Author `scripts/wordlists/dragon-ball.txt`: Dragon Ball character names, 3–10 letters, aiming 15+ per length where canonical names exist, otherwise include what exists
- [x] 1.3 Author `scripts/wordlists/nintendo-switch.txt`: single-word Switch game/franchise titles, 4–10 letters, single-word only; curated-complete, not padded

## 2. Generator

- [x] 2.1 Add an optional `minLength` to the generator's `CategorySource` in `scripts/generate-words.ts` (mirrors the existing `maxLength`); the bucket loop uses `max(MIN_LENGTH, minLength)` … `min(MAX_LENGTH, maxLength)`
- [x] 2.2 Register `movies-tv` (displayName "Movies & TV", `minWords: 1`, `minLength: 4`, `maxLength: 10`), `dragon-ball` (displayName "Dragon Ball", `minWords: 1`, `maxLength: 10`), and `nintendo-switch` (displayName "Nintendo Switch", `minWords: 1`, `minLength: 4`, `maxLength: 10`)
- [x] 2.3 Run `npm run generate:words`; confirm the three new JSON files and an 11-entry `index.json` are emitted, each category's range matches its declaration (Movies/Switch 4–10, Dragon Ball 3–10) and holds only single normalized tokens; verify the run is deterministic (rerun produces no diff)

## 3. Verification

- [x] 3.1 Update the data validation test to expect the eleven launch categories and confirm the existing schema/normalization/uppercase assertions cover the new files; add a check that the three new categories stay within their declared ranges
- [x] 3.2 `npm test` green and `npm run build` clean
- [x] 3.3 Manual preview pass: all three appear in the Normal category grid and the Infinite/Adventure theme pickers; play a quick round in each; then push to GitHub and verify the deployed app
