import { Head, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { Copy, Eye, GripVertical, Plus, Search, Sparkles, WandSparkles } from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'

export default function ListingPagesIndex({ listingPages, filters }) {
  const rows = listingPages?.data || []
  const [dragId, setDragId] = useState(null)
  const [selected, setSelected] = useState([])

  const onSearch = (value) => {
    router.get('/admin/listing-pages', { ...filters, search: value || undefined }, { preserveState: true, replace: true })
  }

  const toggleStatus = (slug) => router.put(`/admin/listing-pages/${slug}/toggle-status`, {}, { preserveScroll: true })
  const duplicate = (slug) => router.post(`/admin/listing-pages/${slug}/duplicate`, {}, { preserveScroll: true })
  const remove = (slug) => {
    if (window.confirm('Delete this listing page?')) {
      router.delete(`/admin/listing-pages/${slug}`, { preserveScroll: true })
    }
  }

  const sortedIds = useMemo(() => rows.map((r) => r.id), [rows])
  const allSelected = rows.length > 0 && selected.length === rows.length
  const toggleSelected = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  const toggleSelectAll = () => {
    setSelected(allSelected ? [] : rows.map((r) => r.id))
  }
  const bulkStatus = (status) => {
    if (!selected.length) return
    router.put('/admin/listing-pages/bulk-status', { ids: selected, status }, { preserveScroll: true })
  }
  const bulkDelete = () => {
    if (!selected.length) return
    if (!window.confirm(`Delete ${selected.length} selected listing page(s)?`)) return
    router.delete('/admin/listing-pages/bulk-delete', {
      data: { ids: selected },
      preserveScroll: true,
      onSuccess: () => setSelected([]),
    })
  }
  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) return
    const ids = [...sortedIds]
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    ids.splice(to, 0, ids.splice(from, 1)[0])
    router.put('/admin/listing-pages/reorder', { ids }, { preserveScroll: true })
    setDragId(null)
  }

  return (
    <AdminLayout title="Listing Pages">
      <Head title="Listing Pages" />
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-600 to-blue-500 p-5 text-white shadow-lg">
          <div className="absolute -right-4 top-0 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">All Listing Pages</h2>
              <p className="mt-1 text-sm text-indigo-100">
                Manage high-converting dynamic pages with premium controls, SEO, and curation workflows.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur">
              <WandSparkles className="h-4 w-4" />
              {rows.length} pages
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                defaultValue={filters?.search || ''}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search listing pages"
                className="w-full rounded-xl border border-slate-200 px-9 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => router.post('/admin/listing-pages/seed-demo', {}, { preserveScroll: true })}
                className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Add Demo Data
              </button>
              <button onClick={() => bulkStatus('active')} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">Bulk Enable</button>
              <button onClick={() => bulkStatus('inactive')} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">Bulk Disable</button>
              <button onClick={bulkDelete} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">Bulk Delete</button>
              <button onClick={() => router.get('/admin/listing-pages/create')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500">
                <Plus className="h-4 w-4" /> Create Listing Page
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2">Order</th>
                <th className="px-2 py-2">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-12 text-center text-sm text-slate-500">
                    No listing pages yet. Click <span className="font-semibold text-indigo-600">Add Demo Data</span> to test full CRUD quickly.
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr
                  key={row.id}
                  draggable
                  onDragStart={() => setDragId(row.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(row.id)}
                  className="group border-t border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-2 py-3"><GripVertical className="h-4 w-4 text-slate-300 group-hover:text-slate-500" /></td>
                  <td className="px-2 py-3"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleSelected(row.id)} /></td>
                  <td className="px-2 py-3">
                    <p className="font-medium text-slate-800">{row.title}</p>
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-500">/packages/{row.slug}</td>
                  <td className="px-2 py-3">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">{row.page_type}</span>
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => toggleStatus(row.slug)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : row.status === 'scheduled'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {row.status}
                    </button>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => router.get(`/admin/listing-pages/${row.slug}/edit`)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100">Edit</button>
                      <button onClick={() => duplicate(row.slug)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs transition hover:bg-slate-100"><Copy className="h-3.5 w-3.5" /></button>
                      <a href={`/packages/${row.slug}?preview=1`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs transition hover:bg-slate-100"><Eye className="h-3.5 w-3.5" /></a>
                      <button onClick={() => remove(row.slug)} className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </AdminLayout>
  )
}
