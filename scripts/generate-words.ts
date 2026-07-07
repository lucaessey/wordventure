/**
 * Authoring-time word data generator. Run with: npm run generate:words
 *
 * Reads raw source lists from scripts/wordlists/, applies the shared engine
 * normalization, and writes the committed JSON under src/data/. Deterministic:
 * output is deduplicated and sorted, so rerunning against the same raw lists
 * reproduces the same files byte-for-byte.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeWord } from '../src/engine/normalize'
import type { Category } from '../src/engine/types'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WORDLISTS = join(ROOT, 'scripts', 'wordlists')
const OUT_DICTIONARY = join(ROOT, 'src', 'data', 'dictionary')
const OUT_CATEGORIES = join(ROOT, 'src', 'data', 'categories')

const MIN_LENGTH = 3
const MAX_LENGTH = 14
// A category length bucket below this word count is dropped so a "random"
// answer pool can never be near-trivial. Provisional — tune in playtesting.
const MIN_WORDS_PER_BUCKET = 5

interface CategorySource {
  id: string
  displayName: string
  file: string
  /** Keep only words that also appear in this set (used by Original). */
  restrictTo?: ReadonlySet<string>
}

function readLines(file: string): string[] {
  return readFileSync(join(WORDLISTS, file), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

/** Normalize, filter to playable lengths, dedupe, sort. */
function toWords(lines: string[]): string[] {
  const words = new Set<string>()
  for (const line of lines) {
    const word = normalizeWord(line)
    if (word && word.length >= MIN_LENGTH && word.length <= MAX_LENGTH) {
      words.add(word)
    }
  }
  return [...words].sort()
}

function bucketByLength(words: string[]): Map<number, string[]> {
  const buckets = new Map<number, string[]>()
  for (const word of words) {
    const bucket = buckets.get(word.length)
    if (bucket) bucket.push(word)
    else buckets.set(word.length, [word])
  }
  return buckets
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

// --- English guess dictionary -----------------------------------------------

const englishWords = toWords(readLines('english.txt'))
const englishSet = new Set(englishWords)
const dictionaryBuckets = bucketByLength(englishWords)

mkdirSync(OUT_DICTIONARY, { recursive: true })
for (let length = MIN_LENGTH; length <= MAX_LENGTH; length++) {
  const words = dictionaryBuckets.get(length) ?? []
  if (words.length === 0) {
    throw new Error(`English dictionary has no words of length ${length}`)
  }
  writeJson(join(OUT_DICTIONARY, `${length}.json`), words)
  console.log(`dictionary/${length}.json: ${words.length} words`)
}

// --- Categories ---------------------------------------------------------------

const sources: CategorySource[] = [
  // Original answers are common words, restricted to the dictionary so junk
  // tokens from the frequency list (abbreviations, web cruft) are excluded.
  { id: 'original', displayName: 'Original', file: 'common-english.txt', restrictTo: englishSet },
  { id: 'pokemon', displayName: 'Pokemon', file: 'pokemon.txt' },
  { id: 'minecraft', displayName: 'Minecraft', file: 'minecraft.txt' },
  { id: 'brawl-stars', displayName: 'Brawl Stars', file: 'brawl-stars.txt' },
  { id: 'animals', displayName: 'Animals', file: 'animals.txt' },
  { id: 'countries', displayName: 'Countries', file: 'countries.txt' },
]

interface CategoryIndexEntry {
  id: string
  displayName: string
  minLetters: number
  maxLetters: number
  /** Exact lengths with a bucket — the range may have gaps. */
  lengths: number[]
}
const index: CategoryIndexEntry[] = []

mkdirSync(OUT_CATEGORIES, { recursive: true })
for (const source of sources) {
  let words = toWords(readLines(source.file))
  if (source.restrictTo) {
    words = words.filter((word) => source.restrictTo!.has(word))
  }

  const buckets = bucketByLength(words)
  const wordsByLength: Record<string, string[]> = {}
  const lengths: number[] = []
  for (let length = MIN_LENGTH; length <= MAX_LENGTH; length++) {
    const bucket = buckets.get(length)
    if (bucket && bucket.length >= MIN_WORDS_PER_BUCKET) {
      wordsByLength[String(length)] = bucket
      lengths.push(length)
    }
  }
  if (lengths.length === 0) {
    throw new Error(`Category '${source.id}' has no length bucket with >= ${MIN_WORDS_PER_BUCKET} words`)
  }

  const category: Category = {
    id: source.id,
    displayName: source.displayName,
    minLetters: Math.min(...lengths),
    maxLetters: Math.max(...lengths),
    wordsByLength,
  }
  writeJson(join(OUT_CATEGORIES, `${source.id}.json`), category)
  index.push({
    id: category.id,
    displayName: category.displayName,
    minLetters: category.minLetters,
    maxLetters: category.maxLetters,
    lengths,
  })

  const total = lengths.reduce((sum, length) => sum + wordsByLength[String(length)].length, 0)
  console.log(
    `categories/${source.id}.json: ${total} words, lengths ${category.minLetters}-${category.maxLetters}` +
      (lengths.length < category.maxLetters - category.minLetters + 1
        ? ` (gaps: ${missingLengths(lengths).join(', ')})`
        : ''),
  )
}

// Lightweight metadata for the home grid and length picker — UI code can show
// every category without loading any word list.
writeJson(join(OUT_CATEGORIES, 'index.json'), index)
console.log(`categories/index.json: ${index.length} categories`)

function missingLengths(present: number[]): number[] {
  const set = new Set(present)
  const missing: number[] = []
  for (let l = Math.min(...present); l <= Math.max(...present); l++) {
    if (!set.has(l)) missing.push(l)
  }
  return missing
}
