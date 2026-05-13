import { Head, Link, usePage } from '@inertiajs/react'

export default function Forbidden({ message }) {
  const { props } = usePage()
  const text = message || props?.errors?.message || 'You do not have permission to view this page.'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <Head title="Forbidden" />
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">403</p>
      <h1 className="mt-3 text-2xl font-semibold text-white">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">{text}</p>
      <Link href="/admin/dashboard" className="mt-8 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400">
        Back to dashboard
      </Link>
    </div>
  )
}
