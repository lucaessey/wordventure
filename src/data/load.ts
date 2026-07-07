import type { Category } from '../engine/types'
import categoryIndex from './categories/index.json'

/** Metadata for one category, small enough to import statically for the home grid. */
export interface CategoryMeta {
  id: string
  displayName: string
  minLetters: number
  maxLetters: number
  /** Exact lengths with a word bucket — offer only these in the length picker. */
  lengths: number[]
}

export const categories: CategoryMeta[] = categoryIndex

/**
 * Word lists load on demand as code-split chunks. The service worker precaches
 * every chunk, so after the first visit these resolve offline too.
 */
export async function loadCategory(id: string): Promise<Category> {
  const module = await import(`./categories/${id}.json`)
  return module.default as Category
}

export async function loadDictionary(length: number): Promise<string[]> {
  const module = await import(`./dictionary/${length}.json`)
  return module.default as string[]
}
