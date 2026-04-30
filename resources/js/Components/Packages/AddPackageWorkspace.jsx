import { useState } from 'react'

const baseInput = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400'

export default function AddPackageWorkspace({
  data,
  setData,
  advanced,
  setAdvancedField,
  itinerary,
  setItinerary,
  faqs,
  setFaqs,
  processing,
  saveState,
  onSubmit,
}) {
  const [autoFaqInput, setAutoFaqInput] = useState('')

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
    <form onSubmit={onSubmit} className="space-y-5 [&_label>span]:text-slate-900">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Destination & Travel Details</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Country</span><input className={baseInput} value={advanced.country} onChange={(e) => setAdvancedField('country', e.target.value)} placeholder="Enter country" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">State</span><input className={baseInput} value={advanced.state} onChange={(e) => setAdvancedField('state', e.target.value)} placeholder="Enter state" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">City / Destination *</span><input className={baseInput} value={data.destination} onChange={(e) => setData('destination', e.target.value)} placeholder="Enter destination city" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Duration Days *</span><input className={baseInput} value={advanced.days} readOnly placeholder="Auto from itinerary" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Duration Nights *</span><input className={baseInput} value={advanced.nights} readOnly placeholder="Auto from itinerary" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Tour Type</span><select className={baseInput} value={data.package_type} onChange={(e) => setData('package_type', e.target.value)}><option value="family">Family</option><option value="honeymoon">Honeymoon</option><option value="adventure">Adventure</option><option value="international">Luxury</option><option value="domestic">Group</option></select></label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Pricing & Offers</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Original Price *</span><input className={baseInput} value={data.price} onChange={(e) => setData('price', e.target.value)} placeholder="e.g. 25999" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Offer Price</span><input className={baseInput} value={data.offer_price} onChange={(e) => setData('offer_price', e.target.value)} placeholder="e.g. 21999" /></label>
          <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Duration Label</span><input className={baseInput} value={data.duration} readOnly placeholder="Auto from itinerary" /></label>
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
          <button type="button" onClick={() => setItinerary((prev) => [...prev, { id: Date.now(), title: `Day ${prev.length + 1}`, description: '', meals: '', hotel: '', transport: '', travel_mode: 'day' }])} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Add Day</button>
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
        <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">Save Draft</button>
        <button type="submit" disabled={processing} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">{processing ? 'Saving...' : 'Publish'}</button>
        <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">Schedule</button>
        <span className="ml-auto text-xs text-slate-500">{saveState}</span>
      </div>
    </form>
  )
}
