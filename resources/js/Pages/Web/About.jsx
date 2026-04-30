import WebLayout from '../../Layouts/WebLayout'

export default function About({ seo }) {
  return (
    <WebLayout title="About UNO Trips Luxury" description="Trusted luxury UNO Trips travel planners." seo={seo}>
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Our story</p>
        <h1 className="mt-4 text-4xl font-semibold">Premium journeys crafted with precision</h1>
        <p className="mt-6 text-slate-300">We build high-touch travel experiences across UNO Trips with trusted local teams, curated stays, and concierge-level service.</p>
      </section>
    </WebLayout>
  )
}
