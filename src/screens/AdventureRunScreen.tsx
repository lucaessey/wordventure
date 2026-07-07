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
  submitGuess,
  type AdventureRunState,
} from '../engine/adventure'
import type { CategoryOption } from '../engine/categoryTheme'
import { keyboardState } from '../engine/keyboardState'
import type { Category } from '../engine/types'
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

const CATEGORY_OPTIONS: CategoryOption[] = categories.map(({ id, lengths }) => ({ id, lengths }))

interface LevelData {
  category: Category
  dictionary: string[]
}

interface UiState {
  run: AdventureRunState
  data: LevelData | null
  message: string | null
  shakeToken: number
  /** Boss intro overlay is showing (dismiss before playing). */
  bossIntro: boolean
}

type UiAction =
  | { type: 'level-ready'; data: LevelData; roll: number }
  | { type: 'key'; key: string }
  | { type: 'advance'; roll: number }
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
    case 'dismiss-boss-intro':
      return { ...state, bossIntro: false }
    case 'clear-message':
      return { ...state, message: null }
    case 'key': {
      const { run, data } = state
      if (!data || state.bossIntro || run.phase !== 'playing') return state
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

export function AdventureRunScreen({ initialRun, onHome, onNewRun }: AdventureRunScreenProps) {
  const [{ run, data, message, shakeToken, bossIntro }, dispatch] = useReducer(
    reducer,
    undefined,
    () => ({ run: initialRun, data: null, message: null, shakeToken: 0, bossIntro: false }),
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

  return (
    <div className="game">
      <div className="run-strip">
        <span className="run-level">
          {boss && <span className="boss-badge">BOSS</span>} Level {run.level}/
          {run.config.levelCount}
        </span>
        <span className="run-category">{categoryName}</span>
        <span className="run-badges">
          <span className={`lives-badge${run.lives <= 1 ? ' pool-low' : ''}`}>
            ♥ {run.lives}
          </span>
          <span className="coins-badge">${run.coins}</span>
        </span>
      </div>

      {message && <div className="toast">{message}</div>}

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
      <Keyboard states={keyboardState(run.guesses)} onKey={handleKey} />

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

      {run.phase === 'level-won' && (
        <div className="overlay">
          <div className="overlay-panel">
            <h2 className="reward-pop">+${run.lastReward}</h2>
            <p>
              {boss ? 'Boss defeated!' : `Level ${run.level} cleared.`} Coins: ${run.coins} · Lives:{' '}
              {run.lives}
            </p>
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
