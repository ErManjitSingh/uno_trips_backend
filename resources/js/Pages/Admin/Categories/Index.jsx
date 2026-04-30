import { Head, router, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  CloudRain,
  Compass,
  GripVertical,
  MapPinned,
  Mountain,
  Palette,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Pencil,
  X,
} from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'

const CATEGORY_TYPES = ['Travel Style', 'Destination', 'Season', 'Marketing']

const ICON_LIBRARY = {
  Mountain,
  MapPinned,
  CloudRain,
  Sparkles,
  Compass,
  Tag,
}

const defaultForm = {
  id: null,
  name: '',
  slug: '',
  type: 'Travel Style',
  icon: 'Tag',
  color: '#6366F1',
  description: '',
  seo_title: '',
  seo_description: '',
  status: 'Active',
  featured: false,
  parent_id: '',
}

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export default function CategoriesIndex({ categories = [] }) {
  const { props } = usePage()
  const [items, setItems] = useState(categories)
  useEffect(() => {
    setItems(categories)
  }, [categories])

  const [showModal, setShowModal] = useState(false)
  const [dragId, setDragId] = useState(null)
  const [form, setForm] = useState(defaultForm)

  const parentOptions = useMemo(
    () => items.filter((item) => item.id !== form.id),
    [items, form.id]
  )

  const openCreateModal = () => {
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEditModal = (item) => {
    setForm({
      ...item,
      parent_id: item.parent_id ?? '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setForm(defaultForm)
  }

  const onNameChange = (value) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.id ? prev.slug : slugify(value),
    }))
  }

  const saveCategory = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      slug: form.slug?.trim() || slugify(form.name),
      type: form.type,
      icon: form.icon,
      color: form.color,
      description: form.description || '',
      seo_title: form.seo_title || '',
      seo_description: form.seo_description || '',
      status: form.status || 'Active',
      featured: Boolean(form.featured),
      parent_id: form.parent_id || null,
    }

    if (form.id) {
      router.put(`/admin/categories/${form.id}`, payload, {
        preserveScroll: true,
        onSuccess: () => closeModal(),
      })
      return
    }

    router.post('/admin/categories', payload, {
      preserveScroll: true,
      onSuccess: () => closeModal(),
    })
  }

  const removeCategory = (id) => {
    if (!window.confirm('Delete this category?')) return
    router.delete(`/admin/categories/${id}`, {
      preserveScroll: true,
    })
  }

  const persistCategoryPatch = (item, patch) => {
    router.put(
      `/admin/categories/${item.id}`,
      {
        name: item.name,
        slug: item.slug,
        type: item.type,
        icon: item.icon,
        color: item.color,
        description: item.description || '',
        seo_title: item.seo_title || '',
        seo_description: item.seo_description || '',
        status: item.status || 'Active',
        featured: Boolean(item.featured),
        parent_id: item.parent_id || null,
        ...patch,
      },
      { preserveScroll: true }
    )
  }

  const toggleFeatured = (id) => {
    const row = items.find((item) => item.id === id)
    if (!row) return
    persistCategoryPatch(row, { featured: !row.featured })
  }

  const toggleStatus = (id) => {
    const row = items.find((item) => item.id === id)
    if (!row) return
    persistCategoryPatch(row, { status: row.status === 'Active' ? 'Inactive' : 'Active' })
  }

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) return

    setItems((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === dragId)
      const targetIndex = prev.findIndex((item) => item.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) return prev

      const cloned = [...prev]
      const [moved] = cloned.splice(sourceIndex, 1)
      cloned.splice(targetIndex, 0, moved)
      return cloned
    })

    setDragId(null)
  }

  const getParentName = (parentId) => items.find((item) => item.id === parentId)?.name

  return (
    <AdminLayout title="Categories Manager">
      <Head title="Categories Manager" />

      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-400 p-6 text-white shadow-2xl premium-hover">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-16 left-12 h-36 w-36 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Categories Manager</h2>
              <p className="mt-2 max-w-2xl text-sm text-indigo-50 md:text-base">
                Organize packages smartly for filters, SEO and homepage sections.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
            >
              <Plus className="h-4 w-4" />
              Add New Category
            </button>
          </div>
          {props.flash?.success ? <p className="relative mt-3 text-sm text-emerald-100">{props.flash.success}</p> : null}
          {props.flash?.error ? <p className="relative mt-3 text-sm text-rose-100">{props.flash.error}</p> : null}
        </section>

        <section className="premium-glass rounded-3xl border border-white/30 bg-white/80 p-4 shadow-xl backdrop-blur-2xl md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Category Table</h3>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{items.length} categories</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Category Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Package Count</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const Icon = ICON_LIBRARY[item.icon] || Tag
                  const parentName = getParentName(item.parent_id)
                  return (
                    <tr
                      key={item.id}
                      draggable
                      onDragStart={() => setDragId(item.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(item.id)}
                      className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <td className="rounded-l-2xl px-3 py-3">
                        <div className="flex items-center gap-3">
                          <button className="cursor-grab text-slate-400">
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <span
                            className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm"
                            style={{ backgroundColor: item.color }}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800">{item.name}</p>
                            {parentName ? <p className="text-xs text-slate-500">Child of {parentName}</p> : <p className="text-xs text-slate-500">Top-level category</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">{item.type}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{item.slug}</td>
                      <td className="px-3 py-3 font-medium text-slate-700">{item.package_count}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => toggleStatus(item.id)}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {item.status}
                          </button>
                          <button
                            onClick={() => toggleFeatured(item.id)}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.featured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {item.featured ? 'Featured' : 'Not Featured'}
                          </button>
                        </div>
                      </td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => removeCategory(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-white/40 bg-white/90 p-5 shadow-2xl md:p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">{form.id ? 'Edit Category' : 'Add New Category'}</h3>
                <p className="text-sm text-slate-500">Configure structure, SEO and visual identity.</p>
              </div>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveCategory} className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Category Name
                <input
                  value={form.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 outline-none ring-indigo-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                Slug
                <input
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 outline-none ring-indigo-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                Category Type
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 outline-none ring-indigo-300 focus:ring"
                >
                  {CATEGORY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600">
                Parent Category
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, parent_id: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 outline-none ring-indigo-300 focus:ring"
                >
                  <option value="">No Parent (Top-level)</option>
                  {parentOptions.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600">
                Icon Picker
                <select
                  value={form.icon}
                  onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 outline-none ring-indigo-300 focus:ring"
                >
                  {Object.keys(ICON_LIBRARY).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600">
                Color Picker
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5">
                  <Palette className="h-4 w-4 text-slate-400" />
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="text-xs font-semibold text-slate-600">{form.color}</span>
                </div>
              </label>

              <label className="md:col-span-2 text-sm text-slate-600">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 outline-none ring-indigo-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                SEO Title
                <input
                  value={form.seo_title}
                  onChange={(e) => setForm((prev) => ({ ...prev, seo_title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 outline-none ring-indigo-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                SEO Description
                <input
                  value={form.seo_description}
                  onChange={(e) => setForm((prev) => ({ ...prev, seo_description: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 outline-none ring-indigo-300 focus:ring"
                />
              </label>

              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                />
                Toggle Featured Category
              </label>

              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600">
                <span className="mr-2 text-xs font-semibold text-slate-500">Live preview badge:</span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: form.color }}
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {form.name || 'Category Name'}
                </span>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90"
                >
                  {form.id ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}
