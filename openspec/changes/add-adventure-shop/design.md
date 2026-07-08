## Context

Adventure core ships the run loop: lives-as-guesses, coin earning, bosses, save/resume. The shop is pure economy layered on that loop. DESIGN.md fixes the catalog and timing (hints mid-puzzle; everything else between levels) but leaves interpretation room on a few mechanics — pinned below. The run state is plain JSON snapshotted after every state change, so every new mechanic must live inside `AdventureRunState`.

## Goals / Non-Goals

**Goals:**

- All five purchases working with pure, tested engine transitions.
- Shop UI folded into the existing level-won overlay; hint button during play.
- Everything in the save snapshot; corrupt/old saves still discard cleanly.

**Non-Goals:**

- No balance tuning beyond first-guess values — playtesting starts when this lands.
- No story work beyond what exists.
- No cross-run persistence of any shop state ("permanent" upgrades are permanent within a run — everything resets on death, per the no-checkpoints rule).

## Decisions

### Interpretation calls (DESIGN.md ambiguities, pinned here)

- **"Premium charged every round"** → charged when each level begins (on `advanceLevel`), while a policy is owned. Affordable → coins −$2, covered for that level. Not affordable → coverage lapses for that level only; the premium is attempted again next level.
- **"First-ever purchase $10"** → per run: $10 until a policy has been consumed in this run, $20 for any repurchase after that (`everUsed` flag).
- **Revive scope** → dying mid-puzzle with active coverage revives with `reviveLives` (4) lives *on the same puzzle*, guesses intact, policy consumed. Advancing with 0 lives (the last-life-solve edge) also triggers a revive when covered — death is death. An explicit `revived` phase lets the UI show the moment before play resumes.
- **"Remove wrong letters"** hint → eliminates *all* letters that are neither in the answer nor already revealed as gray by guesses. Generous, but priced; tune in playtesting.
- **Skip mechanics** → bought between levels ("skip the next level"). The skipped level immediately counts as beaten with zero guesses used: no coins, but perk triggers fire (Perk A lives; Perk B's ≤N-guesses condition trivially holds at 0). The run returns to the shop state so purchases can chain, then advances past the skipped level. Next-level-is-boss disables the button.
- **Perk B credits** → "free hint every level beaten in ≤3 guesses" grants a hint credit at win time; credits accumulate and are spent before coins when using a hint.

### Engine: `shop` field on the run state + `src/engine/adventureShop.ts`

```ts
interface ShopState {
  insurance: { owned: boolean; covered: boolean; everUsed: boolean }
  permanentSlots: number          // earned by bosses, unspent
  perkA: 0 | 1 | 2                // none / bought / upgraded
  perkB: 0 | 1 | 2
  hintCredits: number
  hints: {                        // current level's hint effects, cleared on advance
    revealed: Array<{ position: number; letter: string }>
    contained: string[]
    eliminated: string[]
  }
}
```

New pure functions in `adventureShop.ts`: `buyLife`, `buyInsurance`, `buySkip`, `buyPerk`, `upgradePerk` (all requiring phase `level-won`), and `useHint(type)` (requiring `playing`; consumes a credit else coins; applies the hint effect with injected RNG). Each returns the state unchanged when preconditions fail (can't afford, no slot, boss next, nothing left to reveal) — the UI disables those buttons, and the engine stays safe regardless.

`adventure.ts` changes: `submitGuess` win applies Perk A lives and Perk B credit (threshold by perk level) and boss wins grant +1 permanent slot; death checks insurance (`owned && covered` → `revived` phase, lives = `reviveLives`, policy consumed, `everUsed` set); `advanceLevel` charges the premium and clears per-level hint state; `startRun` seeds an empty `shop`.

### Hint targeting

- *Reveal position*: uniform pick among positions not already green in any scored guess and not previously revealed.
- *Reveal contained letter*: uniform pick among answer letters not already known (no green/yellow score, not previously revealed/contained).
- All three no-op (and cost nothing) when there is nothing left to reveal/eliminate — the UI disables the option.

### Keyboard and board integration

`keyboardState` stays pure and unchanged; the run screen merges hint effects into the letter-state map before passing it to `Keyboard` (eliminated → gray, contained → yellow unless better). Revealed positions render as a hint strip above the board (e.g. tiles showing `3rd: E`) rather than pre-filling the input row — keeps the input model untouched.

### Shop UI

The level-won overlay grows into the shop: reward header, lives/coins status, then purchase rows (life, skip-with-next-level-preview, insurance with status line, perks section visible once the first boss falls, each row showing price and disabled reasons), and the Next Level button. During play: a hint button beside the board opens a three-option picker showing price or credits. Run strip gains a shield glyph when insured (solid = covered, hollow = lapsed).

### Balance additions (`adventure.shop`)

```json
"shop": {
  "lifePrice": 3,
  "hintPrice": 6,
  "skipPrice": 50,
  "insurance": { "firstPrice": 10, "rebuyPrice": 20, "premium": 2, "reviveLives": 4 },
  "perkA": { "price": 60, "upgradePrice": 80, "livesPerLevel": 1, "upgradedLivesPerLevel": 2 },
  "perkB": { "price": 60, "upgradePrice": 80, "guessThreshold": 3, "upgradedGuessThreshold": 4 }
}
```

## Risks / Trade-offs

- [Old saves become invalid (no `shop` field)] → `loadRun` validation rejects them → fresh campaign. Acceptable pre-release; no migration code.
- [Skip + perk interaction could be degenerate (buy skips to farm Perk A lives)] → $50 vs +1/+2 lives is a terrible trade next to $3 lives; if playtesting disagrees, it's all balance values.
- [Eliminate-wrong hint may trivialize short words] → Playtest lever: either price or scope; engine keeps the effect data-driven.
- [Shop overlay getting crowded on small screens] → Purchase rows scroll within the overlay panel; tested at 375px width.

## Open Questions

- All values are first guesses — the real playtesting begins when this lands (finally winnable!).
- Perk display names ("Perk A/B" are design labels; UI will say "Bonus Lives" / "Free Hints") — cosmetic, changeable anytime.
