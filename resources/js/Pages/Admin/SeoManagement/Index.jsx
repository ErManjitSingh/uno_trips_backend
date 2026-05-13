import { Head, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../../Layouts/AdminLayout'

import { imageTooLargeMessage } from '../../../lib/imageUploadLimits'

const tabs = ['Basic', 'Advanced', 'Social', 'Technical']
const schemaTypes = ['Article', 'Product', 'Tour Package', 'Local Business']

const inputClass =
  'w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-orange-400'
const textareaClass =
  'w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-orange-400'

function scoreColor(score) {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-rose-700 bg-rose-50 border-rose-200'
}

function getLiveSeoScore(data) {
  let score = 0
  const titleLength = (data.meta_title || '').trim().length
  const descriptionLength = (data.meta_description || '').trim().length

  if (titleLength >= 30 && titleLength <= 60) score += 20
  if (descriptionLength >= 70 && descriptionLength <= 160) score += 20
  if ((data.meta_keywords || '').trim()) score += 10
  if ((data.canonical_url || '').trim()) score += 10
  if ((data.og_title || '').trim() && (data.og_description || '').trim()) score += 15
  if ((data.twitter_title || '').trim() && (data.twitter_description || '').trim()) score += 10
  if ((data.json_ld || '').trim()) score += 10
  if (data.robots_index && data.robots_follow) score += 5

  return Math.min(100, score)
}

function getLiveWarnings(data) {
  const warnings = []
  const titleLength = (data.meta_title || '').trim().length
  const descriptionLength = (data.meta_description || '').trim().length

  if (!titleLength) warnings.push('Meta title is missing.')
  else if (titleLength > 60) warnings.push('Meta title is longer than 60 characters.')

  if (!descriptionLength) warnings.push('Meta description is missing.')
  else if (descriptionLength > 160) warnings.push('Meta description is longer than 160 characters.')

  if (!(data.og_image || '').trim()) warnings.push('Open Graph image is missing.')
  if (!(data.canonical_url || '').trim()) warnings.push('Canonical URL is missing.')
  if (!data.include_in_sitemap) warnings.push('Page is excluded from sitemap.')

  return warnings
}

export default function SeoManagementIndex({ entities, seoEntries = [], technical, schemaTemplates = [] }) {
  const { props } = usePage()
  const maxImageKb = props?.max_upload_image_kb ?? 500
  const [activeTab, setActiveTab] = useState('Basic')
  const [scope, setScope] = useState('pages')
  const [selectedId, setSelectedId] = useState(String(entities.pages?.[0]?.id || 'home'))
  const [allEntries, setAllEntries] = useState(seoEntries)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [ogPreview, setOgPreview] = useState('')
  const [twitterPreview, setTwitterPreview] = useState('')
  const [bulkTitle, setBulkTitle] = useState('')
  const [bulkDescription, setBulkDescription] = useState('')
  const [technicalState, setTechnicalState] = useState({
    lazy_load_enabled: technical?.lazy_load_enabled ?? true,
    minify_assets_enabled: technical?.minify_assets_enabled ?? false,
    sitemap_auto_generate: technical?.sitemap_auto_generate ?? true,
    robots_txt: technical?.robots_txt ?? '',
  })

  const selectedEntity = useMemo(() => {
    const list = scope === 'pages' ? entities.pages : scope === 'blogs' ? entities.blogs : entities.packages
    return list?.find((item) => String(item.id) === String(selectedId)) || null
  }, [scope, selectedId, entities])

  const currentEntry = useMemo(() => {
    if (!selectedEntity) return null
    const entityType = scope === 'pages' ? 'page' : scope === 'blogs' ? 'blog_post' : 'tour_package'
    const entityId = scope === 'pages' ? 0 : Number(selectedEntity.id)
    const pageKey = scope === 'pages' ? String(selectedEntity.id) : ''

    const found = allEntries.find((entry) => {
      return (
        entry.entity_type === entityType &&
        Number(entry.entity_id || 0) === entityId &&
        String(entry.page_key || '') === pageKey
      )
    })

    return (
      found || {
        entity_type: entityType,
        entity_id: entityId,
        page_key: pageKey,
        slug: selectedEntity.slug || '',
        meta_title: selectedEntity.label || '',
        meta_description: selectedEntity.description || '',
        meta_keywords: '',
        canonical_url: '',
        og_title: '',
        og_description: '',
        og_image: '',
        og_url: '',
        twitter_title: '',
        twitter_description: '',
        twitter_image: '',
        robots_index: true,
        robots_follow: true,
        include_in_sitemap: true,
        schema_type: 'Article',
        json_ld: '',
        image_alt: '',
        image_title: '',
        image_file_name: '',
        score: 0,
        warnings: [],
      }
    )
  }, [scope, selectedEntity, allEntries])

  const [form, setForm] = useState(currentEntry)

  useEffect(() => {
    setForm(currentEntry)
  }, [currentEntry])

  useEffect(() => {
    setOgPreview(currentEntry?.og_image || '')
    setTwitterPreview(currentEntry?.twitter_image || '')
  }, [currentEntry])

  if (!form) {
    return (
      <>
        <Head title="SEO Management" />
        <div className="rounded-2xl border border-amber-200 bg-white p-4 text-sm text-stone-600">No SEO entities available yet.</div>
      </>
    )
  }

  const csrfFromMeta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
  const csrfFromCookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('XSRF-TOKEN='))
    ?.split('=')[1]
  const csrf = csrfFromMeta || (csrfFromCookie ? decodeURIComponent(csrfFromCookie) : '')

  const apiFetch = (url, options = {}) =>
    fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        'X-CSRF-TOKEN': csrf,
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    })

  const saveEntry = async () => {
    setSaving(true)
    setNotice('')
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => body.append(key, value ?? ''))

    const res = await apiFetch('/admin/seo-management/api/entries', {
      method: 'POST',
      body,
    })
    const data = await res.json()
    if (!res.ok) {
      setNotice(data.message || 'Failed to save SEO entry.')
      setSaving(false)
      return
    }

    setAllEntries((prev) => {
      const filtered = prev.filter((entry) => entry.id !== data.data.id)
      return [data.data, ...filtered]
    })
    setForm(data.data)
    setNotice('SEO entry saved successfully.')
    setSaving(false)
  }

  const runSchemaTemplate = async (type) => {
    const res = await apiFetch('/admin/seo-management/api/schema-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        title: form.meta_title,
        description: form.meta_description,
        url: form.canonical_url || window.location.origin,
        image: form.og_image,
      }),
    })
    const data = await res.json()
    if (!res.ok) return
    setForm((prev) => ({ ...prev, schema_type: type, json_ld: data.template }))
  }

  const autoGenerate = async () => {
    setNotice('')
    const res = await apiFetch('/admin/seo-management/api/entries/auto-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entity_type: form.entity_type,
        entity_id: form.entity_id,
        page_key: form.page_key,
        meta_title_template: '{title} | UNO Trips',
        meta_description_template: '{description}',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null
      setNotice(firstError || data?.message || 'Auto-generate failed.')
      return
    }
    setAllEntries((prev) => {
      const filtered = prev.filter((entry) => entry.id !== data.data.id)
      return [data.data, ...filtered]
    })
    setForm((prev) => ({ ...prev, ...data.data }))
    setNotice(data?.message || 'SEO generated from template.')
  }

  const bulkUpdate = async () => {
    const targetType = scope === 'pages' ? 'page' : scope === 'blogs' ? 'blog_post' : 'tour_package'
    const ids = allEntries.filter((entry) => entry.entity_type === targetType).map((entry) => entry.id)
    if (!ids.length) {
      setNotice('No saved SEO entries found for bulk update.')
      return
    }

    const res = await apiFetch('/admin/seo-management/api/entries/bulk-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids,
        meta_title: bulkTitle || null,
        meta_description: bulkDescription || null,
      }),
    })
    const data = await res.json()
    setNotice(data.message || 'Bulk update completed.')
  }

  const saveTechnical = async () => {
    const res = await apiFetch('/admin/seo-management/api/technical', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(technicalState),
    })
    const data = await res.json()
    setNotice(data.message || 'Technical SEO saved.')
  }

  const charTitle = `${(form.meta_title || '').length}/60`
  const charDescription = `${(form.meta_description || '').length}/160`
  const liveScore = useMemo(() => getLiveSeoScore(form), [form])
  const liveWarnings = useMemo(() => getLiveWarnings(form), [form])
  const scoreClass = scoreColor(liveScore)

  return (
    <>
      <Head title="SEO Management" />
      <div className="space-y-5">
        <section className="rounded-3xl border border-amber-200 bg-gradient-to-r from-white via-amber-50 to-orange-50 p-5">
          <h1 className="text-2xl font-bold text-stone-900">SEO Management</h1>
          <p className="mt-1 text-sm text-stone-600">Manage on-page SEO, social metadata, indexing, schema, and technical SEO controls.</p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-amber-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Content Type</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {['pages', 'blogs', 'packages'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setScope(type)
                    const list = type === 'pages' ? entities.pages : type === 'blogs' ? entities.blogs : entities.packages
                    setSelectedId(String(list?.[0]?.id || ''))
                  }}
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium ${scope === type ? 'bg-orange-500 text-white' : 'bg-amber-50 text-stone-700'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {(scope === 'pages' ? entities.pages : scope === 'blogs' ? entities.blogs : entities.packages).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(String(item.id))}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                    String(selectedId) === String(item.id) ? 'border-orange-400 bg-orange-50 text-stone-900' : 'border-amber-200 bg-white text-stone-700'
                  }`}
                >
                  <p className="truncate font-medium">{item.label}</p>
                  <p className="truncate text-xs text-stone-500">{item.slug || item.description}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-amber-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${activeTab === tab ? 'bg-orange-500 text-white' : 'bg-amber-50 text-stone-700'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${scoreClass}`}>SEO Score: {liveScore}/100</div>
            </div>

            {activeTab !== 'Technical' && (
              <div className="mb-4 grid gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3 text-sm">
                <p className="font-semibold text-stone-800">Warnings</p>
                {liveWarnings.length ? (
                  <ul className="list-disc space-y-1 pl-4 text-stone-600">
                    {liveWarnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-stone-600">No major SEO warnings detected.</p>
                )}
              </div>
            )}

            {activeTab === 'Basic' && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium text-stone-700">Meta Title</span><span className="text-xs text-stone-500">{charTitle}</span></div>
                  <input className={inputClass} value={form.meta_title || ''} maxLength={190} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Slug</span>
                  <input className={inputClass} value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium text-stone-700">Meta Description</span><span className="text-xs text-stone-500">{charDescription}</span></div>
                  <textarea className={`${textareaClass} min-h-24`} maxLength={300} value={form.meta_description || ''} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Meta Keywords</span>
                  <input className={inputClass} value={form.meta_keywords || ''} onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })} placeholder="travel, tour packages, holiday" />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Canonical URL</span>
                  <input className={inputClass} value={form.canonical_url || ''} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} />
                </label>

                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-500">Google Search Preview</p>
                  <p className="mt-1 text-lg text-blue-700">{form.meta_title || 'Meta title preview'}</p>
                  <p className="text-xs text-emerald-700">{form.canonical_url || 'https://example.com/page'}</p>
                  <p className="mt-1 text-sm text-slate-600">{form.meta_description || 'Meta description preview text.'}</p>
                </div>
              </div>
            )}

            {activeTab === 'Advanced' && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Indexing</span>
                  <select className={inputClass} value={form.robots_index ? 'index' : 'noindex'} onChange={(e) => setForm({ ...form, robots_index: e.target.value === 'index' })}>
                    <option value="index">index</option>
                    <option value="noindex">noindex</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Follow</span>
                  <select className={inputClass} value={form.robots_follow ? 'follow' : 'nofollow'} onChange={(e) => setForm({ ...form, robots_follow: e.target.value === 'follow' })}>
                    <option value="follow">follow</option>
                    <option value="nofollow">nofollow</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Include in Sitemap</span>
                  <select className={inputClass} value={form.include_in_sitemap ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, include_in_sitemap: e.target.value === 'yes' })}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Schema Type</span>
                  <select className={inputClass} value={form.schema_type || 'Article'} onChange={(e) => setForm({ ...form, schema_type: e.target.value })}>
                    {schemaTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-stone-700">JSON-LD Schema</span>
                  <textarea className={`${textareaClass} min-h-44 font-mono text-xs`} value={form.json_ld || ''} onChange={(e) => setForm({ ...form, json_ld: e.target.value })} />
                </label>
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  {(schemaTemplates.length ? schemaTemplates : schemaTypes).map((template) => (
                    <button key={template} onClick={() => runSchemaTemplate(template)} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-stone-700">
                      Use {template} Template
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Social' && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">OG Title</span>
                  <input className={inputClass} value={form.og_title || ''} onChange={(e) => setForm({ ...form, og_title: e.target.value })} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">OG URL</span>
                  <input className={inputClass} value={form.og_url || ''} onChange={(e) => setForm({ ...form, og_url: e.target.value })} />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-stone-700">OG Description</span>
                  <textarea className={`${textareaClass} min-h-20`} value={form.og_description || ''} onChange={(e) => setForm({ ...form, og_description: e.target.value })} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">OG Image URL</span>
                  <input className={inputClass} value={form.og_image || ''} onChange={(e) => setForm({ ...form, og_image: e.target.value })} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">OG Image Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className={inputClass}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const msg = imageTooLargeMessage(file, maxImageKb)
                      if (msg) {
                        window.alert(msg)
                        e.target.value = ''
                        return
                      }
                      setForm({ ...form, og_image_file: file })
                      setOgPreview(URL.createObjectURL(file))
                    }}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Twitter Title</span>
                  <input className={inputClass} value={form.twitter_title || ''} onChange={(e) => setForm({ ...form, twitter_title: e.target.value })} />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-stone-700">Twitter Description</span>
                  <textarea className={`${textareaClass} min-h-20`} value={form.twitter_description || ''} onChange={(e) => setForm({ ...form, twitter_description: e.target.value })} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Twitter Image URL</span>
                  <input className={inputClass} value={form.twitter_image || ''} onChange={(e) => setForm({ ...form, twitter_image: e.target.value })} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Twitter Image Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className={inputClass}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const msg = imageTooLargeMessage(file, maxImageKb)
                      if (msg) {
                        window.alert(msg)
                        e.target.value = ''
                        return
                      }
                      setForm({ ...form, twitter_image_file: file })
                      setTwitterPreview(URL.createObjectURL(file))
                    }}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Image Alt Text</span>
                  <input className={inputClass} value={form.image_alt || ''} onChange={(e) => setForm({ ...form, image_alt: e.target.value })} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Image Title Attribute</span>
                  <input className={inputClass} value={form.image_title || ''} onChange={(e) => setForm({ ...form, image_title: e.target.value })} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Optimized File Name</span>
                  <input className={inputClass} value={form.image_file_name || ''} onChange={(e) => setForm({ ...form, image_file_name: e.target.value })} />
                </label>
                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-500">Social Preview</p>
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                    <div className="h-28 bg-slate-100">
                      {ogPreview ? <img src={ogPreview} alt="OG Preview" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-slate-900">{form.og_title || form.meta_title || 'Social title preview'}</p>
                      <p className="mt-1 text-xs text-slate-600">{form.og_description || form.meta_description || 'Social description preview'}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-500">Twitter Card Preview</p>
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                    <div className="h-28 bg-slate-100">
                      {twitterPreview ? <img src={twitterPreview} alt="Twitter Preview" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-slate-900">{form.twitter_title || form.meta_title || 'Twitter title preview'}</p>
                      <p className="mt-1 text-xs text-slate-600">{form.twitter_description || form.meta_description || 'Twitter description preview'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Technical' && (
              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/30 px-3 py-2">
                  <span className="text-sm font-medium text-stone-700">Lazy Load Images</span>
                  <input type="checkbox" checked={technicalState.lazy_load_enabled} onChange={(e) => setTechnicalState({ ...technicalState, lazy_load_enabled: e.target.checked })} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/30 px-3 py-2">
                  <span className="text-sm font-medium text-stone-700">Minify HTML/CSS/JS</span>
                  <input type="checkbox" checked={technicalState.minify_assets_enabled} onChange={(e) => setTechnicalState({ ...technicalState, minify_assets_enabled: e.target.checked })} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/30 px-3 py-2">
                  <span className="text-sm font-medium text-stone-700">Auto-generate sitemap.xml</span>
                  <input type="checkbox" checked={technicalState.sitemap_auto_generate} onChange={(e) => setTechnicalState({ ...technicalState, sitemap_auto_generate: e.target.checked })} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-stone-700">Robots.txt Editor</span>
                  <textarea className={`${textareaClass} min-h-44 font-mono text-xs`} value={technicalState.robots_txt || ''} onChange={(e) => setTechnicalState({ ...technicalState, robots_txt: e.target.value })} />
                </label>
                <button onClick={saveTechnical} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
                  Save Technical SEO
                </button>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-amber-200 pt-4">
              {activeTab !== 'Technical' && (
                <>
                  <button onClick={saveEntry} disabled={saving} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">
                    {saving ? 'Saving...' : 'Save SEO Entry'}
                  </button>
                  <button onClick={autoGenerate} className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-stone-700">
                    Auto-generate SEO
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/40 p-3">
              <p className="text-sm font-semibold text-stone-800">Bulk SEO Tools</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <input className={inputClass} placeholder="Bulk meta title" value={bulkTitle} onChange={(e) => setBulkTitle(e.target.value)} />
                <input className={inputClass} placeholder="Bulk meta description" value={bulkDescription} onChange={(e) => setBulkDescription(e.target.value)} />
              </div>
              <button onClick={bulkUpdate} className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700">
                Run Bulk Update (Current Scope)
              </button>
            </div>

            {notice ? <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}
          </section>
        </div>
      </div>
    </>
  )
}

SeoManagementIndex.layout = (page) => <AdminLayout title="SEO Management">{page}</AdminLayout>

