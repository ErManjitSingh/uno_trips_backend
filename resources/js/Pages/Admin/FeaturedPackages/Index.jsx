import { Head, router, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import { GripVertical, PlayCircle, Plus, RefreshCcw, Star, X } from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'

function inr(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    value || 0
  )
}

export default function FeaturedPackagesIndex({ featuredPackages = [], settings }) {
  const { props, errors } = usePage()
  const seeded = useMemo(
    () =>
      [...featuredPackages]
        .sort((a, b) => a.position - b.position)
        .map((pkg, idx) => ({ ...pkg, position: idx + 1 })),
    [featuredPackages]
  )

  const [items, setItems] = useState(seeded)
  const [dragId, setDragId] = useState(null)
  const [autoRotate, setAutoRotate] = useState(Boolean(settings?.auto_rotate ?? true))
  const [maxFeatured, setMaxFeatured] = useState(settings?.max_featured ?? 4)
  const [activeSlide, setActiveSlide] = useState(0)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    setItems(seeded)
  }, [seeded])

  useEffect(() => {
    setAutoRotate(Boolean(settings?.auto_rotate ?? true))
    setMaxFeatured(settings?.max_featured ?? 4)
  }, [settings])

  useEffect(() => {
    const entries = []
    if (props.flash?.success) entries.push({ type: 'success', text: props.flash.success })
    if (props.flash?.error) entries.push({ type: 'error', text: props.flash.error })
    if (errors?.featured) entries.push({ type: 'error', text: errors.featured })
    if (!entries.length) return

    const now = Date.now()
    setToasts((prev) => [...prev, ...entries.map((entry, idx) => ({ id: now + idx, ...entry }))])
  }, [props.flash?.success, props.flash?.error, errors?.featured])

  useEffect(() => {
    if (!toasts.length) return
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, 3000)
    return () => clearTimeout(timer)
  }, [toasts])

  const featuredCount = items.filter((item) => item.is_featured).length
  const featuredItems = items.filter((item) => item.is_featured).sort((a, b) => a.position - b.position)
  const canAddMoreFeatured = featuredCount < maxFeatured

  const syncPositions = (list) => list.map((item, idx) => ({ ...item, position: idx + 1 }))

  const onDropOver = (targetId) => {
    if (!dragId || dragId === targetId) return

    let updatedOrder = []
    setItems((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === dragId)
      const targetIndex = prev.findIndex((item) => item.id === targetId)
      if (sourceIndex < 0 || targetIndex < 0) return prev

      const clone = [...prev]
      const [moved] = clone.splice(sourceIndex, 1)
      clone.splice(targetIndex, 0, moved)
      updatedOrder = syncPositions(clone)
      return updatedOrder
    })

    setDragId(null)

    if (updatedOrder.length) {
      router.put(
        '/admin/featured-packages/reorder',
        { ordered_ids: updatedOrder.map((item) => item.id) },
        { preserveScroll: true }
      )
    }
  }

  const persistFeature = (id, isFeatured, badge) => {
    router.put(
      `/admin/featured-packages/${id}/feature`,
      { is_featured: isFeatured, badge },
      { preserveScroll: true }
    )
  }

  const removeFeatured = (id) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_featured: false } : item)))
    persistFeature(id, false, null)
  }

  const addToFeatured = (id) => {
    if (!canAddMoreFeatured) return
    const row = items.find((item) => item.id === id)
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_featured: true } : item)))
    persistFeature(id, true, row?.badge ?? 'Trending')
  }

  const toggleFeatured = (id) => {
    const row = items.find((item) => item.id === id)
    if (!row) return
    if (!row.is_featured && !canAddMoreFeatured) return

    const nextValue = !row.is_featured
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_featured: nextValue } : item)))
    persistFeature(id, nextValue, row.badge)
  }

  const saveSettings = (nextAutoRotate = autoRotate, nextMaxFeatured = maxFeatured) => {
    router.put(
      '/admin/featured-packages/settings',
      {
        auto_rotate: nextAutoRotate,
        max_featured: Number(nextMaxFeatured || 1),
      },
      { preserveScroll: true }
    )
  }

  const nextSlide = () => {
    if (!featuredItems.length) return
    setActiveSlide((prev) => (prev + 1) % featuredItems.length)
  }

  const prevSlide = () => {
    if (!featuredItems.length) return
    setActiveSlide((prev) => (prev - 1 + featuredItems.length) % featuredItems.length)
  }

  const carouselItem = featuredItems[activeSlide] || featuredItems[0]

  return (
    <AdminLayout title="Featured Packages">
      <Head title="Featured Packages" />
      <div className="pointer-events-none fixed right-4 top-20 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto min-w-[260px] rounded-xl border px-3 py-2 text-sm shadow-lg ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-rose-500 p-6 text-white shadow-2xl">
          <div className="absolute -left-12 top-8 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-fuchsia-200/25 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Featured Packages Management</h2>
              <p className="mt-2 max-w-3xl text-sm text-fuchsia-50 md:text-base">
                Premium OTT-style storytelling section with ranked visual highlights and live carousel preview.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                {featuredCount}/{maxFeatured} featured
              </span>
              <label className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={autoRotate}
                  onChange={(e) => {
                    const next = e.target.checked
                    setAutoRotate(next)
                    saveSettings(next, maxFeatured)
                  }}
                />
                Auto rotate
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium">
                Max
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxFeatured}
                  onChange={(e) => setMaxFeatured(Number(e.target.value || 1))}
                  onBlur={() => saveSettings(autoRotate, maxFeatured)}
                  className="w-12 rounded bg-white/20 px-1 py-0.5 text-center text-white outline-none"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Carousel Preview</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Prev
              </button>
              <button
                onClick={nextSlide}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>

          {carouselItem ? (
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200">
              <img
                src={carouselItem.image}
                alt={carouselItem.name}
                className="h-64 w-full object-cover transition duration-700 group-hover:scale-105 md:h-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-slate-900">
                    {carouselItem.badge}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                    Position #{carouselItem.position}
                  </span>
                </div>
                <h4 className="text-xl font-semibold text-white md:text-2xl">{carouselItem.name}</h4>
                <p className="mt-1 text-sm text-slate-200">{inr(carouselItem.price)}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
                  <PlayCircle className="h-4 w-4" />
                  OTT carousel storytelling preview
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
              Add featured packages to preview carousel.
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <RefreshCcw className={`h-3.5 w-3.5 ${autoRotate ? 'text-emerald-600' : 'text-slate-400'}`} />
            {autoRotate ? 'Auto rotate is enabled for homepage slider' : 'Auto rotate is disabled'}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Drag & Drop Ranking List</h3>
            {!canAddMoreFeatured ? (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                Max featured limit reached
              </span>
            ) : null}
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                draggable
                onDragStart={() => setDragId(item.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropOver(item.id)}
                className="group flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <button className="cursor-grab text-slate-400">
                  <GripVertical className="h-4 w-4" />
                </button>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                  {item.position}
                </span>
                <img src={item.image} alt={item.name} className="h-16 w-24 rounded-xl object-cover" />

                <div className="min-w-[220px] flex-1">
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  <p className="text-sm text-slate-500">{inr(item.price)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        item.badge === 'Best Seller' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                    {item.is_featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <Star className="h-3 w-3" />
                        Featured
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        Not Featured
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.is_featured ? (
                    <button
                      onClick={() => removeFeatured(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => addToFeatured(item.id)}
                      disabled={!canAddMoreFeatured}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 enabled:hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Featured
                    </button>
                  )}

                  <button
                    onClick={() => toggleFeatured(item.id)}
                    disabled={!item.is_featured && !canAddMoreFeatured}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {item.is_featured ? 'Unfeature' : 'Feature'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
