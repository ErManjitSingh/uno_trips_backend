import { Head, router, usePage } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { GripVertical, Search, Sparkles, X } from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'
import CustomRichTextEditor from '../../../Components/Blog/CustomRichTextEditor'
import TabNav from '../../../Components/ListingBuilder/TabNav'
import SectionCard from '../../../Components/ListingBuilder/SectionCard'
import TagMultiSelect from '../../../Components/ListingBuilder/TagMultiSelect'
import { Field, fieldClassName } from '../../../Components/ListingBuilder/Field'

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const TABS = ['Basic Info', 'Packages', 'Filters', 'Content', 'SEO', 'Internal Linking']

function buildAutoSchema(form) {
  const faqEntities = (form.faqs || [])
    .filter((item) => item.q && item.a)
    .map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    }))

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: form.meta_title || form.title || 'Tour Packages',
    description: form.meta_description || form.title || '',
    url: `https://example.com/packages/${form.slug || 'listing-page'}`,
    inLanguage: 'en',
  }

  if (faqEntities.length) {
    schema.mainEntity = faqEntities
  }

  return JSON.stringify(schema, null, 2)
}

function packageImageUrl(imagePath) {
  if (!imagePath) return ''
  if (String(imagePath).startsWith('http')) return imagePath
  return `/storage/${imagePath}`
}

