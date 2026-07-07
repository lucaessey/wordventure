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
  'minecraft',
  'original',
  'pokemon',
]

const ONLY_AZ = /^[A-Z]+$/

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

describe('category data', () => {
  it('ships exactly the six launch categories plus the index', () => {
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
          for (const word of words) {
            expect(word).toMatch(ONLY_AZ)
            expect(word).toHaveLength(length)
          }
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

  it('lists all six launch categories', () => {
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
      for (const word of words) {
        expect(word).toMatch(ONLY_AZ)
        expect(word).toHaveLength(length)
      }
    }
  })
})
