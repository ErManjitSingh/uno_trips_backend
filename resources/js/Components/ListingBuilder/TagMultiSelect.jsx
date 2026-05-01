import { X } from 'lucide-react'

export default function TagMultiSelect({
  options = [],
  selectedIds = [],
  onToggle,
  search = '',
  onSearchChange,
  placeholder = 'Search...',
}) {
  const selected = options.filter((item) => selectedIds.includes(item.id))
  const filtered = options.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-2">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
      />
      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <span key={item.id} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
            {item.title}
            <button type="button" onClick={() => onToggle(item.id)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`rounded-xl border px-3 py-2 text-left text-sm ${
              selectedIds.includes(item.id)
                ? 'border-indigo-200 bg-indigo-100 text-indigo-700'
                : 'bg-white text-slate-600'
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  )
}
