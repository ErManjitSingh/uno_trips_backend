const statusStyles = {
  approved: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-rose-100 text-rose-700',
  spam: 'bg-violet-100 text-violet-700',
}

export default function StatusBadge({ status = 'pending' }) {
  const key = String(status || 'pending').toLowerCase()
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[key] || statusStyles.pending}`}>
      {key.charAt(0).toUpperCase() + key.slice(1)}
    </span>
  )
}

