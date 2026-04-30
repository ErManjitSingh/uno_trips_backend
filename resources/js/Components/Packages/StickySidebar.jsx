export default function StickySidebar({ completionPercent, seoScore, data }) {
  return (
    <aside className="rounded-3xl bg-indigo-50/70 p-3 xl:col-span-3 dark:bg-slate-900/60">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Completion Progress</p>
            <p className="text-xs text-slate-500">{completionPercent}%</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${completionPercent}%` }} /></div>
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            <li>Basic info complete</li>
            <li>SEO complete</li>
            <li>Media complete</li>
            <li>Pricing complete</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Live Preview Mini Card</p>
          <div className="mt-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white">
            <p className="text-sm font-semibold">{data.title || 'Package title preview'}</p>
            <p className="mt-2 text-sm font-bold">INR {Number(data.offer_price || data.price || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">SEO Score</p>
            <p className="text-sm font-bold text-indigo-700">{seoScore}/100</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${seoScore}%` }} /></div>
        </div>
      </div>
    </aside>
  )
}
