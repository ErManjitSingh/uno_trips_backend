import { Head } from '@inertiajs/react'
import AdminLayout from '../../../Layouts/AdminLayout'

const numberFormat = new Intl.NumberFormat('en-IN')

export default function AnalyticsIndex({ kpis }) {
  const cards = [
    { label: 'Monthly Visitors', value: numberFormat.format(kpis?.monthlyVisitors || 0), tone: 'text-blue-600' },
    { label: 'Conversion Rate', value: `${kpis?.conversionRate || 0}%`, tone: 'text-emerald-600' },
    { label: 'Qualified Leads', value: numberFormat.format(kpis?.qualifiedLeads || 0), tone: 'text-indigo-600' },
    { label: 'Booking Growth', value: `${kpis?.bookingGrowth || 0}%`, tone: 'text-amber-600' },
    { label: 'Active Packages', value: `${kpis?.activePackages || 0}`, tone: 'text-cyan-600' },
  ]

  return (
    <>
      <Head title="Analytics" />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">Travel Website Performance</h2>
        <p className="mt-1 text-sm text-slate-500">Route-backed analytics module with API-ready KPI placeholders.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <article key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className={`mt-2 text-2xl font-bold ${card.tone}`}>{card.value}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

AnalyticsIndex.layout = (page) => <AdminLayout title="Analytics">{page}</AdminLayout>
