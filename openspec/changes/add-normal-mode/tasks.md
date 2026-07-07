## 1. Balance config and data plumbing

- [x] 1.1 Create `src/data/balance.json` with `{ "normal": { "guessCount": 6 } }` and a typed accessor `src/data/balance.ts`; unit test that the accessor exposes `normal.guessCount`
- [x] 1.2 Extend `scripts/generate-words.ts` to also emit `src/data/categories/index.json` (array of `{ id, displayName, minLetters, maxLetters }`), regenerate data, and extend the data validation test to cover the index
- [x] 1.3 Create `src/data/load.ts`: `loadCategory(id)` and `loadDictionary(length)` via dynamic `import()` of the JSON files, plus a statically imported, typed category index export

## 2. Round engine

- [x] 2.1 Implement `src/engine/round.ts`: `RoundState` (answer, maxGuesses, submitted guesses with feedback, current input, status `playing | won | lost`) with pure functions `startRound`, `addLetter`, `removeLetter`, `submitGuess` (composes `validateGuess` + `scoreGuess`; invalid submit returns a rejection reason and consumes nothing)
- [x] 2.2 Unit-test the round module: letter entry bounds, win on correct guess, loss after maxGuesses, invalid guess costs nothing and keeps typed letters, no input accepted after the round ends

## 3. Play UI components

- [x] 3.1 Create `Board` and `Tile` components rendering `maxGuesses` rows from `RoundState` with green/yellow/gray feedback, current-row letters, and a CSS shake animation trigger for rejected guesses
- [x] 3.2 Create `Keyboard` component: A-Z + enter + backspace layout, key colors from the engine's `keyboardState`, and a `useEffect` `keydown` listener feeding the same dispatch as on-screen taps
- [x] 3.3 Create the game screen: wires round state + data loading (category words and dictionary bucket for the chosen length), invalid-guess message, win/lose overlay with answer reveal, play-again (new random word, same category/length) and home buttons

## 4. App shell

- [x] 4.1 Replace scaffold `App.tsx`/CSS with the Wordventure shell: screen state (`home | length-picker | game`), home screen rendering the category grid from `index.json`, and back navigation from every screen
- [x] 4.2 Create the length picker screen offering exactly the lengths present in the chosen category's buckets
- [x] 4.3 Style mobile-first with CSS custom properties: scrollable category grid, board + keyboard fitting a phone viewport, tile/shake animations honoring `prefers-reduced-motion`; remove unused scaffold assets
- [x] 4.4 Add `public/pwa-192x192.png` and `public/pwa-512x512.png` (simple letter-tile placeholder art) so the manifest declared in `vite.config.ts` is valid

## 5. Deploy

- [x] 5.1 Add `.github/workflows/deploy.yml`: on push to main - `npm ci`, `npm test`, `npm run build`, then `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages`; confirm the Vite `base` matches the actual GitHub repo name (adjust or derive from the repo variable)
- [ ] 5.2 Push to GitHub with Pages enabled (source: GitHub Actions) and verify the deployed URL loads, plays a full Normal game, and works offline on a second visit

## 6. Verification

- [x] 6.1 `npm test` green (round module, balance accessor, data index tests included) and `npm run build` clean
- [x] 6.2 Manual pass in the local preview: play wins and losses in multiple categories/lengths, confirm invalid-guess shake costs nothing, keyboard states correct, back navigation works
