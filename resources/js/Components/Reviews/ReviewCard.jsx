import { Link } from '@inertiajs/react'
import { BadgeCheck } from 'lucide-react'
import RatingStars from './RatingStars'
import StatusBadge from './StatusBadge'

export default function ReviewCard({ review }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{review?.title || 'Untitled Review'}</p>
          <p className="text-xs text-slate-500">{review?.user?.name || review?.name || 'Guest'} - {review?.package?.title || 'Package'}</p>
        </div>
        <StatusBadge status={review?.status} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <RatingStars value={review?.rating} />
        {review?.is_verified_booking ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            <BadgeCheck className="h-3 w-3" />
            Verified
          </span>
        ) : null}
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{review?.review}</p>
      <div className="mt-3">
        <Link href={`/admin/reviews/${review.id}`} className="text-xs font-medium text-blue-600 hover:text-blue-700">
          View Details
        </Link>
      </div>
    </div>
  )
}

