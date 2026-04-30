import { AlertTriangle, Sparkles, Trash2 } from 'lucide-react'

const toneConfig = {
  edit: {
    title: 'Edit Package',
    description: 'You are about to open this package in edit mode.',
    shell: 'from-blue-500/20 via-blue-100/70 to-white',
    iconWrap: 'bg-blue-100 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
    Icon: Sparkles,
  },
  duplicate: {
    title: 'Duplicate Package',
    description: 'A new package draft will be generated with the same details.',
    shell: 'from-emerald-500/20 via-emerald-100/70 to-white',
    iconWrap: 'bg-emerald-100 text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    Icon: Sparkles,
  },
  delete: {
    title: 'Delete Package',
    description: 'This package will be permanently removed from your list.',
    shell: 'from-rose-500/20 via-rose-100/70 to-white',
    iconWrap: 'bg-rose-100 text-rose-600',
    button: 'bg-rose-600 hover:bg-rose-700',
    Icon: Trash2,
  },
}

export default function ActionConfirmModal({ open, type = 'edit', pkg, onClose, onConfirm }) {
  if (!open || !pkg) return null

  const tone = toneConfig[type] || toneConfig.edit
  const Icon = tone.Icon || AlertTriangle

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-md">
      <div className={`w-full max-w-md overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-b ${tone.shell} shadow-[0_40px_120px_rgba(15,23,42,0.42)]`}>
        <div className="relative border-b border-slate-200/70 bg-white/85 px-6 py-5">
          <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-white/40 blur-2xl" />
          <div className="flex items-start gap-3">
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${tone.iconWrap}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{tone.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{tone.description}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/92 px-6 py-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Selected Package</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{pkg.title}</p>
            <p className="text-xs text-slate-500">{pkg.destination} • INR {Number(pkg.price || 0).toLocaleString()}</p>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={onConfirm} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${tone.button}`}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
