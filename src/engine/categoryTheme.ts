/**
 * Category theming shared by Infinite and Adventure: how a run chooses each
 * level's category, restricted to categories that support the level's word
 * length, with Original as the guaranteed fallback (it spans 3-14).
 */

export type CategoryTheme =
  | { kind: 'fixed'; categoryId: string }
  | { kind: 'random' }
  | { kind: 'custom'; categoryIds: string[] }

/** Category metadata the engine needs for eligibility — UI passes it from the data index. */
export interface CategoryOption {
  id: string
  lengths: number[]
}

export const FALLBACK_CATEGORY_ID = 'original'

export function pickLevelCategory(
  theme: CategoryTheme,
  length: number,
  categories: readonly CategoryOption[],
  rng: () => number = Math.random,
): string {
  const supports = (id: string) =>
    categories.some((c) => c.id === id && c.lengths.includes(length))

  if (theme.kind === 'fixed') {
    return supports(theme.categoryId) ? theme.categoryId : FALLBACK_CATEGORY_ID
  }
  const pool =
    theme.kind === 'custom'
      ? theme.categoryIds.filter(supports)
      : categories.filter((c) => c.lengths.includes(length)).map((c) => c.id)
  if (pool.length === 0) return FALLBACK_CATEGORY_ID
  return pool[Math.floor(rng() * pool.length)]
}
