import type { Category } from './types'

/**
 * Pick a uniformly random answer from the category's bucket for the given
 * length. Answers always come from a category list, never from the English
 * guess dictionary.
 *
 * The random source is injectable for deterministic tests; it must return a
 * number in [0, 1) like Math.random.
 */
export function selectAnswer(
  category: Category,
  length: number,
  rng: () => number = Math.random,
): string {
  const bucket = category.wordsByLength[String(length)]
  if (!bucket || bucket.length === 0) {
    throw new Error(`Category '${category.id}' has no words of length ${length}`)
  }
  return bucket[Math.floor(rng() * bucket.length)]
}