function parseCommaValues(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function scoreSeo(form) {
  let score = 0
  if ((form.meta_title || '').length >= 40) score += 20
  if ((form.meta_description || '').length >= 120) score += 20
  if ((form.meta_keywords || '').trim().length > 0) score += 10
  if ((form.canonical_url || '').trim().length > 0) score += 10
  if ((form.og_title || '').trim().length > 0) score += 10
  if ((form.og_description || '').trim().length > 0) score += 10
  if ((form.twitter_title || '').trim().length > 0) score += 10
  if ((form.schema_json || '').trim().startsWith('{')) score += 10
  return score
}

export default function ListingPageCreate({ listingPage, destinations = [], categories = [], packages = [], blogs = [], listingPageOptions = [] }) {
  const { props } = usePage()
  const errors = props?.errors || {}
  const isEdit = Boolean(listingPage)
  const filters = listingPage?.filters_json || {}
  const packageCfg = listingPage?.packages_json || {}
  const selectedBlogs = listingPage?.blogs_json?.ids || []
  const internalLinks = listingPage?.internal_links_json || []
  const controls = listingPage?.filter_controls_json || {}
  const [activeTab, setActiveTab] = useState(TABS[0])

  const initialForm = useMemo(() => ({
    title: listingPage?.title || '',
    banner_overlay_text: listingPage?.banner_overlay_text || '',
    slug: listingPage?.slug || '',
    page_type: listingPage?.page_type || 'destination',
    status: listingPage?.status || 'active',
    listing_page_category_id: listingPage?.listing_page_category_id || '',
    publish_at: listingPage?.publish_at ? String(listingPage.publish_at).slice(0, 16) : '',
    destination_id: filters.destination_id || '',
    auto_price_min: filters.price_range?.min ?? '',
    auto_price_max: filters.price_range?.max ?? '',
    season: filters.season || '',
    tour_type: filters.tour_type || '',
    duration: filters.duration || '',
    rating: filters.rating || '',
    package_mode: packageCfg.mode || 'auto',
    manual_packages: packageCfg.items || [],
    filter_enabled: controls.enabled ?? true,
    visible_filters: controls.visible_filters || ['price', 'duration', 'destination', 'rating', 'tour_type'],
    short_description: listingPage?.content || '',
    read_more: listingPage?.read_more || '',
    highlights: (listingPage?.seo_meta?.highlights || []).join(', '),
    faqs: listingPage?.seo_meta?.faqs || [{ q: '', a: '' }],
    blog_ids: selectedBlogs,
    tags_input: (listingPage?.tags || []).join(', '),
    internal_links: internalLinks.length ? internalLinks : [{ type: 'listing_page', id: '', anchor_text: '' }],
    meta_title: listingPage?.meta_title || '',
    meta_description: listingPage?.meta_description || '',
    meta_keywords: listingPage?.meta_keywords || '',
    canonical_url: listingPage?.canonical_url || '',
    schema_json: listingPage?.schema_json || '',
    og_title: listingPage?.seo_meta?.og_title || '',
    og_description: listingPage?.seo_meta?.og_description || '',
    og_image: listingPage?.seo_meta?.og_image || '',
    twitter_title: listingPage?.seo_meta?.twitter_title || '',
    twitter_image: listingPage?.seo_meta?.twitter_image || '',
    robots_index: listingPage?.seo_meta?.robots_index || 'index',
    robots_follow: listingPage?.seo_meta?.robots_follow || 'follow',
  }), [listingPage, filters])

  const [form, setForm] = useState(initialForm)
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(listingPage?.banner_image ? (String(listingPage.banner_image).startsWith('http') ? listingPage.banner_image : `/storage/${listingPage.banner_image}`) : '')
  const [blogSearch, setBlogSearch] = useState('')
  const [linkSearch, setLinkSearch] = useState('')
  const [dragIndex, setDragIndex] = useState(null)
  const [highlightRows, setHighlightRows] = useState(() => {
    const parsed = parseCommaValues(initialForm.highlights)
    return parsed.length ? parsed : ['']
  })
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')

  const seoScore = scoreSeo(form)
  const filteredBlogs = blogs.filter((b) => b.title.toLowerCase().includes(blogSearch.toLowerCase()))
  const filteredPackages = packages.filter((p) => p.title.toLowerCase().includes(linkSearch.toLowerCase()))

  const toggleVisibleFilter = (name) => {
    setForm((prev) => ({
      ...prev,
      visible_filters: prev.visible_filters.includes(name)
        ? prev.visible_filters.filter((f) => f !== name)
        : [...prev.visible_filters, name],
    }))
  }

  const addFaq = () => setForm((prev) => ({ ...prev, faqs: [...prev.faqs, { q: '', a: '' }] }))
  const updateFaq = (index, key, value) => {
    setForm((prev) => {
      const faqs = [...prev.faqs]
      faqs[index] = { ...faqs[index], [key]: value }
      return { ...prev, faqs }
    })
  }
  const removeFaq = (index) => setForm((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }))

  const addInternalLink = () => setForm((prev) => ({ ...prev, internal_links: [...prev.internal_links, { type: 'listing_page', id: '', anchor_text: '' }] }))
  const updateInternalLink = (index, key, value) => {
    setForm((prev) => {
      const links = [...prev.internal_links]
      links[index] = { ...links[index], [key]: value }
      return { ...prev, internal_links: links }
    })
  }
  const removeInternalLink = (index) => setForm((prev) => ({ ...prev, internal_links: prev.internal_links.filter((_, i) => i !== index) }))

  const toggleBlog = (id) => {
    setForm((prev) => ({
      ...prev,
      blog_ids: prev.blog_ids.includes(id) ? prev.blog_ids.filter((x) => x !== id) : [...prev.blog_ids, id],
    }))
  }

  const addManualPackage = (id) => {
    if (!id) return
    if (form.manual_packages.some((item) => item.id === Number(id))) return
    setForm((prev) => ({
      ...prev,
      manual_packages: [...prev.manual_packages, { id: Number(id), featured: false }],
    }))
  }
  const movePackage = (index, direction) => {
    const next = [...form.manual_packages]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setForm((prev) => ({ ...prev, manual_packages: next }))
  }
  const toggleFeaturedPackage = (id) => {
    setForm((prev) => ({
      ...prev,
      manual_packages: prev.manual_packages.map((item) => item.id === id ? { ...item, featured: !item.featured } : item),
    }))
  }
  const removeManualPackage = (id) => {
    setForm((prev) => ({ ...prev, manual_packages: prev.manual_packages.filter((item) => item.id !== id) }))
  }
  const onDragStartPackage = (index) => setDragIndex(index)
  const onDropPackage = (index) => {
    if (dragIndex === null || dragIndex === index) return
    const next = [...form.manual_packages]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setForm((prev) => ({ ...prev, manual_packages: next }))
    setDragIndex(null)
  }

  const syncHighlights = (rows) => {
    const nextRows = rows.length ? rows : ['']
    setHighlightRows(nextRows)
    setForm((prev) => ({
      ...prev,
      highlights: nextRows.map((item) => item.trim()).filter(Boolean).join(', '),
    }))
  }

  const uploadEditorImage = async (file) => {
    const formData = new FormData()
    formData.append('image', file)

    const res = await fetch('/admin/blogs/editor-image', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
      },
      credentials: 'same-origin',
      body: formData,
    })

    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(payload.message || 'Image upload failed')
    }

    return payload.url || ''
  }

  const submit = (e) => {
    e.preventDefault()

    const payload = {
      title: form.title,
      banner_overlay_text: form.banner_overlay_text || null,
      slug: form.slug || slugify(form.title),
      page_type: form.page_type,
      status: form.status,
      publish_at: form.status === 'scheduled' ? form.publish_at || null : null,
      listing_page_category_id: form.listing_page_category_id || null,
      filters_json: {
        destination_id: form.destination_id || null,
        season: form.season || null,
        tour_type: form.tour_type || null,
        duration: form.duration || null,
        rating: form.rating || null,
        price_range: {
          min: form.auto_price_min || null,
          max: form.auto_price_max || null,
        },
      },
      packages_json: {
        mode: form.package_mode,
        items: form.package_mode === 'manual' ? form.manual_packages : [],
      },
      filter_controls_json: {
        enabled: form.filter_enabled,
        visible_filters: form.visible_filters,
      },
      content: form.short_description || null,
      read_more: form.read_more || null,
      tags: form.tags_input.split(',').map((v) => v.trim()).filter(Boolean),
      blogs_json: { ids: form.blog_ids },
      internal_links_json: form.internal_links.filter((item) => item.id && item.anchor_text),
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      meta_keywords: form.meta_keywords || null,
      canonical_url: form.canonical_url || null,
      schema_json: form.schema_json || null,
      seo_meta: {
        og_title: form.og_title || null,
        og_description: form.og_description || null,
        og_image: form.og_image || null,
        twitter_title: form.twitter_title || null,
        twitter_image: form.twitter_image || null,
        robots_index: form.robots_index,
        robots_follow: form.robots_follow,
        highlights: form.highlights.split(',').map((v) => v.trim()).filter(Boolean),
        faqs: form.faqs.filter((item) => item.q || item.a),
      },
    }

    if (bannerFile) {
      payload.banner_image_file = bannerFile
    }

    if (isEdit) {
      router.post(`/admin/listing-pages/${listingPage.slug}`, { ...payload, _method: 'put' }, { forceFormData: true })
      return
    }

    router.post('/admin/listing-pages', payload, { forceFormData: true })
  }

  return (
    <AdminLayout title={isEdit ? 'Edit Listing Page' : 'Create Listing Page'}>
      <Head title={isEdit ? 'Edit Listing Page' : 'Create Listing Page'} />
      <div className="space-y-5 bg-slate-50/70">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white shadow-lg">
          <div className="absolute -right-4 top-2 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Premium Listing Page Builder</h2>
              <p className="mt-2 text-sm leading-6 text-indigo-100">Build premium destination and campaign pages with dynamic packages, rich storytelling, and high-converting SEO controls.</p>
            </div>
            <div className="rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">SEO Score: {seoScore}/100</div>
          </div>
        </section>

        <div className="sticky top-3 z-20 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-md backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Modern Builder Workspace
            </div>
            <div className="flex items-center gap-2">
              <a href={`/packages/${form.slug || 'preview'}?preview=1`} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Live Preview</a>
              <button type="button" onClick={() => setForm((p) => ({ ...p, status: 'draft' }))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Save as Draft</button>
              <button type="submit" form="listing-page-form" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500">Save Listing Page</button>
            </div>
          </div>
        </div>

        <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        <form id="listing-page-form" onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          {Object.keys(errors).length > 0 ? (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {Object.values(errors).map((error, index) => (
                <div key={index}>{Array.isArray(error) ? error[0] : error}</div>
              ))}
            </div>
          ) : null}
          {activeTab === 'Basic Info' ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Page Title"><input placeholder="e.g. Manali Tour Packages" className={fieldClassName} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value, slug: isEdit ? p.slug : slugify(e.target.value) }))} /></Field>
              <div className="space-y-2">
                <Field label="Banner Image Upload">
                  <input
                    type="file"
                    accept="image/*"
                    className={fieldClassName}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setBannerFile(file)
                      if (file) {
                        setBannerPreview(URL.createObjectURL(file))
                      }
                    }}
                  />
                </Field>
              </div>
              <Field label="Slug"><input placeholder="e.g. manali-tour-packages" className={fieldClassName} value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} /></Field>
              <Field label="Text On Banner"><input placeholder="e.g. Explore Magical Manali" className={fieldClassName} value={form.banner_overlay_text} onChange={(e) => setForm((p) => ({ ...p, banner_overlay_text: e.target.value }))} /></Field>
              <Field label="Page Type"><select className={fieldClassName} value={form.page_type} onChange={(e) => setForm((p) => ({ ...p, page_type: e.target.value }))}><option value="destination">Destination</option><option value="seasonal">Seasonal</option><option value="theme">Theme</option><option value="custom">Custom</option></select></Field>
              <Field label="Status"><select className={fieldClassName} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value="active">active</option><option value="inactive">inactive</option><option value="draft">draft</option><option value="scheduled">scheduled</option></select></Field>
              {bannerPreview ? (
                <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="relative h-40 w-full bg-slate-100">
                    <img src={bannerPreview} alt="Banner Preview" className="h-full w-full object-cover" />
                    {form.banner_overlay_text ? (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-sm font-semibold text-white">{form.banner_overlay_text}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {form.status === 'scheduled' ? (
                <Field label="Schedule Publish"><input type="datetime-local" placeholder="Choose publish date & time" className={fieldClassName} value={form.publish_at} onChange={(e) => setForm((p) => ({ ...p, publish_at: e.target.value }))} /></Field>
              ) : null}
              <Field label="Listing Category"><select className={fieldClassName} value={form.listing_page_category_id} onChange={(e) => setForm((p) => ({ ...p, listing_page_category_id: e.target.value }))}><option value="">Select</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            </div>
          ) : null}

          {activeTab === 'Packages' ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Mode<select className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" value={form.package_mode} onChange={(e) => setForm((p) => ({ ...p, package_mode: e.target.value }))}><option value="auto">Auto (Dynamic)</option><option value="manual">Manual</option></select></label>
                <label className="text-sm font-medium text-slate-700">Destination<select className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" value={form.destination_id} onChange={(e) => setForm((p) => ({ ...p, destination_id: e.target.value }))}><option value="">Any</option>{destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
              </div>
              {form.package_mode === 'auto' ? (
                <div className="grid gap-4 md:grid-cols-4">
                  <label className="text-sm font-medium text-slate-700">Min Price<input type="range" min="0" max="200000" step="1000" className="mt-3 w-full accent-indigo-600" value={form.auto_price_min || 0} onChange={(e) => setForm((p) => ({ ...p, auto_price_min: e.target.value }))} /><input type="number" placeholder="e.g. 10000" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.auto_price_min} onChange={(e) => setForm((p) => ({ ...p, auto_price_min: e.target.value }))} /></label>
                  <label className="text-sm font-medium text-slate-700">Max Price<input type="range" min="0" max="200000" step="1000" className="mt-3 w-full accent-indigo-600" value={form.auto_price_max || 0} onChange={(e) => setForm((p) => ({ ...p, auto_price_max: e.target.value }))} /><input type="number" placeholder="e.g. 45000" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.auto_price_max} onChange={(e) => setForm((p) => ({ ...p, auto_price_max: e.target.value }))} /></label>
                  <label className="text-sm font-medium text-slate-700">Duration<input placeholder="e.g. 5D/4N" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} /></label>
                  <label className="text-sm font-medium text-slate-700">Tour Type<select className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.tour_type} onChange={(e) => setForm((p) => ({ ...p, tour_type: e.target.value }))}><option value="">Any</option><option value="group">group</option><option value="family">family</option><option value="honeymoon">honeymoon</option><option value="women_special">women_special</option></select></label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} placeholder="Search packages by title..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
                  </div>
                  <label className="text-sm font-medium text-slate-700">Add Package<select className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" onChange={(e) => addManualPackage(e.target.value)} defaultValue=""><option value="">Select package to add manually</option>{filteredPackages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.title}</option>)}</select></label>
                  {form.manual_packages.length === 0 ? (
                    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-sm text-slate-500">
                      No packages selected yet
                    </div>
                  ) : null}
                  <div className="grid gap-3 md:grid-cols-2">
                    {form.manual_packages.map((item, index) => {
                      const pkg = packages.find((p) => p.id === item.id)
                      return (
                        <div
                          key={`${item.id}-${index}`}
                          draggable
                          onDragStart={() => onDragStartPackage(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onDropPackage(index)}
                          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="h-24 bg-slate-100">
                            {pkg?.featured_image ? (
                              <img
                                src={packageImageUrl(pkg.featured_image)}
                                alt={pkg?.title || 'Package image'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-slate-100 to-slate-200 text-xs text-slate-400">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="flex items-start justify-between p-3">
                            <div className="flex items-start gap-2">
                              <GripVertical className="mt-0.5 h-4 w-4 text-slate-400" />
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{pkg?.title || `Package #${item.id}`}</p>
                                <p className="text-xs text-slate-500">{pkg?.slug || ''}</p>
                                <p className="mt-0.5 text-xs font-medium text-emerald-700">
                                  ₹{Number(pkg?.offer_price || pkg?.price || 0).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              <button type="button" onClick={() => movePackage(index, -1)} className="rounded-lg border px-2 py-1 text-xs">Up</button>
                              <button type="button" onClick={() => movePackage(index, 1)} className="rounded-lg border px-2 py-1 text-xs">Down</button>
                              <button type="button" onClick={() => toggleFeaturedPackage(item.id)} className={`rounded-lg px-2 py-1 text-xs ${item.featured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{item.featured ? 'Featured' : 'Feature'}</button>
                              <button type="button" onClick={() => removeManualPackage(item.id)} className="rounded-lg bg-rose-100 px-2 py-1 text-xs text-rose-700">Remove</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'Filters' ? (
            <div className="space-y-3">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.filter_enabled} onChange={(e) => setForm((p) => ({ ...p, filter_enabled: e.target.checked }))} /> Enable frontend filters</label>
              <div className="grid gap-2 md:grid-cols-5">
                {['price', 'duration', 'destination', 'rating', 'tour_type'].map((filterName) => (
                  <button key={filterName} type="button" onClick={() => toggleVisibleFilter(filterName)} className={`rounded-xl border px-3 py-2 text-sm ${form.visible_filters.includes(filterName) ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-white text-slate-500'}`}>
                    {filterName}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === 'Content' ? (
            <div className="space-y-4">
              <SectionCard title="Short Description">
                <CustomRichTextEditor
                  value={form.short_description}
                  onChange={(value) => setForm((p) => ({ ...p, short_description: value }))}
                  onImageUpload={uploadEditorImage}
                />
              </SectionCard>
              <SectionCard title="Read More Content">
                <CustomRichTextEditor
                  value={form.read_more}
                  onChange={(value) => setForm((p) => ({ ...p, read_more: value }))}
                  onImageUpload={uploadEditorImage}
                />
              </SectionCard>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-indigo-800">Highlights</p>
                  <button
                    type="button"
                    onClick={() => syncHighlights([...highlightRows, ''])}
                    className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    + Add Highlight
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-indigo-700/80">Inclusion-style highlights list for listing page header/SEO blocks.</p>
                <div className="mt-3 space-y-2">
                  {highlightRows.map((item, idx) => (
                    <div key={`highlight-${idx}`} className="group flex items-start gap-2 rounded-xl border border-indigo-100 bg-white p-2 shadow-sm">
                      <span className="mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-100 px-1 text-[11px] font-semibold text-indigo-700">{idx + 1}</span>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400"
                        value={item}
                        onChange={(e) => syncHighlights(highlightRows.map((value, index) => (index === idx ? e.target.value : value)))}
                        placeholder="e.g. Premium hotels"
                      />
                      <button
                        type="button"
                        onClick={() => syncHighlights(highlightRows.length <= 1 ? [''] : highlightRows.filter((_, index) => index !== idx))}
                        className="mt-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 opacity-70 transition hover:bg-rose-100 group-hover:opacity-100"
                        title="Remove highlight"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">FAQs</p>
                  <button type="button" onClick={addFaq} className="rounded-lg border px-3 py-1 text-xs transition hover:bg-slate-50">Add FAQ</button>
                </div>
                <div className="space-y-2">
                  {form.faqs.map((faq, index) => (
                    <div key={index} className="grid gap-2 md:grid-cols-2">
                        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="e.g. Is hotel included in this package?" value={faq.q} onChange={(e) => updateFaq(index, 'q', e.target.value)} />
                      <div className="flex gap-2">
                        <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="e.g. Yes, multiple hotel categories are available." value={faq.a} onChange={(e) => updateFaq(index, 'a', e.target.value)} />
                        <button type="button" onClick={() => removeFaq(index)} className="rounded bg-rose-100 px-2 text-xs text-rose-700"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <label className="text-sm font-medium text-slate-700">Tags (comma separated)<input placeholder="e.g. honeymoon, budget travel, luxury tour" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.tags_input} onChange={(e) => setForm((p) => ({ ...p, tags_input: e.target.value }))} /></label>
              <div className="flex flex-wrap gap-2">
                {form.tags_input.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">{tag}</span>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === 'SEO' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Meta Title ({(form.meta_title || '').length})<input placeholder="e.g. Manali Tour Packages | Best Price Guaranteed" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.meta_title} onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))} /></label>
              <label className="text-sm font-medium text-slate-700">Canonical URL<input placeholder="e.g. https://yourdomain.com/packages/manali-tour-packages" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.canonical_url} onChange={(e) => setForm((p) => ({ ...p, canonical_url: e.target.value }))} /></label>
              <label className="md:col-span-2 text-sm font-medium text-slate-700">Meta Description<textarea rows={2} placeholder="Write a compelling meta description in 140-160 characters..." className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.meta_description} onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))} /></label>
              <label className="md:col-span-2 text-sm font-medium text-slate-700">Meta Keywords<input placeholder="e.g. manali package, himachal tour, honeymoon package" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.meta_keywords} onChange={(e) => setForm((p) => ({ ...p, meta_keywords: e.target.value }))} /></label>
              <label className="text-sm font-medium text-slate-700">OG Title<input placeholder="Open Graph title for social sharing" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.og_title} onChange={(e) => setForm((p) => ({ ...p, og_title: e.target.value }))} /></label>
              <label className="text-sm font-medium text-slate-700">OG Image URL<input placeholder="https://cdn.yoursite.com/images/listing-cover.jpg" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.og_image} onChange={(e) => setForm((p) => ({ ...p, og_image: e.target.value }))} /></label>
              <label className="md:col-span-2 text-sm font-medium text-slate-700">OG Description<textarea rows={2} placeholder="Short social preview description..." className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.og_description} onChange={(e) => setForm((p) => ({ ...p, og_description: e.target.value }))} /></label>
              <label className="text-sm font-medium text-slate-700">Twitter Title<input placeholder="Twitter card title" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.twitter_title} onChange={(e) => setForm((p) => ({ ...p, twitter_title: e.target.value }))} /></label>
              <label className="text-sm font-medium text-slate-700">Twitter Image URL<input placeholder="Twitter share image URL" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.twitter_image} onChange={(e) => setForm((p) => ({ ...p, twitter_image: e.target.value }))} /></label>
              <label className="text-sm font-medium text-slate-700">Robots Index<select className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.robots_index} onChange={(e) => setForm((p) => ({ ...p, robots_index: e.target.value }))}><option value="index">index</option><option value="noindex">noindex</option></select></label>
              <label className="text-sm font-medium text-slate-700">Robots Follow<select className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" value={form.robots_follow} onChange={(e) => setForm((p) => ({ ...p, robots_follow: e.target.value }))}><option value="follow">follow</option><option value="nofollow">nofollow</option></select></label>
              <label className="md:col-span-2 text-sm font-medium text-slate-700">
                Schema JSON
                <div className="mt-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, schema_json: buildAutoSchema(p) }))}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Auto Generate Schema
                  </button>
                </div>
                <textarea rows={6} placeholder='{"@context":"https://schema.org","@type":"CollectionPage"}' className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-xs" value={form.schema_json} onChange={(e) => setForm((p) => ({ ...p, schema_json: e.target.value }))} />
              </label>
              <div className="md:col-span-2 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Google Preview</p>
                  <p className="mt-2 text-base text-blue-700">{form.meta_title || form.title || 'Page title preview'}</p>
                  <p className="text-xs text-emerald-700">https://example.com/packages/{form.slug || 'listing-page'}</p>
                  <p className="mt-1 text-sm text-slate-600">{form.meta_description || 'Meta description preview appears here.'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Social Preview</p>
                  <div className="mt-2 rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">{form.og_title || form.meta_title || form.title || 'Social title preview'}</p>
                    <p className="mt-1 text-xs text-slate-600">{form.og_description || form.meta_description || 'Social description preview'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'Internal Linking' ? (
            <div className="space-y-4">
              <div className="rounded-xl border p-3">
                <p className="mb-2 text-sm font-semibold text-slate-800">Related Blogs</p>
                <TagMultiSelect
                  options={blogs.map((b) => ({ id: b.id, title: b.title }))}
                  selectedIds={form.blog_ids}
                  onToggle={toggleBlog}
                  search={blogSearch}
                  onSearchChange={setBlogSearch}
                  placeholder="Search blogs by title..."
                />
              </div>
              <div className="rounded-xl border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">Internal Links</p>
                  <button type="button" onClick={addInternalLink} className="rounded-lg border px-3 py-1 text-xs transition hover:bg-slate-50">Add Link</button>
                </div>
                <div className="space-y-2">
                  {form.internal_links.map((link, index) => (
                    <div key={index} className="grid gap-2 md:grid-cols-4">
                      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={link.type} onChange={(e) => updateInternalLink(index, 'type', e.target.value)}>
                        <option value="listing_page">Listing Page</option>
                        <option value="package">Package</option>
                        <option value="blog">Blog</option>
                      </select>
                      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={link.id} onChange={(e) => updateInternalLink(index, 'id', e.target.value)}>
                        <option value="">Select target</option>
                        {link.type === 'listing_page' ? listingPageOptions.map((row) => <option key={row.id} value={row.id}>{row.title}</option>) : null}
                        {link.type === 'package' ? packages.map((row) => <option key={row.id} value={row.id}>{row.title}</option>) : null}
                        {link.type === 'blog' ? blogs.map((row) => <option key={row.id} value={row.id}>{row.title}</option>) : null}
                      </select>
                      <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="e.g. Explore all Manali honeymoon packages" value={link.anchor_text} onChange={(e) => updateInternalLink(index, 'anchor_text', e.target.value)} />
                      <button type="button" onClick={() => removeInternalLink(index)} className="rounded bg-rose-100 px-3 py-2 text-xs text-rose-700">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t pt-4">
            <button type="button" onClick={() => router.get('/admin/listing-pages')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition duration-200 hover:bg-indigo-500">{isEdit ? 'Update' : 'Create'} Listing Page</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
