import { useEffect, useState } from 'react'
import { Car, Landmark, MapPinned, Utensils, Hotel, ShieldCheck } from 'lucide-react'

const baseInput = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400'

function toEditableList(value) {
  const items = String(value ?? '').split('\n')
  return items.length ? items : ['']
}

function parsePriceCalendar(value) {
  try {
    const parsed = JSON.parse(String(value || '[]'))
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((row) => row && typeof row === 'object')
      .map((row, idx) => ({
        id: row.id || `price-${Date.now()}-${idx}`,
        start_date: row.start_date || '',
        end_date: row.end_date || '',
        offer_price: row.offer_price ?? '',
      }))
  } catch {
    return []
  }
}

const includedFeatureOptions = [
  { key: 'transport', label: 'Transport Included', icon: 'car' },
  { key: 'meals', label: 'Meals Included', icon: 'utensils' },
  { key: 'stay', label: 'Stay Included', icon: 'hotel' },
  { key: 'sightseeing', label: 'Sightseeing', icon: 'map' },
  { key: 'guide', label: 'Guide Included', icon: 'landmark' },
  { key: 'assistance', label: 'Trip Assistance', icon: 'shield' },
]

const includedFeatureIcons = {
  car: Car,
  utensils: Utensils,
  hotel: Hotel,
  map: MapPinned,
  landmark: Landmark,
  shield: ShieldCheck,
}

function parseIncludedFeatures(value) {
  try {
    const parsed = JSON.parse(String(value || '[]'))
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === 'object') : []
  } catch {
    return []
  }
}

function itineraryImgSrc(src) {
  if (!src || typeof src !== 'string') return ''
  const t = src.trim()
  if (t.startsWith('http://') || t.startsWith('https://')) {
    try {
      const u = new URL(t)
      return `${u.pathname}${u.search || ''}`
    } catch {
      return t
    }
  }
  if (t.startsWith('/')) return t
  return `/storage/${t.replace(/^\//, '')}`
}

async function uploadItineraryDayImage(file) {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  const form = new FormData()
  form.append('image', file)
  const res = await fetch('/admin/packages/itinerary-day-image', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { 'X-CSRF-TOKEN': token } : {}),
    },
    body: form,
    credentials: 'same-origin',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.message || (data.errors && Object.values(data.errors).flat().join(' ')) || 'Upload failed'
    throw new Error(msg)
  }
  return data.url || (data.path ? `/storage/${String(data.path).replace(/^\//, '')}` : '')
}

