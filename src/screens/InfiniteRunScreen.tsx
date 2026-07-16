import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { categories, loadCategory, loadDictionary } from '../data/load'
import {
  addLetter,
  advanceLevel,
  beginLevel,
  lengthForLevel,
  removeLetter,
  submitGuess,
  type CategoryOption,
  type InfiniteRunState,
} from '../engine/infinite'
import { keyboardState } from '../engine/keyboardState'
import type { Category } from '../engine/types'
import { recordEvent, todayString } from '../achievements/store'
import { loadHighScores, recordRun, saveHighScores } from '../storage/highScores'
import { clearRun, saveRun } from '../storage/infiniteSave'
import { Board } from '../components/Board'
import { Keyboard } from '../components/Keyboard'

interface InfiniteRunScreenProps {
  /** A fresh run from the setup screen, or a restored save. */
  initialRun: InfiniteRunState
  /** Which save slot this run persists to for its lifetime. */
  slot: number
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
  run: InfiniteRunState
  data: LevelData | null
  message: string | null
  shakeToken: number
}

// Random draws ride along on the action so the reducer stays pure
// (StrictMode double-invokes reducers; Math.random inside would diverge).
type UiAction =
  | { type: 'level-ready'; data: LevelData; roll: number }
  | { type: 'key'; key: string }
  | { type: 'advance'; roll: number }
  | { type: 'clear-message' }

function reducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'level-ready':
      return {
        ...state,
        data: action.data,
        run: beginLevel(state.run, action.data.category, () => action.roll),
        message: null,
        shakeToken: 0,
      }
    case 'advance':
      return { ...state, run: advanceLevel(state.run, CATEGORY_OPTIONS, () => action.roll), data: null }
    case 'clear-message':
      return { ...state, message: null }
    case 'key': {
      const { run, data } = state
      if (!data || run.phase !== 'playing') return state
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

export function InfiniteRunScreen({ initialRun, slot, onHome, onNewRun }: InfiniteRunScreenProps) {
  const [{ run, data, message, shakeToken }, dispatch] = useReducer(reducer, undefined, () => ({
    run: initialRun,
    data: null,
    message: null,
    shakeToken: 0,
  }))
  const [newRecord, setNewRecord] = useState(false)
  const recordedRef = useRef(false)
  // Achievement dedup guards (no game logic — just emit facts)
  const achStartedRef = useRef(false)
  const achLevelRef = useRef(0)
  const achPoolRef = useRef(-1)
  const achSolvedLevelRef = useRef(0)

  useEffect(() => {
    if (achStartedRef.current) return
    achStartedRef.current = true
    // Count a genuinely new run, not a resume of an in-progress one
    if (initialRun.level === 1 && initialRun.guesses.length === 0 && initialRun.levelsBeaten === 0) {
      recordEvent({ type: 'game-started', mode: 'infinite', day: todayString() })
    }
  }, [initialRun])

  useEffect(() => {
    if (run.level !== achLevelRef.current && (run.phase === 'playing' || run.phase === 'loading')) {
      achLevelRef.current = run.level
      recordEvent({ type: 'level-reached', difficulty: run.difficulty, level: run.level })
    }
    if (run.pool !== achPoolRef.current) {
      achPoolRef.current = run.pool
      recordEvent({ type: 'pool-held', difficulty: run.difficulty, amount: run.pool })
    }
    if ((run.phase === 'level-won' || run.phase === 'victory') && achSolvedLevelRef.current !== run.level) {
      achSolvedLevelRef.current = run.level
      recordEvent({
        type: 'word-solved',
        mode: 'infinite',
        difficulty: run.difficulty,
        guessesUsed: run.guesses.length,
        maxGuesses: 0,
        answerLength: run.answer.length,
        hadYellow: run.guesses.some((g) => g.feedback.includes('yellow')),
      })
    }
  }, [run])

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

  // Snapshot after every state change to this run's slot; run end clears that
  // slot (no resume from a finished run)
  useEffect(() => {
    if (run.phase === 'run-over' || run.phase === 'victory') clearRun(slot)
    else saveRun(run, slot)
  }, [run, slot])

  // Record high scores exactly once per run end
  useEffect(() => {
    if (run.phase !== 'run-over' && run.phase !== 'victory') {
      recordedRef.current = false
      return
    }
    if (recordedRef.current) return
    recordedRef.current = true
    const { scores, newRecord: record } = recordRun(loadHighScores(), run.difficulty, run.levelsBeaten)
    saveHighScores(scores)
    setNewRecord(record)
    recordEvent({ type: 'run-finished', mode: 'infinite', difficulty: run.difficulty, won: run.phase === 'victory' })
  }, [run.phase, run.difficulty, run.levelsBeaten])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => dispatch({ type: 'clear-message' }), 1600)
    return () => clearTimeout(timer)
  }, [message, shakeToken])

  const handleKey = useCallback((key: string) => dispatch({ type: 'key', key }), [])

  const categoryName =
    categories.find((c) => c.id === run.categoryId)?.displayName ?? run.categoryId
  const boardRows = run.guesses.length + (run.phase === 'playing' ? 1 : 0)

  return (
    <div className="game">
      <div className="run-strip">
        <span className="run-level">
          Level {run.level}/{run.config.levelCount}
        </span>
        <span className="run-category">{categoryName}</span>
        <span className={`pool-badge${run.pool <= 2 ? ' pool-low' : ''}`}>
          {run.pool} {run.pool === 1 ? 'guess' : 'guesses'}
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

      {run.phase === 'level-won' && (
        <div className="overlay">
          <div className="overlay-panel">
            <h2 className="reward-pop">+{run.lastReward} guesses!</h2>
            <p>
              Level {run.level} beaten — pool is now {run.pool}
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

      {(run.phase === 'run-over' || run.phase === 'victory') && (
        <div className="overlay">
          <div className="overlay-panel">
            {run.phase === 'victory' ? (
              <h2>All {run.config.levelCount} levels beaten! 🏆</h2>
            ) : (
              <h2>Out of guesses</h2>
            )}
            <p>
              {run.phase === 'run-over' && (
                <>
                  The word was <strong>{run.answer}</strong>.{' '}
                </>
              )}
              You beat {run.levelsBeaten} {run.levelsBeaten === 1 ? 'level' : 'levels'}
              {newRecord && <strong> — new best!</strong>}
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
    </div>
  )
}
