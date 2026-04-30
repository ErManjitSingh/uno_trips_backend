import { Link, useForm } from '@inertiajs/react'
import WebLayout from '../../Layouts/WebLayout'
import useRevealMotion from '../../Hooks/useRevealMotion'

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

export default function Home({ seo, heroPackages = [], popularDestinations = [], testimonials = [], latestBlogs = [] }) {
  const { data, setData, post, processing } = useForm({ name: '', phone: '', email: '', message: '', source: 'homepage' })
  useRevealMotion()

  return (
    <WebLayout title={seo?.title ?? 'Premium UNO Trips Tours'} description={seo?.description}>
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="mx-auto max-w-7xl px-4 py-24 md:px-8">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Luxury UNO Trips escapes</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">Design your premium UNO Trips journey with confidence.</h1>
          <p className="mt-5 max-w-2xl text-slate-300">Handcrafted itineraries, elite stays, and destination experts for unforgettable experiences.</p>
          <div className="mt-8 flex gap-3">
            <Link href="/tours" className="rounded-xl bg-amber-400 px-6 py-3 font-semibold text-slate-900">Explore Packages</Link>
            <Link href="/contact" className="rounded-xl border border-white/20 px-6 py-3">Talk to Expert</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <h2 className="text-2xl font-semibold">Featured Tour Packages</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {heroPackages.map((pkg) => (
            <Link data-reveal key={pkg.id} href={`/tours/${pkg.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:bg-white/10">
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
              <p className="mt-2 text-sm text-slate-300">{pkg.duration}</p>
              <p className="mt-3 text-xl font-semibold">INR {Math.round(Number(pkg.offer_price || pkg.price || 0)).toLocaleString()}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <h2 className="text-2xl font-semibold">Popular Destinations</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {popularDestinations.map((destination) => (
              <Link data-reveal key={destination.id} href={`/destinations/${destination.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                {destination.hero_image ? (
                  <img
                    {...responsiveImageProps(destination.hero_image)}
                    alt={destination.name}
                    loading="lazy"
                    decoding="async"
                    className="mb-3 h-36 w-full rounded-xl object-cover"
                  />
                ) : null}
                <h3 className="text-lg font-medium">{destination.name}</h3>
                <p className="mt-2 text-sm text-slate-300">{destination.short_description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-2 md:px-8">
        <div>
          <h2 className="text-2xl font-semibold">Testimonials</h2>
          <div className="mt-6 space-y-4">
            {testimonials.map((item) => (
              <article data-reveal key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-amber-300">{'★'.repeat(Math.max(1, item.rating || 5))}</p>
                <p className="mt-2 text-slate-200">{item.content}</p>
                <p className="mt-3 text-sm text-slate-400">{item.customer_name}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold">Quick Inquiry</h3>
          <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); post('/inquiry') }}>
            <input className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm" placeholder="Your Name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
            <input className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm" placeholder="Phone Number" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
            <input className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm" placeholder="Email (optional)" value={data.email} onChange={(e) => setData('email', e.target.value)} />
            <textarea className="h-24 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm" placeholder="Tell us your plan" value={data.message} onChange={(e) => setData('message', e.target.value)} />
            <button disabled={processing} className="w-full rounded-xl bg-amber-400 px-4 py-2.5 font-semibold text-slate-900">{processing ? 'Submitting...' : 'Get Custom Plan'}</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <h2 className="text-2xl font-semibold">Latest Blogs</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {latestBlogs.map((blog) => (
            <Link data-reveal key={blog.id} href={`/blog/${blog.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {blog.featured_image ? (
                <img
                  {...responsiveImageProps(blog.featured_image)}
                  alt={blog.title}
                  loading="lazy"
                  decoding="async"
                  className="mb-3 h-32 w-full rounded-xl object-cover"
                />
              ) : null}
              <h3 className="font-semibold">{blog.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{blog.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </WebLayout>
  )
}
