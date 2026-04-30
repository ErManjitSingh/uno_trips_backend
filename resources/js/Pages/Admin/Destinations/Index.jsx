import { Head } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import {
  Check,
  Grid3X3,
  Image as ImageIcon,
  Pencil,
  Plus,
  Star,
  Table2,
  X,
} from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'

const REGIONS = ['North', 'South', 'East', 'West', 'Central', 'North East', 'International']

const defaultForm = {
  id: null,
  name: '',
  slug: '',
  region: 'North',
  heroImage: '',
  galleryImages: '',
  description: '',
  highlightsInput: '',
  highlights: [],
  bestTime: '',
  seoTitle: '',
  seoDescription: '',
  featured: false,
  homepagePriority: 1,
  status: 'Active',
  totalPackages: 0,
  linkedPackages: [],
}

const packageDirectory = [
  { id: 1, name: 'Manali Snow Escape' },
  { id: 2, name: 'Goa Beach Party Trail' },
  { id: 3, name: 'Kashmir Valley Deluxe' },
  { id: 4, name: 'Shimla Heritage Drive' },
  { id: 5, name: 'Kerala Backwater Retreat' },
  { id: 6, name: 'Ladakh Adventure Roadtrip' },
]

const fallbackImages = [
  'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1200&q=80',
]

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export default function DestinationsIndex({ destinations }) {
  const mapped = useMemo(
    () =>
      (destinations?.data || []).map((item, idx) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        region: item.state || 'North',
        heroImage: fallbackImages[idx % fallbackImages.length],
        galleryImages: '',
        description: item.description || item.short_description || '',
        highlightsInput: '',
        highlights: item.short_description
          ? item.short_description
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
          : ['Premium stays', 'Guided support'],
        bestTime: 'Oct - Mar',
        seoTitle: `${item.name} Tour Packages`,
        seoDescription: `Explore premium travel packages for ${item.name}.`,
        featured: Boolean(item.is_featured),
        homepagePriority: idx + 1,
        status: 'Active',
        totalPackages: Math.max(3, (idx + 1) * 4),
        linkedPackages: packageDirectory.slice(0, 2).map((p) => p.id),
      })),
    [destinations]
  )

  const [items, setItems] = useState(mapped)
  const [view, setView] = useState('grid')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)

  const openCreateModal = () => {
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEditModal = (item) => {
    setForm({ ...item, highlightsInput: item.highlights.join(', ') })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setForm(defaultForm)
  }

  const onChangeName = (value) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.id ? prev.slug : slugify(value),
    }))
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    const prepared = {
      ...form,
      highlights: form.highlightsInput
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      galleryImages: form.galleryImages
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
        .join(', '),
      heroImage: form.heroImage || fallbackImages[0],
      totalPackages: form.linkedPackages.length || form.totalPackages || 0,
    }

    if (form.id) {
      setItems((prev) => prev.map((item) => (item.id === form.id ? prepared : item)))
    } else {
      const id = Date.now()
      setItems((prev) => [{ ...prepared, id }, ...prev])
    }

    closeModal()
  }

  const toggleFeatured = (id) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, featured: !item.featured } : item)))
  }

  const toggleStatus = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item
      )
    )
  }

  const resolvePackages = (linkedPackages) =>
    packageDirectory.filter((pkg) => linkedPackages.includes(pkg.id)).map((pkg) => pkg.name)

  return (
    <AdminLayout title="Destinations Management">
      <Head title="Destinations Management" />

      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-6 text-white shadow-2xl premium-hover">
          <div className="absolute -left-20 top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-12 right-8 h-36 w-36 rounded-full bg-cyan-200/25 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Destinations Management</h2>
              <p className="mt-2 max-w-2xl text-sm text-cyan-50 md:text-base">
                Curate premium destination stories with visual-first cards, SEO controls and package linking.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
            >
              <Plus className="h-4 w-4" />
              Add Destination
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white/85 p-4 shadow-xl backdrop-blur-xl md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Manage Destinations</h3>
              <p className="text-xs text-slate-500">Switch between premium cards and table view.</p>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setView('grid')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                  view === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                Grid
              </button>
              <button
                onClick={() => setView('table')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                  view === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Table2 className="h-4 w-4" />
                Table
              </button>
            </div>
          </div>

          {view === 'grid' ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={item.heroImage}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                      <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                      Image heavy preview
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-slate-800">{item.name}</h4>
                        <p className="text-xs text-slate-500">{item.region} Region</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-500">Total Packages</span>
                      <span className="font-semibold text-slate-700">{item.totalPackages}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Quick Edit
                      </button>
                      <button
                        onClick={() => toggleFeatured(item.id)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                          item.featured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Star className="h-3.5 w-3.5" />
                        {item.featured ? 'Featured' : 'Feature'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Destination</th>
                    <th className="px-3 py-2">Region</th>
                    <th className="px-3 py-2">Total Packages</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Quick Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                      <td className="rounded-l-xl px-3 py-3">
                        <div className="flex items-center gap-3">
                          <img src={item.heroImage} alt={item.name} className="h-10 w-14 rounded-lg object-cover" />
                          <div>
                            <p className="font-semibold text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{item.region}</td>
                      <td className="px-3 py-3 font-semibold text-slate-700">{item.totalPackages}</td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleStatus(item.id)}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {item.status}
                        </button>
                      </td>
                      <td className="rounded-r-xl px-3 py-3">
                        <button
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Quick Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-3xl border border-white/30 bg-white/95 p-5 shadow-2xl md:p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  {form.id ? 'Edit Destination' : 'Add Destination'}
                </h3>
                <p className="text-sm text-slate-500">Premium destination profile with SEO and package linking.</p>
              </div>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Destination Name
                <input
                  value={form.name}
                  onChange={(e) => onChangeName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                Slug
                <input
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                Region
                <select
                  value={form.region}
                  onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring"
                >
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600">
                Best Time to Visit
                <input
                  value={form.bestTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, bestTime: e.target.value }))}
                  placeholder="e.g. October to March"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring"
                />
              </label>

              <label className="md:col-span-2 text-sm text-slate-600">
                Hero Image URL
                <input
                  value={form.heroImage}
                  onChange={(e) => setForm((prev) => ({ ...prev, heroImage: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring"
                />
              </label>

              <label className="md:col-span-2 text-sm text-slate-600">
                Gallery Images (comma separated URLs)
                <input
                  value={form.galleryImages}
                  onChange={(e) => setForm((prev) => ({ ...prev, galleryImages: e.target.value }))}
                  placeholder="https://... , https://..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring"
                />
              </label>

              <label className="md:col-span-2 text-sm text-slate-600">
                Description (Rich Text)
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring"
                />
              </label>

              <label className="md:col-span-2 text-sm text-slate-600">
                Highlights (chips input, comma separated)
                <input
                  value={form.highlightsInput}
                  onChange={(e) => setForm((prev) => ({ ...prev, highlightsInput: e.target.value }))}
                  placeholder="Snow views, Family friendly, Adventure sports"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                SEO Title
                <input
                  value={form.seoTitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, seoTitle: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                SEO Description
                <input
                  value={form.seoDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, seoDescription: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                Homepage Priority
                <input
                  type="number"
                  min={1}
                  value={form.homepagePriority}
                  onChange={(e) => setForm((prev) => ({ ...prev, homepagePriority: Number(e.target.value || 1) }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring"
                />
              </label>

              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                />
                Featured destination toggle
              </label>

              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-sm font-semibold text-slate-700">Auto link packages</p>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {packageDirectory.map((pkg) => {
                    const selected = form.linkedPackages.includes(pkg.id)
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            linkedPackages: selected
                              ? prev.linkedPackages.filter((id) => id !== pkg.id)
                              : [...prev.linkedPackages, pkg.id],
                          }))
                        }
                        className={`inline-flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition ${
                          selected
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        <span className="truncate">{pkg.name}</span>
                        {selected ? <Check className="ml-2 h-3.5 w-3.5" /> : null}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Linked: {resolvePackages(form.linkedPackages).join(', ') || 'No packages linked'}
                </p>
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
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:opacity-90"
                >
                  {form.id ? 'Update Destination' : 'Create Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}
