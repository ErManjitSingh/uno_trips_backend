import { Head, router, useForm, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../../Layouts/AdminLayout'
import CustomRichTextEditor from '../../../Components/Blog/CustomRichTextEditor'
import { imageTooLargeMessage, jsonUploadErrorMessage } from '../../../lib/imageUploadLimits'

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

function calcReadTime(content) {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 220))
  return `${minutes} min read`
}

function buildToc(content) {
  return (content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^(#|##|###)\s+/.test(line))
    .map((line) => line.replace(/^(#|##|###)\s+/, ''))
}

const toStorageUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//.test(path) || path.startsWith('data:')) return path
  return `/storage/${path}`
}

export default function BlogCreate({ categories = [], tags = [], authors = [], post = null }) {
  const { props } = usePage()
  const maxImageKb = props?.max_upload_image_kb ?? 500
  const [featuredPreview, setFeaturedPreview] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tagItems, setTagItems] = useState([])
  const [keywordInput, setKeywordInput] = useState('')
  const [keywordItems, setKeywordItems] = useState([])

  const { data, setData, processing, errors } = useForm({
    draft_id: '',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: null,
    featured_image_existing: '',
    status: 'draft',
    published_at: '',
    seo_meta_title: '',
    seo_meta_description: '',
    author_id: '',
    tag_ids: [],
    tag_names: '',
    category_ids: [],
    meta_keywords: '',
    canonical_url: '',
    robots: 'index,follow',
    og_title: '',
    og_description: '',
    twitter_title: '',
    twitter_description: '',
    include_in_sitemap: true,
    schema_type: 'BlogPosting',
    schema_json: '',
  })

  const readTime = useMemo(() => calcReadTime(data.content), [data.content])
  const toc = useMemo(() => buildToc(data.content), [data.content])

  useEffect(() => {
    if (!post) return
    setData({
      draft_id: post.id ? String(post.id) : '',
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      featured_image: null,
      featured_image_existing: post.featured_image || '',
      status: post.status || 'draft',
      published_at: post.published_at || '',
      seo_meta_title: post.seo_meta_title || '',
      seo_meta_description: post.seo_meta_description || '',
      author_id: post.author_id ? String(post.author_id) : '',
      tag_ids: (post.tag_ids || []).map((id) => Number(id)),
      tag_names: post.tag_names || '',
      category_ids: (post.category_ids || []).map((id) => Number(id)),
      meta_keywords: post.meta_keywords || '',
      canonical_url: post.canonical_url || '',
      robots: post.robots || 'index,follow',
      og_title: post.og_title || '',
      og_description: post.og_description || '',
      twitter_title: post.twitter_title || '',
      twitter_description: post.twitter_description || '',
      include_in_sitemap: typeof post.include_in_sitemap === 'boolean' ? post.include_in_sitemap : true,
      schema_type: post.schema_type || 'BlogPosting',
      schema_json: post.schema_json || '',
    })
    setFeaturedPreview(toStorageUrl(post.featured_image || ''))
    setSlugTouched(true)
  }, [post, setData])

  useEffect(() => {
    const initialTags = String(post?.tag_names ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    setTagItems(initialTags)
    setTagInput('')
  }, [post?.id, post?.tag_names])

  useEffect(() => {
    setData('tag_names', tagItems.join(', '))
  }, [setData, tagItems])

  useEffect(() => {
    const initialKeywords = String(post?.meta_keywords ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    setKeywordItems(initialKeywords)
    setKeywordInput('')
  }, [post?.id, post?.meta_keywords])

  useEffect(() => {
    setData('meta_keywords', keywordItems.join(', '))
  }, [keywordItems, setData])

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  const [autoSaveMessage, setAutoSaveMessage] = useState('')
  const schemaAuto = useMemo(() => {
    const payload = {
      '@context': 'https://schema.org',
      '@type': data.schema_type || 'BlogPosting',
      headline: data.title || 'Blog title',
      description: data.seo_meta_description || data.excerpt || 'Blog description',
      mainEntityOfPage: data.canonical_url || (typeof window !== 'undefined' ? `${window.location.origin}/blog/${data.slug || 'your-slug'}` : `/blog/${data.slug || 'your-slug'}`),
      keywords: data.meta_keywords || '',
    }
    return JSON.stringify(payload, null, 2)
  }, [data.canonical_url, data.excerpt, data.meta_keywords, data.schema_type, data.seo_meta_description, data.slug, data.title])

  const uploadEditorImage = async (file) => {
    const sizeMsg = imageTooLargeMessage(file, maxImageKb)
    if (sizeMsg) {
      window.alert(sizeMsg)
      return ''
    }
    const form = new FormData()
    form.append('image', file)

    const res = await fetch('/admin/blogs/editor-image', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
      },
      credentials: 'same-origin',
      body: form,
    })

    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(jsonUploadErrorMessage(payload))
    }

    return payload.url || ''
  }

  useEffect(() => {
    const timer = setInterval(async () => {
      if (processing) return
      if (!data.title.trim() && !data.content.trim()) return

      try {
        const res = await fetch('/admin/blogs/autosave', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            draft_id: data.draft_id || null,
            title: data.title,
            slug: data.slug,
            excerpt: data.excerpt,
            tag_names: tagItems.join(', '),
            content: data.content,
            seo_meta_title: data.seo_meta_title,
            seo_meta_description: data.seo_meta_description,
          }),
        })

        const payload = await res.json().catch(() => ({}))
        if (!res.ok) return

        if (payload.draft_id && String(payload.draft_id) !== String(data.draft_id || '')) {
          setData('draft_id', String(payload.draft_id))
        }
        setAutoSaveMessage(`Draft auto-saved at ${new Date().toLocaleTimeString()}`)
      } catch {
        // Ignore autosave errors silently; manual save still works.
      }
    }, 10000)

    return () => clearInterval(timer)
  }, [csrfToken, data.content, data.draft_id, data.excerpt, data.seo_meta_description, data.seo_meta_title, data.slug, data.title, processing, setData, tagItems])

  const onFeaturedFile = (file) => {
    if (!file) return
    const sizeMsg = imageTooLargeMessage(file, maxImageKb)
    if (sizeMsg) {
      window.alert(sizeMsg)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setFeaturedPreview(String(reader.result || ''))
      setData('featured_image', file)
    }
    reader.readAsDataURL(file)
  }

  const toggleMultiValue = (key, value) => {
    const normalized = Number(value)
    const current = data[key] || []
    const next = current.includes(normalized)
      ? current.filter((item) => item !== normalized)
      : [...current, normalized]
    setData(key, next)
  }

  const addTagFromInput = (rawValue) => {
    const value = String(rawValue || '').trim()
    if (!value) return
    setTagItems((prev) => {
      if (prev.some((item) => item.toLowerCase() === value.toLowerCase())) return prev
      return [...prev, value]
    })
  }

  const onTagInputChange = (e) => {
    const value = e.target.value
    if (value.includes(',')) {
      const parts = value.split(',')
      parts.slice(0, -1).forEach((part) => addTagFromInput(part))
      setTagInput(parts[parts.length - 1].trimStart())
      return
    }
    setTagInput(value)
  }

  const onTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTagFromInput(tagInput)
      setTagInput('')
      return
    }

    if (e.key === 'Backspace' && !tagInput && tagItems.length) {
      setTagItems((prev) => prev.slice(0, -1))
    }
  }

  const removeTag = (index) => {
    setTagItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  const addKeywordFromInput = (rawValue) => {
    const value = String(rawValue || '').trim()
    if (!value) return
    setKeywordItems((prev) => {
      if (prev.some((item) => item.toLowerCase() === value.toLowerCase())) return prev
      return [...prev, value]
    })
  }

  const onKeywordInputChange = (e) => {
    const value = e.target.value
    if (value.includes(',')) {
      const parts = value.split(',')
      parts.slice(0, -1).forEach((part) => addKeywordFromInput(part))
      setKeywordInput(parts[parts.length - 1].trimStart())
      return
    }
    setKeywordInput(value)
  }

  const onKeywordInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addKeywordFromInput(keywordInput)
      setKeywordInput('')
      return
    }

    if (e.key === 'Backspace' && !keywordInput && keywordItems.length) {
      setKeywordItems((prev) => prev.slice(0, -1))
    }
  }

  const removeKeyword = (index) => {
    setKeywordItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...data,
      schema_json: (data.schema_json || '').trim() || schemaAuto,
    }

    if (post?.id) {
      router.post(`/admin/blogs/${post.id}`, { ...payload, _method: 'PUT' }, { forceFormData: true })
      return
    }
    router.post('/admin/blogs', payload, { forceFormData: true })
  }

  return (
    <AdminLayout title="Add New Blog">
      <Head title={post ? 'Edit Blog' : 'Add New Blog'} />

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="space-y-3">
            <input
              value={data.title}
              onChange={(e) => {
                const title = e.target.value
                setData('title', title)
                if (!slugTouched) setData('slug', slugify(title))
                if (!data.seo_meta_title) setData('seo_meta_title', title)
              }}
              placeholder="Blog Title"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-2xl font-semibold outline-none focus:border-indigo-400"
            />
            <input
              value={data.slug}
              onChange={(e) => {
                const next = slugify(e.target.value)
                setData('slug', next)
                setSlugTouched(next !== slugify(data.title))
              }}
              placeholder="slug-auto-generate"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <textarea
              value={data.excerpt}
              onChange={(e) => setData('excerpt', e.target.value)}
              placeholder="Short Description (excerpt)"
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            {(errors.title || errors.slug || errors.content) && (
              <p className="text-sm text-rose-600">{errors.title || errors.slug || errors.content}</p>
            )}
          </div>

          <CustomRichTextEditor value={data.content} onChange={(value) => setData('content', value)} onImageUpload={uploadEditorImage} />
        </section>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Category & Tags</h3>
            <p className="mb-2 text-xs font-semibold text-slate-600">Categories (multi-select)</p>
            <div className="mb-3 max-h-40 space-y-1 overflow-auto rounded-lg border border-slate-200 p-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={data.category_ids.includes(category.id)}
                    onChange={() => toggleMultiValue('category_ids', category.id)}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Tags (multi-select)</p>
            <div className="space-y-2 rounded-lg border border-slate-200 p-2">
              <input
                value={tagInput}
                onChange={onTagInputChange}
                onKeyDown={onTagInputKeyDown}
                onBlur={() => {
                  if (!tagInput.trim()) return
                  addTagFromInput(tagInput)
                  setTagInput('')
                }}
                placeholder="e.g. goa, honeymoon, summer travel, family tour"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              {tagItems.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {tagItems.map((tag, idx) => (
                    <button
                      key={`${tag}-${idx}`}
                      type="button"
                      onClick={() => removeTag(idx)}
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                      title="Click to remove tag"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              ) : null}
              <p className="text-[11px] text-slate-500">Comma se separate karein. Tags auto create + assign ho jayenge.</p>
              {tags.length ? <p className="text-[11px] text-slate-400">Suggestions: {tags.slice(0, 12).map((tag) => tag.name).join(', ')}</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Featured Image</h3>
            <input type="file" accept="image/*" onChange={(e) => onFeaturedFile(e.target.files?.[0])} className="mb-2 w-full text-xs" />
            {featuredPreview || data.featured_image_existing ? (
              <img src={featuredPreview || toStorageUrl(data.featured_image_existing)} alt="Preview" className="h-32 w-full rounded-lg object-cover" />
            ) : (
              <div className="grid h-24 place-items-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-500">Preview thumbnail</div>
            )}
            {errors.featured_image && <p className="mt-1 text-xs text-rose-600">{errors.featured_image}</p>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Status & Publish</h3>
            <div className="space-y-2">
              <select value={data.status} onChange={(e) => setData('status', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
              <input type="datetime-local" value={data.published_at} onChange={(e) => setData('published_at', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <select value={data.author_id} onChange={(e) => setData('author_id', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">Select Author</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">SEO Control</h3>
            <input value={data.seo_meta_title} onChange={(e) => setData('seo_meta_title', e.target.value)} placeholder="SEO Title" className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <textarea value={data.seo_meta_description} onChange={(e) => setData('seo_meta_description', e.target.value)} placeholder="Meta Description" rows={3} className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <div className="mb-2 space-y-2 rounded-lg border border-slate-200 p-2">
              <input
                value={keywordInput}
                onChange={onKeywordInputChange}
                onKeyDown={onKeywordInputKeyDown}
                onBlur={() => {
                  if (!keywordInput.trim()) return
                  addKeywordFromInput(keywordInput)
                  setKeywordInput('')
                }}
                placeholder="Meta Keywords (comma separated)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              {keywordItems.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {keywordItems.map((keyword, idx) => (
                    <button
                      key={`${keyword}-${idx}`}
                      type="button"
                      onClick={() => removeKeyword(idx)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      title="Click to remove keyword"
                    >
                      {keyword} ×
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <input value={data.canonical_url} onChange={(e) => setData('canonical_url', e.target.value)} placeholder="Canonical URL" className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <select value={data.robots} onChange={(e) => setData('robots', e.target.value)} className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="index,follow">index,follow</option>
              <option value="index,nofollow">index,nofollow</option>
              <option value="noindex,follow">noindex,follow</option>
              <option value="noindex,nofollow">noindex,nofollow</option>
            </select>
            <input value={data.og_title} onChange={(e) => setData('og_title', e.target.value)} placeholder="OG Title" className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <textarea value={data.og_description} onChange={(e) => setData('og_description', e.target.value)} placeholder="OG Description" rows={2} className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input value={data.twitter_title} onChange={(e) => setData('twitter_title', e.target.value)} placeholder="Twitter Title" className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <textarea value={data.twitter_description} onChange={(e) => setData('twitter_description', e.target.value)} placeholder="Twitter Description" rows={2} className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <label className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input type="checkbox" checked={Boolean(data.include_in_sitemap)} onChange={(e) => setData('include_in_sitemap', e.target.checked)} />
              Include in sitemap
            </label>
            <select value={data.schema_type} onChange={(e) => setData('schema_type', e.target.value)} className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="BlogPosting">BlogPosting</option>
              <option value="Article">Article</option>
              <option value="NewsArticle">NewsArticle</option>
              <option value="HowTo">HowTo</option>
            </select>
            <button
              type="button"
              onClick={() => setData('schema_json', schemaAuto)}
              className="mb-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"
            >
              Auto Generate Schema
            </button>
            <textarea value={data.schema_json || schemaAuto} onChange={(e) => setData('schema_json', e.target.value)} placeholder="JSON-LD Schema" rows={6} className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs" />
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs">
              <p className="truncate text-blue-700">{data.seo_meta_title || data.title || 'SEO Title Preview'}</p>
              <p className="truncate text-emerald-700">{data.canonical_url || `https://example.com/blog/${data.slug || 'blog-slug'}`}</p>
              <p className="mt-1 line-clamp-2 text-slate-600">{data.seo_meta_description || 'Meta description preview appears here.'}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Advanced</h3>
            <p className="mb-2 text-xs text-slate-600">Read Time: <span className="font-semibold text-slate-800">{readTime}</span></p>
            <div className="mb-3 rounded-lg bg-slate-50 p-2">
              <p className="mb-1 text-xs font-semibold text-slate-700">Auto Table of Contents</p>
              {toc.length ? (
                <ul className="space-y-1 text-xs text-slate-600">{toc.map((item) => <li key={item}>- {item}</li>)}</ul>
              ) : (
                <p className="text-xs text-slate-500">Add H1/H2/H3 headings to generate TOC.</p>
              )}
            </div>
          </section>

          <button disabled={processing} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30">
            {processing ? 'Saving...' : post ? 'Update Blog Post' : 'Save Blog Post'}
          </button>
          {autoSaveMessage ? <p className="text-xs text-slate-500">{autoSaveMessage}</p> : null}
          {props.flash?.success && <p className="text-sm text-emerald-600">{props.flash.success}</p>}
        </aside>
      </form>
    </AdminLayout>
  )
}
