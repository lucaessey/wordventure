import type { ScoredGuess } from '../engine/types'
import { Tile } from './Tile'

interface BoardProps {
  /** Word length — tiles per row. */
  length: number
  guesses: ScoredGuess[]
  input: string
  /** Render an input row after the submitted guesses (i.e. still accepting guesses). */
  active: boolean
  /** Total rows to render; empty rows pad the difference (Normal shows all six up front). */
  rows: number
  /** Increment to retrigger the shake animation on the current row. */
  shakeToken: number
}

export function Board({ length, guesses, input, active, rows, shakeToken }: BoardProps) {
  const rendered = []

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    const submitted = guesses[rowIndex]
    if (submitted) {
      rendered.push(
        <div className="board-row" key={rowIndex}>
          {submitted.word.split('').map((letter, i) => (
            <Tile key={i} letter={letter} state={submitted.feedback[i]} revealIndex={i} />
          ))}
        </div>,
      )
    } else if (rowIndex === guesses.length && active) {
      // Current input row; remounting on shakeToken restarts the shake animation
      rendered.push(
        <div className={`board-row${shakeToken > 0 ? ' shake' : ''}`} key={`input-${shakeToken}`}>
          {Array.from({ length }, (_, i) => (
            <Tile key={i} letter={input[i] ?? ''} state={input[i] ? 'typed' : 'empty'} />
          ))}
        </div>,
      )
    } else {
      rendered.push(
        <div className="board-row" key={rowIndex}>
          {Array.from({ length }, (_, i) => (
            <Tile key={i} letter="" state="empty" />
          ))}
        </div>,
      )
    }
  }

  return (
    <div className="board" style={{ '--len': length } as React.CSSProperties}>
      {rendered}
    </div>
  )
}
