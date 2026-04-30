import { Link } from '@inertiajs/react'
import WebLayout from '../../../Layouts/WebLayout'

export default function DestinationShow({ destination, packages }) {
  return (
    <WebLayout title={destination.seo_meta_title || destination.name} description={destination.seo_meta_description || destination.short_description}>
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <h1 className="text-4xl font-semibold">{destination.name}</h1>
        <p className="mt-3 max-w-3xl text-slate-300">{destination.description || destination.short_description}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {packages.data.map((pkg) => (
            <Link key={pkg.id} href={`/tours/${pkg.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">{pkg.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{pkg.duration}</p>
            </Link>
          ))}
        </div>
      </section>
    </WebLayout>
  )
}
