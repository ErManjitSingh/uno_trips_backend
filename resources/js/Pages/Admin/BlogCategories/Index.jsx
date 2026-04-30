import { Head, router, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import { GripVertical, Pencil, Star, Trash2 } from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'

const defaultForm = {
  id: null,
  name: '',
  slug: '',
  description: '',
  seo_title: '',
  seo_description: '',
  parent_id: '',
  status: 'Active',
  featured: false,
}

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export default function BlogCategoriesIndex({ categories = [] }) {
  const { props } = usePage()
  const [items, setItems] = useState(categories)
  const [form, setForm] = useState(defaultForm)
  const [dragId, setDragId] = useState(null)

  useEffect(() => {
    setItems(categories)
  }, [categories])

  const parentOptions = useMemo(
    () => items.filter((item) => item.id !== form.id),
    [items, form.id]
  )

  const openEdit = (row) => {
    setForm({
      ...row,
      parent_id: row.parent_id ?? '',
    })
  }

  const resetForm = () => setForm(defaultForm)

  const saveCategory = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      slug: form.slug?.trim() || slugify(form.name),
    }

    if (form.id) {
      router.put(`/admin/blog-categories/${form.id}`, payload, {
        preserveScroll: true,
        onSuccess: () => resetForm(),
      })
      return
    }

    router.post('/admin/blog-categories', payload, {
      preserveScroll: true,
      onSuccess: () => resetForm(),
    })
  }

  const removeCategory = (id) => {
    if (!window.confirm('Delete this category?')) return
    router.delete(`/admin/blog-categories/${id}`, {
      preserveScroll: true,
    })
  }

  const toggleStatus = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' }
          : item
      )
    )
  }

  const toggleFeatured = (id) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, featured: !item.featured } : item)))
  }

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) return

    setItems((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === dragId)
      const targetIndex = prev.findIndex((item) => item.id === targetId)
      if (sourceIndex < 0 || targetIndex < 0) return prev

      const clone = [...prev]
      const [moved] = clone.splice(sourceIndex, 1)
      clone.splice(targetIndex, 0, moved)
      return clone.map((item, idx) => ({ ...item, position: idx + 1 }))
    })
    setDragId(null)
  }

  const getParentName = (parentId) => items.find((item) => item.id === parentId)?.name

  return (
    <AdminLayout title="Blog Categories">
      <Head title="Blog Categories" />

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-800">Blog Categories Management</h2>
          <p className="mt-1 text-sm text-slate-500">Simple, premium controls for blog taxonomy and organization.</p>
          {props.flash?.success ? <p className="mt-2 text-sm text-emerald-600">{props.flash.success}</p> : null}
          {props.flash?.error ? <p className="mt-2 text-sm text-rose-600">{props.flash.error}</p> : null}
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Add Category</h3>
          <form onSubmit={saveCategory} className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              Name
              <input
                value={form.name}
                onChange={(e) => {
                  const value = e.target.value
                  setForm((prev) => ({ ...prev, name: value, slug: prev.id ? prev.slug : slugify(value) }))
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm text-slate-600">
              Slug
              <input
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="md:col-span-2 text-sm text-slate-600">
              Description
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-600">
              SEO Title
              <input
                value={form.seo_title}
                onChange={(e) => setForm((prev) => ({ ...prev, seo_title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-600">
              Parent Category
              <select
                value={form.parent_id}
                onChange={(e) => setForm((prev) => ({ ...prev, parent_id: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="">No Parent</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 text-sm text-slate-600">
              SEO Description
              <textarea
                rows={2}
                value={form.seo_description}
                onChange={(e) => setForm((prev) => ({ ...prev, seo_description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                />
                Featured category
              </label>
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.status === 'Active'}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.checked ? 'Active' : 'Inactive' }))}
                />
                Active status
              </label>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  Reset
                </button>
                <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">
                  {form.id ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Categories Table</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2">Category Name</th>
                  <th className="px-2 py-2">Slug</th>
                  <th className="px-2 py-2">Total Posts</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    draggable
                    onDragStart={() => setDragId(item.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(item.id)}
                    className="group rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <td className="rounded-l-xl px-2 py-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.featured ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Featured</span> : null}
                            {getParentName(item.parent_id) ? <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">Child of {getParentName(item.parent_id)}</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Top-level</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{item.slug}</td>
                    <td className="px-2 py-3 font-semibold text-slate-700">{item.posts_count}</td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className="rounded-r-xl px-2 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(item)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => toggleFeatured(item.id)} className={`rounded-lg border p-1.5 ${item.featured ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                          <Star className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeCategory(item.id)} className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
