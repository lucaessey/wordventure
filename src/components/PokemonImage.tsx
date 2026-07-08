import { pokemonImageUrl, type PokemonEntry } from '../data/whosThatPokemon'

interface PokemonImageProps {
  entry: PokemonEntry
  revealed: boolean
}

/**
 * Renders a Pokemon as a silhouette during play and full-color on reveal.
 *
 * Preferred path: when silhouette and reveal are the same transparent image, a
 * single <img> is shown with a CSS brightness(0) filter until revealed — one
 * file serves as both. When the manifest gives distinct files, each is shown
 * for its phase with no filter.
 */
export function PokemonImage({ entry, revealed }: PokemonImageProps) {
  const singleImage = entry.silhouetteImage === entry.revealImage
  const src = singleImage
    ? entry.revealImage
    : revealed
      ? entry.revealImage
      : entry.silhouetteImage
  const silhouette = singleImage && !revealed

  return (
    <div className="pokemon-frame">
      <img
        className={`pokemon-img${silhouette ? ' pokemon-silhouette' : ''}`}
        src={pokemonImageUrl(src)}
        alt={revealed ? entry.name : 'Silhouette of a mystery Pokemon'}
        draggable={false}
      />
    </div>
  )
}
