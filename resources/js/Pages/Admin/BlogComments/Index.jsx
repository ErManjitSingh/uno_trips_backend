import { Head, router } from '@inertiajs/react'
import { Fragment, useMemo, useState } from 'react'
import { Check, ChevronDown, MessageCircle, ShieldAlert, Trash2, X } from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'

const suspiciousWords = ['buy now', 'crypto', 'free money', 'click here', 'http://', 'https://']

export default function BlogCommentsIndex({ comments = [] }) {
  const initialItems = Array.isArray(comments) ? comments : comments?.data || []
  const [items, setItems] = useState(initialItems)
  const [selected, setSelected] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [showSpamOnly, setShowSpamOnly] = useState(false)
  const [replies, setReplies] = useState({})
  const [replyDrafts, setReplyDrafts] = useState({})

  const rows = useMemo(
    () =>
      items
        .map((item) => ({
          ...item,
          is_spam:
            item.is_spam ||
            suspiciousWords.some((word) => item.comment.toLowerCase().includes(word)),
        }))
        .filter((item) => (showSpamOnly ? item.is_spam : true)),
    [items, showSpamOnly]
  )

  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id))

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    setSelected(allSelected ? [] : rows.map((row) => row.id))
  }

  const approveComment = (id) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'Approved' } : item)))
    router.put(`/admin/blog-comments/${id}/approve`, {}, { preserveScroll: true })
  }

  const rejectComment = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    router.delete(`/admin/blog-comments/${id}/reject`, { preserveScroll: true })
  }

  const runBulk = (action) => {
    if (!selected.length) return
    if (action === 'approve') {
      setItems((prev) => prev.map((item) => (selected.includes(item.id) ? { ...item, status: 'Approved' } : item)))
    } else {
      setItems((prev) => prev.filter((item) => !selected.includes(item.id)))
    }

    router.post('/admin/blog-comments/bulk', { action, ids: selected }, { preserveScroll: true })
    setSelected([])
  }

  const sendReply = (id) => {
    const text = (replyDrafts[id] || '').trim()
    if (!text) return
    setReplies((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), { id: Date.now(), author: 'Admin', text }],
    }))
    setReplyDrafts((prev) => ({ ...prev, [id]: '' }))
  }

  return (
    <AdminLayout title="Comments Moderation">
      <Head title="Comments Moderation" />

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Comments Moderation Page</h2>
              <p className="mt-1 text-sm text-slate-500">YouTube-style moderation dashboard with quick actions and threaded replies.</p>
            </div>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <input type="checkbox" checked={showSpamOnly} onChange={(e) => setShowSpamOnly(e.target.checked)} />
              Show spam only
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button onClick={() => runBulk('approve')} disabled={!selected.length} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-50">
              Bulk Approve
            </button>
            <button onClick={() => runBulk('reject')} disabled={!selected.length} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50">
              Bulk Reject
            </button>
            <span className="text-xs text-slate-500">{selected.length} selected</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /></th>
                  <th className="px-2 py-2">User Name</th>
                  <th className="px-2 py-2">Comment</th>
                  <th className="px-2 py-2">Post Name</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const expanded = expandedId === row.id
                  return (
                    <Fragment key={row.id}>
                      <tr key={row.id} className={`group rounded-xl border bg-white shadow-sm transition hover:shadow-md ${row.is_spam ? 'border-amber-200' : 'border-slate-200'}`}>
                        <td className="rounded-l-xl px-2 py-3"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleSelect(row.id)} /></td>
                        <td className="px-2 py-3 font-semibold text-slate-800">{row.user_name}</td>
                        <td className="px-2 py-3">
                          <p className={`max-w-lg truncate ${row.is_spam ? 'text-amber-700' : 'text-slate-700'}`}>{row.comment}</p>
                        </td>
                        <td className="px-2 py-3 text-slate-600">{row.post_name}</td>
                        <td className="px-2 py-3 text-slate-600">{row.date ? new Date(row.date).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="px-2 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {row.status}
                          </span>
                          {row.is_spam ? (
                            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                              <ShieldAlert className="h-3 w-3" />Spam
                            </span>
                          ) : null}
                        </td>
                        <td className="rounded-r-xl px-2 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => approveComment(row.id)} className="rounded-lg border border-emerald-200 p-1.5 text-emerald-700 hover:bg-emerald-50"><Check className="h-3.5 w-3.5" /></button>
                            <button onClick={() => rejectComment(row.id)} className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setExpandedId(expanded ? null : row.id)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"><ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`} /></button>
                          </div>
                        </td>
                      </tr>

                      {expanded ? (
                        <tr>
                          <td colSpan={7} className="px-2 pb-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="mb-2 text-sm text-slate-700">{row.comment}</p>
                              <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                                <p className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  Replies
                                </p>
                                {(replies[row.id] || []).length ? (
                                  <div className="space-y-2">
                                    {replies[row.id].map((reply) => (
                                      <div key={reply.id} className="max-w-md rounded-2xl bg-indigo-100 px-3 py-2 text-sm text-indigo-800">
                                        <p className="text-[11px] font-semibold">{reply.author}</p>
                                        {reply.text}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500">No reply yet.</p>
                                )}
                                <div className="flex items-center gap-2">
                                  <input
                                    value={replyDrafts[row.id] || ''}
                                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                                    placeholder="Reply to comment..."
                                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                  />
                                  <button onClick={() => sendReply(row.id)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Reply</button>
                                  <button onClick={() => setExpandedId(null)} className="rounded-lg border border-slate-200 px-2 py-2 text-slate-500"><X className="h-3.5 w-3.5" /></button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!Array.isArray(comments) ? (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={!comments?.prev_page_url}
                onClick={() => comments?.prev_page_url && router.visit(comments.prev_page_url, { preserveScroll: true })}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {comments?.current_page || 1} of {comments?.last_page || 1}
              </span>
              <button
                type="button"
                disabled={!comments?.next_page_url}
                onClick={() => comments?.next_page_url && router.visit(comments.next_page_url, { preserveScroll: true })}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </AdminLayout>
  )
}
