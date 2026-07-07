import { describe, expect, it } from 'vitest'
import { balance } from './balance'

describe('balance', () => {
  it('exposes the Normal mode guess count', () => {
    expect(balance.normal.guessCount).toBeGreaterThan(0)
    expect(Number.isInteger(balance.normal.guessCount)).toBe(true)
  })
})
