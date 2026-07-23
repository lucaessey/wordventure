import { useState } from 'react'
import { loadProgress } from '../achievements/store'
import { ACHIEVEMENTS, GROUP_LABELS, GROUP_ORDER } from '../data/achievements'

const ROMAN = ['', 'I', 'II', 'III']

export function TrophyRoomScreen() {
  const [progress] = useState(loadProgress)

  const total = ACHIEVEMENTS.length
  const earnedCount = ACHIEVEMENTS.filter((a) => (progress.earned[a.id] ?? []).length > 0).length

  return (
    <div className="trophy-room">
      <p className="home-tagline">
        {earnedCount} of {total} earned
      </p>

      {GROUP_ORDER.map((group) => (
        <section className="trophy-group" key={group}>
          <h3 className="setup-heading">{GROUP_LABELS[group]}</h3>
          {ACHIEVEMENTS.filter((a) => a.group === group).map((a) => {
            const tiers = progress.earned[a.id] ?? []
            const anyEarned = tiers.length > 0
            const revealed = !a.hidden || anyEarned
            const tiered = a.kind !== 'single'
            return (
              <div className={`badge${anyEarned ? ' badge-earned' : ''}`} key={a.id}>
                <div className="badge-main">
                  <span className="badge-name">{revealed ? a.name : '???'}</span>
                  <span className="badge-how">{revealed ? a.howTo : 'Hidden — keep playing to discover it.'}</span>
                </div>
                {tiered ? (
                  <div className="tier-pips" aria-label="tiers earned">
                    {[1, 2, 3].map((t) => (
                      <span className={`pip${tiers.includes(t) ? ' pip-on' : ''}`} key={t}>
                        {ROMAN[t]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={`badge-check${anyEarned ? ' badge-check-on' : ''}`}>
                    {anyEarned ? '✓' : ''}
                  </span>
                )}
              </div>
            )
          })}
        </section>
      ))}

      <section className="trophy-group creator-links">
        <h3 className="setup-heading">More by this creator</h3>
        <div className="creator-link-row">
          <a
            className="creator-link"
            href="https://lucaessey.github.io/phaser-snake/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="creator-emoji" aria-hidden="true">🐍</span>
            <span className="creator-label">snake</span>
          </a>
          <a
            className="creator-link"
            href="https://lucaessey.github.io/Boggle/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="creator-emoji" aria-hidden="true">🔠</span>
            <span className="creator-label">boggle</span>
          </a>
        </div>
      </section>
    </div>
  )
}
