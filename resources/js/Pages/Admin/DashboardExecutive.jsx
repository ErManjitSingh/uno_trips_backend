import { Head, Link } from '@inertiajs/react'
import AdminLayout from '../../Layouts/AdminLayout'

function StatCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-white/10 bg-white/5 text-slate-100',
    amber: 'border-amber-400/30 bg-amber-500/10 text-amber-50',
    emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-50',
    rose: 'border-rose-400/30 bg-rose-500/10 text-rose-50',
  }
  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-sm ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export default function DashboardExecutive({ stats, recentPackages, recentBlogs }) {
  return (
    <AdminLayout title="My dashboard">
      <Head title="Executive dashboard" />
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-amber-50">My workspace</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-amber-100/70">Packages and blogs you own. Live content requires super admin approval.</p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-amber-200/80">Packages</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total" value={stats.packages_total} />
            <StatCard label="Pending approval" value={stats.packages_pending} tone="amber" />
            <StatCard label="Approved" value={stats.packages_approved} tone="emerald" />
            <StatCard label="Rejected" value={stats.packages_rejected} tone="rose" />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-amber-200/80">Blogs</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total" value={stats.blogs_total} />
            <StatCard label="Pending approval" value={stats.blogs_pending} tone="amber" />
            <StatCard label="Approved" value={stats.blogs_approved} tone="emerald" />
            <StatCard label="Rejected" value={stats.blogs_rejected} tone="rose" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-amber-200/60 bg-white/80 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/80">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-stone-900 dark:text-amber-50">Recent packages</h3>
              <Link href="/admin/packages" className="text-xs font-medium text-orange-600 hover:underline dark:text-amber-300">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-amber-100 dark:divide-stone-700">
              {recentPackages?.length ? (
                recentPackages.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate text-stone-800 dark:text-amber-50">{p.title}</span>
                    <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600 dark:bg-stone-800 dark:text-amber-200">
                      {p.approval_status || p.status}
                    </span>
                  </li>
                ))
              ) : (
                <li className="py-6 text-center text-sm text-stone-500">No packages yet.</li>
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200/60 bg-white/80 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/80">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-stone-900 dark:text-amber-50">Recent blogs</h3>
              <Link href="/admin/blogs" className="text-xs font-medium text-orange-600 hover:underline dark:text-amber-300">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-amber-100 dark:divide-stone-700">
              {recentBlogs?.length ? (
                recentBlogs.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate text-stone-800 dark:text-amber-50">{b.title}</span>
                    <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600 dark:bg-stone-800 dark:text-amber-200">
                      {b.approval_status || b.status}
                    </span>
                  </li>
                ))
              ) : (
                <li className="py-6 text-center text-sm text-stone-500">No blogs yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
