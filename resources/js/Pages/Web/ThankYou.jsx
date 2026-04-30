import { Link } from '@inertiajs/react'
import WebLayout from '../../Layouts/WebLayout'

export default function ThankYou() {
  return (
    <WebLayout title="Thank You" description="Inquiry submitted successfully.">
      <section className="mx-auto max-w-3xl px-4 py-20 text-center md:px-8">
        <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Inquiry received</p>
        <h1 className="mt-4 text-4xl font-semibold">Thank you. Our travel expert will contact you shortly.</h1>
        <p className="mt-4 text-slate-300">We are preparing personalized package suggestions based on your requirements.</p>
        <Link href="/" className="mt-8 inline-flex rounded-xl bg-amber-400 px-6 py-3 font-semibold text-slate-900">Back to Home</Link>
      </section>
    </WebLayout>
  )
}
