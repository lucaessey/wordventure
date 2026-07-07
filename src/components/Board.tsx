import type { RoundState } from '../engine/round'
import { Tile } from './Tile'

interface BoardProps {
  round: RoundState
  /** Increment to retrigger the shake animation on the current row. */
  shakeToken: number
}

export function Board({ round, shakeToken }: BoardProps) {
  const length = round.answer.length
  const rows = []

  for (let rowIndex = 0; rowIndex < round.maxGuesses; rowIndex++) {
    const submitted = round.guesses[rowIndex]
    if (submitted) {
      rows.push(
        <div className="board-row" key={rowIndex}>
          {submitted.word.split('').map((letter, i) => (
            <Tile key={i} letter={letter} state={submitted.feedback[i]} revealIndex={i} />
          ))}
        </div>,
      )
    } else if (rowIndex === round.guesses.length && round.status === 'playing') {
      // Current input row; remounting on shakeToken restarts the shake animation
      rows.push(
        <div className={`board-row${shakeToken > 0 ? ' shake' : ''}`} key={`input-${shakeToken}`}>
          {Array.from({ length }, (_, i) => (
            <Tile key={i} letter={round.input[i] ?? ''} state={round.input[i] ? 'typed' : 'empty'} />
          ))}
        </div>,
      )
    } else {
      rows.push(
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
      {rows}
    </div>
  )
}
