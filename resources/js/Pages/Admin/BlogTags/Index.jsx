import { Head, router, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import { Merge, Plus, Sparkles, Table2, Tags } from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export default function BlogTagsIndex({ tags = [], suggestions = [] }) {
  const { props } = usePage()
  const [mode, setMode] = useState('cloud')
  const [items, setItems] = useState(tags)
  const [quickTag, setQuickTag] = useState('')
  const [mergeSource, setMergeSource] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')

  useEffect(() => {
    setItems(tags)
  }, [tags])

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.usage_count - a.usage_count),
    [items]
  )

  const addTag = (name) => {
    const value = (name || quickTag).trim()
    if (!value) return
    router.post('/admin/blog-tags', { name: value, slug: slugify(value) }, {
      preserveScroll: true,
      onSuccess: () => {
        setQuickTag('')
      },
    })
  }

  const mergeTags = () => {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return
    const source = items.find((item) => String(item.id) === mergeSource)
    const target = items.find((item) => String(item.id) === mergeTarget)
    if (!source || !target) return

    setItems((prev) =>
      prev
        .filter((item) => String(item.id) !== mergeSource)
        .map((item) =>
          String(item.id) === mergeTarget
            ? { ...item, usage_count: item.usage_count + source.usage_count }
            : item
        )
    )
    setMergeSource('')
    setMergeTarget('')
  }

  return (
    <AdminLayout title="Tags Management">
      <Head title="Tags Management" />

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-800">Tags Management Page</h2>
          <p className="mt-1 text-sm text-slate-500">Visually engaging tag cloud with clean table controls.</p>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button onClick={() => setMode('cloud')} className={`rounded-lg px-3 py-1.5 text-sm ${mode === 'cloud' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Tag Cloud</button>
              <button onClick={() => setMode('table')} className={`rounded-lg px-3 py-1.5 text-sm ${mode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><Table2 className="mr-1 inline h-4 w-4" />Table</button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                value={quickTag}
                onChange={(e) => setQuickTag(e.target.value)}
                placeholder="Quick add tag"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button onClick={() => addTag()} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">
                <Plus className="mr-1 inline h-4 w-4" />
                Add
              </button>
            </div>
          </div>
          {props.errors?.name && (
            <p className="mb-3 text-sm text-rose-600">{props.errors.name}</p>
          )}

          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
              <Sparkles className="h-3.5 w-3.5" />
              Auto suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => addTag(item)}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
              <Merge className="h-3.5 w-3.5" />
              Merge duplicate tags
            </p>
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <select value={mergeSource} onChange={(e) => setMergeSource(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">Merge from...</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">Merge into...</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <button onClick={mergeTags} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Merge
              </button>
            </div>
          </div>

          {mode === 'cloud' ? (
            <div className="flex flex-wrap gap-3">
              {sorted.map((tag) => (
                <div
                  key={tag.id}
                  className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-md"
                  style={{ fontSize: `${12 + Math.min(tag.usage_count, 20) * 0.4}px` }}
                >
                  <Tags className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-medium text-slate-700">{tag.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 group-hover:bg-white">{tag.usage_count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2">Tag Name</th>
                    <th className="px-2 py-2">Slug</th>
                    <th className="px-2 py-2">Usage Count</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((tag) => (
                    <tr key={tag.id} className="rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                      <td className="rounded-l-xl px-2 py-3">
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">{tag.name}</span>
                      </td>
                      <td className="px-2 py-3 text-slate-600">{tag.slug}</td>
                      <td className="rounded-r-xl px-2 py-3 font-semibold text-slate-700">{tag.usage_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}