export default function AddPackageWorkspace({
  data,
  setData,
  advanced,
  setAdvancedField,
  destinationOptions = [],
  itinerary,
  setItinerary,
  faqs,
  setFaqs,
  processing,
  saveState,
  onSubmit,
}) {
  const [autoFaqInput, setAutoFaqInput] = useState('')
  const [uploadingDayId, setUploadingDayId] = useState(null)
  const [inclusions, setInclusions] = useState(() => toEditableList(data.inclusions_text))
  const [exclusions, setExclusions] = useState(() => toEditableList(data.exclusions_text))
  const [locationQuery, setLocationQuery] = useState(data.location_name || data.destination || '')
  const [suggestions, setSuggestions] = useState([])
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [priceCalendarRows, setPriceCalendarRows] = useState(() => parsePriceCalendar(data.offer_price_calendar_json))
  const [includedFeatures, setIncludedFeatures] = useState(() => parseIncludedFeatures(data.included_features_json))
  const syncInclusions = (next) => {
    setInclusions(next)
    setData('inclusions_text', next.join('\n'))
  }

  const syncExclusions = (next) => {
    setExclusions(next)
    setData('exclusions_text', next.join('\n'))
  }

  useEffect(() => {
    const next = toEditableList(data.inclusions_text)
    if (next.join('\n') !== inclusions.join('\n')) setInclusions(next)
  }, [data.inclusions_text])

  useEffect(() => {
    const next = toEditableList(data.exclusions_text)
    if (next.join('\n') !== exclusions.join('\n')) setExclusions(next)
  }, [data.exclusions_text])

  useEffect(() => {
    const next = parsePriceCalendar(data.offer_price_calendar_json)
    const nextSerialized = JSON.stringify(next.map(({ start_date, end_date, offer_price }) => ({ start_date, end_date, offer_price })))
    const currentSerialized = JSON.stringify(priceCalendarRows.map(({ start_date, end_date, offer_price }) => ({ start_date, end_date, offer_price })))
    if (nextSerialized !== currentSerialized) {
      setPriceCalendarRows(next)
    }
  }, [data.offer_price_calendar_json])

  useEffect(() => {
    const next = parseIncludedFeatures(data.included_features_json)
    const a = JSON.stringify(next)
    const b = JSON.stringify(includedFeatures)
    if (a !== b) setIncludedFeatures(next)
  }, [data.included_features_json])

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  const fetchJson = async (url, options = {}) => {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...options,
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.message || 'Request failed')
    return payload
  }

  useEffect(() => {
    const q = locationQuery.trim()
    const t = setTimeout(async () => {
      try {
        setLoadingSuggestions(true)
        const payload = await fetchJson(`/search-locations?q=${encodeURIComponent(q)}`)
        setSuggestions(payload.data || [])
        setActiveSuggestion(-1)
      } catch {
        setSuggestions([])
      } finally {
        setLoadingSuggestions(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [locationQuery])

  const selectLocation = async (item) => {
    const label = item?.label || item?.name || ''
    setLocationQuery(label)
    setData('location_name', label)
    setData('destination', label)
    setData('latitude', item?.lat ?? '')
    setData('longitude', item?.lng ?? '')
    setAdvancedField('city', item?.name || '')
    setShowSuggestions(false)
    await fetchJson('/search-locations/recent', {
      method: 'POST',
      body: JSON.stringify({
        location_name: label,
        latitude: item?.lat ?? null,
        longitude: item?.lng ?? null,
      }),
    }).catch(() => {})
  }

  const highlightMatch = (text, query) => {
    const t = String(text || '')
    const q = String(query || '').trim()
    if (!q) return t
    const i = t.toLowerCase().indexOf(q.toLowerCase())
    if (i === -1) return t
    return (
      <>
        {t.slice(0, i)}
        <mark className="rounded bg-yellow-200/70 px-0.5">{t.slice(i, i + q.length)}</mark>
        {t.slice(i + q.length)}
      </>
    )
  }

  const syncPriceCalendarRows = (rows) => {
    setPriceCalendarRows(rows)
    setData('offer_price_calendar_json', JSON.stringify(rows.map(({ start_date, end_date, offer_price }) => ({ start_date, end_date, offer_price }))))
  }

  const syncIncludedFeatures = (rows) => {
    setIncludedFeatures(rows)
    setData('included_features_json', JSON.stringify(rows))
  }

  const toggleIncludedFeature = (feature) => {
    const exists = includedFeatures.some((item) => item.key === feature.key)
    if (exists) {
      syncIncludedFeatures(includedFeatures.filter((item) => item.key !== feature.key))
      return
    }
    syncIncludedFeatures([...includedFeatures, feature])
  }

  const onPickDayImage = async (dayId, file) => {
    if (!file) return
    setUploadingDayId(dayId)
    try {
      const url = await uploadItineraryDayImage(file)
      if (!url) throw new Error('No image URL returned')
      setItinerary((prev) => prev.map((d) => (d.id === dayId ? { ...d, image: url } : d)))
    } catch (e) {
      window.alert(e.message || 'Could not upload image')
    } finally {
      setUploadingDayId(null)
    }
  }

  const addFaq = () => {
    setFaqs((prev) => [...prev, { id: Date.now(), q: '', a: '' }])
  }

  const generateFaqFromInput = () => {
    const lines = autoFaqInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (!lines.length) return

    const generated = lines.map((line, idx) => {
      const [question, answer] = line.split('|').map((part) => part?.trim())
      const q = question || line
      const a = answer || `Details for "${q}" will be shared by our travel expert.`
      return { id: Date.now() + idx, q, a }
    })

    setFaqs((prev) => [...prev, ...generated])
    setAutoFaqInput('')
  }

  return (
    <form
      onSubmit={(e) => onSubmit(e, 'published')}
      className="space-y-5 [&_label>span]:text-slate-900"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Destination & Travel Details</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-slate-500">Search Destination *</span>
            <div className="relative">
              <input
                className={baseInput}
                value={locationQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setLocationQuery(e.target.value)
                  setShowSuggestions(true)
                  setData('location_name', e.target.value)
                  setData('destination', e.target.value)
                }}
                onKeyDown={(e) => {
                  if (!showSuggestions || suggestions.length === 0) return
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActiveSuggestion((prev) => Math.max(prev - 1, 0))
                  } else if (e.key === 'Enter' && activeSuggestion >= 0) {
                    e.preventDefault()
                    selectLocation(suggestions[activeSuggestion])
                  }
                }}
                placeholder="Type city e.g. Manali"
              />
              {showSuggestions ? (
                <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  {loadingSuggestions ? <p className="px-3 py-2 text-xs text-slate-500">Searching...</p> : null}
                  {!loadingSuggestions && suggestions.length === 0 ? <p className="px-3 py-2 text-xs text-slate-500">No results</p> : null}
                  {suggestions.map((item, idx) => (
                    <button
                      key={`${item.label}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        selectLocation(item)
                      }}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${activeSuggestion === idx ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'}`}
                    >
                      {highlightMatch(item.label, locationQuery)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <p className="text-[11px] text-slate-500">Selected: {data.location_name || data.destination || 'Not selected'} | Lat: {data.latitude || '-'} | Lng: {data.longitude || '-'}</p>
          </label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Duration Days *</span><input className={baseInput} value={advanced.days} readOnly placeholder="Auto from itinerary" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Duration Nights *</span><input className={baseInput} value={advanced.nights} readOnly placeholder="Auto from itinerary" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Tour Type</span><select className={baseInput} value={data.package_type} onChange={(e) => setData('package_type', e.target.value)}><option value="family">Family</option><option value="honeymoon">Honeymoon</option><option value="adventure">Adventure</option><option value="international">Luxury</option><option value="domestic">Group</option></select></label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Pricing & Offers</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Original Price *</span><input className={baseInput} value={data.price} onChange={(e) => setData('price', e.target.value)} placeholder="e.g. 25999" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Duration Label</span><input className={baseInput} value={data.duration} readOnly placeholder="Auto from itinerary" /></label>
        </div>
        <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-indigo-800">Offer Price Calendar</p>
            <button
              type="button"
              onClick={() => syncPriceCalendarRows([...priceCalendarRows, { id: `price-${Date.now()}`, start_date: '', end_date: '', offer_price: '' }])}
              className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              + Add Date Range
            </button>
          </div>
          <p className="mt-1 text-[11px] text-indigo-700/80">Different offer prices for different travel dates.</p>
          <div className="mt-3 space-y-2">
            {priceCalendarRows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-indigo-200 bg-white px-3 py-2 text-xs text-slate-500">
                No date-wise price added yet.
              </p>
            ) : null}
            {priceCalendarRows.map((row, idx) => (
              <div key={row.id} className="grid gap-2 rounded-xl border border-indigo-100 bg-white p-2 md:grid-cols-4">
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-500">From</span>
                  <input
                    type="date"
                    className={baseInput}
                    value={row.start_date}
                    onChange={(e) => syncPriceCalendarRows(priceCalendarRows.map((item, index) => (index === idx ? { ...item, start_date: e.target.value } : item)))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-500">To</span>
                  <input
                    type="date"
                    className={baseInput}
                    value={row.end_date}
                    min={row.start_date || undefined}
                    onChange={(e) => syncPriceCalendarRows(priceCalendarRows.map((item, index) => (index === idx ? { ...item, end_date: e.target.value } : item)))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-500">Offer Price (INR)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={baseInput}
                    value={row.offer_price}
                    onChange={(e) => syncPriceCalendarRows(priceCalendarRows.map((item, index) => (index === idx ? { ...item, offer_price: e.target.value } : item)))}
                    placeholder="e.g. 19999"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => syncPriceCalendarRows(priceCalendarRows.filter((_, index) => index !== idx))}
                    className="w-full rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Inclusions &amp; Exclusions</h3>
        <p className="mt-1 text-xs text-slate-500">Add all package inclusions and exclusions clearly here. Use Top Highlights to showcase the major experiences and key benefits included in this package.</p>
        <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-indigo-800">Top Highlights Icons</p>
            <span className="text-[11px] text-indigo-700/80">{includedFeatures.length} selected</span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-700/80">Tour page header me icon ke saath show honge.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {includedFeatureOptions.map((feature) => {
              const selected = includedFeatures.some((item) => item.key === feature.key)
              const Icon = includedFeatureIcons[feature.icon] || ShieldCheck
              return (
                <button
                  key={feature.key}
                  type="button"
                  onClick={() => toggleIncludedFeature(feature)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selected
                      ? 'border-indigo-300 bg-indigo-100 text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/70'
                  }`}
                >
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${selected ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{feature.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-emerald-800">Inclusions</p>
              <button
                type="button"
                onClick={() => syncInclusions([...inclusions, ''])}
                className="rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200"
              >
                + Add Inclusion
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {inclusions.map((item, idx) => (
                <div key={`inclusion-${idx}`} className="group flex items-start gap-2 rounded-xl border border-emerald-100 bg-white p-2 shadow-sm">
                  <span className="mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-1 text-[11px] font-semibold text-emerald-700">{idx + 1}</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
                    value={item}
                    onChange={(e) => syncInclusions(inclusions.map((value, index) => (index === idx ? e.target.value : value)))}
                    placeholder="e.g. Airport transfers"
                  />
                  <button
                    type="button"
                    onClick={() => syncInclusions(inclusions.length <= 1 ? [''] : inclusions.filter((_, index) => index !== idx))}
                    className="mt-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 opacity-70 transition hover:bg-rose-100 group-hover:opacity-100"
                    title="Remove inclusion"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-amber-800">Exclusions</p>
              <button
                type="button"
                onClick={() => syncExclusions([...exclusions, ''])}
                className="rounded-lg border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-200"
              >
                + Add Exclusion
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {exclusions.map((item, idx) => (
                <div key={`exclusion-${idx}`} className="group flex items-start gap-2 rounded-xl border border-amber-100 bg-white p-2 shadow-sm">
                  <span className="mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100 px-1 text-[11px] font-semibold text-amber-700">{idx + 1}</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-amber-400"
                    value={item}
                    onChange={(e) => syncExclusions(exclusions.map((value, index) => (index === idx ? e.target.value : value)))}
                    placeholder="e.g. Flight tickets"
                  />
                  <button
                    type="button"
                    onClick={() => syncExclusions(exclusions.length <= 1 ? [''] : exclusions.filter((_, index) => index !== idx))}
                    className="mt-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 opacity-70 transition hover:bg-rose-100 group-hover:opacity-100"
                    title="Remove exclusion"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Media Uploads</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center"><p className="text-sm font-medium text-slate-700">Featured Image *</p><input type="file" accept="image/*" className="mt-2 w-full text-xs" onChange={(e) => setData('featured_image', e.target.files?.[0] || null)} /></label>
          <label className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center"><p className="text-sm font-medium text-slate-700">Gallery Multiple Upload</p><input type="file" multiple className="mt-2 w-full text-xs" /></label>
          <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-500">Video URL</span><input className={baseInput} value={advanced.video_url} onChange={(e) => setAdvancedField('video_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." /></label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Itinerary Builder</h3>
          <button type="button" onClick={() => setItinerary((prev) => [...prev, { id: Date.now(), title: `Day ${prev.length + 1}`, description: '', meals: '', hotel: '', transport: '', travel_mode: 'day', image: '' }])} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Add Day</button>
        </div>
        <div className="mt-4 space-y-3">
          {itinerary.map((day, idx) => (
            <article key={day.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-sm font-semibold text-slate-700">Day {idx + 1}</p>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Travel Type:</span>
                {idx === 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, travel_mode: 'day' } : d)))}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${day.travel_mode !== 'night' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                      Day Travel
                    </button>
                    <button
                      type="button"
                      onClick={() => setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, travel_mode: 'night' } : d)))}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${day.travel_mode === 'night' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                      Night Travel
                    </button>
                    {day.travel_mode === 'night' ? <span className="text-[11px] text-emerald-700">Day 1 still counted (night departure)</span> : null}
                  </>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Day Travel</span>
                )}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input className={baseInput} value={day.title} onChange={(e) => setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, title: e.target.value } : d)))} placeholder="Day Title" />
                <input className={baseInput} value={day.meals} onChange={(e) => setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, meals: e.target.value } : d)))} placeholder="Meals Included" />
                <input className={baseInput} value={day.hotel} onChange={(e) => setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, hotel: e.target.value } : d)))} placeholder="Hotel Stay" />
                <input className={baseInput} value={day.transport} onChange={(e) => setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, transport: e.target.value } : d)))} placeholder="Transport" />
                <textarea className={`${baseInput} min-h-20 md:col-span-2`} value={day.description} onChange={(e) => setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, description: e.target.value } : d)))} placeholder="Description" />
                <div className="md:col-span-2 space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium text-slate-500">Day image (optional)</p>
                  <div className="flex flex-wrap items-start gap-3">
                    {day.image ? (
                      <div className="relative shrink-0">
                        <img src={itineraryImgSrc(day.image)} alt="" className="h-28 w-44 rounded-lg border border-slate-200 object-cover" />
                        <button
                          type="button"
                          onClick={() => setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, image: '' } : d)))}
                          className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null}
                    <label className="flex min-w-[10rem] cursor-pointer flex-col gap-1">
                      <span className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-600">
                        {uploadingDayId === day.id ? 'Uploading…' : 'Upload photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingDayId === day.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          e.target.value = ''
                          if (f) onPickDayImage(day.id, f)
                        }}
                      />
                    </label>
                  </div>
                  <input
                    className={baseInput}
                    value={day.image || ''}
                    onChange={(e) => setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, image: e.target.value } : d)))}
                    placeholder="Or paste image URL"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">FAQ Builder</h3>
          <button
            type="button"
            onClick={addFaq}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Add FAQ
          </button>
        </div>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-600">Auto FAQ Input</p>
          <p className="mt-1 text-xs text-slate-500">Har line me `Question | Answer` likho. Sirf question likhoge to answer auto-fill ho jayega.</p>
          <textarea
            className={`${baseInput} mt-2 min-h-24`}
            value={autoFaqInput}
            onChange={(e) => setAutoFaqInput(e.target.value)}
            placeholder={`Best time to visit? | October to March\nIs EMI available? | Yes, selected cards supported\nPickup included?`}
          />
          <button
            type="button"
            onClick={generateFaqFromInput}
            className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700"
          >
            Auto Generate FAQ
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {faqs.map((faq) => (
            <div key={faq.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input className={baseInput} value={faq.q} onChange={(e) => setFaqs((prev) => prev.map((f) => (f.id === faq.id ? { ...f, q: e.target.value } : f)))} placeholder="Question" />
              <textarea className={`${baseInput} mt-2 min-h-20`} value={faq.a} onChange={(e) => setFaqs((prev) => prev.map((f) => (f.id === faq.id ? { ...f, a: e.target.value } : f)))} placeholder="Answer" />
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-3 z-10 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow backdrop-blur">
        <button
          type="button"
          onClick={(e) => onSubmit(e, 'draft')}
          disabled={processing}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Save Draft
        </button>
        <button type="submit" disabled={processing} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          {processing ? 'Saving...' : 'Publish'}
        </button>
        <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400" disabled title="Coming soon">
          Schedule
        </button>
        <span className="ml-auto text-xs text-slate-500">{saveState}</span>
      </div>
    </form>
  )
}
