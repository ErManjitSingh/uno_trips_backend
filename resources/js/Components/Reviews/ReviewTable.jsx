import { Link } from '@inertiajs/react'
import { BadgeCheck } from 'lucide-react'
import RatingStars from './RatingStars'
import StatusBadge from './StatusBadge'

export default function ReviewTable({
  rows = [],
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onApprove,
  onReject,
  onSpam,
  onDelete,
}) {
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="pb-2">
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} />
            </th>
            <th className="pb-2">User Name</th>
            <th className="pb-2">Package Name</th>
            <th className="pb-2">Rating</th>
            <th className="pb-2">Review Title</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Verified</th>
            <th className="pb-2">Created</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((review, idx) => (
            <tr
              key={review.id}
              className={`border-b border-slate-100 ${idx % 3 === 0 ? 'bg-white' : idx % 3 === 1 ? 'bg-blue-50/60' : 'bg-amber-50/60'}`}
            >
              <td className="py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(review.id)}
                  onChange={() => onToggleSelect(review.id)}
                />
              </td>
              <td className="py-3 text-slate-700">{review?.user?.name || review?.name || 'Guest'}</td>
              <td className="text-slate-600">{review?.package?.title || '-'}</td>
              <td><RatingStars value={review?.rating} /></td>
              <td>
                <p className="font-medium text-slate-700">{review?.title || 'Untitled'}</p>
                <p className="line-clamp-1 max-w-[220px] text-xs text-slate-500">{review?.review}</p>
              </td>
              <td><StatusBadge status={review?.status} /></td>
              <td>
                {review?.is_verified_booking ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700"><BadgeCheck className="h-3.5 w-3.5" />Yes</span>
                ) : (
                  <span className="text-xs text-slate-500">No</span>
                )}
              </td>
              <td className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</td>
              <td className="py-2">
                <div className="flex items-center justify-end gap-1.5">
                  <Link href={`/admin/reviews/${review.id}`} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600">View</Link>
                  <button type="button" onClick={() => onApprove(review.id)} className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Approve</button>
                  <button type="button" onClick={() => onReject(review.id)} className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Reject</button>
                  <button type="button" onClick={() => onSpam(review.id)} className="rounded-md bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700">Spam</button>
                  <button type="button" onClick={() => onDelete(review.id)} className="rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={9} className="py-10 text-center text-sm text-slate-500">No reviews found.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

