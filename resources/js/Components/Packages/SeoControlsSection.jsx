const baseInput = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400'

export default function SeoControlsSection({
  data,
  setData,
  advanced,
  setAdvancedField,
  autoGenerateSeo,
  suggestedKeyword,
  sitemapPreview,
  schemaPreview,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">SEO Controls</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={autoGenerateSeo} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Auto Generate SEO</button>
        <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">Suggested Focus Keyword: <strong>{suggestedKeyword || 'Type title + destination'}</strong></span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Focus Keyword *</span><input className={baseInput} value={advanced.focus_keyword} onChange={(e) => setAdvancedField('focus_keyword', e.target.value)} placeholder="e.g. goa honeymoon package" /></label>
        <label className="space-y-1"><span className="text-xs font-medium text-slate-500">SEO Title *</span><input className={baseInput} value={data.seo_meta_title} onChange={(e) => setData('seo_meta_title', e.target.value)} placeholder="Enter SEO title" /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-500">Meta Description *</span><textarea className={`${baseInput} min-h-20`} value={data.seo_meta_description} onChange={(e) => setData('seo_meta_description', e.target.value)} placeholder="Write SEO meta description (120-170 chars)" /></label>
        <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Canonical URL</span><input className={baseInput} value={advanced.canonical_url} onChange={(e) => setAdvancedField('canonical_url', e.target.value)} placeholder="https://unotrips.com/tours/your-slug" /></label>
        <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Robots</span><select className={baseInput} value={advanced.robots} onChange={(e) => setAdvancedField('robots', e.target.value)}><option>index,follow</option><option>index,nofollow</option><option>noindex,follow</option><option>noindex,nofollow</option></select></label>
        <label className="space-y-1"><span className="text-xs font-medium text-slate-500">OG Title</span><input className={baseInput} value={advanced.og_title} onChange={(e) => setAdvancedField('og_title', e.target.value)} placeholder="Open Graph title for social sharing" /></label>
        <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-500">OG Description</span><textarea className={`${baseInput} min-h-20`} value={advanced.og_description} onChange={(e) => setAdvancedField('og_description', e.target.value)} placeholder="Open Graph description for WhatsApp/Facebook preview" /></label>
        <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Schema Type</span><select className={baseInput} value={advanced.schema_type} onChange={(e) => setAdvancedField('schema_type', e.target.value)}><option>TourPackage</option><option>TravelAgency</option><option>FAQPage</option></select></label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><input type="checkbox" checked={advanced.faq_schema} onChange={(e) => setAdvancedField('faq_schema', e.target.checked)} /> FAQ schema toggle</label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><input type="checkbox" checked={advanced.breadcrumb_schema} onChange={(e) => setAdvancedField('breadcrumb_schema', e.target.checked)} /> Breadcrumb schema toggle</label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm md:col-span-2"><input type="checkbox" checked={advanced.sitemap_include} onChange={(e) => setAdvancedField('sitemap_include', e.target.checked)} /> Include in sitemap</label>
        <div className="space-y-2 rounded-2xl border border-blue-200 bg-blue-50 p-3 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Auto Sitemap Preview</p>
          <p className="break-all font-mono text-xs text-blue-900">{sitemapPreview}</p>
        </div>
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Auto JSON-LD Schema Generator</p>
          <pre className="max-h-56 overflow-auto rounded-lg bg-white p-2 text-xs text-slate-700">{schemaPreview}</pre>
        </div>
      </div>
    </section>
  )
}
