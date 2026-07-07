import type { CategoryMeta } from '../data/load'

interface LengthPickerScreenProps {
  category: CategoryMeta
  onPickLength: (length: number) => void
}

export function LengthPickerScreen({ category, onPickLength }: LengthPickerScreenProps) {
  return (
    <div className="length-picker">
      <p className="home-tagline">How many letters?</p>
      <div className="length-grid">
        {category.lengths.map((length) => (
          <button key={length} className="length-box" onClick={() => onPickLength(length)}>
            {length}
          </button>
        ))}
      </div>
    </div>
  )
}
