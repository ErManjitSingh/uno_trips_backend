import { Head, Link, router } from '@inertiajs/react'
import { Clock3, Edit3, Trash2 } from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'

function timeAgo(value) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function DraftPostsIndex({ drafts = [] }) {
  const draftRows = Array.isArray(drafts) ? drafts : drafts?.data || []

  const deleteDraft = (id) => {
    router.delete(`/admin/blogs/${id}`, { preserveScroll: true })
  }

  return (
    <AdminLayout title="Draft Posts">
      <Head title="Draft Posts" />

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-800">Draft Posts Page</h2>
          <p className="mt-1 text-sm text-slate-500">Minimal, productivity-first workspace for unfinished posts.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {draftRows.length ? (
            draftRows.map((draft) => (
              <article
                key={draft.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="line-clamp-2 text-base font-semibold text-slate-800">{draft.title || 'Untitled Draft'}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                  {draft.excerpt || draft.content?.slice(0, 160) || 'No preview snippet yet.'}
                </p>

                <div className="mt-4 space-y-2">
                  <p className="text-xs text-slate-500">Last edited: {new Date(draft.updated_at).toLocaleString('en-IN')}</p>
                  <p className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    Auto-saved {timeAgo(draft.updated_at)}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/admin/blogs/create?draft=${draft.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Continue Editing
                  </Link>
                  <button
                    onClick={() => deleteDraft(draft.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Draft
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No drafts available.
            </div>
          )}
        </section>
        {!Array.isArray(drafts) ? (
          <section className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={!drafts?.prev_page_url}
              onClick={() => drafts?.prev_page_url && router.visit(drafts.prev_page_url, { preserveScroll: true })}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {drafts?.current_page || 1} of {drafts?.last_page || 1}
            </span>
            <button
              type="button"
              disabled={!drafts?.next_page_url}
              onClick={() => drafts?.next_page_url && router.visit(drafts.next_page_url, { preserveScroll: true })}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </section>
        ) : null}
      </div>
    </AdminLayout>
  )
}
