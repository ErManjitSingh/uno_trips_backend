import { Head, useForm } from '@inertiajs/react'
import { useState } from 'react'
import WebLayout from '../../../Layouts/WebLayout'

export default function TourShow({ tour, related = [], seo }) {
  const { data, setData, post, processing } = useForm({ name: '', phone: '', email: '', message: `Inquiry for ${tour.title}`, source: 'tour_detail' })
  const [openFaq, setOpenFaq] = useState(0)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: tour.seo_meta_description || tour.title,
    touristType: tour.package_type || 'luxury',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: Number(tour.offer_price || tour.price || 0),
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <WebLayout title={tour.seo_meta_title || tour.title} description={tour.seo_meta_description || tour.title} seo={seo}>
      <Head>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Head>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <div className="md:col-span-2">
          <p className="text-xs text-amber-300">{tour.destination}</p>
          <h1 className="mt-2 text-4xl font-semibold">{tour.title}</h1>
          <p className="mt-3 text-slate-300">{tour.duration}</p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Inclusions</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {(tour.inclusions || []).map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Day-wise Itinerary</h2>
            <div className="mt-4 space-y-3">
              {(tour.itinerary || []).map((line, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-xs text-amber-300">Day {idx + 1}</p>
                  <p className="mt-1 text-sm text-slate-200">{line}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
            <div className="mt-4 space-y-2">
              {(tour.faqs || []).map((faq, idx) => (
                <button key={faq.id || idx} type="button" onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)} className="w-full rounded-xl border border-white/10 bg-slate-900/60 p-3 text-left">
                  <p className="text-sm font-semibold text-white">{faq.question}</p>
                  {openFaq === idx ? <p className="mt-2 text-sm text-slate-300">{faq.answer}</p> : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="sticky top-24 h-fit rounded-2xl border border-indigo-300/20 bg-indigo-950/40 p-5">
          <p className="text-sm text-slate-300">Starting from</p>
          <p className="mt-1 text-3xl font-semibold text-amber-300">INR {Math.round(Number(tour.offer_price || tour.price || 0)).toLocaleString()}</p>
          <form className="mt-4 space-y-2" onSubmit={(e) => { e.preventDefault(); post('/inquiry') }}>
            <input className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm" placeholder="Name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
            <input className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm" placeholder="Phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
            <button disabled={processing} className="w-full rounded-xl bg-amber-400 px-4 py-2 font-semibold text-slate-900">{processing ? 'Submitting...' : 'Book Consultation'}</button>
          </form>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <h3 className="text-2xl font-semibold">Related Packages</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {related.map((pkg) => (
            <a key={pkg.id} href={`/tours/${pkg.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">{pkg.title}</a>
          ))}
        </div>
      </section>

      <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-amber-300/50 bg-slate-900/95 p-3 shadow-2xl backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-300">Need instant help?</p>
            <p className="text-sm font-semibold text-white">Talk to travel expert now</p>
          </div>
          <a href="https://wa.me/919999912345" className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-900">WhatsApp</a>
        </div>
      </div>
    </WebLayout>
  )
}
