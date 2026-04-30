import { Head, Link, router, useForm, usePage } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { Eye, Pencil, Search, Trash2 } from 'lucide-react'
import AdminLayout from '../../../Layouts/AdminLayout'

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

function scoreSeo(post) {
  const titleLen = post.seo_meta_title?.length || 0
  const metaLen = post.seo_meta_description?.length || 0
  const contentLen = post.content?.length || 0
  const score = (titleLen >= 35 && titleLen <= 70 ? 1 : 0) + (metaLen >= 120 && metaLen <= 170 ? 1 : 0) + (contentLen >= 800 ? 1 : 0)
  if (score >= 3) return 'High'
  if (score === 2) return 'Medium'
  return 'Low'
}

export default function BlogsIndex({ posts, categories, authors = [] }) {
  const { props } = usePage()
  const [activeTab, setActiveTab] = useState('all')
  const [selectedRows, setSelectedRows] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    author: 'all',
    date: '',
  })

  const { data, setData, post, processing, reset } = useForm({
    blog_category_id: '',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft',
    seo_meta_title: '',
    seo_meta_description: '',
    featured_image: '',
  })

  const submit = (e) => {
    e.preventDefault()
    if (editingId) {
      router.put(`/admin/blogs/${editingId}`, data, {
        preserveScroll: true,
        onSuccess: () => {
          reset()
          setEditingId(null)
          setActiveTab('all')
        },
      })
      return
    }

    post('/admin/blogs', {
      onSuccess: () => {
        reset()
        setActiveTab('all')
      },
    })
  }

  const rows = useMemo(
    () =>
      posts.data
        .map((postItem) => ({
          ...postItem,
          seoScore: scoreSeo(postItem),
          author_name: postItem.author_name || 'Admin Team',
        }))
        .filter((postItem) => {
          const searchMatch =
            !search.trim() ||
            postItem.title.toLowerCase().includes(search.toLowerCase()) ||
            (postItem.slug || '').toLowerCase().includes(search.toLowerCase())
          const statusMatch = filters.status === 'all' || postItem.status === filters.status
          const categoryMatch =
            filters.category === 'all' || String(postItem.blog_category_id || '') === filters.category
          const authorMatch = filters.author === 'all' || postItem.author_name === filters.author
          const dateMatch = !filters.date || (postItem.published_at || '').slice(0, 10) === filters.date
          return searchMatch && statusMatch && categoryMatch && authorMatch && dateMatch
        }),
    [posts.data, search, filters]
  )

  const allSelected = rows.length > 0 && rows.every((row) => selectedRows.includes(row.id))

  const toggleSelection = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    setSelectedRows(allSelected ? [] : rows.map((row) => row.id))
  }

  const runBulkAction = (action) => {
    if (!selectedRows.length) return
    router.post('/admin/blogs/bulk-action', { action, ids: selectedRows }, { preserveScroll: true })
    setSelectedRows([])
  }

  const quickPublish = (row) => {
    router.put(`/admin/blogs/${row.id}/quick-publish`, {}, { preserveScroll: true })
  }

  const deleteRow = (row) => {
    router.delete(`/admin/blogs/${row.id}`, { preserveScroll: true })
  }

  const startEdit = (row) => {
    router.get(`/admin/blogs/${row.id}/edit`)
  }

  return (
    <>
      <Head title="Blog Management" />
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`rounded-lg px-3 py-1.5 text-sm ${activeTab === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
              >
                All Posts
              </button>
              <button
                onClick={() => router.get('/admin/blogs/create')}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500"
              >
                Add New Blog
              </button>
            </div>
            {props.flash?.success ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {props.flash.success}
              </span>
            ) : null}
          </div>
        </section>

        {activeTab === 'add' ? (
          <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                placeholder="Blog title"
                value={data.title}
                onChange={(e) => {
                  setData('title', e.target.value)
                  if (!data.slug) setData('slug', slugify(e.target.value))
                }}
              />
              <input className="rounded-lg border border-slate-200 bg-white px-3 py-2" placeholder="Slug" value={data.slug} onChange={(e) => setData('slug', slugify(e.target.value))} />
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2" value={data.blog_category_id} onChange={(e) => setData('blog_category_id', e.target.value)}>
                <option value="">Category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <input className="rounded-lg border border-slate-200 bg-white px-3 py-2" placeholder="Thumbnail URL" value={data.featured_image} onChange={(e) => setData('featured_image', e.target.value)} />
            <textarea className="min-h-28 rounded-lg border border-slate-200 bg-white px-3 py-2" placeholder="Excerpt" value={data.excerpt} onChange={(e) => setData('excerpt', e.target.value)} />
            <textarea className="min-h-40 rounded-lg border border-slate-200 bg-white px-3 py-2" placeholder="Content" value={data.content} onChange={(e) => setData('content', e.target.value)} />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-lg border border-slate-200 bg-white px-3 py-2" placeholder="SEO title" value={data.seo_meta_title} onChange={(e) => setData('seo_meta_title', e.target.value)} />
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-2" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <textarea className="min-h-24 rounded-lg border border-slate-200 bg-white px-3 py-2" placeholder="SEO description" value={data.seo_meta_description} onChange={(e) => setData('seo_meta_description', e.target.value)} />
            <div className="flex items-center gap-2">
              <button disabled={processing} className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                {editingId ? 'Update Blog' : 'Save Blog'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    reset()
                    setActiveTab('all')
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-[220px] grow">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
                  placeholder="Search title or slug"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <select className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
              <select className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm" value={filters.category} onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}>
                <option value="all">All Category</option>
                {categories.map((cat) => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
              </select>
              <select className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm" value={filters.author} onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}>
                <option value="all">All Author</option>
                {authors.map((author) => <option key={author} value={author}>{author}</option>)}
              </select>
              <input type="date" className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm" value={filters.date} onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => runBulkAction('publish')} disabled={!selectedRows.length} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-50">
                Bulk Publish
              </button>
              <button onClick={() => runBulkAction('delete')} disabled={!selectedRows.length} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50">
                Bulk Delete
              </button>
              <span className="text-xs text-slate-500">{selectedRows.length} selected</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /></th>
                    <th className="px-2 py-2">Thumbnail</th>
                    <th className="px-2 py-2">Title</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Author</th>
                    <th className="px-2 py-2">Views</th>
                    <th className="px-2 py-2">SEO</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Publish Date</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((blog) => (
                    <tr key={blog.id} className="group rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                      <td className="rounded-l-xl px-2 py-2 align-middle">
                        <input type="checkbox" checked={selectedRows.includes(blog.id)} onChange={() => toggleSelection(blog.id)} />
                      </td>
                      <td className="px-2 py-2">
                        <img
                          src={blog.featured_image || 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=300&q=80'}
                          alt={blog.title}
                          className="h-12 w-16 rounded-lg object-cover"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <p className="font-semibold text-slate-800">{blog.title}</p>
                        <p className="text-xs text-slate-500">{blog.slug}</p>
                      </td>
                      <td className="px-2 py-2 text-slate-600">{blog.category?.name ?? '-'}</td>
                      <td className="px-2 py-2 text-slate-600">{blog.author_name}</td>
                      <td className="px-2 py-2 text-slate-700">{blog.views_count?.toLocaleString('en-IN') ?? 0}</td>
                      <td className="px-2 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${blog.seoScore === 'High' ? 'bg-emerald-100 text-emerald-700' : blog.seoScore === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {blog.seoScore}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => quickPublish(blog)}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${blog.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                        >
                          {blog.status === 'published' ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-2 py-2 text-slate-600">{blog.published_at ? new Date(blog.published_at).toLocaleDateString('en-IN') : '-'}</td>
                      <td className="rounded-r-xl px-2 py-2">
                        <div className="flex items-center gap-1 opacity-80 transition group-hover:opacity-100">
                          <button onClick={() => startEdit(blog)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"><Pencil className="h-3.5 w-3.5" /></button>
                          <Link href={`/blog/${blog.slug}`} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"><Eye className="h-3.5 w-3.5" /></Link>
                          <button onClick={() => deleteRow(blog)} className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  )
}

BlogsIndex.layout = (page) => <AdminLayout title="Blog Management">{page}</AdminLayout>
