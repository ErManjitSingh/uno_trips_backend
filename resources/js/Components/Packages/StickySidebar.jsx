const cardBase =
  'rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_20px_50px_-30px_rgba(79,70,229,0.55)] backdrop-blur'

function parseCalendarOffer(jsonValue) {
  try {
    const rows = JSON.parse(String(jsonValue || '[]'))
    if (!Array.isArray(rows)) return null
    const prices = rows
      .map((row) => Number(row?.offer_price || 0))
      .filter((price) => Number.isFinite(price) && price > 0)
    if (!prices.length) return null
    return Math.min(...prices)
  } catch {
    return null
  }
}

export default function StickySidebar({ completionPercent, seoScore, data }) {
  const calendarOffer = parseCalendarOffer(data?.offer_price_calendar_json)
  const displayPrice = calendarOffer || Number(data?.offer_price || 0) || Number(data?.price || 0) || 0
  const completionTone =
    completionPercent >= 80 ? 'from-emerald-500 to-teal-500' : completionPercent >= 50 ? 'from-indigo-500 to-blue-500' : 'from-amber-500 to-orange-500'

  return (
    <aside className="sticky top-2 mt-0 h-fit pt-0 xl:col-span-3 xl:self-start">
      <div className="mt-0 space-y-4 rounded-3xl bg-gradient-to-b from-indigo-100/60 via-fuchsia-50/50 to-cyan-100/50 p-2">
        <div className={`${cardBase} overflow-hidden`}>
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-500">Progress</p>
              <p className="text-sm font-semibold text-slate-900">Publishing Readiness</p>
            </div>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              {completionPercent}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100/90">
            <div className={`h-2.5 rounded-full bg-gradient-to-r ${completionTone} transition-all`} style={{ width: `${completionPercent}%` }} />
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-600">Basic info</li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-600">SEO</li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-600">Media</li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-600">Pricing</li>
          </ul>
        </div>

        <div className={`${cardBase} border-indigo-100 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-100">Live Preview</p>
          <div className="mt-3 rounded-2xl border border-white/25 bg-slate-900/25 p-4">
            <p className="line-clamp-2 text-sm font-semibold">{data.title || 'Package title preview'}</p>
            <p className="mt-3 text-[11px] text-indigo-100/90">Starting from</p>
            <p className="text-2xl font-black tracking-tight">INR {Number(displayPrice).toLocaleString()}</p>
            {calendarOffer ? (
              <p className="mt-1 text-[11px] text-emerald-100">Calendar pricing active</p>
            ) : (
              <p className="mt-1 text-[11px] text-indigo-100">Base price preview</p>
            )}
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-500">Optimization</p>
              <p className="text-sm font-semibold text-slate-900">SEO Strength</p>
            </div>
            <p className="text-sm font-bold text-emerald-600">{seoScore}/100</p>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-slate-100">
            <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all" style={{ width: `${seoScore}%` }} />
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            {seoScore >= 80 ? 'Excellent SEO setup. Ready for publishing.' : seoScore >= 50 ? 'Good progress. Add more meta depth.' : 'Add focus keyword and meta content for better ranking.'}
          </p>
        </div>
      </div>
    </aside>
  )
}
