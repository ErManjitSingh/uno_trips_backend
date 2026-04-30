import { Head, Link, router, useForm } from '@inertiajs/react'
import { BadgeCheck, Images } from 'lucide-react'
import { useState } from 'react'
import AdminLayout from '../../../Layouts/AdminLayout'
import RatingStars from '../../../Components/Reviews/RatingStars'
import StatusBadge from '../../../Components/Reviews/StatusBadge'

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value || '-'}</p>
    </div>
  )
}

export default function ReviewShow({ review }) {
  const [activeImage, setActiveImage] = useState('')
  const { data, setData } = useForm({ reply: review?.admin_reply || '' })

  const submitReply = () => {
    router.post(`/admin/reviews/${review.id}/reply`, { reply: data.reply }, { preserveScroll: true })
  }

  const deleteReply = () => {
    router.delete(`/admin/reviews/${review.id}/reply`, { preserveScroll: true })
  }

  const toggleFlags = (payload) => {
    router.put(`/admin/reviews/${review.id}/flags`, payload, { preserveScroll: true })
  }

  const moderation = (type) => {
    if (type === 'delete') {
      router.delete(`/admin/reviews/${review.id}`, { preserveScroll: true, onSuccess: () => router.get('/admin/reviews') })
      return
    }
    router.put(`/admin/reviews/${review.id}/${type}`, {}, { preserveScroll: true })
  }

  return (
    <>
      <Head title={`Review #${review.id}`} />
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/reviews" className="text-xs text-blue-600 hover:text-blue-700">Back to Reviews</Link>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{review.title || 'Review Details'}</h2>
          </div>
          <StatusBadge status={review.status} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2">
              <RatingStars value={review.rating} size="md" />
              <span className="text-sm font-semibold text-slate-700">{review.rating}/5</span>
              {review.is_verified_booking ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified Booking
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-700">{review.review}</p>
            <div className="grid gap-2 md:grid-cols-2">
              <DetailRow label="Pros" value={review.pros} />
              <DetailRow label="Cons" value={review.cons} />
              <DetailRow label="Travel Date" value={review.travel_date} />
              <DetailRow label="Trip Type" value={review.trip_type} />
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              <DetailRow label="Service" value={`${review.service_rating || '-'} / 5`} />
              <DetailRow label="Value" value={`${review.value_rating || '-'} / 5`} />
              <DetailRow label="Location" value={`${review.location_rating || '-'} / 5`} />
              <DetailRow label="Cleanliness" value={`${review.cleanliness_rating || '-'} / 5`} />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <DetailRow label="User" value={review?.user?.name || review?.name || 'Guest'} />
            <DetailRow label="Email" value={review?.user?.email} />
            <DetailRow label="Package" value={review?.package?.title} />
            <DetailRow label="Created Date" value={new Date(review.created_at).toLocaleString()} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-800">Moderation Controls</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => moderation('approve')} className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">Approve</button>
            <button type="button" onClick={() => moderation('reject')} className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">Reject</button>
            <button type="button" onClick={() => moderation('spam')} className="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700">Mark Spam</button>
            <button type="button" onClick={() => moderation('delete')} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700">Delete</button>
            <button type="button" onClick={() => toggleFlags({ is_verified_booking: !review.is_verified_booking })} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {review.is_verified_booking ? 'Remove Verified' : 'Mark Verified'}
            </button>
            <button type="button" onClick={() => toggleFlags({ is_featured: !review.is_featured })} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              {review.is_featured ? 'Unfeature' : 'Feature Review'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-800">Admin Reply</p>
          <textarea value={data.reply} onChange={(e) => setData('reply', e.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="Write response to review..." />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={submitReply} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Save Reply</button>
            {review.admin_reply ? <button type="button" onClick={deleteReply} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700">Delete Reply</button> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-800">Uploaded Images</p>
          {Array.isArray(review.images) && review.images.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {review.images.map((img, idx) => (
                <button key={idx} type="button" onClick={() => setActiveImage(img)} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img src={img} alt={`Review ${idx + 1}`} className="h-24 w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="inline-flex items-center gap-1 text-sm text-slate-500"><Images className="h-4 w-4" /> No review images uploaded.</p>
          )}
        </div>
      </div>

      {activeImage ? (
        <button type="button" onClick={() => setActiveImage('')} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <img src={activeImage} alt="Review preview" className="max-h-[80vh] max-w-[90vw] rounded-xl border border-white/30 object-contain" />
        </button>
      ) : null}
    </>
  )
}

ReviewShow.layout = (page) => <AdminLayout title="Review Details">{page}</AdminLayout>

