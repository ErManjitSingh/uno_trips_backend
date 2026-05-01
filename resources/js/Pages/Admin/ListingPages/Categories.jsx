import { Head, router, usePage } from '@inertiajs/react'
import { Layers, Plus, Search, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../../Layouts/AdminLayout'

const defaultForm = { id: null, name: '', slug: '', status: 'active' }

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export default function ListingPageCategories({ categories = [], filters = {} }) {
  const { url } = usePage()
  const rows = categories?.data || []
  const [form, setForm] = useState(defaultForm)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(filters.search || '')
  const [sort, setSort] = useState(filters.sort || 'name_asc')

  useEffect(() => {
    const qs = url.includes('?') ? url.slice(url.indexOf('?')) : ''
    const params = new URLSearchParams(qs)
    if (params.get('action') !== 'new') return
    setForm({ ...defaultForm })
    setOpen(true)
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/admin/listing-categories')
    }
  }, [url])

  const filtered = useMemo(
    () => rows.filter((row) =>
      [row.name, row.slug, row.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
    [rows, search],
  )

  const applyFilters = (nextSearch, nextSort) => {
    router.get('/admin/listing-categories', {
      search: nextSearch || undefined,
      sort: nextSort || 'name_asc',
    }, { preserveState: true, replace: true })
  }

  const toggleStatus = (id) => {
    router.put(`/admin/listing-categories/${id}/toggle-status`, {}, { preserveScroll: true })
  }

  const remove = (id) => {
    if (!window.confirm('Delete this listing category?')) return
    router.delete(`/admin/listing-categories/${id}`, { preserveScroll: true })
  }

  const save = (e) => {
    e.preventDefault()
    const payload = { name: form.name, slug: form.slug || slugify(form.name), status: form.status }
    if (form.id) {
      router.put(`/admin/listing-categories/${form.id}`, payload, { preserveScroll: true, onSuccess: () => setOpen(false) })
      return
    }
    router.post('/admin/listing-categories', payload, { preserveScroll: true, onSuccess: () => setOpen(false) })
  }

  return (
    <AdminLayout title="Listing Categories">
      <Head title="Listing Categories" />
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-600 to-blue-500 p-5 text-white shadow-lg">
          <div className="absolute -right-4 top-2 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Listing Categories</h2>
              <p className="mt-1 text-sm text-indigo-100">
                Organize listing pages with clean taxonomy for better discoverability and admin control.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur">
              <Layers className="h-4 w-4" />
              {categories.length} categories
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  const value = e.target.value
                  setSearch(value)
                  applyFilters(value, sort)
                }}
                placeholder="Search categories"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => {
                const value = e.target.value
                setSort(value)
                applyFilters(search, value)
              }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="pages_desc">Most Pages</option>
              <option value="pages_asc">Least Pages</option>
            </select>
            <button
              onClick={() => { setForm(defaultForm); setOpen(true) }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Listing Pages</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-12 text-center text-sm text-slate-500">
                    <div className="inline-flex items-center gap-2 text-indigo-600">
                      <Sparkles className="h-4 w-4" />
                      No categories found
                    </div>
                  </td>
                </tr>
              ) : null}
              {filtered.map((row) => (
                <tr key={row.id} className="group border-t border-slate-100 transition hover:bg-slate-50">
                  <td className="px-2 py-3">
                    <p className="font-medium text-slate-800">{row.name}</p>
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-500">{row.slug}</td>
                  <td className="px-2 py-3">
                    <button onClick={() => toggleStatus(row.id)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {row.status}
                    </button>
                  </td>
                  <td className="px-2 py-3 font-medium text-slate-700">{row.listing_pages_count}</td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => { setForm(row); setOpen(true) }}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(row.id)}
                      className="ml-2 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories?.links?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.links.map((link, idx) => (
                <button
                  key={`${link.url}-${idx}`}
                  disabled={!link.url}
                  onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                  className={`rounded-lg border px-2.5 py-1 text-xs ${
                    link.active ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
                  } disabled:opacity-50`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h4 className="text-lg font-semibold text-slate-800">{form.id ? 'Edit Category' : 'Create Category'}</h4>
                <p className="mt-0.5 text-xs text-slate-500">Define category identity for listing page grouping.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">
                Name
                <input
                  placeholder="e.g. Destination Focused Pages"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: p.id ? p.slug : slugify(e.target.value) }))}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Slug
                <input
                  placeholder="e.g. destination-focused-pages"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500">Save Category</button>
            </div>
          </form>
        </div>
      ) : null}
    </AdminLayout>
  )
}
