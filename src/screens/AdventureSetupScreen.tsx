import { useState } from 'react'
import { balance } from '../data/balance'
import { categories } from '../data/load'
import { STORY_INTRO } from '../data/story'
import type { AdventureDifficulty, AdventureRunState } from '../engine/adventure'
import type { CategoryTheme } from '../engine/categoryTheme'
import { loadRun } from '../storage/adventureSave'

interface AdventureSetupScreenProps {
  onStart: (difficulty: AdventureDifficulty, theme: CategoryTheme) => void
  onContinue: (run: AdventureRunState) => void
}

type ThemeKind = CategoryTheme['kind']

const DIFFICULTY_LABELS: Record<AdventureDifficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
}

/** Blurb built from balance values so it never drifts from the numbers. */
function difficultyBlurb(difficulty: AdventureDifficulty): string {
  const lives = balance.adventure.startingLives[difficulty]
  const perks = balance.adventure.startingPerks[difficulty]
  const parts = [`${lives} lives`]
  if (perks.perkA) parts.push('free bonus-lives perk')
  return parts.join(' · ')
}

export function AdventureSetupScreen({ onStart, onContinue }: AdventureSetupScreenProps) {
  const [difficulty, setDifficulty] = useState<AdventureDifficulty>('normal')
  const [themeKind, setThemeKind] = useState<ThemeKind>('random')
  const [fixedCategory, setFixedCategory] = useState(categories[0].id)
  const [customIds, setCustomIds] = useState<string[]>(categories.map((c) => c.id))
  const [save] = useState(loadRun)

  function toggleCustom(id: string) {
    setCustomIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))
  }

  function start() {
    const theme: CategoryTheme =
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
      <p className="story-intro">{STORY_INTRO}</p>

      {save && (
        <button className="continue-card" onClick={() => onContinue(save)}>
          <span className="continue-title">Continue your run</span>
          <span className="continue-detail">
            {DIFFICULTY_LABELS[save.difficulty]} · Level {save.level}/{save.config.levelCount} ·{' '}
            {save.lives} {save.lives === 1 ? 'life' : 'lives'} · ${save.coins}
          </span>
        </button>
      )}

      <h3 className="setup-heading">Difficulty</h3>
      <div className="chip-row">
        {(['easy', 'normal', 'hard'] as const).map((d) => (
          <button
            key={d}
            className={`chip${difficulty === d ? ' chip-selected' : ''}`}
            onClick={() => setDifficulty(d)}
          >
            <span className="chip-label">{DIFFICULTY_LABELS[d]}</span>
            <span className="chip-blurb">{difficultyBlurb(d)}</span>
          </button>
        ))}
      </div>

      <h3 className="setup-heading">Categories</h3>
      <div className="chip-row">
        <button
          className={`chip${themeKind === 'random' ? ' chip-selected' : ''}`}
          onClick={() => setThemeKind('random')}
        >
          <span className="chip-label">All mixed</span>
          <span className="chip-blurb">anything goes</span>
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
        {save ? 'New run (overwrites your save)' : 'Start the campaign'}
      </button>
    </div>
  )
}
