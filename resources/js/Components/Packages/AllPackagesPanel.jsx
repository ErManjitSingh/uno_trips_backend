import { router } from '@inertiajs/react'
import { Copy, Eye, PencilLine, Trash2 } from 'lucide-react'
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{showPricingManager ? 'Pricing Manager' : 'All Packages'}</h2>
          <p className="text-sm text-slate-500">
            {showPricingManager ? 'Manage bulk discounts for packages.' : 'Browse, filter, and manage packages.'}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <input defaultValue={filters.search} placeholder="Search packages..." className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400" onChange={(e) => updateFilters({ search: e.target.value })} />
          <select value={filters.status || ''} onChange={(e) => updateFilters({ status: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"><option value="">All Status</option><option value="draft">Draft</option><option value="published">Published</option></select>
          <select value={filters.package_type || ''} onChange={(e) => updateFilters({ package_type: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"><option value="">All Types</option><option value="domestic">Domestic</option><option value="international">International</option><option value="honeymoon">Honeymoon</option><option value="family">Family</option><option value="adventure">Adventure</option></select>
          <select value={filters.destination || ''} onChange={(e) => updateFilters({ destination: e.target.value })} className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"><option value="">All Destinations</option>{destinations.map((d) => <option key={d} value={d}>{d}</option>)}</select>
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
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">{selectedPackageIds.length} selected</p>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={!selectedPackageIds.length}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Bulk Delete
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400"><th className="pb-2"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all packages" /></th><th className="pb-2">Image</th><th className="pb-2">Title</th><th className="pb-2">Type</th><th className="pb-2">Destination</th><th className="pb-2">Price</th><th className="pb-2">Status</th><th className="pb-2">SEO Score</th><th className="pb-2 text-right">Actions</th></tr></thead>
          <tbody>
            {packageList.map((pkg, index) => (
              <tr
                key={pkg.id}
                className={`border-b border-slate-100 ${
                  index % 3 === 0 ? 'bg-white' : index % 3 === 1 ? 'bg-blue-50/70' : 'bg-amber-50/70'
                }`}
              >
                <td className="py-2 align-middle">
                  <input
                    type="checkbox"
                    checked={selectedPackageIds.includes(pkg.id)}
                    onChange={() => toggleSelectOne(pkg.id)}
                    aria-label={`Select ${pkg.title}`}
                  />
                </td>
                <td className="py-2">
                  {resolveImageUrl(pkg.featured_image) ? (
                    <img src={resolveImageUrl(pkg.featured_image)} alt={pkg.title} className="h-12 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="grid h-12 w-16 place-items-center rounded-lg bg-slate-100 text-[10px] text-slate-500">No image</div>
                  )}
                </td>
                <td className="py-3">
                  <p className="font-medium text-slate-700">{pkg.title}</p>
                  <p className="text-xs text-slate-500">/{pkg.slug}</p>
                </td>
                <td>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{pkg.package_type || 'general'}</span>
                </td>
                <td className="text-slate-600">{pkg.location_name || pkg.destination}</td>
                <td className="text-slate-700">
                  <p className="font-medium">INR {Number(pkg.offer_price || pkg.price || 0).toLocaleString()}</p>
                  {pkg.offer_price ? (
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="text-xs text-slate-400 line-through">INR {Number(pkg.price || 0).toLocaleString()}</p>
                      {getDiscountPercent(pkg) > 0 ? (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-[1px] text-[10px] font-semibold leading-none text-emerald-700">
                          {getDiscountPercent(pkg)}% OFF
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </td>
                <td>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pkg.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {pkg.status}
                  </span>
                </td>
                <td>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      getSeoScore(pkg) >= 80
                        ? 'bg-emerald-100 text-emerald-700'
                        : getSeoScore(pkg) >= 50
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {getSeoScore(pkg)}%
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex items-center justify-end gap-1.5">
                    <button type="button" onClick={() => handleEdit(pkg)} className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600" title="Edit Package">
                      <PencilLine className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => window.open(`/tours/${pkg.slug}`, '_blank')} className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-600" title="Preview Package">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDuplicate(pkg)} className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600" title="Duplicate Package">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDelete(pkg)} className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:text-rose-600" title="Delete Package">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!packageList.length ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-sm text-slate-500">No packages found for selected filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
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
