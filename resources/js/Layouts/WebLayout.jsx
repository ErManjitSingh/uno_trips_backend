import { Head, Link } from '@inertiajs/react'

export default function WebLayout({ title, description, seo, children }) {
  const resolvedTitle = seo?.title || title
  const resolvedDescription = seo?.description || description
  const robots = `${seo?.robots?.index === false ? 'noindex' : 'index'},${seo?.robots?.follow === false ? 'nofollow' : 'follow'}`

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50">
      <Head title={resolvedTitle}>
        {resolvedDescription && <meta name="description" content={resolvedDescription} />}
        {seo?.keywords ? <meta name="keywords" content={seo.keywords} /> : null}
        <meta name="robots" content={robots} />
        {seo?.canonical_url ? <link rel="canonical" href={seo.canonical_url} /> : null}
        {seo?.og?.title ? <meta property="og:title" content={seo.og.title} /> : null}
        {seo?.og?.description ? <meta property="og:description" content={seo.og.description} /> : null}
        {seo?.og?.image ? <meta property="og:image" content={seo.og.image} /> : null}
        {seo?.og?.url ? <meta property="og:url" content={seo.og.url} /> : null}
        <meta property="og:type" content="website" />
        {seo?.twitter?.title ? <meta name="twitter:title" content={seo.twitter.title} /> : null}
        {seo?.twitter?.description ? <meta name="twitter:description" content={seo.twitter.description} /> : null}
        {seo?.twitter?.image ? <meta name="twitter:image" content={seo.twitter.image} /> : null}
        <meta name="twitter:card" content="summary_large_image" />
        {seo?.json_ld ? <script type="application/ld+json">{seo.json_ld}</script> : null}
      </Head>

      <header className="sticky top-0 z-40 border-b border-amber-200/20 bg-stone-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <Link href="/" className="flex flex-col items-start gap-0.5">
            <img
              src="https://travelwithuno.com/img/logo.png"
              alt="UNO Trips"
              className="h-9 w-auto max-w-[200px] object-contain"
            />
            <span className="text-[11px] font-medium tracking-wide text-amber-200/90">Travel made simple</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-amber-100/80 md:flex">
            <Link href="/about" className="hover:text-amber-300">About</Link>
            <Link href="/tours" className="hover:text-amber-300">Tours</Link>
            <Link href="/blog" className="hover:text-amber-300">Blog</Link>
            <Link href="/contact" className="hover:text-amber-300">Contact</Link>
          </nav>
          <a href="https://wa.me/919999912345" className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-stone-900">WhatsApp</a>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-amber-200/20 bg-stone-950">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-3 md:px-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-200/70">Luxury Travel</p>
            <h3 className="mt-2 text-xl font-semibold">Curated UNO Trips Journeys</h3>
          </div>
          <div className="text-sm text-amber-100/80">Premium package design, concierge support, and trusted local partners.</div>
          <div className="text-sm text-amber-100/80">Email: hello@unotrips.example<br />Phone: +91 99999 12345</div>
        </div>
      </footer>
    </div>
  )
}
