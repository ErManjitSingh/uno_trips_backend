const baseInput = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400'

export default function BasicInfoSection({ data, setData, advanced, setAdvancedField, onTitleChange, onSlugChange }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Basic Package Information</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-500">Package Name *</span><input className={baseInput} value={data.title} onChange={(e) => (onTitleChange ? onTitleChange(e.target.value) : setData('title', e.target.value))} placeholder="Enter package name" /></label>
        <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Auto Slug (editable)</span><input className={baseInput} value={data.slug} onChange={(e) => (onSlugChange ? onSlugChange(e.target.value) : setData('slug', e.target.value))} placeholder="enter-package-slug" /></label>
        <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Highlight Badge</span><select className={baseInput} value={advanced.badge} onChange={(e) => setAdvancedField('badge', e.target.value)}><option>Best Seller</option><option>Trending</option><option>Luxury</option><option>Budget</option></select></label>
        <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-500">Short Description (160 char)</span><textarea maxLength={160} className={`${baseInput} min-h-20`} value={advanced.short_description} onChange={(e) => setAdvancedField('short_description', e.target.value)} placeholder="Write a short package summary" /><p className="text-xs text-slate-400">{advanced.short_description.length}/160</p></label>
        <div className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium text-slate-500">Full Description</span>
          <textarea
            className={`${baseInput} min-h-56`}
            value={advanced.full_description}
            onChange={(e) => setAdvancedField('full_description', e.target.value)}
            placeholder="Write full package details, highlights and itinerary context"
          />
          <p className="text-xs text-slate-400">SEO ke liye headings, internal links, aur keyword-rich content yahan add kar sakte ho.</p>
        </div>
        <button type="button" className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700">AI Improve Description</button>
      </div>
    </section>
  )
}
