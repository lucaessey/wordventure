import { useState } from 'react'
import { balance } from '../data/balance'
import { categories } from '../data/load'
import { STORY_INTRO } from '../data/story'
import type { AdventureDifficulty, AdventureRunState } from '../engine/adventure'
import type { CategoryTheme } from '../engine/categoryTheme'
import { loadRun, SAVE_SLOTS } from '../storage/adventureSave'

interface AdventureSetupScreenProps {
  onStart: (difficulty: AdventureDifficulty, theme: CategoryTheme, slot: number) => void
  onContinue: (run: AdventureRunState, slot: number) => void
}

type ThemeKind = CategoryTheme['kind']

const DIFFICULTY_LABELS: Record<AdventureDifficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  extraHard: 'Extra Hard',
  superHard: 'Super Hard',
}

/** Blurb built from balance values so it never drifts from the numbers. */
function difficultyBlurb(difficulty: AdventureDifficulty): string {
  const lives = balance.adventure.startingLives[difficulty]
  const perks = balance.adventure.startingPerks[difficulty]
  const flatTax = balance.adventure.lifeTaxPerRound[difficulty]
  const ramp = balance.adventure.lifeTaxRamp[difficulty]
  const parts = [`${lives} lives`]
  if (perks.perkA) parts.push('free bonus-lives perk')
  if (ramp.length > 0) {
    const taxes = ramp.map((b) => b.tax)
    const lo = Math.min(...taxes)
    const hi = Math.max(...taxes)
    parts.push(lo === hi ? `−${lo} life each round` : `−${lo}–${hi} lives each round (scales up)`)
  } else if (flatTax > 0) {
    parts.push(`−${flatTax} life each round`)
  }
  return parts.join(' · ')
}

export function AdventureSetupScreen({ onStart, onContinue }: AdventureSetupScreenProps) {
  const [difficulty, setDifficulty] = useState<AdventureDifficulty>('normal')
  const [themeKind, setThemeKind] = useState<ThemeKind>('random')
  const [fixedCategory, setFixedCategory] = useState(categories[0].id)
  const [customIds, setCustomIds] = useState<string[]>(categories.map((c) => c.id))
  // Read every slot once so the list stays stable while configuring a new run.
  const [slots] = useState(() => Array.from({ length: SAVE_SLOTS }, (_, slot) => loadRun(slot)))

  function toggleCustom(id: string) {
    setCustomIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))
  }

  function buildTheme(): CategoryTheme {
    return themeKind === 'fixed'
      ? { kind: 'fixed', categoryId: fixedCategory }
      : themeKind === 'custom'
        ? { kind: 'custom', categoryIds: customIds }
        : { kind: 'random' }
  }

  const startDisabled = themeKind === 'custom' && customIds.length === 0

  return (
    <div className="setup">
      <p className="story-intro">{STORY_INTRO}</p>

      <h3 className="setup-heading">Difficulty</h3>
      <div className="chip-row chip-row-difficulty">
        {(['easy', 'normal', 'hard', 'extraHard', 'superHard'] as const).map((d) => (
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

      <h3 className="setup-heading">Your runs</h3>
      <div className="slot-list">
        {slots.map((save, slot) => (
          <div className={`slot-card${save ? '' : ' slot-card-empty'}`} key={slot}>
            <div className="slot-head">
              <span className="slot-name">Slot {slot + 1}</span>
              {save ? (
                <span className="slot-detail">
                  {DIFFICULTY_LABELS[save.difficulty]} · Level {save.level}/{save.config.levelCount}{' '}
                  · ♥ {save.lives} · ${save.coins}
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
    </div>
  )
}
