import { Head, router } from '@inertiajs/react'
import AdminLayout from '../../../Layouts/AdminLayout'

export default function ApprovalsIndex({ pendingPackages, pendingBlogs }) {
  const submitBulkPackages = () => {
    const ids = pendingPackages?.data?.map((p) => p.id) || []
    if (!window.confirm(`Approve all ${ids.length} pending package(s)?`)) return
    router.post('/admin/approvals/packages/bulk-approve', { ids })
  }

  const submitBulkBlogs = () => {
    const ids = pendingBlogs?.data?.map((b) => b.id) || []
    if (!window.confirm(`Approve all ${ids.length} pending blog(s)?`)) return
    router.post('/admin/approvals/blogs/bulk-approve', { ids })
  }

  return (
    <AdminLayout title="Approvals">
      <Head title="Content approvals" />
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-amber-50">Approvals</h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-amber-100/70">Review executive submissions before they go live.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitBulkPackages}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100"
            >
              Bulk approve packages
            </button>
            <button
              type="button"
              onClick={submitBulkBlogs}
              className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900 shadow-sm dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100"
            >
              Bulk approve blogs
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/80">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-amber-50">Pending packages</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-amber-100 text-left text-xs uppercase text-stone-500 dark:border-stone-700 dark:text-amber-200/70">
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Author</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPackages?.data?.length ? (
                  pendingPackages.data.map((p) => (
                    <tr key={p.id} className="border-b border-amber-50 dark:border-stone-800">
                      <td className="py-2 font-medium text-stone-800 dark:text-amber-50">{p.title}</td>
                      <td className="py-2 text-stone-600 dark:text-amber-100/80">{p.creator?.email || '—'}</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          className="mr-2 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                          onClick={() => router.post(`/admin/approvals/packages/${p.id}/approve`, {})}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white"
                          onClick={() => {
                            const remarks = window.prompt('Rejection note (optional)') || ''
                            router.post(`/admin/approvals/packages/${p.id}/reject`, { remarks })
                          }}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-stone-500">
                      No pending packages.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/80">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-amber-50">Pending blogs</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-amber-100 text-left text-xs uppercase text-stone-500 dark:border-stone-700 dark:text-amber-200/70">
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Author</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBlogs?.data?.length ? (
                  pendingBlogs.data.map((b) => (
                    <tr key={b.id} className="border-b border-amber-50 dark:border-stone-800">
                      <td className="py-2 font-medium text-stone-800 dark:text-amber-50">{b.title}</td>
                      <td className="py-2 text-stone-600 dark:text-amber-100/80">{b.author?.email || '—'}</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          className="mr-2 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                          onClick={() => router.post(`/admin/approvals/blogs/${b.id}/approve`, {})}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white"
                          onClick={() => {
                            const remarks = window.prompt('Rejection note (optional)') || ''
                            router.post(`/admin/approvals/blogs/${b.id}/reject`, { remarks })
                          }}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-stone-500">
                      No pending blogs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
