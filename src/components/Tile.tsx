import type { TileState } from '../engine/types'

interface TileProps {
  letter: string
  state: TileState | 'empty' | 'typed'
  /** Stagger index for the reveal animation of a submitted row. */
  revealIndex?: number
}

export function Tile({ letter, state, revealIndex }: TileProps) {
  return (
    <div
      className={`tile tile-${state}`}
      style={revealIndex !== undefined ? { animationDelay: `${revealIndex * 60}ms` } : undefined}
    >
      {letter}
    </div>
  )
}
