import { Head, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import AdminLayout from '../../../Layouts/AdminLayout'
import ReviewCard from '../../../Components/Reviews/ReviewCard'
import ReviewTable from '../../../Components/Reviews/ReviewTable'

export default function ReviewsIndex({ reviews, filters, analytics }) {
  const rows = reviews?.data || []
  const [selectedIds, setSelectedIds] = useState([])

  const distribution = useMemo(() => analytics?.distribution || {}, [analytics?.distribution])

  const updateFilters = (patch) => {
    router.get('/admin/reviews', { ...filters, ...patch }, { preserveState: true, replace: true })
  }

  const patchReview = (id, type) => {
    router.put(`/admin/reviews/${id}/${type}`, {}, { preserveScroll: true })
  }

  const deleteReview = (id) => {
    router.delete(`/admin/reviews/${id}`, { preserveScroll: true })
  }

  const runBulk = (action) => {
    if (!selectedIds.length) return
    router.post('/admin/reviews/bulk-action', { ids: selectedIds, action }, { preserveScroll: true })
    setSelectedIds([])
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (rows.every((r) => selectedIds.includes(r.id))) {
      setSelectedIds([])
      return
    }
    setSelectedIds(rows.map((r) => r.id))
  }

  return (
    <>
      <Head title="Review Management" />
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Total Reviews</p><p className="mt-1 text-2xl font-semibold text-slate-800">{analytics?.total_reviews || 0}</p></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"><p className="text-xs text-amber-700">Average Rating</p><p className="mt-1 text-2xl font-semibold text-amber-700">{analytics?.average_rating || 0}</p></div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm md:col-span-2">
            <p className="text-xs text-blue-700">Rating Distribution</p>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="rounded-lg bg-white px-2 py-1 text-center">
                  <p className="text-[11px] text-slate-500">{star}★</p>
                  <p className="text-sm font-semibold text-slate-700">{distribution?.[star] || 0}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-2 md:grid-cols-5">
            <input defaultValue={filters.search} onChange={(e) => updateFilters({ search: e.target.value })} placeholder="Search by user/package/keyword..." className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 md:col-span-2" />
            <select value={filters.status || ''} onChange={(e) => updateFilters({ status: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"><option value="">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="spam">Spam</option></select>
            <select value={filters.rating || ''} onChange={(e) => updateFilters({ rating: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"><option value="">All Ratings</option>{[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} Stars</option>)}</select>
            <select value={filters.verified || ''} onChange={(e) => updateFilters({ verified: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"><option value="">All Verification</option><option value="yes">Verified</option><option value="no">Non-verified</option></select>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <select value={filters.sort || 'latest'} onChange={(e) => updateFilters({ sort: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"><option value="latest">Latest</option><option value="highest_rating">Highest Rating</option><option value="most_helpful">Most Helpful</option></select>
            <button type="button" onClick={() => runBulk('approve')} className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 disabled:opacity-50" disabled={!selectedIds.length}>Bulk Approve</button>
            <button type="button" onClick={() => runBulk('reject')} className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 disabled:opacity-50" disabled={!selectedIds.length}>Bulk Reject</button>
            <button type="button" onClick={() => runBulk('delete')} className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700 disabled:opacity-50" disabled={!selectedIds.length}>Bulk Delete</button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {(analytics?.recent_reviews || []).map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ReviewTable
            rows={rows}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onApprove={(id) => patchReview(id, 'approve')}
            onReject={(id) => patchReview(id, 'reject')}
            onSpam={(id) => patchReview(id, 'spam')}
            onDelete={deleteReview}
          />
        </div>
      </div>
    </>
  )
}

ReviewsIndex.layout = (page) => <AdminLayout title="Review Management">{page}</AdminLayout>

