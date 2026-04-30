import { useForm } from '@inertiajs/react'
import WebLayout from '../../Layouts/WebLayout'

export default function Contact({ settings, seo }) {
  const { data, setData, post, processing } = useForm({ name: '', phone: '', email: '', message: '', source: 'contact_page' })

  return (
    <WebLayout title="Contact Us" description="Talk to our travel specialists." seo={seo}>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 md:px-8">
        <div>
          <h1 className="text-4xl font-semibold">Let’s plan your journey</h1>
          <p className="mt-4 text-slate-300">Call, WhatsApp, or submit the form. Our experts reply quickly with tailored options.</p>
          <div className="mt-6 space-y-2 text-sm text-slate-300">
            <p>Email: {settings?.contact_email || 'hello@unotrips.example'}</p>
            <p>Phone: {settings?.contact_phone || '+91 99999 12345'}</p>
          </div>
        </div>
        <form className="rounded-2xl border border-white/10 bg-white/5 p-6" onSubmit={(e) => { e.preventDefault(); post('/inquiry') }}>
          <div className="space-y-3">
            <input className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm" placeholder="Name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
            <input className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm" placeholder="Phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
            <input className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm" placeholder="Email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
            <textarea className="h-28 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm" placeholder="Message" value={data.message} onChange={(e) => setData('message', e.target.value)} />
            <button disabled={processing} className="w-full rounded-xl bg-amber-400 px-4 py-2.5 font-semibold text-slate-900">{processing ? 'Sending...' : 'Send Inquiry'}</button>
          </div>
        </form>
      </section>
    </WebLayout>
  )
}
