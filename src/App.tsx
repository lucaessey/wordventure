import { useState } from 'react'
import { categories } from './data/load'
import { HomeScreen } from './screens/HomeScreen'
import { LengthPickerScreen } from './screens/LengthPickerScreen'
import { GameScreen } from './screens/GameScreen'

type Screen =
  | { name: 'home' }
  | { name: 'length-picker'; categoryId: string }
  | { name: 'game'; categoryId: string; length: number }

function categoryName(categoryId: string): string {
  return categories.find((c) => c.id === categoryId)?.displayName ?? categoryId
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  const goHome = () => setScreen({ name: 'home' })

  return (
    <div className="app">
      <header className="app-header">
        {screen.name !== 'home' ? (
          <button
            className="back-button"
            aria-label="Back"
            onClick={() =>
              setScreen(
                screen.name === 'game'
                  ? { name: 'length-picker', categoryId: screen.categoryId }
                  : { name: 'home' },
              )
            }
          >
            ←
          </button>
        ) : (
          <span className="back-button-spacer" />
        )}
        <h1 className="app-title">Wordventure</h1>
        <span className="header-context">
          {screen.name !== 'home' ? categoryName(screen.categoryId) : ''}
        </span>
      </header>

      {screen.name === 'home' && (
        <HomeScreen
          onPickCategory={(categoryId) => setScreen({ name: 'length-picker', categoryId })}
        />
      )}
      {screen.name === 'length-picker' && (
        <LengthPickerScreen
          category={categories.find((c) => c.id === screen.categoryId)!}
          onPickLength={(length) =>
            setScreen({ name: 'game', categoryId: screen.categoryId, length })
          }
        />
      )}
      {screen.name === 'game' && (
        <GameScreen categoryId={screen.categoryId} length={screen.length} onHome={goHome} />
      )}
    </div>
  )
}
