import { useEffect, useState } from 'react'
import { subscribeToUnlocks } from '../achievements/store'
import { ACHIEVEMENTS } from '../data/achievements'

const ROMAN = ['', 'I', 'II', 'III']

interface ToastItem {
  key: number
  text: string
}

function unlockText(id: string, tier: number): string {
  const def = ACHIEVEMENTS.find((a) => a.id === id)
  const name = def?.name ?? id
  const tiered = def && def.kind !== 'single'
  return tiered ? `${name} ${ROMAN[tier] ?? tier}` : name
}

/**
 * Global achievement-unlock notifier. Subscribes to the store and shows a small
 * toast for each newly-earned badge, on whatever screen the player is on.
 */
export function AchievementToast() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    let seq = 0
    return subscribeToUnlocks((unlocks) => {
      setItems((current) => [
        ...current,
        ...unlocks.map((u) => ({ key: ++seq + Math.random(), text: unlockText(u.id, u.tier) })),
      ])
    })
  }, [])

  useEffect(() => {
    if (items.length === 0) return
    const timer = setTimeout(() => setItems((current) => current.slice(1)), 2800)
    return () => clearTimeout(timer)
  }, [items])

  if (items.length === 0) return null

  return (
    <div className="achievement-toasts">
      {items.map((item) => (
        <div className="achievement-toast" key={item.key}>
          <span className="achievement-toast-trophy">🏆</span>
          <span className="achievement-toast-body">
            <span className="achievement-toast-label">Achievement unlocked</span>
            <span className="achievement-toast-name">{item.text}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
