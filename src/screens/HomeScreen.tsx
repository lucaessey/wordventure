import { balance } from '../data/balance'

interface HomeScreenProps {
  onNormal: () => void
  onInfinite: () => void
}

const INFINITE_BLURB = `${balance.infinite.levelCount} levels, words growing ${balance.infinite.startLength} to ${
  balance.infinite.startLength + balance.infinite.levelCount - 1
} letters, one shared guess pool`

export function HomeScreen({ onNormal, onInfinite }: HomeScreenProps) {
  return (
    <div className="home">
      <p className="home-tagline">Pick a mode</p>
      <div className="mode-list">
        <button className="mode-card" onClick={onNormal}>
          <span className="mode-name">Normal</span>
          <span className="mode-blurb">Pick a category and length — 6 guesses, endless replays</span>
        </button>
        <button className="mode-card" onClick={onInfinite}>
          <span className="mode-name">Infinite</span>
          <span className="mode-blurb">{INFINITE_BLURB}</span>
        </button>
      </div>
    </div>
  )
}
