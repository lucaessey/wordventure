import { useCallback, useEffect, useReducer } from 'react'
import { balance } from '../data/balance'
import { loadCategory, loadDictionary } from '../data/load'
import { keyboardState } from '../engine/keyboardState'
import { addLetter, removeLetter, startRound, submitGuess, type RoundState } from '../engine/round'
import { selectAnswer } from '../engine/selectAnswer'
import type { Category } from '../engine/types'
import { Board } from '../components/Board'
import { Keyboard } from '../components/Keyboard'

interface GameScreenProps {
  categoryId: string
  length: number
  onHome: () => void
}

const REJECTION_MESSAGES = {
  'not-in-word-list': 'Not in word list',
  'wrong-length': 'Not enough letters',
}

interface GameData {
  category: Category
  dictionary: string[]
}

interface UiState {
  data: GameData | null
  round: RoundState | null
  message: string | null
  shakeToken: number
}

type UiAction =
  | { type: 'loaded'; data: GameData; round: RoundState }
  | { type: 'new-round'; round: RoundState }
  | { type: 'key'; key: string }
  | { type: 'clear-message' }

const INITIAL: UiState = { data: null, round: null, message: null, shakeToken: 0 }

// A reducer (not per-render callbacks) so that every key action is applied to
// the latest state even when several events land in one React batch.
function reducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'loaded':
      return { data: action.data, round: action.round, message: null, shakeToken: 0 }
    case 'new-round':
      return { ...state, round: action.round, message: null, shakeToken: 0 }
    case 'clear-message':
      return { ...state, message: null }
    case 'key': {
      const { data, round } = state
      if (!data || !round || round.status !== 'playing') return state
      if (action.key === 'ENTER') {
        const categoryWords = data.category.wordsByLength[String(round.answer.length)] ?? []
        const result = submitGuess(round, data.dictionary, categoryWords)
        if (result.rejection) {
          return {
            ...state,
            message: REJECTION_MESSAGES[result.rejection],
            shakeToken: state.shakeToken + 1,
          }
        }
        return { ...state, round: result.state, message: null }
      }
      if (action.key === 'BACKSPACE') return { ...state, round: removeLetter(round) }
      return { ...state, round: addLetter(round, action.key) }
    }
  }
}

export function GameScreen({ categoryId, length, onHome }: GameScreenProps) {
  const [{ data, round, message, shakeToken }, dispatch] = useReducer(reducer, INITIAL)

  useEffect(() => {
    let cancelled = false
    Promise.all([loadCategory(categoryId), loadDictionary(length)]).then(([category, dictionary]) => {
      if (cancelled) return
      dispatch({
        type: 'loaded',
        data: { category, dictionary },
        round: startRound(selectAnswer(category, length), balance.normal.guessCount),
      })
    })
    return () => {
      cancelled = true
    }
  }, [categoryId, length])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => dispatch({ type: 'clear-message' }), 1600)
    return () => clearTimeout(timer)
  }, [message, shakeToken])

  const handleKey = useCallback((key: string) => dispatch({ type: 'key', key }), [])

  function playAgain() {
    if (!data) return
    dispatch({
      type: 'new-round',
      round: startRound(selectAnswer(data.category, length), balance.normal.guessCount),
    })
  }

  if (!round) {
    return <div className="screen-loading">Loading…</div>
  }

  return (
    <div className="game">
      {message && <div className="toast">{message}</div>}
      <Board round={round} shakeToken={shakeToken} />
      <Keyboard states={keyboardState(round.guesses)} onKey={handleKey} />
      {round.status !== 'playing' && (
        <div className="overlay">
          <div className="overlay-panel">
            {round.status === 'won' ? (
              <>
                <h2>You got it! 🎉</h2>
                <p>
                  Solved in {round.guesses.length} of {round.maxGuesses}
                </p>
              </>
            ) : (
              <>
                <h2>Out of guesses</h2>
                <p>
                  The word was <strong>{round.answer}</strong>
                </p>
              </>
            )}
            <div className="overlay-buttons">
              <button className="button-primary" onClick={playAgain}>
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
