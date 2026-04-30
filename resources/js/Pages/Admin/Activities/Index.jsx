import { Head } from '@inertiajs/react'
import { useMemo, useRef, useState } from 'react'
import {
  Activity,
  Compass,
  Droplets,
  Filter,
  Mountain,
  Pencil,
  Plane,
  Plus,
  Snowflake,
  Sparkles,
  Table2,
  Trees,
  Grid3X3,
} from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'

const defaultForm = {
  id: null,
  name: '',
  slug: '',
  short_description: '',
  full_description: '',
  image: '',
  gallery_text: '',
  category: 'Adventure',
  tags: [],
  destination: 'Rishikesh',
  location: '',
  duration: '',
  difficulty: 'Easy',
  age_limit: '',
  best_time: '',
  price_min: '',
  price_max: '',
  price_type: 'Per Person',
  safety_instructions: '',
  included: '',
  excluded: '',
  seo_title: '',
  meta_description: '',
  keywords: '',
  packages_linked: [],
  status: 'Active',
  featured: false,
}

const destinationSuggestions = {
  Rishikesh: ['River Rafting', 'Bungee Jumping', 'Camping by Ganga'],
  Manali: ['Paragliding', 'Snow Activities', 'ATV Ride'],
  Goa: ['Scuba Diving', 'Jet Ski', 'Sunset Cruise'],
}

const categoryIconMap = {
  Adventure: Mountain,
  Water: Droplets,
  Air: Plane,
  Wildlife: Trees,
  Snow: Snowflake,
  Nature: Compass,
}

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const inrRange = (min, max) => `₹${Number(min || 0).toLocaleString('en-IN')} - ₹${Number(max || 0).toLocaleString('en-IN')}`

