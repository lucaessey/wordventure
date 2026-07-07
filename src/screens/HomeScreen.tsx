import { categories } from '../data/load'

interface HomeScreenProps {
  onPickCategory: (categoryId: string) => void
}

export function HomeScreen({ onPickCategory }: HomeScreenProps) {
  return (
    <div className="home">
      <p className="home-tagline">Pick a category</p>
      <div className="category-grid">
        {categories.map((category) => (
          <button
            key={category.id}
            className="category-box"
            onClick={() => onPickCategory(category.id)}
          >
            <span className="category-name">{category.displayName}</span>
            <span className="category-range">
              {category.minLetters}–{category.maxLetters} letters
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
