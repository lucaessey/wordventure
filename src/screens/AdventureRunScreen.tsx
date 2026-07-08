import { useCallback, useEffect, useReducer } from 'react'
import { categories, loadCategory, loadDictionary } from '../data/load'
import { tauntForLevel } from '../data/story'
import {
  addLetter,
  advanceLevel,
  beginLevel,
  isBossLevel,
  lengthForLevel,
  removeLetter,
  resumePlay,
  submitGuess,
  type AdventureDifficulty,
  type AdventureRunState,
} from '../engine/adventure'
import {
  buyInsurance,
  buyLife,
  buyPerk,
  buySkip,
  canSkipNext,
  hintAvailable,
  insurancePrice,
  upgradePerk,
  useHint,
  type HintType,
  type Perk,
} from '../engine/adventureShop'
import type { CategoryOption } from '../engine/categoryTheme'
import { keyboardState } from '../engine/keyboardState'
import type { Category, LetterState } from '../engine/types'
import { clearRun, saveRun } from '../storage/adventureSave'
import { Board } from '../components/Board'
import { Keyboard } from '../components/Keyboard'

interface AdventureRunScreenProps {
  /** A fresh run from the setup screen, or a restored save. */
  initialRun: AdventureRunState
  onHome: () => void
  onNewRun: () => void
}

const REJECTION_MESSAGES = {
  'not-in-word-list': 'Not in word list',
  'wrong-length': 'Not enough letters',
}

const DIFFICULTY_LABELS: Record<AdventureDifficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
}

const CATEGORY_OPTIONS: CategoryOption[] = categories.map(({ id, lengths }) => ({ id, lengths }))

const ORDINALS = ['th', 'st', 'nd', 'rd']
function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : (ORDINALS[n % 10] ?? 'th')
  return `${n}${suffix}`
}

interface LevelData {
  category: Category
  dictionary: string[]
}

interface UiState {
  run: AdventureRunState
  data: LevelData | null
  message: string | null
  shakeToken: number
  bossIntro: boolean
  hintPicker: boolean
}

type UiAction =
  | { type: 'level-ready'; data: LevelData; roll: number }
  | { type: 'key'; key: string }
  | { type: 'advance'; roll: number }
  | { type: 'buy-life' }
  | { type: 'buy-insurance' }
  | { type: 'buy-skip' }
  | { type: 'buy-perk'; perk: Perk }
  | { type: 'upgrade-perk'; perk: Perk }
  | { type: 'use-hint'; hint: HintType; roll: number }
  | { type: 'hint-picker'; show: boolean }
  | { type: 'resume-play' }
  | { type: 'dismiss-boss-intro' }
  | { type: 'clear-message' }

function reducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'level-ready': {
      const run = beginLevel(state.run, action.data.category, () => action.roll)
      // Taunt only when the boss puzzle starts fresh — not when resuming mid-fight
      const bossIntro = isBossLevel(run.config, run.level) && run.guesses.length === 0
      return { ...state, data: action.data, run, message: null, shakeToken: 0, bossIntro }
    }
    case 'advance':
      return {
        ...state,
        run: advanceLevel(state.run, CATEGORY_OPTIONS, () => action.roll),
        data: null,
      }
    case 'buy-life':
      return { ...state, run: buyLife(state.run) }
    case 'buy-insurance':
      return { ...state, run: buyInsurance(state.run) }
    case 'buy-skip':
      return { ...state, run: buySkip(state.run) }
    case 'buy-perk':
      return { ...state, run: buyPerk(state.run, action.perk) }
    case 'upgrade-perk':
      return { ...state, run: upgradePerk(state.run, action.perk) }
    case 'use-hint':
      return { ...state, run: useHint(state.run, action.hint, () => action.roll), hintPicker: false }
    case 'hint-picker':
      return { ...state, hintPicker: action.show }
    case 'resume-play':
      return { ...state, run: resumePlay(state.run) }
    case 'dismiss-boss-intro':
      return { ...state, bossIntro: false }
    case 'clear-message':
      return { ...state, message: null }
    case 'key': {
      const { run, data } = state
      if (!data || state.bossIntro || state.hintPicker || run.phase !== 'playing') return state
      if (action.key === 'ENTER') {
        const categoryWords = data.category.wordsByLength[String(run.answer.length)] ?? []
        const result = submitGuess(run, data.dictionary, categoryWords)
        if (result.rejection) {
          return {
            ...state,
            message: REJECTION_MESSAGES[result.rejection],
            shakeToken: state.shakeToken + 1,
          }
        }
        return { ...state, run: result.state, message: null }
      }
      if (action.key === 'BACKSPACE') return { ...state, run: removeLetter(run) }
      return { ...state, run: addLetter(run, action.key) }
    }
  }
}

