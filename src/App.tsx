import { useState } from 'react'
import { categories } from './data/load'
import { startRun as startAdventureRun, type AdventureRunState } from './engine/adventure'
import type { CategoryOption } from './engine/categoryTheme'
import { startRun as startInfiniteRun, type InfiniteRunState } from './engine/infinite'
import { HomeScreen } from './screens/HomeScreen'
import { CategoryGridScreen } from './screens/CategoryGridScreen'
import { LengthPickerScreen } from './screens/LengthPickerScreen'
import { GameScreen } from './screens/GameScreen'
import { InfiniteSetupScreen } from './screens/InfiniteSetupScreen'
import { InfiniteRunScreen } from './screens/InfiniteRunScreen'
import { AdventureSetupScreen } from './screens/AdventureSetupScreen'
import { AdventureRunScreen } from './screens/AdventureRunScreen'
import { TrophyRoomScreen } from './screens/TrophyRoomScreen'
import { AchievementToast } from './components/AchievementToast'

const CATEGORY_OPTIONS: CategoryOption[] = categories.map(({ id, lengths }) => ({ id, lengths }))

type Screen =
  | { name: 'home' }
  | { name: 'category-grid' }
  | { name: 'length-picker'; categoryId: string }
  | { name: 'game'; categoryId: string; length: number }
  | { name: 'infinite-setup' }
  | { name: 'infinite-run'; run: InfiniteRunState; slot: number }
  | { name: 'adventure-setup' }
  | { name: 'adventure-run'; run: AdventureRunState; slot: number }
  | { name: 'trophy-room' }

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
    case 'adventure-run':
      return { name: 'adventure-setup' }
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
    case 'adventure-setup':
    case 'adventure-run':
      return 'Adventure'
    case 'trophy-room':
      return 'Trophy Room'
    default:
      return ''
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  // Bumped for every fresh Adventure run so the run screen remounts with the new state
  const [runNonce, setRunNonce] = useState(0)

  return (
    <div className="app">
      <header className="app-header">
        {screen.name === 'home' ? (
          // Trophy icon lives in the top-left only on home, where there is no
          // back button, so the two never collide.
          <button
            className="trophy-button"
            aria-label="Trophy Room"
            onClick={() => setScreen({ name: 'trophy-room' })}
          >
            🏆
          </button>
        ) : (
          <button
            className="back-button"
            aria-label="Back"
            onClick={() => setScreen(backTarget(screen))}
          >
            ←
          </button>
        )}
        <h1 className="app-title">Wordventure</h1>
        <span className="header-context">{headerContext(screen)}</span>
      </header>

      <AchievementToast />

      {screen.name === 'home' && (
        <HomeScreen
          onNormal={() => setScreen({ name: 'category-grid' })}
          onInfinite={() => setScreen({ name: 'infinite-setup' })}
          onAdventure={() => setScreen({ name: 'adventure-setup' })}
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
          onStart={(difficulty, theme, slot) => {
            setRunNonce((n) => n + 1)
            setScreen({
              name: 'infinite-run',
              run: startInfiniteRun(difficulty, theme, CATEGORY_OPTIONS),
              slot,
            })
          }}
          onContinue={(run, slot) => {
            setRunNonce((n) => n + 1)
            setScreen({ name: 'infinite-run', run, slot })
          }}
        />
      )}
      {screen.name === 'infinite-run' && (
        <InfiniteRunScreen
          key={runNonce}
          initialRun={screen.run}
          slot={screen.slot}
          onHome={() => setScreen({ name: 'home' })}
          onNewRun={() => {
            setRunNonce((n) => n + 1)
            // Retry keeps the same difficulty, theme, and slot as the run that just ended
            setScreen({
              name: 'infinite-run',
              run: startInfiniteRun(screen.run.difficulty, screen.run.theme, CATEGORY_OPTIONS),
              slot: screen.slot,
            })
          }}
        />
      )}
      {screen.name === 'adventure-setup' && (
        <AdventureSetupScreen
          onStart={(difficulty, theme, slot) => {
            setRunNonce((n) => n + 1)
            setScreen({
              name: 'adventure-run',
              run: startAdventureRun(difficulty, theme, CATEGORY_OPTIONS),
              slot,
            })
          }}
          onContinue={(run, slot) => {
            setRunNonce((n) => n + 1)
            setScreen({ name: 'adventure-run', run, slot })
          }}
        />
      )}
      {screen.name === 'adventure-run' && (
        <AdventureRunScreen
          key={runNonce}
          initialRun={screen.run}
          slot={screen.slot}
          onHome={() => setScreen({ name: 'home' })}
          onNewRun={() => {
            setRunNonce((n) => n + 1)
            // Retry keeps the same difficulty and slot as the run that just ended
            setScreen({
              name: 'adventure-run',
              run: startAdventureRun(screen.run.difficulty, screen.run.theme, CATEGORY_OPTIONS),
              slot: screen.slot,
            })
          }}
        />
      )}
      {screen.name === 'trophy-room' && <TrophyRoomScreen />}
    </div>
  )
}
