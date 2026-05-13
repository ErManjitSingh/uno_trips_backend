import { Head, Link, router, usePage } from '@inertiajs/react'
import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'
import { withPathPrefix } from '../../../lib/urlPath'

function storageUrl(path) {
  if (!path) return ''
  const s = String(path).trim()
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  return `/storage/${s.replace(/^\//, '')}`
}

function itineraryDayCount(itinerary) {
  if (!itinerary) return 0
  if (Array.isArray(itinerary)) return itinerary.length
  if (typeof itinerary === 'object') return Object.keys(itinerary).length
  return 0
}

function linesCount(val) {
  if (!val) return 0
  if (Array.isArray(val)) return val.filter(Boolean).length
  return 0
}

function missingPackageFields(p) {
  const missing = []
  if (!String(p.short_description || '').trim()) missing.push('Short description')
  if (!p.featured_image) missing.push('Featured image')
  if (itineraryDayCount(p.itinerary) === 0) missing.push('Itinerary days')
  if (!String(p.location_name || p.destination || '').trim()) missing.push('Location')
  if (p.price == null || Number(p.price) <= 0) missing.push('Price')
  if (!String(p.duration || '').trim()) missing.push('Duration')
  return missing
}

function missingBlogFields(b) {
  const missing = []
  if (!String(b.excerpt || '').trim()) missing.push('Excerpt')
  if (!b.featured_image) missing.push('Featured image')
  return missing
}

