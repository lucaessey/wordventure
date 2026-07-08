import { useCallback, useEffect, useReducer } from 'react'
import { balance } from '../data/balance'
import { loadCategory, loadDictionary } from '../data/load'
import { hasPokemonEntries, pokemonEntries, type PokemonEntry } from '../data/whosThatPokemon'
import { normalizeWord } from '../engine/normalize'
import { keyboardState } from '../engine/keyboardState'
import { addLetter, removeLetter, startRound, submitGuess, type RoundState } from '../engine/round'
import type { Category } from '../engine/types'
import { Board } from '../components/Board'
import { Keyboard } from '../components/Keyboard'
import { PokemonImage } from '../components/PokemonImage'

interface WhosThatPokemonScreenProps {
  onHome: () => void
}

const REJECTION_MESSAGES = {
  'not-in-word-list': 'Not in word list',
  'wrong-length': 'Not enough letters',
}

interface RoundData {
  entry: PokemonEntry
  round: RoundState
  /** Valid-guess word set for this round's length (Pokemon names ∪ dictionary). */
  categoryWords: string[]
  dictionary: string[]
}

interface UiState {
  data: RoundData | null
  message: string | null
  shakeToken: number
}

type UiAction =
  | { type: 'round'; data: RoundData }
  | { type: 'key'; key: string }
  | { type: 'clear-message' }

function reducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'round':
      return { data: action.data, message: null, shakeToken: 0 }
    case 'clear-message':
      return { ...state, message: null }
    case 'key': {
      const { data } = state
      if (!data || data.round.status !== 'playing') return state
      if (action.key === 'ENTER') {
        const result = submitGuess(data.round, data.dictionary, data.categoryWords)
        if (result.rejection) {
          return {
            ...state,
            message: REJECTION_MESSAGES[result.rejection],
            shakeToken: state.shakeToken + 1,
          }
        }
        return { ...state, data: { ...data, round: result.state }, message: null }
      }
      if (action.key === 'BACKSPACE')
        return { ...state, data: { ...data, round: removeLetter(data.round) } }
      return { ...state, data: { ...data, round: addLetter(data.round, action.key) } }
    }
  }
}

/** Pick a random manifest entry and assemble a fresh round for it. */
async function buildRound(pokemon: Category): Promise<RoundData> {
  const entry = pokemonEntries[Math.floor(Math.random() * pokemonEntries.length)]
  // A manifest name should be a real Pokemon (present in the category); fall
  // back to the raw normalized name so a round is always playable.
  const answer = normalizeWord(entry.name) ?? entry.name.toUpperCase()
  const length = answer.length
  const dictionary = await loadDictionary(length)
  const pokemonNames = pokemon.wordsByLength[String(length)] ?? []
  // Include the manifest's own same-length names so the answer is always guessable.
  const manifestNames = pokemonEntries
    .map((e) => normalizeWord(e.name))
    .filter((n): n is string => n !== null && n.length === length)
  const categoryWords = [...new Set([...pokemonNames, ...manifestNames])]
  return {
    entry,
    round: startRound(answer, balance.whosThatPokemon.guessCount),
    categoryWords,
    dictionary,
  }
}

export function WhosThatPokemonScreen({ onHome }: WhosThatPokemonScreenProps) {
  const [{ data, message, shakeToken }, dispatch] = useReducer(reducer, {
    data: null,
    message: null,
    shakeToken: 0,
  })

  const startNewRound = useCallback(() => {
    let cancelled = false
    loadCategory('pokemon')
      .then((pokemon) => buildRound(pokemon))
      .then((roundData) => {
        if (!cancelled) dispatch({ type: 'round', data: roundData })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => startNewRound(), [startNewRound])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => dispatch({ type: 'clear-message' }), 1600)
    return () => clearTimeout(timer)
  }, [message, shakeToken])

  const handleKey = useCallback((key: string) => dispatch({ type: 'key', key }), [])

  if (!hasPokemonEntries()) {
    return (
      <div className="screen-loading">
        No Pokemon available yet — add entries to the manifest.
      </div>
    )
  }

  if (!data) {
    return <div className="screen-loading">Loading…</div>
  }

  const { entry, round } = data
  const over = round.status !== 'playing'

  return (
    <div className="game whos-that">
      {message && <div className="toast">{message}</div>}

      <div className="pokemon-stage">
        <PokemonImage entry={entry} revealed={over} />
        {over ? (
          <p className={`pokemon-name${round.status === 'won' ? ' pokemon-name-won' : ''}`}>
            {round.status === 'won' ? "It's " : ''}
            {entry.name}
            {round.status === 'won' ? '! 🎉' : ''}
          </p>
        ) : (
          <p className="pokemon-prompt">Who's that Pokemon?</p>
        )}
      </div>

      <Board
        length={round.answer.length}
        guesses={round.guesses}
        input={round.input}
        active={round.status === 'playing'}
        rows={round.maxGuesses}
        shakeToken={shakeToken}
      />

      {over ? (
        <div className="result-bar">
          <span className="result-text">
            {round.status === 'won'
              ? `Solved in ${round.guesses.length} of ${round.maxGuesses}`
              : `Out of guesses — it was ${entry.name}`}
          </span>
          <div className="overlay-buttons">
            <button className="button-primary" onClick={startNewRound}>
              Play again
            </button>
            <button className="button-secondary" onClick={onHome}>
              Home
            </button>
          </div>
        </div>
      ) : (
        <Keyboard states={keyboardState(round.guesses)} onKey={handleKey} />
      )}
    </div>
  )
}
