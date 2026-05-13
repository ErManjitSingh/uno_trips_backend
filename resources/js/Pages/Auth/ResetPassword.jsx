import { Head, useForm } from '@inertiajs/react'

export default function ResetPassword({ token, email }) {
  const { data, setData, post, processing, errors } = useForm({
    token,
    email: email || '',
    password: '',
    password_confirmation: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post('/reset-password')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <Head title="Set new password" />
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-xl font-semibold text-white">New password</h1>
        <p className="mt-2 text-sm text-slate-400">Choose a strong password for your account.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={data.token} readOnly />
          <div>
            <label className="text-xs font-medium text-slate-300">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              autoComplete="username"
            />
            {errors.email ? <p className="mt-1 text-xs text-rose-300">{errors.email}</p> : null}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              autoComplete="new-password"
            />
            {errors.password ? <p className="mt-1 text-xs text-rose-300">{errors.password}</p> : null}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Confirm password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={processing}
            className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {processing ? 'Saving…' : 'Update password'}
          </button>
        </form>
        <a href="/login" className="mt-6 block text-center text-sm text-amber-200/90 hover:text-amber-100">
          Back to login
        </a>
      </div>
    </div>
  )
}
