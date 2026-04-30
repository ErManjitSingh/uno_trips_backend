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

export default function PackagesIndex({ packages, filters, destinations = [], selectedPackage = null, packageCategories = [] }) {
  const { data, setData, processing, errors, clearErrors } = useForm({
    title: '',
    slug: '',
    destination: '',
    duration: '',
    price: '',
    offer_price: '',
    package_type: 'domestic',
    status: 'draft',
    is_popular: false,
    itinerary_text: '',
    inclusions_text: '',
    exclusions_text: '',
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
  const [itinerary, setItinerary] = useState([{ id: 1, title: 'Arrival', description: 'Airport pickup and hotel check-in', meals: 'Dinner', hotel: 'Uno Grand', transport: 'SUV', travel_mode: 'day' }])
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
        price: data.offer_price || data.price || 0,
        availability: 'https://schema.org/InStock',
      },
      ...(advanced.faq_schema ? { mainEntity: faqs.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) } : {}),
    }
    return JSON.stringify(payload, null, 2)
  }, [advanced.faq_schema, advanced.focus_keyword, advanced.schema_type, advanced.short_description, canonicalPreview, data.offer_price, data.price, data.seo_meta_description, data.title, faqs, suggestedKeyword])

  const completionPercent = useMemo(() => {
    const checks = [
      Boolean(data.title && data.destination && data.price),
      Boolean(data.seo_meta_title && data.seo_meta_description && advanced.focus_keyword),
      Boolean(data.featured_image || advanced.video_url),
      Boolean(data.offer_price),
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [advanced.focus_keyword, advanced.video_url, data.destination, data.featured_image, data.offer_price, data.price, data.seo_meta_description, data.seo_meta_title, data.title])

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
    setData('duration', selectedPackageData.duration || '')
    setData('price', selectedPackageData.price || '')
    setData('offer_price', selectedPackageData.offer_price || '')
    setData('package_type', selectedPackageData.package_type || 'domestic')
    setData('status', selectedPackageData.status || 'draft')
    setData('is_popular', Boolean(selectedPackageData.is_popular))
    setData('itinerary_text', Array.isArray(selectedPackageData.itinerary) ? selectedPackageData.itinerary.join('\n') : '')
    setData('inclusions_text', Array.isArray(selectedPackageData.inclusions) ? selectedPackageData.inclusions.join('\n') : '')
    setData('exclusions_text', Array.isArray(selectedPackageData.exclusions) ? selectedPackageData.exclusions.join('\n') : '')
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

    setItinerary(
      Array.isArray(selectedPackageData.itinerary) && selectedPackageData.itinerary.length
        ? selectedPackageData.itinerary.map((item, index) => ({
            id: Date.now() + index,
            title: item || `Day ${index + 1}`,
            description: '',
            meals: '',
            hotel: '',
            transport: '',
            travel_mode: 'day',
          }))
        : [{ id: 1, title: 'Arrival', description: 'Airport pickup and hotel check-in', meals: 'Dinner', hotel: 'Uno Grand', transport: 'SUV', travel_mode: 'day' }]
    )

    setFaqs(
      Array.isArray(selectedPackageData.faqs) && selectedPackageData.faqs.length
        ? selectedPackageData.faqs.map((item, index) => ({
            id: item.id || Date.now() + index,
            q: item.question || '',
            a: item.answer || '',
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

  const submit = (e) => {
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
    const effectiveStatus = (data.status || '').trim() || (selectedPackageData?.status || '').trim() || 'draft'

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
      faqs: faqs.map((item) => ({ q: item.q, a: item.a })),
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

          <div className="grid gap-5 xl:grid-cols-10">
            <div className="space-y-5 xl:col-span-7 [&_label>span]:text-slate-900">
              <BasicInfoSection
                data={data}
                setData={setData}
                advanced={advanced}
                setAdvancedField={setAdvancedField}
                onTitleChange={handleTitleChange}
                onSlugChange={handleSlugChange}
              />
              <CategoryTaxonomySection taxonomy={taxonomy} setTaxonomy={setTaxonomy} packageTitle={data.title} managedCategories={packageCategories} />
              <AddPackageWorkspace
                data={data}
                setData={setData}
                advanced={advanced}
                setAdvancedField={setAdvancedField}
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
