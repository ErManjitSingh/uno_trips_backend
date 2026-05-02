import { router } from '@inertiajs/react'
import { Copy, Eye, ImageOff, PencilLine, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ActionConfirmModal from './ActionConfirmModal'

export default function AllPackagesPanel({ packages, filters, destinations, updateFilters, showPricingManager = false }) {
  const [confirmModal, setConfirmModal] = useState(null)
  const [selectedPackageIds, setSelectedPackageIds] = useState([])
  const [bulkDiscount, setBulkDiscount] = useState({
    scope: 'all',
    discount_type: 'percent',
    discount_value: '15',
  })
  const [bulkApplying, setBulkApplying] = useState(false)
  const packageList = packages?.data || []
  const allSelected = packageList.length > 0 && packageList.every((pkg) => selectedPackageIds.includes(pkg.id))

  const getSeoScore = (pkg) => {
    let score = 0
    const title = (pkg.seo_meta_title || '').trim()
    const description = (pkg.seo_meta_description || '').trim()
    const slug = (pkg.slug || '').trim()

    if (title.length >= 30 && title.length <= 60) score += 35
    if (description.length >= 70 && description.length <= 160) score += 35
    if (slug.length >= 5) score += 15
    if (pkg.status === 'published') score += 15

    return Math.min(100, score)
  }

  const getDiscountPercent = (pkg) => {
    const price = Number(pkg.price || 0)
    const offerPrice = Number(pkg.offer_price || 0)
    if (!price || !offerPrice || offerPrice >= price) return 0
    return Math.round(((price - offerPrice) / price) * 100)
  }

  const normalizeImagePath = (value) => {
    if (!value) return null

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return null

      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed)
          return normalizeImagePath(parsed)
        } catch {
          return trimmed
        }
      }

      return trimmed
    }

    if (typeof value === 'object') {
      return (
        normalizeImagePath(value.thumb) ||
        normalizeImagePath(value.thumbnail) ||
        normalizeImagePath(value.md) ||
        normalizeImagePath(value.medium) ||
        normalizeImagePath(value.lg) ||
        normalizeImagePath(value.large) ||
        normalizeImagePath(value.original) ||
        normalizeImagePath(value.path) ||
        null
      )
    }

    return null
  }

  const resolveImageUrl = (value) => {
    const path = normalizeImagePath(value)
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path
    return `/storage/${path}`
  }

  const openConfirm = (type, pkg) => setConfirmModal({ type, pkg })
  const closeConfirm = () => setConfirmModal(null)

  const handleConfirmAction = () => {
    if (!confirmModal) return
    const { type, pkg } = confirmModal

    if (type === 'duplicate') {
      router.get('/admin/packages', { tab: 'add', duplicate: pkg.id }, { preserveState: false, replace: true })
    } else if (type === 'delete') {
      router.delete(`/admin/packages/${pkg.id}`)
    }

    closeConfirm()
  }

  const handleEdit = (pkg) => {
    router.get('/admin/packages', { tab: 'add', edit: pkg.id }, { preserveState: false, replace: true })
  }

  const handleDuplicate = (pkg) => {
    router.post(
      `/admin/packages/${pkg.id}/duplicate-log`,
      {},
      {
        preserveScroll: true,
        onFinish: () => openConfirm('duplicate', pkg),
      }
    )
  }

  const handleDelete = (pkg) => {
    openConfirm('delete', pkg)
  }

  const toggleSelectAll = () => {
    setSelectedPackageIds(allSelected ? [] : packageList.map((pkg) => pkg.id))
  }

  const toggleSelectOne = (id) => {
    setSelectedPackageIds((prev) =>
      prev.includes(id) ? prev.filter((pkgId) => pkgId !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = () => {
    if (!selectedPackageIds.length) return
    const shouldDelete = window.confirm(`Delete ${selectedPackageIds.length} selected package(s)?`)
    if (!shouldDelete) return

    router.post(
      '/admin/packages/bulk-delete',
      { ids: selectedPackageIds },
      {
        preserveScroll: true,
        onSuccess: () => setSelectedPackageIds([]),
      }
    )
  }

  const applyBulkDiscount = () => {
    if (bulkDiscount.discount_type !== 'clear' && Number(bulkDiscount.discount_value) <= 0) return

    setBulkApplying(true)
    router.post(
      '/admin/packages/bulk-discount',
      {
        scope: bulkDiscount.scope,
        discount_type: bulkDiscount.discount_type,
        discount_value: bulkDiscount.discount_type === 'clear' ? null : Number(bulkDiscount.discount_value),
      },
      {
        preserveScroll: true,
        onFinish: () => setBulkApplying(false),
      }
    )
  }

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{showPricingManager ? 'Pricing Manager' : 'All Packages'}</h2>
          <p className="mt-1.5 text-base leading-relaxed text-slate-600">
            {showPricingManager ? 'Manage bulk discounts for packages.' : 'Browse, filter, and manage packages. Each card shows key details at a glance.'}
          </p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:min-w-[640px]">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Search</span>
            <input defaultValue={filters.search} placeholder="Title or slug…" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" onChange={(e) => updateFilters({ search: e.target.value })} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</span>
            <select value={filters.status || ''} onChange={(e) => updateFilters({ status: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"><option value="">All Status</option><option value="draft">Draft</option><option value="published">Published</option></select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Type</span>
            <select value={filters.package_type || ''} onChange={(e) => updateFilters({ package_type: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"><option value="">All Types</option><option value="domestic">Domestic</option><option value="international">International</option><option value="honeymoon">Honeymoon</option><option value="family">Family</option><option value="adventure">Adventure</option></select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Destination</span>
            <select value={filters.destination || ''} onChange={(e) => updateFilters({ destination: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"><option value="">All Destinations</option>{destinations.map((d) => <option key={d} value={d}>{d}</option>)}</select>
          </label>
        </div>
      </div>

      {showPricingManager ? (
        <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Pricing Manager</p>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <select
              value={bulkDiscount.scope}
              onChange={(e) => setBulkDiscount((prev) => ({ ...prev, scope: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="all">All Packages</option>
              <option value="published">Published Only</option>
              <option value="draft">Draft Only</option>
            </select>
            <select
              value={bulkDiscount.discount_type}
              onChange={(e) => setBulkDiscount((prev) => ({ ...prev, discount_type: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="percent">Percent Off (%)</option>
              <option value="fixed">Fixed Off (INR)</option>
              <option value="clear">Clear Offer Price</option>
            </select>
            <input
              type="number"
              min="0"
              value={bulkDiscount.discount_value}
              onChange={(e) => setBulkDiscount((prev) => ({ ...prev, discount_value: e.target.value }))}
              disabled={bulkDiscount.discount_type === 'clear'}
              placeholder={bulkDiscount.discount_type === 'percent' ? 'e.g. 15' : 'e.g. 2000'}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={applyBulkDiscount}
              disabled={bulkApplying || (bulkDiscount.discount_type !== 'clear' && Number(bulkDiscount.discount_value) <= 0)}
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {bulkApplying ? 'Applying...' : 'Apply Bulk Discount'}
            </button>
          </div>
        </div>
      ) : null}

      {!showPricingManager ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" aria-label="Select all packages" />
              <span>Select all on this page</span>
            </label>
            <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" aria-hidden />
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{selectedPackageIds.length}</span> selected
            </p>
          </div>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={!selectedPackageIds.length}
            className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Bulk delete
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        {packageList.map((pkg) => (
          <article
            key={pkg.id}
            className="group flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/40 p-4 shadow-sm transition hover:border-indigo-200/80 hover:shadow-md sm:flex-row sm:items-stretch sm:gap-5 sm:p-5"
          >
            <div className="flex shrink-0 items-start gap-3 sm:flex-col sm:items-center sm:pt-1">
              <input
                type="checkbox"
                checked={selectedPackageIds.includes(pkg.id)}
                onChange={() => toggleSelectOne(pkg.id)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 sm:mt-0"
                aria-label={`Select ${pkg.title}`}
              />
              <div className="relative h-36 w-full overflow-hidden rounded-xl bg-slate-100 shadow-inner ring-1 ring-slate-200/80 sm:h-32 sm:w-40">
                {resolveImageUrl(pkg.featured_image) ? (
                  <img src={resolveImageUrl(pkg.featured_image)} alt={pkg.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center text-xs font-medium text-slate-500">
                    <ImageOff className="h-8 w-8 opacity-35" strokeWidth={1.25} aria-hidden />
                    No image
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold leading-snug text-slate-900 sm:text-xl">{pkg.title}</h3>
                  <p className="mt-1 font-mono text-sm text-slate-500">/{pkg.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-800 ring-1 ring-indigo-100">
                    {pkg.package_type || 'general'}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${pkg.status === 'published' ? 'bg-emerald-50 text-emerald-800 ring-emerald-100' : 'bg-amber-50 text-amber-800 ring-amber-100'}`}>
                    {pkg.status}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                      getSeoScore(pkg) >= 80
                        ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
                        : getSeoScore(pkg) >= 50
                          ? 'bg-amber-50 text-amber-800 ring-amber-100'
                          : 'bg-rose-50 text-rose-800 ring-rose-100'
                    }`}
                  >
                    SEO {getSeoScore(pkg)}%
                  </span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-600">
                <span className="font-medium text-slate-700">Destination:</span>{' '}
                {pkg.location_name || pkg.destination || '—'}
              </p>

              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">From</p>
                  <p className="text-xl font-bold tabular-nums text-slate-900">INR {Number(pkg.offer_price || pkg.price || 0).toLocaleString()}</p>
                </div>
                {pkg.offer_price ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-slate-400 line-through">INR {Number(pkg.price || 0).toLocaleString()}</p>
                    {getDiscountPercent(pkg) > 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200/80">
                        {getDiscountPercent(pkg)}% off
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-row items-center justify-end gap-2 border-t border-slate-100 pt-3 sm:flex-col sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <button type="button" onClick={() => handleEdit(pkg)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 hover:shadow" title="Edit">
                <PencilLine className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => window.open(`/tours/${pkg.slug}`, '_blank')} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 hover:shadow" title="Preview">
                <Eye className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => handleDuplicate(pkg)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600 hover:shadow" title="Duplicate">
                <Copy className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => handleDelete(pkg)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-rose-300 hover:text-rose-600 hover:shadow" title="Delete">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </article>
        ))}
        {!packageList.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
            <p className="text-base font-medium text-slate-700">No packages match these filters</p>
            <p className="mt-2 text-sm text-slate-500">Try clearing search or changing status / type / destination.</p>
          </div>
        ) : null}
      </div>

      <ActionConfirmModal
        open={Boolean(confirmModal)}
        type={confirmModal?.type}
        pkg={confirmModal?.pkg}
        onClose={closeConfirm}
        onConfirm={handleConfirmAction}
      />
    </div>
  )
}
