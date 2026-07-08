import manifest from './whos-that-pokemon.json'

/**
 * One Who's That Pokemon manifest entry. Images live under public/pokemon/;
 * paths are relative to the app base. When silhouetteImage === revealImage the
 * mode renders the silhouette from that single image via a CSS filter.
 */
export interface PokemonEntry {
  name: string
  silhouetteImage: string
  revealImage: string
}

/** The manifest entries — whatever is present, no hardcoded count. */
export const pokemonEntries: PokemonEntry[] = manifest

export function hasPokemonEntries(): boolean {
  return pokemonEntries.length > 0
}

/** Resolve a manifest image path against the app base (e.g. /wordventure/). */
export function pokemonImageUrl(path: string): string {
  return import.meta.env.BASE_URL + path
}
