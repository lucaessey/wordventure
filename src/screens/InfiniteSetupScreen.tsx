import { useState } from 'react'
import { balance } from '../data/balance'
import { categories } from '../data/load'
import type { Difficulty, InfiniteTheme } from '../engine/infinite'
import { loadHighScores } from '../storage/highScores'

interface InfiniteSetupScreenProps {
  onStart: (difficulty: Difficulty, theme: InfiniteTheme) => void
}

const DIFFICULTIES: Array<{ id: Difficulty; label: string; blurb: string }> = [
  { id: 'easy', label: 'Easy', blurb: `+${balance.infinite.rewards.easy} per level` },
  { id: 'medium', label: 'Medium', blurb: `+${balance.infinite.rewards.medium} per level` },
  { id: 'hard', label: 'Hard', blurb: `+${balance.infinite.rewards.hard} per level` },
]

type ThemeKind = InfiniteTheme['kind']

export function InfiniteSetupScreen({ onStart }: InfiniteSetupScreenProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [themeKind, setThemeKind] = useState<ThemeKind>('random')
  const [fixedCategory, setFixedCategory] = useState(categories[0].id)
  const [customIds, setCustomIds] = useState<string[]>(categories.map((c) => c.id))
  const [scores] = useState(loadHighScores)

  function toggleCustom(id: string) {
    setCustomIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))
  }

  function start() {
    const theme: InfiniteTheme =
      themeKind === 'fixed'
        ? { kind: 'fixed', categoryId: fixedCategory }
        : themeKind === 'custom'
          ? { kind: 'custom', categoryIds: customIds }
          : { kind: 'random' }
    onStart(difficulty, theme)
  }

  const startDisabled = themeKind === 'custom' && customIds.length === 0

  return (
    <div className="setup">
      <p className="home-tagline">Set up your run</p>

      <h3 className="setup-heading">Difficulty</h3>
      <div className="chip-row">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            className={`chip${difficulty === d.id ? ' chip-selected' : ''}`}
            onClick={() => setDifficulty(d.id)}
          >
            <span className="chip-label">{d.label}</span>
            <span className="chip-blurb">{d.blurb}</span>
          </button>
        ))}
      </div>

      <h3 className="setup-heading">Categories</h3>
      <div className="chip-row">
        <button
          className={`chip${themeKind === 'random' ? ' chip-selected' : ''}`}
          onClick={() => setThemeKind('random')}
        >
          <span className="chip-label">Random</span>
          <span className="chip-blurb">new one each level</span>
        </button>
        <button
          className={`chip${themeKind === 'fixed' ? ' chip-selected' : ''}`}
          onClick={() => setThemeKind('fixed')}
        >
          <span className="chip-label">One category</span>
          <span className="chip-blurb">stay on a theme</span>
        </button>
        <button
          className={`chip${themeKind === 'custom' ? ' chip-selected' : ''}`}
          onClick={() => setThemeKind('custom')}
        >
          <span className="chip-label">My picks</span>
          <span className="chip-blurb">choose a mix</span>
        </button>
      </div>

      {themeKind === 'fixed' && (
        <div className="chip-row chip-row-wrap">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`chip chip-small${fixedCategory === c.id ? ' chip-selected' : ''}`}
              onClick={() => setFixedCategory(c.id)}
            >
              {c.displayName}
            </button>
          ))}
        </div>
      )}
      {themeKind === 'custom' && (
        <div className="chip-row chip-row-wrap">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`chip chip-small${customIds.includes(c.id) ? ' chip-selected' : ''}`}
              onClick={() => toggleCustom(c.id)}
            >
              {c.displayName}
            </button>
          ))}
        </div>
      )}

      <button className="button-primary setup-start" onClick={start} disabled={startDisabled}>
        Start run
      </button>

      <div className="scores">
        <h3 className="setup-heading">Best level</h3>
        <div className="scores-row">
          {DIFFICULTIES.map((d) => (
            <div className="score-box" key={d.id}>
              <span className="score-value">{scores.byDifficulty[d.id].bestLevel || '—'}</span>
              <span className="score-label">{d.label}</span>
            </div>
          ))}
          <div className="score-box">
            <span className="score-value">{scores.totalLevelsBeaten}</span>
            <span className="score-label">Lifetime levels</span>
          </div>
        </div>
      </div>
    </div>
  )
}