export default function ApprovalsIndex({ pendingPackages, pendingBlogs }) {
  const basePath = (usePage().props?.base_path ?? '').toString()
  const adminUrl = (path) => withPathPrefix(path, basePath)

  const [expandedPackageId, setExpandedPackageId] = useState(null)
  const [expandedBlogId, setExpandedBlogId] = useState(null)

  const pkgTotal = pendingPackages?.total ?? 0
  const blogTotal = pendingBlogs?.total ?? 0

  const submitBulkPackages = () => {
    const ids = pendingPackages?.data?.map((p) => p.id) || []
    if (!window.confirm(`Approve all ${ids.length} pending package(s)?`)) return
    router.post(adminUrl('/admin/approvals/packages/bulk-approve'), { ids })
  }

  const submitBulkBlogs = () => {
    const ids = pendingBlogs?.data?.map((b) => b.id) || []
    if (!window.confirm(`Approve all ${ids.length} pending blog(s)?`)) return
    router.post(adminUrl('/admin/approvals/blogs/bulk-approve'), { ids })
  }

  const summaryCards = useMemo(
    () => [
      { label: 'Packages awaiting approval', value: pkgTotal, tone: 'from-rose-500 to-orange-500' },
      { label: 'Blogs awaiting approval', value: blogTotal, tone: 'from-sky-500 to-indigo-500' },
    ],
    [pkgTotal, blogTotal],
  )

  return (
    <AdminLayout title="Approvals">
      <Head title="Content approvals" />
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-amber-50">Approvals</h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-amber-100/70">
              Review executive submissions, inspect fields, edit if needed, then approve or reject.
            </p>
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

        <div className="grid gap-3 sm:grid-cols-2">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl bg-gradient-to-br ${card.tone} p-[1px] shadow-md`}
            >
              <div className="rounded-2xl bg-white px-4 py-3 dark:bg-stone-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-amber-200/80">{card.label}</p>
                <p className="mt-1 text-3xl font-black text-stone-900 dark:text-amber-50">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/80">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-amber-50">
            Pending packages
            <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-200">
              {pkgTotal}
            </span>
          </h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-amber-200/70">
            Open details to see what is filled or missing. Use Edit to fix the package in Package Control, then return here to approve.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-amber-100 text-left text-xs uppercase text-stone-500 dark:border-stone-700 dark:text-amber-200/70">
                  <th className="w-8 pb-2" />
                  <th className="pb-2">Preview</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2">Itinerary</th>
                  <th className="pb-2">Gaps</th>
                  <th className="pb-2">Submitted by</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPackages?.data?.length ? (
                  pendingPackages.data.map((p) => {
                    const open = expandedPackageId === p.id
                    const missing = missingPackageFields(p)
                    const days = itineraryDayCount(p.itinerary)
                    const inc = linesCount(p.inclusions)
                    const exc = linesCount(p.exclusions)
                    return (
                      <Fragment key={p.id}>
                        <tr className="border-b border-amber-50 dark:border-stone-800">
                          <td className="py-2 align-middle">
                            <button
                              type="button"
                              aria-expanded={open}
                              className="rounded-lg p-1 text-stone-500 hover:bg-amber-100 dark:hover:bg-stone-800"
                              onClick={() => setExpandedPackageId(open ? null : p.id)}
                            >
                              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </td>
                          <td className="py-2 align-middle">
                            {p.featured_image ? (
                              <img
                                src={storageUrl(p.featured_image)}
                                alt=""
                                className="h-12 w-16 rounded-lg border border-amber-100 object-cover dark:border-stone-700"
                              />
                            ) : (
                              <span className="inline-flex h-12 w-16 items-center justify-center rounded-lg border border-dashed border-rose-200 text-[10px] text-rose-600 dark:border-rose-900">
                                No image
                              </span>
                            )}
                          </td>
                          <td className="py-2 align-middle font-medium text-stone-800 dark:text-amber-50">
                            <div>{p.title}</div>
                            <div className="text-[11px] font-normal text-stone-500 dark:text-amber-200/60">/{p.slug}</div>
                          </td>
                          <td className="py-2 align-middle text-stone-600 dark:text-amber-100/80">{p.location_name || p.destination || '—'}</td>
                          <td className="py-2 align-middle text-stone-600 dark:text-amber-100/80">{p.duration || '—'}</td>
                          <td className="py-2 align-middle text-stone-600 dark:text-amber-100/80">
                            {p.price != null ? `₹${Number(p.price).toLocaleString('en-IN')}` : '—'}
                            {p.offer_price != null && Number(p.offer_price) > 0 ? (
                              <div className="text-[11px] text-emerald-700 dark:text-emerald-300">Offer ₹{Number(p.offer_price).toLocaleString('en-IN')}</div>
                            ) : null}
                          </td>
                          <td className="py-2 align-middle text-stone-600 dark:text-amber-100/80">{days ? `${days} day(s)` : '—'}</td>
                          <td className="py-2 align-middle">
                            {missing.length ? (
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800 dark:bg-rose-950/80 dark:text-rose-200">
                                {missing.length} missing
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                Complete
                              </span>
                            )}
                          </td>
                          <td className="py-2 align-middle text-stone-600 dark:text-amber-100/80">{p.creator?.name || p.creator?.email || '—'}</td>
                          <td className="py-2 align-middle text-right">
                            <Link
                              href={adminUrl(`/admin/packages?tab=add&edit=${p.id}`)}
                              className="mr-2 inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="mr-2 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                              onClick={() =>
                                router.post(adminUrl(`/admin/approvals/packages/${p.id}/approve`), {})
                              }
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white"
                              onClick={() => {
                                const remarks = window.prompt('Rejection note (optional)') || ''
                                router.post(adminUrl(`/admin/approvals/packages/${p.id}/reject`), { remarks })
                              }}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                        {open ? (
                          <tr className="border-b border-amber-100 bg-amber-50/40 dark:border-stone-800 dark:bg-stone-950/50">
                            <td colSpan={10} className="px-4 py-3 text-left text-xs text-stone-700 dark:text-amber-100/90">
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <p className="font-semibold text-stone-900 dark:text-amber-50">Short description</p>
                                  <p className="mt-1 whitespace-pre-wrap text-stone-600 dark:text-amber-100/80">
                                    {String(p.short_description || '').trim() || '— Not provided —'}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-semibold text-stone-900 dark:text-amber-50">Checklist</p>
                                  <ul className="mt-1 list-disc pl-4 text-stone-600 dark:text-amber-100/80">
                                    <li>Inclusions lines: {inc || '—'}</li>
                                    <li>Exclusions lines: {exc || '—'}</li>
                                    <li>Status: {p.status || '—'} · Type: {p.package_type || '—'}</li>
                                    <li>Days / nights: {(p.days ?? '—')} / {(p.nights ?? '—')}</li>
                                  </ul>
                                  {missing.length ? (
                                    <p className="mt-2 font-medium text-rose-700 dark:text-rose-300">Missing: {missing.join(', ')}</p>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-stone-500">
                      No pending packages.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/80">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-amber-50">
            Pending blogs
            <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-900 dark:bg-sky-950/80 dark:text-sky-200">
              {blogTotal}
            </span>
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-amber-100 text-left text-xs uppercase text-stone-500 dark:border-stone-700 dark:text-amber-200/70">
                  <th className="w-8 pb-2" />
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Gaps</th>
                  <th className="pb-2">Author</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBlogs?.data?.length ? (
                  pendingBlogs.data.map((b) => {
                    const open = expandedBlogId === b.id
                    const missing = missingBlogFields(b)
                    return (
                      <Fragment key={b.id}>
                        <tr className="border-b border-amber-50 dark:border-stone-800">
                          <td className="py-2 align-middle">
                            <button
                              type="button"
                              className="rounded-lg p-1 text-stone-500 hover:bg-amber-100 dark:hover:bg-stone-800"
                              onClick={() => setExpandedBlogId(open ? null : b.id)}
                            >
                              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </td>
                          <td className="py-2 font-medium text-stone-800 dark:text-amber-50">
                            {b.title}
                            <div className="text-[11px] font-normal text-stone-500 dark:text-amber-200/60">/{b.slug}</div>
                          </td>
                          <td className="py-2">
                            {missing.length ? (
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800 dark:bg-rose-950/80 dark:text-rose-200">
                                {missing.length} missing
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                Complete
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-stone-600 dark:text-amber-100/80">{b.author?.email || '—'}</td>
                          <td className="py-2 text-right">
                            <Link
                              href={adminUrl(`/admin/blogs/${b.id}/edit`)}
                              className="mr-2 inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="mr-2 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                              onClick={() =>
                                router.post(adminUrl(`/admin/approvals/blogs/${b.id}/approve`), {})
                              }
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white"
                              onClick={() => {
                                const remarks = window.prompt('Rejection note (optional)') || ''
                                router.post(adminUrl(`/admin/approvals/blogs/${b.id}/reject`), { remarks })
                              }}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                        {open ? (
                          <tr className="border-b border-amber-100 bg-amber-50/40 dark:border-stone-800 dark:bg-stone-950/50">
                            <td colSpan={5} className="px-4 py-3 text-left text-xs text-stone-700 dark:text-amber-100/90">
                              <p className="font-semibold text-stone-900 dark:text-amber-50">Excerpt</p>
                              <p className="mt-1 whitespace-pre-wrap text-stone-600 dark:text-amber-100/80">
                                {String(b.excerpt || '').trim() || '— Not provided —'}
                              </p>
                              {missing.length ? (
                                <p className="mt-2 font-medium text-rose-700 dark:text-rose-300">Missing: {missing.join(', ')}</p>
                              ) : null}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-500">
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