/** Keyboard letter states with hint knowledge merged in. */
function mergedKeyStates(run: AdventureRunState): Record<string, LetterState> {
  const states = keyboardState(run.guesses)
  for (const letter of [...run.shop.hints.contained, ...run.shop.hints.revealed.map((r) => r.letter)]) {
    if (states[letter] !== 'green') states[letter] = 'yellow'
  }
  for (const letter of run.shop.hints.eliminated) {
    if (!states[letter] || states[letter] === 'unknown') states[letter] = 'gray'
  }
  return states
}

export function AdventureRunScreen({ initialRun, onHome, onNewRun }: AdventureRunScreenProps) {
  const [{ run, data, message, shakeToken, bossIntro, hintPicker }, dispatch] = useReducer(
    reducer,
    undefined,
    () => ({
      run: initialRun,
      data: null,
      message: null,
      shakeToken: 0,
      bossIntro: false,
      hintPicker: false,
    }),
  )

  // Load the level's words whenever the run needs them. Covers both a fresh
  // level ('loading') and a restored save (phase 'playing' but no data yet).
  useEffect(() => {
    if (data !== null) return
    if (run.phase !== 'loading' && run.phase !== 'playing') return
    let cancelled = false
    const length = lengthForLevel(run.config, run.level)
    Promise.all([loadCategory(run.categoryId), loadDictionary(length)]).then(
      ([category, dictionary]) => {
        if (!cancelled)
          dispatch({ type: 'level-ready', data: { category, dictionary }, roll: Math.random() })
      },
    )
    return () => {
      cancelled = true
    }
  }, [data, run.phase, run.categoryId, run.level, run.config])

  // Snapshot after every state change; run end clears the save (full restart, no checkpoints)
  useEffect(() => {
    if (run.phase === 'run-over' || run.phase === 'victory') clearRun()
    else saveRun(run)
  }, [run])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => dispatch({ type: 'clear-message' }), 1600)
    return () => clearTimeout(timer)
  }, [message, shakeToken])

  const handleKey = useCallback((key: string) => dispatch({ type: 'key', key }), [])

  const boss = isBossLevel(run.config, run.level)
  const categoryName =
    categories.find((c) => c.id === run.categoryId)?.displayName ?? run.categoryId
  const boardRows = run.guesses.length + (run.phase === 'playing' ? 1 : 0)
  const shop = run.config.shop
  const { insurance } = run.shop
  const hintCost =
    run.shop.hintCredits > 0
      ? `${run.shop.hintCredits} free`
      : `$${shop.hintPrice}`
  const canHint = run.shop.hintCredits > 0 || run.coins >= shop.hintPrice
  const perksVisible = run.shop.permanentSlots > 0 || run.shop.perkA > 0 || run.shop.perkB > 0

  const hintStrip = [
    ...run.shop.hints.revealed.map((r) => `${ordinal(r.position + 1)}: ${r.letter}`),
    ...run.shop.hints.contained.map((letter) => `has ${letter}`),
  ]

  return (
    <div className="game">
      <div className="run-strip">
        <span className="run-level">
          {boss && <span className="boss-badge">BOSS</span>}
          <span className="run-difficulty">{DIFFICULTY_LABELS[run.difficulty]}</span> · Level{' '}
          {run.level}/{run.config.levelCount}
        </span>
        <span className="run-category">{categoryName}</span>
        <span className="run-badges">
          {insurance.owned && (
            <span
              className={`shield${insurance.covered ? '' : ' shield-lapsed'}`}
              title={insurance.covered ? 'Insured' : 'Premium unpaid — not covered this level'}
            >
              🛡
            </span>
          )}
          <span className={`lives-badge${run.lives <= 1 ? ' pool-low' : ''}`}>♥ {run.lives}</span>
          <span className="coins-badge">${run.coins}</span>
        </span>
      </div>

      {message && <div className="toast">{message}</div>}

      {hintStrip.length > 0 && run.phase === 'playing' && (
        <div className="hint-strip">
          {hintStrip.map((chip) => (
            <span className="hint-chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      )}

      {run.phase === 'loading' && !data ? (
        <div className="screen-loading">Loading…</div>
      ) : (
        <Board
          length={run.answer.length || lengthForLevel(run.config, run.level)}
          guesses={run.guesses}
          input={run.input}
          active={run.phase === 'playing'}
          rows={Math.max(boardRows, 1)}
          shakeToken={shakeToken}
        />
      )}

      {run.phase === 'playing' && (
        <button
          className="hint-button"
          disabled={!canHint}
          onClick={() => dispatch({ type: 'hint-picker', show: true })}
        >
          💡 Hint — {hintCost}
        </button>
      )}

      <Keyboard states={mergedKeyStates(run)} onKey={handleKey} />

      {hintPicker && run.phase === 'playing' && (
        <div className="overlay">
          <div className="overlay-panel">
            <h2>Pick a hint</h2>
            <p>{run.shop.hintCredits > 0 ? 'Uses a free hint' : `Costs $${shop.hintPrice}`}</p>
            <div className="hint-options">
              {(
                [
                  ['reveal-position', 'Reveal a letter in its spot'],
                  ['reveal-contained', 'Reveal a letter in the word'],
                  ['eliminate-wrong', 'Remove wrong letters from the keyboard'],
                ] as Array<[HintType, string]>
              ).map(([hint, label]) => (
                <button
                  key={hint}
                  className="button-secondary hint-option"
                  disabled={!hintAvailable(run, hint)}
                  onClick={() => dispatch({ type: 'use-hint', hint, roll: Math.random() })}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="overlay-buttons">
              <button
                className="button-secondary"
                onClick={() => dispatch({ type: 'hint-picker', show: false })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {bossIntro && run.phase === 'playing' && (
        <div className="overlay">
          <div className="overlay-panel boss-panel">
            <h2>Boss level</h2>
            <p className="taunt">{tauntForLevel(run.level)}</p>
            <div className="overlay-buttons">
              <button
                className="button-primary"
                onClick={() => dispatch({ type: 'dismiss-boss-intro' })}
              >
                Bring it on
              </button>
            </div>
          </div>
        </div>
      )}

      {run.phase === 'revived' && (
        <div className="overlay">
          <div className="overlay-panel">
            <h2>Insurance kicked in! 🛡</h2>
            <p>
              Revived with {shop.insurance.reviveLives} lives — the policy is used up. A new one
              costs ${shop.insurance.rebuyPrice}.
            </p>
            <div className="overlay-buttons">
              <button className="button-primary" onClick={() => dispatch({ type: 'resume-play' })}>
                Keep going
              </button>
            </div>
          </div>
        </div>
      )}

      {run.phase === 'level-won' && (
        <div className="overlay">
          <div className="overlay-panel shop-panel">
            <h2 className="reward-pop">
              {run.lastReward > 0 ? `+$${run.lastReward}` : `Level ${run.level} skipped`}
            </h2>
            <p>
              {boss && run.lastReward > 0 ? 'Boss defeated! ' : ''}♥ {run.lives} · ${run.coins}
              {run.shop.hintCredits > 0 && ` · ${run.shop.hintCredits} free hint${run.shop.hintCredits > 1 ? 's' : ''}`}
            </p>

            <div className="shop-rows">
              <button
                className="shop-row"
                disabled={run.coins < shop.lifePrice}
                onClick={() => dispatch({ type: 'buy-life' })}
              >
                <span>♥ +1 life</span>
                <span className="shop-price">${shop.lifePrice}</span>
              </button>

              {run.level + 1 <= run.config.levelCount &&
                !isBossLevel(run.config, run.level + 1) && (
                  <button
                    className="shop-row"
                    disabled={!canSkipNext(run)}
                    onClick={() => dispatch({ type: 'buy-skip' })}
                  >
                    <span>
                      ⏭ Skip level {run.level + 1} (
                      {lengthForLevel(run.config, run.level + 1)} letters, no reward)
                    </span>
                    <span className="shop-price">${shop.skipPrice}</span>
                  </button>
                )}

              {insurance.owned ? (
                <div className="shop-row shop-row-status">
                  <span>🛡 Insured — ${shop.insurance.premium} premium each level</span>
                </div>
              ) : (
                <button
                  className="shop-row"
                  disabled={run.coins < insurancePrice(run)}
                  onClick={() => dispatch({ type: 'buy-insurance' })}
                >
                  <span>🛡 Insurance (revive with {shop.insurance.reviveLives} lives)</span>
                  <span className="shop-price">${insurancePrice(run)}</span>
                </button>
              )}

              {perksVisible && (
                <>
                  <div className="shop-section">
                    Permanent upgrades — {run.shop.permanentSlots}{' '}
                    {run.shop.permanentSlots === 1 ? 'slot' : 'slots'}
                  </div>
                  {run.shop.perkA < 2 ? (
                    <button
                      className="shop-row"
                      disabled={
                        run.shop.permanentSlots < 1 ||
                        run.coins < (run.shop.perkA === 0 ? shop.perkA.price : shop.perkA.upgradePrice)
                      }
                      onClick={() =>
                        dispatch({ type: run.shop.perkA === 0 ? 'buy-perk' : 'upgrade-perk', perk: 'A' })
                      }
                    >
                      <span>
                        {run.shop.perkA === 0
                          ? `Bonus lives: +${shop.perkA.livesPerLevel} per level beaten`
                          : `Upgrade bonus lives to +${shop.perkA.upgradedLivesPerLevel}`}
                      </span>
                      <span className="shop-price">
                        ${run.shop.perkA === 0 ? shop.perkA.price : shop.perkA.upgradePrice}
                      </span>
                    </button>
                  ) : (
                    <div className="shop-row shop-row-status">
                      <span>Bonus lives: +{shop.perkA.upgradedLivesPerLevel} per level (max)</span>
                    </div>
                  )}
                  {run.shop.perkB < 2 ? (
                    <button
                      className="shop-row"
                      disabled={
                        run.shop.permanentSlots < 1 ||
                        run.coins < (run.shop.perkB === 0 ? shop.perkB.price : shop.perkB.upgradePrice)
                      }
                      onClick={() =>
                        dispatch({ type: run.shop.perkB === 0 ? 'buy-perk' : 'upgrade-perk', perk: 'B' })
                      }
                    >
                      <span>
                        {run.shop.perkB === 0
                          ? `Free hint when a level falls in ≤${shop.perkB.guessThreshold} guesses`
                          : `Upgrade free hints to ≤${shop.perkB.upgradedGuessThreshold} guesses`}
                      </span>
                      <span className="shop-price">
                        ${run.shop.perkB === 0 ? shop.perkB.price : shop.perkB.upgradePrice}
                      </span>
                    </button>
                  ) : (
                    <div className="shop-row shop-row-status">
                      <span>Free hints at ≤{shop.perkB.upgradedGuessThreshold} guesses (max)</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="overlay-buttons">
              <button
                className="button-primary"
                onClick={() => dispatch({ type: 'advance', roll: Math.random() })}
              >
                Next level
              </button>
            </div>
          </div>
        </div>
      )}

      {run.phase === 'run-over' && (
        <div className="overlay">
          <div className="overlay-panel">
            <h2>Bankrupt!</h2>
            <p>
              {run.answer && (
                <>
                  The word was <strong>{run.answer}</strong>.{' '}
                </>
              )}
              The run ends at level {run.level}. No checkpoints — it's back to level 1.
            </p>
            <div className="overlay-buttons">
              <button className="button-primary" onClick={onNewRun}>
                New run
              </button>
              <button className="button-secondary" onClick={onHome}>
                Home
              </button>
            </div>
          </div>
        </div>
      )}

      {run.phase === 'victory' && (
        <div className="overlay">
          <div className="overlay-panel">
            <h2>Company saved! 🏆</h2>
            <p>
              All {run.config.levelCount} levels beaten with ${run.coins} in the bank. The Daily
              Word-Search slinks away… for now.
            </p>
            <div className="overlay-buttons">
              <button className="button-primary" onClick={onNewRun}>
                Play again
              </button>
              <button className="button-secondary" onClick={onHome}>
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
