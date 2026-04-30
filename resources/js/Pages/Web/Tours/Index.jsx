import { Link, router } from '@inertiajs/react'
import WebLayout from '../../../Layouts/WebLayout'

const toImageUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//.test(path) || path.startsWith('data:')) return path
  return `/storage/${path}`
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

export default function TourIndex({ packages, filters = {}, destinations = [], seo }) {
  const onFilterChange = (field, value) => {
    router.get('/tours', { ...filters, [field]: value || undefined }, { preserveState: true, replace: true })
  }

  return (
    <WebLayout title="Tour Packages" description="Discover premium UNO Trips tour packages." seo={seo}>
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <h1 className="text-3xl font-semibold">Curated Tours</h1>
        <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-4">
          <select value={filters.destination || ''} onChange={(e) => onFilterChange('destination', e.target.value)} className="rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm">
            <option value="">All Destinations</option>
            {destinations.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select value={filters.category || ''} onChange={(e) => onFilterChange('category', e.target.value)} className="rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm">
            <option value="">All Categories</option>
            <option value="honeymoon">Honeymoon</option><option value="family">Family</option><option value="adventure">Adventure</option><option value="luxury">Luxury</option>
          </select>
          <select value={filters.sort || 'latest'} onChange={(e) => onFilterChange('sort', e.target.value)} className="rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm">
            <option value="latest">Latest</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option><option value="popular">Most Popular</option>
          </select>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {packages.data.map((pkg) => (
            <Link key={pkg.id} href={`/tours/${pkg.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
              {pkg.featured_image ? (
                <img
                  {...responsiveImageProps(pkg.featured_image)}
                  alt={pkg.title}
                  loading="lazy"
                  decoding="async"
                  className="mb-3 h-40 w-full rounded-xl object-cover"
                />
              ) : null}
              <p className="text-xs text-amber-300">{pkg.destination}</p>
              <h3 className="mt-2 text-lg font-semibold">{pkg.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{pkg.duration}</p>
              <p className="mt-3 font-semibold">INR {Math.round(Number(pkg.offer_price || pkg.price || 0)).toLocaleString()}</p>
            </Link>
          ))}
        </div>
      </section>
    </WebLayout>
  )
}
