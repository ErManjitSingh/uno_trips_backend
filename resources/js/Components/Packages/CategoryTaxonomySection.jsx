import {
  BadgePercent,
  Briefcase,
  Compass,
  Flower2,
  Globe2,
  Mountain,
  Plus,
  Search,
  Sparkles,
  Sun,
  Tag,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'

const ICON_BY_NAME = {
  BadgePercent,
  Briefcase,
  Compass,
  Flower2,
  Globe2,
  Mountain,
  Sparkles,
  Sun,
  Tag,
}

const categoryCatalog = [
  { label: 'Family Tour', group: 'Travel Style', color: 'bg-blue-100 text-blue-700', icon: Compass },
  { label: 'Honeymoon Package', group: 'Travel Style', color: 'bg-pink-100 text-pink-700', icon: Flower2 },
  { label: 'Adventure Tour', group: 'Travel Style', color: 'bg-orange-100 text-orange-700', icon: Mountain },
  { label: 'Luxury Tour', group: 'Travel Style', color: 'bg-amber-100 text-amber-700', icon: Sparkles },
  { label: 'Budget Tour', group: 'Travel Style', color: 'bg-slate-100 text-slate-700', icon: Tag },
  { label: 'Group Tour', group: 'Travel Style', color: 'bg-indigo-100 text-indigo-700', icon: Briefcase },
  { label: 'Solo Travel', group: 'Travel Style', color: 'bg-cyan-100 text-cyan-700', icon: Compass },
  { label: 'Friends Trip', group: 'Travel Style', color: 'bg-violet-100 text-violet-700', icon: Globe2 },
  { label: 'Corporate Tour', group: 'Travel Style', color: 'bg-zinc-100 text-zinc-700', icon: Briefcase },
  { label: 'Weekend Getaway', group: 'Travel Style', color: 'bg-teal-100 text-teal-700', icon: Sun },

  { label: 'Hill Station', group: 'Destination Type', color: 'bg-emerald-100 text-emerald-700', icon: Mountain },
  { label: 'Beach Holiday', group: 'Destination Type', color: 'bg-sky-100 text-sky-700', icon: Sun },
  { label: 'Desert Tour', group: 'Destination Type', color: 'bg-yellow-100 text-yellow-700', icon: Sun },
  { label: 'Wildlife Safari', group: 'Destination Type', color: 'bg-lime-100 text-lime-700', icon: Compass },
  { label: 'Spiritual / Pilgrimage', group: 'Destination Type', color: 'bg-purple-100 text-purple-700', icon: Sparkles },
  { label: 'City Escape', group: 'Destination Type', color: 'bg-slate-100 text-slate-700', icon: Globe2 },
  { label: 'Island Tour', group: 'Destination Type', color: 'bg-cyan-100 text-cyan-700', icon: Globe2 },
  { label: 'Snow Destination', group: 'Destination Type', color: 'bg-blue-100 text-blue-700', icon: Mountain },
  { label: 'Countryside Retreat', group: 'Destination Type', color: 'bg-green-100 text-green-700', icon: Compass },

  { label: '1 Night 2 Days', group: 'Duration', color: 'bg-indigo-100 text-indigo-700', icon: Tag },
  { label: '2 Nights 3 Days', group: 'Duration', color: 'bg-indigo-100 text-indigo-700', icon: Tag },
  { label: '3 Nights 4 Days', group: 'Duration', color: 'bg-indigo-100 text-indigo-700', icon: Tag },
  { label: '4 Nights 5 Days', group: 'Duration', color: 'bg-indigo-100 text-indigo-700', icon: Tag },
  { label: '5+ Nights', group: 'Duration', color: 'bg-indigo-100 text-indigo-700', icon: Tag },
  { label: 'Long Vacation', group: 'Duration', color: 'bg-indigo-100 text-indigo-700', icon: Tag },

  { label: 'Himachal', group: 'Region', color: 'bg-emerald-100 text-emerald-700', icon: Mountain },
  { label: 'Kashmir', group: 'Region', color: 'bg-cyan-100 text-cyan-700', icon: Mountain },
  { label: 'Goa', group: 'Region', color: 'bg-sky-100 text-sky-700', icon: Sun },
  { label: 'Rajasthan', group: 'Region', color: 'bg-amber-100 text-amber-700', icon: Sun },
  { label: 'Uttarakhand', group: 'Region', color: 'bg-green-100 text-green-700', icon: Mountain },
  { label: 'Kerala', group: 'Region', color: 'bg-teal-100 text-teal-700', icon: Compass },
  { label: 'Ladakh', group: 'Region', color: 'bg-orange-100 text-orange-700', icon: Mountain },
  { label: 'Andaman', group: 'Region', color: 'bg-cyan-100 text-cyan-700', icon: Globe2 },
  { label: 'North East', group: 'Region', color: 'bg-lime-100 text-lime-700', icon: Compass },
  { label: 'South India', group: 'Region', color: 'bg-emerald-100 text-emerald-700', icon: Globe2 },
  { label: 'Golden Triangle', group: 'Region', color: 'bg-yellow-100 text-yellow-700', icon: Tag },

  { label: 'Romantic', group: 'Experience Type', color: 'bg-rose-100 text-rose-700', icon: Flower2 },
  { label: 'Family Friendly', group: 'Experience Type', color: 'bg-blue-100 text-blue-700', icon: Compass },
  { label: 'Thrill Seeking', group: 'Experience Type', color: 'bg-orange-100 text-orange-700', icon: Mountain },
  { label: 'Relaxation', group: 'Experience Type', color: 'bg-teal-100 text-teal-700', icon: Sun },
  { label: 'Luxury Escape', group: 'Experience Type', color: 'bg-amber-100 text-amber-700', icon: Sparkles },
  { label: 'Nature Retreat', group: 'Experience Type', color: 'bg-green-100 text-green-700', icon: Compass },
  { label: 'Road Trip', group: 'Experience Type', color: 'bg-violet-100 text-violet-700', icon: Globe2 },
  { label: 'Trekking', group: 'Experience Type', color: 'bg-lime-100 text-lime-700', icon: Mountain },
  { label: 'Camping', group: 'Experience Type', color: 'bg-zinc-100 text-zinc-700', icon: Compass },
  { label: 'Photography Tour', group: 'Experience Type', color: 'bg-indigo-100 text-indigo-700', icon: Sparkles },
  { label: 'Cruise Experience', group: 'Experience Type', color: 'bg-cyan-100 text-cyan-700', icon: Globe2 },

  { label: 'Summer Special', group: 'Season', color: 'bg-yellow-100 text-yellow-700', icon: Sun },
  { label: 'Winter Special', group: 'Season', color: 'bg-blue-100 text-blue-700', icon: Mountain },
  { label: 'Monsoon Escape', group: 'Season', color: 'bg-cyan-100 text-cyan-700', icon: Sun },
  { label: 'New Year Package', group: 'Season', color: 'bg-violet-100 text-violet-700', icon: Sparkles },
  { label: 'Christmas Package', group: 'Season', color: 'bg-emerald-100 text-emerald-700', icon: Sparkles },
  { label: 'Festival Package', group: 'Season', color: 'bg-amber-100 text-amber-700', icon: Sparkles },
  { label: 'Long Weekend Offer', group: 'Season', color: 'bg-pink-100 text-pink-700', icon: BadgePercent },

  { label: 'Trending Now', group: 'Booking Intent', color: 'bg-rose-100 text-rose-700', icon: BadgePercent },
  { label: 'Best Seller', group: 'Booking Intent', color: 'bg-emerald-100 text-emerald-700', icon: BadgePercent },
  { label: 'Featured', group: 'Booking Intent', color: 'bg-blue-100 text-blue-700', icon: BadgePercent },
  { label: 'Hot Deal', group: 'Booking Intent', color: 'bg-orange-100 text-orange-700', icon: BadgePercent },
  { label: 'Limited Offer', group: 'Booking Intent', color: 'bg-rose-100 text-rose-700', icon: BadgePercent },
  { label: 'Newly Added', group: 'Booking Intent', color: 'bg-cyan-100 text-cyan-700', icon: BadgePercent },
  { label: 'Recommended', group: 'Booking Intent', color: 'bg-violet-100 text-violet-700', icon: BadgePercent },
]

const suggestionRules = [
  { key: 'goa', picks: ['Beach Holiday', 'Goa', 'Honeymoon Package'] },
  { key: 'manali', picks: ['Hill Station', 'Himachal', 'Family Tour'] },
  { key: 'kedarnath', picks: ['Spiritual / Pilgrimage', 'Uttarakhand'] },
]

export default function CategoryTaxonomySection({ taxonomy, setTaxonomy, packageTitle, managedCategories = [] }) {
  const [query, setQuery] = useState('')
  const [customCategory, setCustomCategory] = useState('')

  const dynamicCatalog = useMemo(() => {
    const items = managedCategories.map((item) => ({
      label: item.name,
      group: item.type || 'General',
      color: item.color ? '' : 'bg-slate-100 text-slate-700',
      icon: item.icon && typeof item.icon === 'string' ? (ICON_BY_NAME[item.icon] || Tag) : Tag,
      customColor: item.color || null,
    }))

    if (!items.length) {
      return categoryCatalog.map((item) => ({ ...item, customColor: null }))
    }

    const seen = new Set()
    return items.filter((item) => {
      const key = item.label.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [managedCategories])

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return dynamicCatalog
    return dynamicCatalog.filter((item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q))
  }, [dynamicCatalog, query])

  const groupedCategories = useMemo(() => {
    return filteredCategories.reduce((acc, item) => {
      const key = item.group || 'General'
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [filteredCategories])

  const suggested = useMemo(() => {
    const title = (packageTitle || '').toLowerCase()
    const labels = new Set()
    suggestionRules.forEach((rule) => {
      if (title.includes(rule.key)) rule.picks.forEach((item) => labels.add(item))
    })
    return dynamicCatalog.filter((item) => labels.has(item.label))
  }, [dynamicCatalog, packageTitle])

  const secondarySet = new Set(taxonomy.secondary_categories)

  const setPrimary = (label) => {
    setTaxonomy((prev) => ({
      ...prev,
      primary_category: label,
      recently_used: [label, ...prev.recently_used.filter((x) => x !== label)].slice(0, 8),
    }))
  }

  const toggleSecondary = (label) => {
    setTaxonomy((prev) => {
      const exists = prev.secondary_categories.includes(label)
      const nextSecondary = exists ? prev.secondary_categories.filter((x) => x !== label) : [...prev.secondary_categories, label]
      return {
        ...prev,
        secondary_categories: nextSecondary,
        recently_used: [label, ...prev.recently_used.filter((x) => x !== label)].slice(0, 8),
      }
    })
  }

  const moveChip = (index, dir) => {
    setTaxonomy((prev) => {
      const arr = [...prev.secondary_categories]
      const target = index + dir
      if (target < 0 || target >= arr.length) return prev
      ;[arr[index], arr[target]] = [arr[target], arr[index]]
      return { ...prev, secondary_categories: arr }
    })
  }

  const addCustomCategory = () => {
    const value = customCategory.trim()
    if (!value) return
    setTaxonomy((prev) => ({
      ...prev,
      tags: prev.tags.includes(value) ? prev.tags : [...prev.tags, value],
      recently_used: [value, ...prev.recently_used.filter((x) => x !== value)].slice(0, 8),
    }))
    setCustomCategory('')
  }

  const categoryCard = (item) => {
    const Icon = item.icon
    const isPrimary = taxonomy.primary_category === item.label
    const isSecondary = secondarySet.has(item.label)
    return (
      <button
        key={item.label}
        type="button"
        onClick={() => (isPrimary ? setPrimary('') : setPrimary(item.label))}
        onContextMenu={(e) => {
          e.preventDefault()
          toggleSecondary(item.label)
        }}
        className={`group rounded-2xl border p-3 text-left transition ${
          isPrimary ? 'border-indigo-400 bg-indigo-50 shadow-sm' : isSecondary ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
        }`}
        title="Click = set primary, Right click = toggle secondary"
      >
        <div className="flex items-start justify-between gap-2">
        <div
          className={`grid h-8 w-8 place-items-center rounded-lg ${item.customColor ? '' : item.color}`}
          style={item.customColor ? { backgroundColor: item.customColor, color: '#fff' } : undefined}
        >
            <Icon className="h-4 w-4" />
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.customColor ? 'bg-slate-100 text-slate-700' : item.color}`}
          >
            {item.group}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-800">{item.label}</p>
        <p className="mt-1 text-[11px] text-slate-500">{isPrimary ? 'Primary selected' : isSecondary ? 'Secondary selected' : 'Select category'}</p>
      </button>
    )
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Package Category</h3>
          <p className="text-sm text-slate-500">Choose one primary category and optional secondary categories.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:col-span-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search category by name, intent, region, season..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400"
            />
          </div>

          <div className="mt-3 max-h-[460px] space-y-4 overflow-auto pr-1">
            {Object.entries(groupedCategories).map(([groupName, groupItems]) => (
              <div key={groupName}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{groupName}</p>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {groupItems.map((item) => categoryCard(item))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Tip: Left click for primary category, right click for secondary category.</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Primary Category</p>
            <p className="mt-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">{taxonomy.primary_category || 'Not selected'}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secondary Categories</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {taxonomy.secondary_categories.length ? taxonomy.secondary_categories.map((cat, idx) => (
                <span key={cat} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {cat}
                  <button type="button" onClick={() => moveChip(idx, -1)} className="rounded bg-white/70 px-1 text-[10px]">↑</button>
                  <button type="button" onClick={() => moveChip(idx, 1)} className="rounded bg-white/70 px-1 text-[10px]">↓</button>
                  <button type="button" onClick={() => toggleSecondary(cat)}><X className="h-3 w-3" /></button>
                </span>
              )) : <p className="text-xs text-slate-500">No secondary categories selected.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick Add New Category</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Create custom tag"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm"
              />
              <button type="button" onClick={addCustomCategory} className="rounded-lg bg-indigo-600 p-2 text-white"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recently Used</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {taxonomy.recently_used.length ? taxonomy.recently_used.map((item) => (
                <button key={item} type="button" onClick={() => setPrimary(item)} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100">
                  {item}
                </button>
              )) : <p className="text-xs text-slate-500">No recent categories yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {suggested.length ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Smart Suggestions from Title</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggested.map((item) => (
              <button key={`suggested-${item.label}`} type="button" onClick={() => toggleSecondary(item.label)} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 shadow-sm">
                + {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

    </section>
  )
}
