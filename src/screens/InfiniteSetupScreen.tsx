import { useState } from 'react'
import { balance } from '../data/balance'
import { categories } from '../data/load'
import type { Difficulty, InfiniteRunState, InfiniteTheme } from '../engine/infinite'
import { loadHighScores } from '../storage/highScores'
import { loadRun, SAVE_SLOTS } from '../storage/infiniteSave'

interface InfiniteSetupScreenProps {
  onStart: (difficulty: Difficulty, theme: InfiniteTheme, slot: number) => void
  onContinue: (run: InfiniteRunState, slot: number) => void
}

const DIFFICULTIES: Array<{ id: Difficulty; label: string; blurb: string }> = [
  { id: 'easy', label: 'Easy', blurb: `start ${balance.infinite.startingPool.easy} · +${balance.infinite.rewards.easy}/level` },
  { id: 'medium', label: 'Medium', blurb: `start ${balance.infinite.startingPool.medium} · +${balance.infinite.rewards.medium}/level` },
  { id: 'hard', label: 'Hard', blurb: `start ${balance.infinite.startingPool.hard} · +${balance.infinite.rewards.hard}/level` },
]

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

type ThemeKind = InfiniteTheme['kind']

export function InfiniteSetupScreen({ onStart, onContinue }: InfiniteSetupScreenProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [themeKind, setThemeKind] = useState<ThemeKind>('random')
  const [fixedCategory, setFixedCategory] = useState(categories[0].id)
  const [customIds, setCustomIds] = useState<string[]>(categories.map((c) => c.id))
  const [scores] = useState(loadHighScores)
  // Read every slot once so the list stays stable while configuring a new run.
  const [slots] = useState(() => Array.from({ length: SAVE_SLOTS }, (_, slot) => loadRun(slot)))

  function toggleCustom(id: string) {
    setCustomIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))
  }

  function buildTheme(): InfiniteTheme {
    return themeKind === 'fixed'
      ? { kind: 'fixed', categoryId: fixedCategory }
      : themeKind === 'custom'
        ? { kind: 'custom', categoryIds: customIds }
        : { kind: 'random' }
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

      <h3 className="setup-heading">Your runs</h3>
      <div className="slot-list">
        {slots.map((save, slot) => (
          <div className={`slot-card${save ? '' : ' slot-card-empty'}`} key={slot}>
            <div className="slot-head">
              <span className="slot-name">Slot {slot + 1}</span>
              {save ? (
                <span className="slot-detail">
                  {DIFFICULTY_LABELS[save.difficulty]} · Level {save.level}/{save.config.levelCount}{' '}
                  · {save.pool} {save.pool === 1 ? 'guess' : 'guesses'}
                </span>
              ) : (
                <span className="slot-detail slot-empty-text">Empty</span>
              )}
            </div>
            <div className="slot-actions">
              {save && (
                <button className="button-primary slot-action" onClick={() => onContinue(save, slot)}>
                  Continue
                </button>
              )}
              <button
                className={`${save ? 'button-secondary' : 'button-primary'} slot-action`}
                disabled={startDisabled}
                onClick={() => onStart(difficulty, buildTheme(), slot)}
              >
                {save ? 'New run (overwrites)' : 'Start new run'}
              </button>
            </div>
          </div>
        ))}
      </div>

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
