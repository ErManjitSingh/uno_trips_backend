export default function SectionCard({ title, subtitle, children, actions = null }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {(title || subtitle || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title ? <h3 className="text-sm font-semibold text-slate-800">{title}</h3> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}
