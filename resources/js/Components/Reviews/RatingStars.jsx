import { Star } from 'lucide-react'

export default function RatingStars({ value = 0, size = 'sm' }) {
  const stars = Math.max(0, Math.min(5, Number(value || 0)))
  const cls = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'

  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star
          key={idx}
          className={`${cls} ${idx < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </div>
  )
}

