export default function AddPackageHeader({ onSubmit }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-indigo-50 p-5 shadow-sm">
      <p className="text-sm font-medium text-indigo-600">Dashboard / Package Control / Add New Package</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Package</h1>
          <p className="text-sm text-slate-500">Create and publish a premium travel package</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600">Save Draft</button>
          <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600">Preview</button>
          <button type="button" onClick={onSubmit} className="rounded-xl bg-emerald-600 px-3 py-2 font-semibold text-white">Publish Now</button>
        </div>
      </div>
    </div>
  )
}
