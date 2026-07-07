import { useEffect } from 'react'
import type { LetterState } from '../engine/types'

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

interface KeyboardProps {
  states: Record<string, LetterState>
  /** Receives 'A'-'Z', 'ENTER', or 'BACKSPACE'. */
  onKey: (key: string) => void
}

export function Keyboard({ states, onKey }: KeyboardProps) {
  // Physical keyboard feeds the exact same dispatch as on-screen taps
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === 'Enter') onKey('ENTER')
      else if (event.key === 'Backspace') onKey('BACKSPACE')
      else if (/^[a-zA-Z]$/.test(event.key)) onKey(event.key.toUpperCase())
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onKey])

  return (
    <div className="keyboard">
      {ROWS.map((row, rowIndex) => (
        <div className="keyboard-row" key={row}>
          {rowIndex === 2 && (
            <button className="key key-wide" onClick={() => onKey('ENTER')}>
              ENTER
            </button>
          )}
          {row.split('').map((letter) => (
            <button
              key={letter}
              className={`key key-${states[letter] ?? 'unknown'}`}
              onClick={() => onKey(letter)}
            >
              {letter}
            </button>
          ))}
          {rowIndex === 2 && (
            <button className="key key-wide" onClick={() => onKey('BACKSPACE')} aria-label="Backspace">
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
