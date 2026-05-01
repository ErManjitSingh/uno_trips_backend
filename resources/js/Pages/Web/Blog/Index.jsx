import { Link } from '@inertiajs/react'
import WebLayout from '../../../Layouts/WebLayout'

const toImageUrl = (path) => {
  if (!path) return ''
  const normalized = String(path).replace(/\\/g, '/').trim()
  if (!normalized) return ''
  if (/^https?:\/\//.test(normalized) || normalized.startsWith('data:')) return normalized
  if (normalized.startsWith('/')) return normalized
  return `/storage/${normalized.replace(/^\/+/, '')}`
}

const responsiveImageProps = (path) => {
  const src = toImageUrl(path)
  if (!src) return {}
  if (/^https?:\/\//.test(src) || src.startsWith('data:')) {
    return { src }
  }

  return {
    src,
    srcSet: `${src} 480w, ${src} 768w, ${src} 1200w`,
    sizes: '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw',
  }
}

export default function BlogIndex({ posts, categories = [], seo }) {
  return (
    <WebLayout title="Travel Blog" description="Travel guides and destination stories." seo={seo}>
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-semibold">Travel Journal</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {categories.map((category) => <span key={category.id} className="rounded-full border border-white/20 px-3 py-1">{category.name}</span>)}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {posts.data.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {post.featured_image ? (
                <img
                  {...responsiveImageProps(post.featured_image)}
                  alt={post.title}
                  loading="lazy"
                  decoding="async"
                  className="mb-3 h-40 w-full rounded-xl object-cover"
                />
              ) : null}
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </WebLayout>
  )
}
