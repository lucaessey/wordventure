## 1. Word list

- [x] 1.1 Author `scripts/wordlists/music.txt`: single-word music artist names and single-word song titles mixed together, 3–10 letters; single-word only (skip multi-word); write clean A–Z spellings (BEYONCE, PINK); favor durable/widely-recognized names with a few current ones; curated-complete, not padded

## 2. Generator

- [x] 2.1 Register `music` (displayName "Music", `minWords: 1`, `maxLength: 10`) in the category source list in `scripts/generate-words.ts`
- [x] 2.2 Run `npm run generate:words`; confirm `music.json` and a 12-entry `index.json` are emitted, the range is within 3–10, and it holds only single normalized tokens; verify the run is deterministic (rerun produces no diff)

## 3. Verification

- [x] 3.1 Update the data validation test to expect the twelve launch categories and add a Music range/token check (3–10, single uppercase A–Z tokens)
- [x] 3.2 `npm test` green and `npm run build` clean
- [x] 3.3 Manual preview pass: Music appears in the Normal category grid and the Infinite/Adventure theme pickers; play a quick round; then push to GitHub and verify the deployed app
