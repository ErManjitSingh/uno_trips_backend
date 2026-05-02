import { Head, Link, router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  Clock3,
  Eye,
  FileText,
  Package,
  ReceiptIndianRupee,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import AdminLayout from '../../Layouts/AdminLayout'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

const formatCompact = (value) => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
const currencyCompact = (value) => `INR ${formatCompact(value)}`

const defaultStats = {
  totalPackages: { value: 0, growth: 0, isUp: true, compareText: 'vs previous period' },
  totalBlogs: { value: 0, growth: 0, isUp: true, compareText: 'vs previous period' },
  totalVisitors: { value: 0, growth: 0, isUp: true, compareText: 'vs previous period' },
  totalBookings: { value: 0, growth: 0, isUp: true, compareText: 'vs previous period' },
  revenue: { value: 0, growth: 0, isUp: true, compareText: 'vs previous period' },
}

function KpiCard({ icon: Icon, title, metric, isCurrency = false }) {
  const growth = Number(metric?.growth || 0)
  const isUp = growth >= 0
  return (
    <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        <span className="rounded-lg bg-slate-900/5 p-2 text-slate-700"><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{isCurrency ? currencyCompact(metric?.value) : formatCompact(metric?.value)}</p>
      <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(growth)}%
      </div>
      <p className="mt-1 text-xs text-slate-500">{metric?.compareText || 'vs previous period'}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return <div className="h-[260px] animate-pulse rounded-2xl bg-slate-100" />
}

export default function Dashboard({
  stats = defaultStats,
  range = '7d',
  visitorsRange = 'last7',
  trafficRange = 'last7',
  visitorsTrend = { labels: [], values: [] },
  bookingsLeadsTrend = { labels: [], bookings: [], leads: [] },
  trafficSources = { labels: [], values: [] },
  recentActivities = [],
  topContent = { topPackages: [], topBlogs: [] },
  seo = { keywordsRankingCount: 0, topKeywords: [], seoScore: 0 },
  activeUsersNow = 0,
  latestVisitors = [],
}) {
  const [loadingCharts, setLoadingCharts] = useState(false)
  const [selectedRange, setSelectedRange] = useState(range)
  const [selectedVisitorsRange, setSelectedVisitorsRange] = useState(visitorsRange)
  const [selectedTrafficRange, setSelectedTrafficRange] = useState(trafficRange)
  const todayDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  useEffect(() => {
    setSelectedRange(range)
  }, [range])

  useEffect(() => {
    setSelectedVisitorsRange(visitorsRange)
  }, [visitorsRange])

  useEffect(() => {
    setSelectedTrafficRange(trafficRange)
  }, [trafficRange])

  useEffect(() => {
    const intervalMs = 45000
    const reloadStats = () => {
      if (document.visibilityState !== 'visible') {
        return
      }
      router
        .reload({
          only: ['stats', 'recentActivities', 'activeUsersNow', 'latestVisitors'],
          preserveScroll: true,
          preserveState: true,
        })
        .catch(() => {
          /* shared hosting / tab background — ignore transient network errors */
        })
    }
    const timer = setInterval(reloadStats, intervalMs)
    return () => clearInterval(timer)
  }, [])

  const applyRange = (nextRange) => {
    setLoadingCharts(true)
    setSelectedRange(nextRange)
    router.get('/admin/dashboard', { range: nextRange, visitors_range: selectedVisitorsRange, traffic_range: selectedTrafficRange }, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      onFinish: () => setLoadingCharts(false),
      onError: () => setLoadingCharts(false),
    })
  }

  const applyVisitorsRange = (nextRange) => {
    setLoadingCharts(true)
    setSelectedVisitorsRange(nextRange)
    router.get('/admin/dashboard', { range: selectedRange, visitors_range: nextRange, traffic_range: selectedTrafficRange }, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      onFinish: () => setLoadingCharts(false),
      onError: () => setLoadingCharts(false),
    })
  }

  const applyTrafficRange = (nextRange) => {
    setLoadingCharts(true)
    setSelectedTrafficRange(nextRange)
    router.get('/admin/dashboard', { range: selectedRange, visitors_range: selectedVisitorsRange, traffic_range: nextRange }, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      onFinish: () => setLoadingCharts(false),
      onError: () => setLoadingCharts(false),
    })
  }

  const visitorsLineData = useMemo(() => ({
    labels: visitorsTrend.labels,
    datasets: [
      {
        label: 'Visitors',
        data: visitorsTrend.values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.12)',
        fill: true,
        tension: 0.35,
      },
    ],
  }), [visitorsTrend])

  const bookingsLeadsBarData = useMemo(() => ({
    labels: bookingsLeadsTrend.labels,
    datasets: [
      { label: 'Bookings', data: bookingsLeadsTrend.bookings, backgroundColor: '#16a34a', borderRadius: 8 },
      { label: 'Leads', data: bookingsLeadsTrend.leads, backgroundColor: '#8b5cf6', borderRadius: 8 },
    ],
  }), [bookingsLeadsTrend])

  const trafficData = useMemo(() => ({
    labels: trafficSources.labels || [],
    datasets: [{
      data: trafficSources.values || [],
      backgroundColor: ['#2563eb', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'],
    }],
  }), [trafficSources])
  const hasTrafficData = (trafficSources.values || []).some((value) => Number(value) > 0)

  return (
    <>
      <Head title="Dashboard" />

      <section className="rounded-3xl bg-gradient-to-br from-[#b45309] via-[#f97316] to-[#fb923c] p-6 text-white shadow-[0_20px_60px_rgba(249,115,22,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold">Welcome to Admin</h2>
            <p className="mt-1 text-xs text-orange-100/90">{todayDate}</p>
            <p className="mt-2 text-sm text-orange-50/95">Track Performance. Optimize Growth.</p>
          </div>
          <div className="inline-flex rounded-xl border border-white/20 bg-white/10 p-1">
            {['7d', '30d'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => applyRange(item)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${selectedRange === item ? 'bg-white text-slate-900' : 'text-indigo-100'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-5">
        <KpiCard icon={Package} title="Total Packages" metric={stats.totalPackages} />
        <KpiCard icon={BookOpenText} title="Total Blogs" metric={stats.totalBlogs} />
        <KpiCard icon={Eye} title="Total Visitors" metric={stats.totalVisitors} />
        <KpiCard icon={CalendarDays} title="Total Bookings" metric={stats.totalBookings} />
        <KpiCard icon={ReceiptIndianRupee} title="Revenue" metric={stats.revenue} isCurrency />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Visitors Trend</h3>
            <select
              value={selectedVisitorsRange}
              onChange={(e) => applyVisitorsRange(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="lastmonth">Last Month</option>
              <option value="alltime">All Time</option>
            </select>
          </div>
          {loadingCharts ? <LoadingSkeleton /> : <Line data={visitorsLineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Traffic Sources</h3>
            <select
              value={selectedTrafficRange}
              onChange={(e) => applyTrafficRange(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="lastmonth">Last Month</option>
              <option value="alltime">All Time</option>
            </select>
          </div>
          {loadingCharts ? (
            <LoadingSkeleton />
          ) : hasTrafficData ? (
            <Doughnut data={trafficData} options={{ plugins: { legend: { position: 'bottom' } } }} />
          ) : (
            <div className="mt-4 grid h-[260px] place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
              No traffic source data available yet.
            </div>
          )}
        </article>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/50 p-5 shadow-[0_14px_30px_rgba(59,130,246,0.12)]">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span className="rounded-lg bg-indigo-100 p-2 text-indigo-700"><Clock3 className="h-4 w-4" /></span>
              Recent Activity
            </h3>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">Live</span>
          </div>
          <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {recentActivities.map((activity, idx) => (
              <div key={`${activity.type}-${idx}`} className="rounded-xl border border-indigo-100/80 bg-white/85 p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 rounded-md p-1.5 ${
                    activity.type === 'package' ? 'bg-amber-100 text-amber-700' :
                    activity.type === 'booking' ? 'bg-emerald-100 text-emerald-700' :
                    activity.type === 'blog' ? 'bg-violet-100 text-violet-700' :
                    activity.type === 'lead' ? 'bg-cyan-100 text-cyan-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {activity.type === 'package' ? <Package className="h-3.5 w-3.5" /> :
                     activity.type === 'booking' ? <CalendarDays className="h-3.5 w-3.5" /> :
                     activity.type === 'blog' ? <FileText className="h-3.5 w-3.5" /> :
                     activity.type === 'lead' ? <Users className="h-3.5 w-3.5" /> :
                     <Users className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{activity.text}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/40 p-5 shadow-[0_14px_30px_rgba(16,185,129,0.12)]">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700"><Trophy className="h-4 w-4" /></span>
            Top Packages
          </h3>
          <div className="mt-3 space-y-2">
            {topContent.topPackages.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white/90 p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">{index + 1}</span>
                  <span className="font-medium text-slate-800">{item.name}</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                  <TrendingUp className="h-3 w-3" />
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/40 p-5 shadow-[0_14px_30px_rgba(139,92,246,0.12)]">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="rounded-lg bg-violet-100 p-2 text-violet-700"><Sparkles className="h-4 w-4" /></span>
            Top Blogs
          </h3>
          <div className="mt-3 space-y-2">
            {topContent.topBlogs.map((item, index) => (
              <div key={item.title} className="flex items-center justify-between rounded-xl border border-violet-100 bg-white/90 p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">{index + 1}</span>
                  <span className="truncate pr-2 font-medium text-slate-800">{item.title}</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
                  <Eye className="h-3 w-3" />
                  {formatCompact(item.views)}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">SEO Insights</h3>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">SEO Score: {seo.seoScore}%</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">Keywords ranking count: <span className="font-semibold text-slate-700">{seo.keywordsRankingCount}</span></p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {seo.topKeywords.map((item) => (
            <div key={item.keyword} className="rounded-lg border border-slate-200 p-3">
              <p className="truncate text-sm font-medium text-slate-800">{item.keyword}</p>
              <p className="text-xs text-slate-500">Mentions: {item.count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Link href="/admin/packages" className="rounded-xl bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white">Add New Package</Link>
          <Link href="/admin/blogs" className="rounded-xl bg-violet-600 px-3 py-2 text-center text-sm font-medium text-white">Add Blog</Link>
          <Link href="/admin/leads" className="rounded-xl bg-emerald-600 px-3 py-2 text-center text-sm font-medium text-white">View Leads</Link>
          <button className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-medium text-white">Export Report</button>
          <Link href="/admin/media-library" className="rounded-xl bg-cyan-600 px-3 py-2 text-center text-sm font-medium text-white">Upload Media</Link>
          <Link href="/admin/settings" className="rounded-xl bg-slate-700 px-3 py-2 text-center text-sm font-medium text-white">Settings</Link>
        </div>
      </section>
    </>
  )
}

Dashboard.layout = (page) => <AdminLayout title="Dashboard">{page}</AdminLayout>
