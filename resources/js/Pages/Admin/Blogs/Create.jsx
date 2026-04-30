import { Head, router, useForm, usePage } from '@inertiajs/react'
import { Editor } from '@tinymce/tinymce-react'
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../../Layouts/AdminLayout'

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
  const [featuredPreview, setFeaturedPreview] = useState('')

  const { data, setData, processing, errors } = useForm({
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
    category_ids: [],
  })

  const readTime = useMemo(() => calcReadTime(data.content), [data.content])
  const toc = useMemo(() => buildToc(data.content), [data.content])

  useEffect(() => {
    if (!post) return
    setData({
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
      category_ids: (post.category_ids || []).map((id) => Number(id)),
    })
    setFeaturedPreview(toStorageUrl(post.featured_image || ''))
  }, [post, setData])

  const onFeaturedFile = (file) => {
    if (!file) return
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

  const onSubmit = (e) => {
    e.preventDefault()
    if (post?.id) {
      router.post(`/admin/blogs/${post.id}`, { ...data, _method: 'PUT' }, { forceFormData: true })
      return
    }
    router.post('/admin/blogs', data, { forceFormData: true })
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
                setData('title', e.target.value)
                if (!data.slug) setData('slug', slugify(e.target.value))
                if (!data.seo_meta_title) setData('seo_meta_title', e.target.value)
              }}
              placeholder="Blog Title"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-2xl font-semibold outline-none focus:border-indigo-400"
            />
            <input
              value={data.slug}
              onChange={(e) => setData('slug', e.target.value)}
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

          <div className="rounded-2xl border border-slate-200">
            <Editor
              value={data.content}
              onEditorChange={(value) => setData('content', value)}
              init={{
                height: 520,
                menubar: false,
                plugins: 'lists link image table code autoresize',
                toolbar:
                  'undo redo | blocks | bold italic underline | bullist numlist | link image table | code',
                branding: false,
              }}
            />
          </div>
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
            <div className="max-h-40 space-y-1 overflow-auto rounded-lg border border-slate-200 p-2">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={data.tag_ids.includes(tag.id)}
                    onChange={() => toggleMultiValue('tag_ids', tag.id)}
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
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
            <input value={data.focus_keyword} onChange={(e) => setData('focus_keyword', e.target.value)} placeholder="Focus Keyword" className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input value={data.keywords} onChange={(e) => setData('keywords', e.target.value)} placeholder="Keywords (comma separated)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs">
              <p className="truncate text-blue-700">{data.seo_meta_title || data.title || 'SEO Title Preview'}</p>
              <p className="truncate text-emerald-700">https://example.com/blog/{data.slug || 'blog-slug'}</p>
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
          {props.flash?.success && <p className="text-sm text-emerald-600">{props.flash.success}</p>}
        </aside>
      </form>
    </AdminLayout>
  )
}
