## 1. Word lists

- [x] 1.1 Author `scripts/wordlists/food.txt`: broad generic foods/dishes/fruits/vegetables/snacks, no brands, enough per length that after normalization each length 3–10 has 20+ entries (aim past 20 for margin); multi-word dishes written letters-only (HOTDOG, ICECREAM) or omitted
- [x] 1.2 Author `scripts/wordlists/sports.txt`: real athletic activities only (not teams), covering 3–10 letters, including every legitimate entry rather than padding

## 2. Generator

- [x] 2.1 Register `food` (displayName "Food") and `sports` (displayName "Sports") in the category source list in `scripts/generate-words.ts`
- [x] 2.2 Make the minimum-words-per-bucket threshold per-category so Sports keeps every real entry (low/zero threshold) while Food and the existing six keep the standard threshold; log any Sports buckets that fall below the usual bar rather than silently dropping them
- [x] 2.3 Run `npm run generate:words`; confirm `food.json`, `sports.json`, and an 8-entry `index.json` are emitted, Food has 20+ per length across 3–10, and Sports keeps its full curated set; verify the run is deterministic (rerun produces no diff)

## 3. Verification

- [x] 3.1 Update the data validation test to expect the eight launch categories (including Food and Sports) and confirm the existing schema/normalization/uppercase assertions cover the new files
- [x] 3.2 `npm test` green and `npm run build` clean
- [x] 3.3 Manual preview pass: Food and Sports appear in the Normal category grid and the Infinite/Adventure theme pickers; play a quick round in each; then push to GitHub and verify the deployed app
