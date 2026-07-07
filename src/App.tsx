import { useState } from 'react'
import { categories } from './data/load'
import type { Difficulty, InfiniteTheme } from './engine/infinite'
import { HomeScreen } from './screens/HomeScreen'
import { CategoryGridScreen } from './screens/CategoryGridScreen'
import { LengthPickerScreen } from './screens/LengthPickerScreen'
import { GameScreen } from './screens/GameScreen'
import { InfiniteSetupScreen } from './screens/InfiniteSetupScreen'
import { InfiniteRunScreen } from './screens/InfiniteRunScreen'

type Screen =
  | { name: 'home' }
  | { name: 'category-grid' }
  | { name: 'length-picker'; categoryId: string }
  | { name: 'game'; categoryId: string; length: number }
  | { name: 'infinite-setup' }
  | { name: 'infinite-run'; difficulty: Difficulty; theme: InfiniteTheme }

function categoryName(categoryId: string): string {
  return categories.find((c) => c.id === categoryId)?.displayName ?? categoryId
}

function backTarget(screen: Screen): Screen {
  switch (screen.name) {
    case 'game':
      return { name: 'length-picker', categoryId: screen.categoryId }
    case 'length-picker':
      return { name: 'category-grid' }
    case 'infinite-run':
      return { name: 'infinite-setup' }
    default:
      return { name: 'home' }
  }
}

function headerContext(screen: Screen): string {
  switch (screen.name) {
    case 'length-picker':
    case 'game':
      return categoryName(screen.categoryId)
    case 'category-grid':
      return 'Normal'
    case 'infinite-setup':
    case 'infinite-run':
      return 'Infinite'
    default:
      return ''
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  return (
    <div className="app">
      <header className="app-header">
        {screen.name !== 'home' ? (
          <button
            className="back-button"
            aria-label="Back"
            onClick={() => setScreen(backTarget(screen))}
          >
            ←
          </button>
        ) : (
          <span className="back-button-spacer" />
        )}
        <h1 className="app-title">Wordventure</h1>
        <span className="header-context">{headerContext(screen)}</span>
      </header>

      {screen.name === 'home' && (
        <HomeScreen
          onNormal={() => setScreen({ name: 'category-grid' })}
          onInfinite={() => setScreen({ name: 'infinite-setup' })}
        />
      )}
      {screen.name === 'category-grid' && (
        <CategoryGridScreen
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
        <GameScreen
          categoryId={screen.categoryId}
          length={screen.length}
          onHome={() => setScreen({ name: 'home' })}
        />
      )}
      {screen.name === 'infinite-setup' && (
        <InfiniteSetupScreen
          onStart={(difficulty, theme) => setScreen({ name: 'infinite-run', difficulty, theme })}
        />
      )}
      {screen.name === 'infinite-run' && (
        <InfiniteRunScreen
          difficulty={screen.difficulty}
          theme={screen.theme}
          onHome={() => setScreen({ name: 'home' })}
        />
      )}
    </div>
  )
}
