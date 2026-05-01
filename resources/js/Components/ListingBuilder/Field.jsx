export function Field({ label, children, hint = '' }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      <span className="inline-flex items-center text-[13px] font-semibold uppercase tracking-wide text-slate-700">
        {label}
      </span>
      {hint ? <span className="ml-1 text-xs text-slate-400">{hint}</span> : null}
      <div className="mt-1">{children}</div>
    </label>
  )
}

export const fieldClassName =
  'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'
