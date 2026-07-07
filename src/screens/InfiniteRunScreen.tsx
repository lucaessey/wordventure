import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { categories, loadCategory, loadDictionary } from '../data/load'
import {
  addLetter,
  advanceLevel,
  beginLevel,
  lengthForLevel,
  removeLetter,
  startRun,
  submitGuess,
  type CategoryOption,
  type Difficulty,
  type InfiniteRunState,
  type InfiniteTheme,
} from '../engine/infinite'
import { keyboardState } from '../engine/keyboardState'
import type { Category } from '../engine/types'
import { loadHighScores, recordRun, saveHighScores } from '../storage/highScores'
import { Board } from '../components/Board'
import { Keyboard } from '../components/Keyboard'

interface InfiniteRunScreenProps {
  difficulty: Difficulty
  theme: InfiniteTheme
  onHome: () => void
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
  | { type: 'restart'; roll: number }
  | { type: 'clear-message' }

function freshRun(difficulty: Difficulty, theme: InfiniteTheme, roll: number): UiState {
  return {
    run: startRun(difficulty, theme, CATEGORY_OPTIONS, undefined, () => roll),
    data: null,
    message: null,
    shakeToken: 0,
  }
}

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
    case 'restart':
      return freshRun(state.run.difficulty, state.run.theme, action.roll)
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

export function InfiniteRunScreen({ difficulty, theme, onHome }: InfiniteRunScreenProps) {
  const [{ run, data, message, shakeToken }, dispatch] = useReducer(
    reducer,
    undefined,
    () => freshRun(difficulty, theme, Math.random()),
  )
  const [newRecord, setNewRecord] = useState(false)
  const recordedRef = useRef(false)

  // Load the level's words whenever the run enters 'loading'
  useEffect(() => {
    if (run.phase !== 'loading') return
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
  }, [run.phase, run.categoryId, run.level, run.config])

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
              <button
                className="button-primary"
                onClick={() => dispatch({ type: 'restart', roll: Math.random() })}
              >
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
