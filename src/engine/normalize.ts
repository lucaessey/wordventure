/**
 * Shared word normalization, used both by the authoring-time generator and at
 * guess-input time so a typed guess and a stored answer always normalize
 * identically.
 *
 * Rules (see openspec/changes/add-word-data-and-guess-engine/specs/word-data):
 * - strip spaces, hyphens, apostrophes, and periods
 * - remove accents (Unicode NFD decomposition, drop combining marks)
 * - uppercase
 * - anything left outside A-Z (digits, symbols) makes the entry invalid
 */

const STRIPPED_CHARS = /[\s\-'’.]/g
const COMBINING_MARKS = /[̀-ͯ]/g
const ONLY_AZ = /^[A-Z]+$/

/**
 * Normalize a raw word or guess. Returns the normalized uppercase A-Z form,
 * or null if the entry cannot be represented (empty, or contains digits or
 * other characters that are not simply stripped/decomposed away).
 */
export function normalizeWord(raw: string): string | null {
  const normalized = raw
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(STRIPPED_CHARS, '')
    .toUpperCase()
  return ONLY_AZ.test(normalized) ? normalized : null
}
