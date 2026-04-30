import { Head } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { CalendarDays, Clock3, Gift, Plus, Sparkles, Tag, Trophy, X } from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'

const defaultForm = {
  id: null,
  title: '',
  slug: '',
  banner: '',
  description: '',
  discountType: 'Percentage',
  discountValue: '',
  packages: [],
  startDate: '',
  endDate: '',
  ctaText: 'Book Now',
  homepageBanner: false,
  priority: 1,
  status: 'Active',
}

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

function formatDate(value) {
  if (!value) return '--'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function buildCountdown(endDate) {
  if (!endDate) return 'Set end date to preview countdown'
  const now = new Date()
  const end = new Date(endDate)
  const diff = end.getTime() - now.getTime()
  if (diff <= 0) return 'Offer ended'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  return `${days}d ${hours}h left`
}

export default function SeasonalOffersIndex({ offers = [], packageOptions = [] }) {
  const mappedOffers = useMemo(
    () =>
      offers.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        banner: item.banner,
        description: item.description || '',
        discountType: item.discount_type === 'Flat' ? 'Flat' : 'Percentage',
        discountValue: item.discount_value ?? '',
        discountTag: item.discount_tag,
        packages: item.linked_packages || [],
        startDate: item.start_date,
        endDate: item.end_date,
        ctaText: item.cta_text || 'Book Offer',
        homepageBanner: Boolean(item.homepage_banner),
        priority: item.priority || 1,
        status: item.status || 'Active',
      })),
    [offers]
  )

  const [items, setItems] = useState(mappedOffers)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)

  const openCreate = () => {
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEdit = (item) => {
    setForm(item)
    setShowModal(true)
  }

  const closeModal = () => {
    setForm(defaultForm)
    setShowModal(false)
  }

  const onTitleChange = (value) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: prev.id ? prev.slug : slugify(value),
    }))
  }

  const togglePackage = (pkg) => {
    setForm((prev) => ({
      ...prev,
      packages: prev.packages.includes(pkg) ? prev.packages.filter((item) => item !== pkg) : [...prev.packages, pkg],
    }))
  }

  const toggleStatus = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'Active' ? 'Draft' : 'Active' }
          : item
      )
    )
  }

  const saveOffer = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const discountTag =
      form.discountType === 'Flat'
        ? `₹${form.discountValue || 0} OFF`
        : `${form.discountValue || 0}% OFF`

    const payload = {
      ...form,
      discountTag,
    }

    if (form.id) {
      setItems((prev) => prev.map((item) => (item.id === form.id ? payload : item)))
    } else {
      setItems((prev) => [{ ...payload, id: Date.now() }, ...prev])
    }

    closeModal()
  }

  return (
    <AdminLayout title="Seasonal Offers">
      <Head title="Seasonal Offers" />

      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-400 p-6 text-white shadow-2xl">
          <div className="absolute -left-14 top-10 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-100/30 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Seasonal Offers</h2>
              <p className="mt-2 max-w-2xl text-sm text-rose-50 md:text-base">
                Marketing-focused festive campaign manager with big banners, countdowns and priority slots.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
            >
              <Plus className="h-4 w-4" />
              Add Offer
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Offer Cards</h3>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
              {items.length} campaigns
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={item.banner}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                  <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    <Tag className="h-3.5 w-3.5" />
                    {item.discountTag}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-200">{item.description}</p>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="mb-1 flex items-center gap-1 text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Valid Range
                      </p>
                      <p className="font-semibold text-slate-700">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="mb-1 flex items-center gap-1 text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        Countdown
                      </p>
                      <p className="font-semibold text-rose-600">{buildCountdown(item.endDate)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold text-slate-500">Linked Packages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.packages.length ? (
                        item.packages.map((pkg) => (
                          <span key={pkg} className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-700">
                            {pkg}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No packages linked</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </button>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <Trophy className="h-3.5 w-3.5" />
                        Priority {item.priority}
                      </span>
                      {item.homepageBanner ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2.5 py-1 text-xs font-semibold text-fuchsia-700">
                          <Sparkles className="h-3.5 w-3.5" />
                          Homepage Banner
                        </span>
                      ) : null}
                    </div>
                    <button
                      onClick={() => openEdit(item)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    >
                      Edit Offer
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl border border-white/40 bg-white/95 p-5 shadow-2xl md:p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">{form.id ? 'Edit Offer' : 'Add Offer'}</h3>
                <p className="text-sm text-slate-500">Craft high-conversion campaigns for seasonal traffic.</p>
              </div>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveOffer} className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Offer Name
                <input
                  value={form.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-rose-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                Slug
                <input
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-rose-300 focus:ring"
                />
              </label>

              <label className="md:col-span-2 text-sm text-slate-600">
                Banner
                <input
                  value={form.banner}
                  onChange={(e) => setForm((prev) => ({ ...prev, banner: e.target.value }))}
                  placeholder="https://banner-image-url"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-rose-300 focus:ring"
                />
              </label>

              <label className="md:col-span-2 text-sm text-slate-600">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-rose-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                Discount Type
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-rose-300 focus:ring"
                >
                  <option value="Flat">Flat</option>
                  <option value="Percentage">%</option>
                </select>
              </label>

              <label className="text-sm text-slate-600">
                Discount Value
                <input
                  type="number"
                  min={0}
                  value={form.discountValue}
                  onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-rose-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                Start Date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-rose-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                End Date
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-rose-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                CTA Button Text
                <input
                  value={form.ctaText}
                  onChange={(e) => setForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-rose-300 focus:ring"
                />
              </label>

              <label className="text-sm text-slate-600">
                Priority Ranking
                <input
                  type="number"
                  min={1}
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: Number(e.target.value || 1) }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-rose-300 focus:ring"
                />
              </label>

              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.homepageBanner}
                  onChange={(e) => setForm((prev) => ({ ...prev, homepageBanner: e.target.checked }))}
                />
                Homepage banner toggle
              </label>

              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.status === 'Active'}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.checked ? 'Active' : 'Draft' }))}
                />
                Active status
              </label>

              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">
                  <Gift className="h-4 w-4 text-rose-500" />
                  Select Packages (multi-select)
                </p>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {packageOptions.map((pkg) => {
                    const selected = form.packages.includes(pkg)
                    return (
                      <button
                        key={pkg}
                        type="button"
                        onClick={() => togglePackage(pkg)}
                        className={`rounded-lg border px-3 py-2 text-xs transition ${
                          selected
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50'
                        }`}
                      >
                        {pkg}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm">
                <p className="font-semibold text-amber-800">Countdown timer preview</p>
                <p className="text-amber-700">{buildCountdown(form.endDate)}</p>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:opacity-90"
                >
                  {form.id ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}
