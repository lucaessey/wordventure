import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Category } from '../engine/types'

const DATA_DIR = import.meta.dirname
const CATEGORIES_DIR = join(DATA_DIR, 'categories')
const DICTIONARY_DIR = join(DATA_DIR, 'dictionary')

const LAUNCH_CATEGORY_IDS = [
  'animals',
  'brawl-stars',
  'countries',
  'dragon-ball',
  'food',
  'minecraft',
  'movies-tv',
  'music',
  'nintendo-switch',
  'original',
  'pokemon',
  'sports',
]

const ONLY_AZ = /^[A-Z]+$/

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

describe('category data', () => {
  it('ships exactly the twelve launch categories plus the index', () => {
    const files = readdirSync(CATEGORIES_DIR).filter((f) => f.endsWith('.json')).sort()
    expect(files).toEqual([...LAUNCH_CATEGORY_IDS.map((id) => `${id}.json`), 'index.json'].sort())
  })

  for (const id of LAUNCH_CATEGORY_IDS) {
    describe(id, () => {
      const category = readJson<Category>(join(CATEGORIES_DIR, `${id}.json`))

      it('matches the schema', () => {
        expect(category.id).toBe(id)
        expect(category.displayName.length).toBeGreaterThan(0)
        expect(category.minLetters).toBeLessThanOrEqual(category.maxLetters)
        expect(Object.keys(category.wordsByLength).length).toBeGreaterThan(0)
      })

      it('has bucket keys within [minLetters, maxLetters] and non-empty buckets', () => {
        for (const [key, words] of Object.entries(category.wordsByLength)) {
          const length = Number(key)
          expect(length).toBeGreaterThanOrEqual(category.minLetters)
          expect(length).toBeLessThanOrEqual(category.maxLetters)
          expect(words.length).toBeGreaterThan(0)
        }
      })

      it('has every word normalized (uppercase A-Z) and matching its bucket length', () => {
        for (const [key, words] of Object.entries(category.wordsByLength)) {
          const length = Number(key)
          const bad = words.filter((word) => word.length !== length || !ONLY_AZ.test(word))
          expect(bad).toEqual([])
        }
      })
    })
  }
})

describe('category index', () => {
  interface IndexEntry {
    id: string
    displayName: string
    minLetters: number
    maxLetters: number
    lengths: number[]
  }
  const index = readJson<IndexEntry[]>(join(CATEGORIES_DIR, 'index.json'))

  it('lists all twelve launch categories', () => {
    expect(index.map((e) => e.id).sort()).toEqual(LAUNCH_CATEGORY_IDS)
  })

  it('matches each category file exactly', () => {
    for (const entry of index) {
      const category = readJson<Category>(join(CATEGORIES_DIR, `${entry.id}.json`))
      expect(entry.displayName).toBe(category.displayName)
      expect(entry.minLetters).toBe(category.minLetters)
      expect(entry.maxLetters).toBe(category.maxLetters)
      const bucketLengths = Object.keys(category.wordsByLength).map(Number).sort((a, b) => a - b)
      expect(entry.lengths).toEqual(bucketLengths)
    }
  })
})

describe('Food category', () => {
  const food = readJson<Category>(join(CATEGORIES_DIR, 'food.json'))

  it('spans 3-10 letters', () => {
    expect(food.minLetters).toBe(3)
    expect(food.maxLetters).toBe(10)
    for (let length = 3; length <= 10; length++) {
      expect(food.wordsByLength[String(length)]).toBeDefined()
    }
  })

  it('has at least 20 words in every length bucket', () => {
    for (const [length, words] of Object.entries(food.wordsByLength)) {
      expect(words.length, `length ${length}`).toBeGreaterThanOrEqual(20)
    }
  })
})

describe('Sports category', () => {
  const sports = readJson<Category>(join(CATEGORIES_DIR, 'sports.json'))

  it('is within the declared 3-10 range', () => {
    expect(sports.minLetters).toBeGreaterThanOrEqual(3)
    expect(sports.maxLetters).toBeLessThanOrEqual(10)
  })

  it('keeps every real entry, allowing small buckets', () => {
    // A curated category may have length buckets below the usual minimum
    const total = Object.values(sports.wordsByLength).reduce((sum, w) => sum + w.length, 0)
    expect(total).toBeGreaterThan(0)
    for (const words of Object.values(sports.wordsByLength)) {
      expect(words.length).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('franchise categories stay within their declared ranges', () => {
  const ranges: Record<string, [number, number]> = {
    'movies-tv': [4, 10],
    'dragon-ball': [3, 10],
    'nintendo-switch': [4, 10],
    music: [3, 10],
  }
  for (const [id, [lo, hi]] of Object.entries(ranges)) {
    it(`${id} is single-word tokens within ${lo}-${hi}`, () => {
      const cat = readJson<Category>(join(CATEGORIES_DIR, `${id}.json`))
      expect(cat.minLetters).toBeGreaterThanOrEqual(lo)
      expect(cat.maxLetters).toBeLessThanOrEqual(hi)
      const words = Object.values(cat.wordsByLength).flat()
      expect(words.length).toBeGreaterThan(0)
      for (const word of words) expect(word).toMatch(/^[A-Z]+$/)
    })
  }
})

describe('English guess dictionary', () => {
  it('has a non-empty bucket for every length 3-14', () => {
    for (let length = 3; length <= 14; length++) {
      const words = readJson<string[]>(join(DICTIONARY_DIR, `${length}.json`))
      expect(words.length).toBeGreaterThan(0)
    }
  })

  it('contains only normalized words of the bucket length', () => {
    for (let length = 3; length <= 14; length++) {
      const words = readJson<string[]>(join(DICTIONARY_DIR, `${length}.json`))
      const bad = words.filter((word) => word.length !== length || !ONLY_AZ.test(word))
      expect(bad).toEqual([])
    }
  })
})