export default function ActivitiesIndex({
  activities = [],
  categories = [],
  difficulties = [],
  destinations = [],
  tagOptions = [],
  packageOptions = [],
}) {
  const [items, setItems] = useState(activities)
  const [mode, setMode] = useState('grid')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [filters, setFilters] = useState({ category: 'All', location: 'All', difficulty: 'All' })
  const formRef = useRef(null)

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const byCategory = filters.category === 'All' || item.category === filters.category
        const byLocation = filters.location === 'All' || item.location === filters.location
        const byDifficulty = filters.difficulty === 'All' || item.difficulty === filters.difficulty
        return byCategory && byLocation && byDifficulty
      }),
    [items, filters]
  )

  const uniqueLocations = useMemo(() => ['All', ...new Set(items.map((item) => item.location))], [items])
  const suggestions = destinationSuggestions[form.destination] || []

  const openCreate = () => {
    setForm({ ...defaultForm, category: categories[0] || 'Adventure', destination: destinations[0] || 'Rishikesh' })
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const openEdit = (item) => {
    setForm({
      ...item,
      gallery_text: Array.isArray(item.gallery) ? item.gallery.join(', ') : '',
    })
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const closeForm = () => {
    setShowForm(false)
    setForm(defaultForm)
  }

  const onNameChange = (value) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.id ? prev.slug : slugify(value),
    }))
  }

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const togglePackage = (pkg) => {
    setForm((prev) => ({
      ...prev,
      packages_linked: prev.packages_linked.includes(pkg)
        ? prev.packages_linked.filter((p) => p !== pkg)
        : [...prev.packages_linked, pkg],
    }))
  }

  const saveActivity = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    const payload = {
      ...form,
      location: form.location || form.destination,
      gallery: form.gallery_text
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      price_min: Number(form.price_min || 0),
      price_max: Number(form.price_max || 0),
    }

    if (form.id) {
      setItems((prev) => prev.map((item) => (item.id === form.id ? payload : item)))
    } else {
      setItems((prev) => [{ ...payload, id: Date.now() }, ...prev])
    }
    closeForm()
  }

  const toggleStatus = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item
      )
    )
  }

  const toggleFeatured = (id) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, featured: !item.featured } : item)))
  }

  return (
    <AdminLayout title="Activities Manager">
      <Head title="Activities Manager" />

      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 p-6 text-white shadow-2xl">
          <div className="absolute -left-16 top-8 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -right-14 -bottom-10 h-40 w-40 rounded-full bg-cyan-200/20 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Activities Manager</h2>
              <p className="mt-2 max-w-2xl text-sm text-indigo-50 md:text-base">
                Manage adventure and travel activities used across packages.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
            >
              <Plus className="h-4 w-4" />
              Add Activity
            </button>
          </div>
        </section>

        {!showForm ? (
        <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setMode('grid')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${mode === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
              >
                <Grid3X3 className="h-4 w-4" />
                Grid
              </button>
              <button
                onClick={() => setMode('table')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${mode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
              >
                <Table2 className="h-4 w-4" />
                Table
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                Filters
              </span>
              <select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
              >
                {['All', ...categories].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={filters.location}
                onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
              >
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters((prev) => ({ ...prev, difficulty: e.target.value }))}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
              >
                {['All', ...difficulties].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {mode === 'grid' ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => {
                const Icon = categoryIconMap[item.category] || Activity
                return (
                  <article key={item.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative h-44 overflow-hidden">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                      <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <Icon className="h-3.5 w-3.5 text-indigo-600" />
                        {item.category}
                      </div>
                      <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700"
                        >
                          Quick Edit
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 p-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800">{item.name}</h3>
                        <p className="text-xs text-slate-500">{item.location}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-50 px-2.5 py-2 text-slate-600">{inrRange(item.price_min, item.price_max)}</div>
                        <div className="rounded-lg bg-slate-50 px-2.5 py-2 text-slate-600">{item.duration}</div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.difficulty === 'Hard' ? 'bg-rose-100 text-rose-700' : item.difficulty === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.difficulty}
                        </span>
                        <button
                          onClick={() => toggleStatus(item.id)}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                        >
                          {item.status}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Activity Name</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Duration</th>
                    <th className="px-3 py-2">Difficulty</th>
                    <th className="px-3 py-2">Packages Linked</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                      <td className="rounded-l-xl px-3 py-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="px-3 py-3 text-slate-600">{item.category}</td>
                      <td className="px-3 py-3 text-slate-600">{item.location}</td>
                      <td className="px-3 py-3 text-slate-700">{inrRange(item.price_min, item.price_max)}</td>
                      <td className="px-3 py-3 text-slate-600">{item.duration}</td>
                      <td className="px-3 py-3 text-slate-600">{item.difficulty}</td>
                      <td className="px-3 py-3 text-slate-600">{item.packages_linked.length}</td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleStatus(item.id)}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                        >
                          {item.status}
                        </button>
                      </td>
                      <td className="rounded-r-xl px-3 py-3">
                        <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        ) : null}
      </div>

      {showForm ? (
      <section ref={formRef} className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-xl backdrop-blur-xl md:p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-800">{form.id ? 'Edit Activity' : 'Add Activity'}</h3>
              <p className="text-sm text-slate-500">Professional activity marketplace configuration</p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Back to Activities
            </button>
          </div>

            <form onSubmit={saveActivity} className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-slate-800">Basic Info</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-600">Activity Name
                    <input value={form.name} onChange={(e) => onNameChange(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" required />
                  </label>
                  <label className="text-sm text-slate-600">Slug
                    <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <label className="md:col-span-2 text-sm text-slate-600">Short Description
                    <input value={form.short_description} onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <label className="md:col-span-2 text-sm text-slate-600">Full Description (rich text)
                    <textarea rows={4} value={form.full_description} onChange={(e) => setForm((p) => ({ ...p, full_description: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-slate-800">Media</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="md:col-span-2 text-sm text-slate-600">Featured Image
                    <input value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <label className="md:col-span-2 text-sm text-slate-600">Gallery Upload (comma-separated URLs)
                    <input value={form.gallery_text} onChange={(e) => setForm((p) => ({ ...p, gallery_text: e.target.value }))} placeholder="https://... , https://..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-slate-800">Classification</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-600">Category
                    <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5">
                      {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-slate-600">Destination
                    <select value={form.destination} onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value, location: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5">
                      {destinations.map((des) => <option key={des} value={des}>{des}</option>)}
                    </select>
                  </label>
                  <label className="md:col-span-2 text-sm text-slate-600">Location
                    <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-indigo-700">Smart Suggestions</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.length ? suggestions.map((s) => (
                        <button key={s} type="button" onClick={() => onNameChange(s)} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 shadow-sm">
                          {s}
                        </button>
                      )) : <p className="text-xs text-indigo-600">No suggestion for this destination yet.</p>}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="mb-2 text-sm text-slate-600">Tags (multi-select)</p>
                    <div className="flex flex-wrap gap-2">
                      {tagOptions.map((tag) => (
                        <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${form.tags.includes(tag) ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-slate-800">Details</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-600">Duration
                    <input value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} placeholder="2 hours" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <label className="text-sm text-slate-600">Difficulty Level
                    <select value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5">
                      {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-slate-600">Age Limit
                    <input value={form.age_limit} onChange={(e) => setForm((p) => ({ ...p, age_limit: e.target.value }))} placeholder="14+" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <label className="text-sm text-slate-600">Best Time to Do
                    <input value={form.best_time} onChange={(e) => setForm((p) => ({ ...p, best_time: e.target.value }))} placeholder="Oct to Mar" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-slate-800">Pricing</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="text-sm text-slate-600">Starting Price
                    <input type="number" min={0} value={form.price_min} onChange={(e) => setForm((p) => ({ ...p, price_min: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <label className="text-sm text-slate-600">Max Price
                    <input type="number" min={0} value={form.price_max} onChange={(e) => setForm((p) => ({ ...p, price_max: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <label className="text-sm text-slate-600">Price Type
                    <select value={form.price_type} onChange={(e) => setForm((p) => ({ ...p, price_type: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5">
                      <option value="Per Person">Per Person</option>
                      <option value="Per Group">Per Group</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-slate-800">Safety & Info</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-600">Safety Instructions
                    <textarea rows={3} value={form.safety_instructions} onChange={(e) => setForm((p) => ({ ...p, safety_instructions: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <label className="text-sm text-slate-600">Included
                    <textarea rows={3} value={form.included} onChange={(e) => setForm((p) => ({ ...p, included: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <label className="md:col-span-2 text-sm text-slate-600">Excluded
                    <textarea rows={3} value={form.excluded} onChange={(e) => setForm((p) => ({ ...p, excluded: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-slate-800">SEO Section</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-600">SEO Title
                    <input value={form.seo_title} onChange={(e) => setForm((p) => ({ ...p, seo_title: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <label className="text-sm text-slate-600">Keywords
                    <input value={form.keywords} onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                  <label className="md:col-span-2 text-sm text-slate-600">Meta Description
                    <textarea rows={3} value={form.meta_description} onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-slate-800">Package Integration</h4>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {packageOptions.map((pkg) => (
                    <button
                      key={pkg}
                      type="button"
                      onClick={() => togglePackage(pkg)}
                      className={`rounded-lg border px-3 py-2 text-xs transition ${form.packages_linked.includes(pkg) ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50'}`}
                    >
                      {pkg}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">Used in {form.packages_linked.length} packages</p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-slate-800">Status Control</h4>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.status === 'Active'} onChange={(e) => setForm((p) => ({ ...p, status: e.target.checked ? 'Active' : 'Draft' }))} />
                    Active / Draft
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))} />
                    Featured Activity
                  </label>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Marketplace-ready setup
                  </span>
                </div>
              </section>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90">
                  {form.id ? 'Update Activity' : 'Create Activity'}
                </button>
              </div>
            </form>
      </section>
      ) : null}
    </AdminLayout>
  )
}
