import { Head, router, useForm } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../../Layouts/AdminLayout'
import AddPackageHeader from '../../../Components/Packages/AddPackageHeader'
import BasicInfoSection from '../../../Components/Packages/BasicInfoSection'
import AddPackageWorkspace from '../../../Components/Packages/AddPackageWorkspace'
import SeoControlsSection from '../../../Components/Packages/SeoControlsSection'
import StickySidebar from '../../../Components/Packages/StickySidebar'
import AllPackagesPanel from '../../../Components/Packages/AllPackagesPanel'
import CategoryTaxonomySection from '../../../Components/Packages/CategoryTaxonomySection'

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const parseOfferCalendar = (json) => {
  try {
    const parsed = JSON.parse(String(json || '[]'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function PackagesIndex({
  packages,
  filters,
  destinations = [],
  destinationOptions = [],
  selectedPackage = null,
  packageCategories = [],
}) {
  const { data, setData, processing, errors, clearErrors } = useForm({
    title: '',
    slug: '',
    destination: '',
    location_name: '',
    latitude: '',
    longitude: '',
    duration: '',
    price: '',
    offer_price_calendar_json: '[]',
    package_type: 'domestic',
    status: 'draft',
    is_popular: false,
    itinerary_text: '',
    inclusions_text: '',
    exclusions_text: '',
    included_features_json: '[]',
    seo_meta_title: '',
    seo_meta_description: '',
    featured_image: null,
  })
  const [saveState, setSaveState] = useState('All changes saved')
  const [showSaveAnimation, setShowSaveAnimation] = useState(false)
  const [saveProgress, setSaveProgress] = useState(0)
  const [slugTouched, setSlugTouched] = useState(false)
  const [advanced, setAdvanced] = useState({
    focus_keyword: '',
    short_description: '',
    full_description: 'Experience curated stays, private transfers, gourmet dining and premium local activities.',
    badge: 'Luxury',
    country: 'India',
    state: '',
    city: '',
    days: '6',
    nights: '5',
    taxes_included: true,
    emi_available: true,
    coupon_eligible: true,
    featured_image: null,
    video_url: '',
    faq_schema: true,
    breadcrumb_schema: true,
    sitemap_include: true,
    canonical_url: '',
    robots: 'index,follow',
    og_title: '',
    og_description: '',
    schema_type: 'TourPackage',
  })
  const [itinerary, setItinerary] = useState([{ id: 1, title: 'Arrival', description: 'Airport pickup and hotel check-in', meals: 'Dinner', hotel: 'Uno Grand', transport: 'SUV', travel_mode: 'day', image: '' }])
  const [faqs, setFaqs] = useState([{ id: 1, q: 'Best time to visit?', a: 'October to March for best weather.' }])
  const [taxonomy, setTaxonomy] = useState({
    primary_category: '',
    secondary_categories: [],
    tags: [],
    seasonal_categories: [],
    marketing_labels: [],
    recently_used: [],
    seo_landing_pages: ['/honeymoon-packages', '/family-tour-packages', '/goa-packages', '/summer-special-packages'],
    homepage_display_category: '',
    filter_priority: 1,
  })

  const activeTab = filters.tab || 'all'
  const totalPackagesCount = packages?.total ?? packages?.data?.length ?? 0
  const editingPackageId = Number(filters.edit || 0)
  const duplicatePackageId = Number(filters.duplicate || 0)
  const updateFilters = (patch = {}, options = { preserveState: true, replace: true }) => {
    const merged = { ...filters, ...patch }
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([, value]) => value !== null && value !== undefined && value !== '')
    )
    router.get('/admin/packages', cleaned, options)
  }
  const setAdvancedField = (k, v) => setAdvanced((p) => ({ ...p, [k]: v }))
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  const selectedPackageData = useMemo(() => {
    if (selectedPackage) return selectedPackage
    return packages?.data?.find((item) => item.id === editingPackageId || item.id === duplicatePackageId) || null
  }, [duplicatePackageId, editingPackageId, packages, selectedPackage])
  const isEditing = Boolean(editingPackageId)

  const seoScore = useMemo(() => {
    let score = 0
    if (advanced.focus_keyword) score += 25
    if (data.seo_meta_title.toLowerCase().includes(advanced.focus_keyword.toLowerCase()) && advanced.focus_keyword) score += 25
    if (data.slug.toLowerCase().includes(advanced.focus_keyword.toLowerCase()) && advanced.focus_keyword) score += 25
    if (data.seo_meta_description.length >= 120 && data.seo_meta_description.length <= 170) score += 25
    return score
  }, [advanced.focus_keyword, data.seo_meta_description, data.seo_meta_title, data.slug])

  const suggestedKeyword = useMemo(() => {
    if (!data.title && !data.destination) return ''
    return `${data.destination || advanced.city || 'premium'} ${data.title || 'tour package'}`
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
  }, [advanced.city, data.destination, data.title])

  const canonicalPreview = useMemo(() => {
    if (advanced.canonical_url) return advanced.canonical_url
    if (!data.slug) return 'https://unotrips.com/tours/<auto-slug>'
    return `https://unotrips.com/tours/${data.slug}`
  }, [advanced.canonical_url, data.slug])

  const sitemapPreview = useMemo(() => {
    if (!advanced.sitemap_include) return 'Excluded from sitemap'
    return `<url><loc>${canonicalPreview}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`
  }, [advanced.sitemap_include, canonicalPreview])

  const schemaPreview = useMemo(() => {
    const calendarPrices = parseOfferCalendar(data.offer_price_calendar_json)
      .map((item) => Number(item?.offer_price || 0))
      .filter((value) => Number.isFinite(value) && value > 0)
    const effectiveOfferPrice = calendarPrices.length ? Math.min(...calendarPrices) : 0

    const payload = {
      '@context': 'https://schema.org',
      '@type': advanced.schema_type,
      name: data.title || 'Package title',
      description: data.seo_meta_description || advanced.short_description || 'Premium travel package',
      url: canonicalPreview,
      keywords: advanced.focus_keyword || suggestedKeyword || '',
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: effectiveOfferPrice || data.price || 0,
        availability: 'https://schema.org/InStock',
      },
      ...(advanced.faq_schema ? { mainEntity: faqs.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) } : {}),
    }
    return JSON.stringify(payload, null, 2)
  }, [advanced.faq_schema, advanced.focus_keyword, advanced.schema_type, advanced.short_description, canonicalPreview, data.offer_price_calendar_json, data.price, data.seo_meta_description, data.title, faqs, suggestedKeyword])

  const completionPercent = useMemo(() => {
    const hasCalendarOffer = parseOfferCalendar(data.offer_price_calendar_json).some((item) => {
      const price = Number(item?.offer_price || 0)
      return Number.isFinite(price) && price > 0
    })

    const checks = [
      Boolean(data.title && data.destination && data.price),
      Boolean(data.seo_meta_title && data.seo_meta_description && advanced.focus_keyword),
      Boolean(data.featured_image || advanced.video_url),
      hasCalendarOffer,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [advanced.focus_keyword, advanced.video_url, data.destination, data.featured_image, data.offer_price_calendar_json, data.price, data.seo_meta_description, data.seo_meta_title, data.title])

  useEffect(() => {
    const totalDays = itinerary.length || 1
    const startsWithNightTravel = itinerary[0]?.travel_mode === 'night'
    const totalNights = Math.max(totalDays - 1, 0) + (startsWithNightTravel ? 1 : 0)

    setAdvanced((prev) => ({
      ...prev,
      days: String(totalDays),
      nights: String(totalNights),
    }))
    setData('duration', `${totalDays}D / ${totalNights}N`)
  }, [itinerary, setData])

  useEffect(() => {
    if (!advanced.focus_keyword && suggestedKeyword) {
      setAdvancedField('focus_keyword', suggestedKeyword)
    }
  }, [advanced.focus_keyword, suggestedKeyword])

  useEffect(() => {
    if (activeTab !== 'add') return
    setSaveState('Auto-saving...')
    const t = setTimeout(() => setSaveState('All changes saved'), 700)
    return () => clearTimeout(t)
  }, [activeTab, data, advanced, itinerary, faqs])

  useEffect(() => {
    if (activeTab !== 'add' || !selectedPackageData) return

    const isDuplicateMode = Boolean(duplicatePackageId)
    const nextSlug = isDuplicateMode ? `${selectedPackageData.slug}-copy-${Date.now().toString().slice(-4)}` : selectedPackageData.slug
    const durationMatch = String(selectedPackageData.duration || '').match(/(\d+)\D+(\d+)/)
    const days = durationMatch?.[1] || '6'
    const nights = durationMatch?.[2] || '5'

    setData('title', selectedPackageData.title || '')
    setData('slug', nextSlug || '')
    setData('destination', selectedPackageData.destination || '')
    setData('location_name', selectedPackageData.location_name || selectedPackageData.destination || '')
    setData('latitude', selectedPackageData.latitude || '')
    setData('longitude', selectedPackageData.longitude || '')
    setData('duration', selectedPackageData.duration || '')
    setData('price', selectedPackageData.price || '')
    setData('offer_price_calendar_json', JSON.stringify(Array.isArray(selectedPackageData.offer_price_calendar) ? selectedPackageData.offer_price_calendar : []))
    setData('package_type', selectedPackageData.package_type || 'domestic')
    setData('status', selectedPackageData.status || 'draft')
    setData('is_popular', Boolean(selectedPackageData.is_popular))
    setData(
      'itinerary_text',
      Array.isArray(selectedPackageData.itinerary) && selectedPackageData.itinerary.length && typeof selectedPackageData.itinerary[0] === 'string'
        ? selectedPackageData.itinerary.join('\n')
        : '',
    )
    setData('inclusions_text', Array.isArray(selectedPackageData.inclusions) ? selectedPackageData.inclusions.join('\n') : '')
    setData('exclusions_text', Array.isArray(selectedPackageData.exclusions) ? selectedPackageData.exclusions.join('\n') : '')
    setData('included_features_json', JSON.stringify(Array.isArray(selectedPackageData.included_features) ? selectedPackageData.included_features : []))
    setData('seo_meta_title', selectedPackageData.seo_meta_title || '')
    setData('seo_meta_description', selectedPackageData.seo_meta_description || '')
    setData('featured_image', null)

    setAdvanced((prev) => ({
      ...prev,
      badge: selectedPackageData.featured_badge || prev.badge,
      short_description: selectedPackageData.short_description || prev.short_description,
      full_description: selectedPackageData.full_description || prev.full_description,
      country: selectedPackageData.country || prev.country,
      state: selectedPackageData.state || prev.state,
      city: selectedPackageData.city || prev.city,
      days,
      nights,
      taxes_included: typeof selectedPackageData.taxes_included === 'boolean' ? selectedPackageData.taxes_included : prev.taxes_included,
      emi_available: typeof selectedPackageData.emi_available === 'boolean' ? selectedPackageData.emi_available : prev.emi_available,
      coupon_eligible: typeof selectedPackageData.coupon_eligible === 'boolean' ? selectedPackageData.coupon_eligible : prev.coupon_eligible,
      video_url: selectedPackageData.video_url || prev.video_url,
      faq_schema: typeof selectedPackageData.faq_schema === 'boolean' ? selectedPackageData.faq_schema : prev.faq_schema,
      breadcrumb_schema: typeof selectedPackageData.breadcrumb_schema === 'boolean' ? selectedPackageData.breadcrumb_schema : prev.breadcrumb_schema,
      sitemap_include: typeof selectedPackageData.sitemap_include === 'boolean' ? selectedPackageData.sitemap_include : prev.sitemap_include,
      canonical_url: selectedPackageData.canonical_url || prev.canonical_url,
      robots: selectedPackageData.robots || prev.robots,
      og_title: selectedPackageData.og_title || prev.og_title,
      og_description: selectedPackageData.og_description || prev.og_description,
      schema_type: selectedPackageData.schema_type || prev.schema_type,
    }))

    setTaxonomy((prev) => ({
      ...prev,
      primary_category: selectedPackageData.primary_category || '',
      secondary_categories: Array.isArray(selectedPackageData.secondary_categories) ? selectedPackageData.secondary_categories : [],
      tags: Array.isArray(selectedPackageData.highlight_tags) ? selectedPackageData.highlight_tags : [],
      seasonal_categories: Array.isArray(selectedPackageData.seasonal_categories) ? selectedPackageData.seasonal_categories : [],
      marketing_labels: Array.isArray(selectedPackageData.marketing_labels) ? selectedPackageData.marketing_labels : [],
      seo_landing_pages: Array.isArray(selectedPackageData.seo_landing_pages) && selectedPackageData.seo_landing_pages.length ? selectedPackageData.seo_landing_pages : prev.seo_landing_pages,
      homepage_display_category: selectedPackageData.homepage_display_category || '',
      filter_priority: selectedPackageData.filter_priority || 1,
    }))

    setItinerary(() => {
      const raw = selectedPackageData.itinerary
      if (!Array.isArray(raw) || raw.length === 0) {
        return [{ id: Date.now(), title: 'Arrival', description: 'Airport pickup and hotel check-in', meals: 'Dinner', hotel: 'Uno Grand', transport: 'SUV', travel_mode: 'day', image: '' }]
      }
      return raw.map((item, index) => {
        if (typeof item === 'string') {
          return {
            id: Date.now() + index,
            title: item || `Day ${index + 1}`,
            description: '',
            meals: '',
            hotel: '',
            transport: '',
            travel_mode: 'day',
            image: '',
          }
        }
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          return {
            id: item.id ?? Date.now() + index,
            title: item.title ?? `Day ${index + 1}`,
            description: item.description ?? '',
            meals: item.meals ?? '',
            hotel: item.hotel ?? '',
            transport: item.transport ?? '',
            travel_mode: item.travel_mode === 'night' ? 'night' : 'day',
            image: item.image ?? '',
          }
        }
        return {
          id: Date.now() + index,
          title: `Day ${index + 1}`,
          description: '',
          meals: '',
          hotel: '',
          transport: '',
          travel_mode: 'day',
          image: '',
        }
      })
    })

    setFaqs(
      Array.isArray(selectedPackageData.faqs) && selectedPackageData.faqs.length
        ? selectedPackageData.faqs.map((item, index) => ({
            id: item.id || Date.now() + index,
            q: item.question ?? item.q ?? '',
            a: item.answer ?? item.a ?? '',
          }))
        : [{ id: 1, q: 'Best time to visit?', a: 'October to March for best weather.' }]
    )

    setSlugTouched(!isDuplicateMode)
    setSaveState(isDuplicateMode ? 'Duplicate mode' : 'Editing package')
  }, [activeTab, duplicatePackageId, selectedPackageData])

  useEffect(() => {
    const auto = setInterval(() => {
      if (activeTab === 'add') setSaveState(`Auto-saved at ${new Date().toLocaleTimeString()}`)
    }, 30000)
    return () => clearInterval(auto)
  }, [activeTab])

  useEffect(() => {
    if (!showSaveAnimation) return

    const ticker = setInterval(() => {
      setSaveProgress((prev) => {
        const next = Math.min(prev + 5, 100)
        if (next === 100) {
          clearInterval(ticker)
          setTimeout(() => {
            setShowSaveAnimation(false)
            updateFilters({ tab: 'all', edit: null, duplicate: null }, { preserveState: false, replace: true })
          }, 350)
        }
        return next
      })
    }, 45)

    return () => clearInterval(ticker)
  }, [showSaveAnimation])

  const submit = (e, forcedStatus) => {
    e?.preventDefault?.()
    clearErrors()

    if (isEditing && !selectedPackageData) {
      setSaveState('Loading package data, please try again...')
      return
    }

    const effectiveTitle = (data.title || '').trim() || (selectedPackageData?.title || '').trim()
    const effectiveSlug = (data.slug || '').trim() || (selectedPackageData?.slug || '').trim()
    const effectiveDestination = (data.destination || '').trim() || (selectedPackageData?.destination || '').trim()
    const effectiveDuration = (data.duration || '').trim() || (selectedPackageData?.duration || '').trim()
    const effectivePrice = data.price !== '' && data.price !== null && data.price !== undefined
      ? data.price
      : (selectedPackageData?.price ?? '')
    const effectivePackageType = (data.package_type || '').trim() || (selectedPackageData?.package_type || '').trim() || 'domestic'
    const effectiveStatus =
      forcedStatus === 'published' || forcedStatus === 'draft'
        ? forcedStatus
        : (data.status || '').trim() || (selectedPackageData?.status || '').trim() || 'draft'

    if (!effectiveTitle) {
      setSaveState('Title missing. Please wait for package data to load.')
      return
    }

    if (!effectiveSlug || !effectiveDestination || !effectiveDuration || effectivePrice === '') {
      setSaveState('Required fields are still loading. Please try again in a second.')
      return
    }

    const payload = {
      ...data,
      title: effectiveTitle,
      slug: effectiveSlug,
      destination: effectiveDestination,
      location_name: (data.location_name || '').trim() || effectiveDestination,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      offer_price: null,
      duration: effectiveDuration,
      price: effectivePrice,
      package_type: effectivePackageType,
      status: effectiveStatus,
      short_description: advanced.short_description,
      full_description: advanced.full_description,
      country: advanced.country,
      state: advanced.state,
      city: advanced.city,
      days: advanced.days || null,
      nights: advanced.nights || null,
      taxes_included: advanced.taxes_included,
      emi_available: advanced.emi_available,
      coupon_eligible: advanced.coupon_eligible,
      video_url: advanced.video_url,
      faq_schema: advanced.faq_schema,
      breadcrumb_schema: advanced.breadcrumb_schema,
      sitemap_include: advanced.sitemap_include,
      canonical_url: advanced.canonical_url,
      robots: advanced.robots,
      og_title: advanced.og_title,
      og_description: advanced.og_description,
      schema_type: advanced.schema_type,
      featured_badge: advanced.badge,
      primary_category: taxonomy.primary_category,
      secondary_categories: taxonomy.secondary_categories,
      highlight_tags: taxonomy.tags,
      seasonal_categories: taxonomy.seasonal_categories,
      marketing_labels: taxonomy.marketing_labels,
      seo_landing_pages: taxonomy.seo_landing_pages,
      homepage_display_category: taxonomy.homepage_display_category,
      filter_priority: taxonomy.filter_priority,
      itinerary_json: JSON.stringify(
        itinerary.map(({ title, description, meals, hotel, transport, travel_mode, image }) => ({
          title: title || '',
          description: description || '',
          meals: meals || '',
          hotel: hotel || '',
          transport: transport || '',
          travel_mode: travel_mode === 'night' ? 'night' : 'day',
          image: image || '',
        })),
      ),
      faqs_json: JSON.stringify(faqs.map((item) => ({ q: item.q || '', a: item.a || '' }))),
      offer_price_calendar_json: data.offer_price_calendar_json || '[]',
      included_features_json: data.included_features_json || '[]',
    }

    const onSuccess = () => {
      setSaveState(isEditing ? 'Updated successfully' : 'Saved successfully')
      setSaveProgress(0)
      setShowSaveAnimation(true)
    }
    const onError = () => setSaveState(isEditing ? 'Update failed. Please fix required fields.' : 'Save failed. Please fix required fields.')

    if (isEditing) {
      router.post(`/admin/packages/${editingPackageId}`, { ...payload, _method: 'put' }, {
        preserveScroll: true,
        forceFormData: true,
        onSuccess,
        onError,
      })
      return
    }

    router.post('/admin/packages', payload, {
      preserveScroll: true,
      forceFormData: true,
      onSuccess,
      onError,
    })
  }

  const autoGenerateSeo = () => {
    const keyword = advanced.focus_keyword || suggestedKeyword
    if (!data.seo_meta_title && data.title) {
      setData('seo_meta_title', `${data.title} | Uno Trips`)
    }
    if (!data.seo_meta_description) {
      setData('seo_meta_description', `Book ${keyword || data.title || 'premium tour package'} with Uno Trips. Curated stays, guided experiences, and best-value offers.`.slice(0, 160))
    }
    if (!advanced.canonical_url && data.slug) {
      setAdvancedField('canonical_url', `https://unotrips.com/tours/${data.slug}`)
    }
    if (!advanced.og_title && data.seo_meta_title) {
      setAdvancedField('og_title', data.seo_meta_title)
    }
    if (!advanced.og_description && data.seo_meta_description) {
      setAdvancedField('og_description', data.seo_meta_description)
    }
    if (!advanced.focus_keyword && keyword) {
      setAdvancedField('focus_keyword', keyword)
    }
  }

  const handleTitleChange = (title) => {
    setData('title', title)
    if (!slugTouched) {
      setData('slug', slugify(title))
    }
  }

  const handleSlugChange = (slug) => {
    setData('slug', slug)
    setSlugTouched(slug.trim().length > 0 && slug !== slugify(data.title))
  }

  const uploadPackageEditorImage = async (file) => {
    const form = new FormData()
    form.append('image', file)

    const res = await fetch('/admin/packages/editor-image', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
      },
      credentials: 'same-origin',
      body: form,
    })

    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(payload.message || 'Image upload failed')
    }

    return payload.url || ''
  }

  return (
    <>
      <Head title="Tour Packages" />
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => updateFilters({ tab: 'all' })} className={`rounded-xl px-4 py-2 text-sm font-medium ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>All Packages ({totalPackagesCount})</button>
        <button onClick={() => updateFilters({ tab: 'add' })} className={`rounded-xl px-4 py-2 text-sm font-medium ${activeTab === 'add' ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>Add New Package</button>
        <button onClick={() => updateFilters({ tab: 'pricing' })} className={`rounded-xl px-4 py-2 text-sm font-medium ${activeTab === 'pricing' ? 'bg-cyan-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>Pricing Manager</button>
      </div>

      {activeTab === 'add' ? (
        <div className="space-y-5">
          {showSaveAnimation ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-7 text-center shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Publishing Package</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Please wait...</h3>
                <p className="mt-1 text-sm text-slate-500">Your package is being saved and synced.</p>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 transition-all duration-200"
                    style={{ width: `${saveProgress}%` }}
                  />
                </div>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">{saveProgress}%</p>
              </div>
            </div>
          ) : null}

          {Object.keys(errors).length > 0 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p className="font-semibold">Package could not be saved.</p>
              <ul className="mt-1 list-disc pl-5">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <AddPackageHeader onSubmit={submit} />

          <div className="grid gap-5 xl:grid-cols-10 xl:items-start">
            <div className="space-y-5 xl:col-span-7 [&_label>span]:text-slate-900">
              <BasicInfoSection
                data={data}
                setData={setData}
                advanced={advanced}
                setAdvancedField={setAdvancedField}
                onTitleChange={handleTitleChange}
                onSlugChange={handleSlugChange}
                onEditorImageUpload={uploadPackageEditorImage}
              />
              <CategoryTaxonomySection taxonomy={taxonomy} setTaxonomy={setTaxonomy} packageTitle={data.title} managedCategories={packageCategories} />
              <AddPackageWorkspace
                data={data}
                setData={setData}
                advanced={advanced}
                setAdvancedField={setAdvancedField}
                destinationOptions={destinationOptions}
                itinerary={itinerary}
                setItinerary={setItinerary}
                faqs={faqs}
                setFaqs={setFaqs}
                processing={processing}
                saveState={saveState}
                onSubmit={submit}
              />
              <SeoControlsSection
                data={data}
                setData={setData}
                advanced={advanced}
                setAdvancedField={setAdvancedField}
                autoGenerateSeo={autoGenerateSeo}
                suggestedKeyword={suggestedKeyword}
                sitemapPreview={sitemapPreview}
                schemaPreview={schemaPreview}
              />
            </div>
            <StickySidebar completionPercent={completionPercent} seoScore={seoScore} data={data} />
          </div>
        </div>
      ) : (
      <AllPackagesPanel packages={packages} filters={filters} destinations={destinations} updateFilters={updateFilters} showPricingManager={activeTab === 'pricing'} />
      )}
    </>
  )
}

PackagesIndex.layout = (page) => <AdminLayout title="Tour Package Management">{page}</AdminLayout>
