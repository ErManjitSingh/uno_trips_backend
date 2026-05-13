import { Head, useForm, usePage } from '@inertiajs/react'
import { useState } from 'react'

export default function Login() {
  const { flash } = usePage().props
  const [showPassword, setShowPassword] = useState(false)

  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: false,
  })

  const submit = (e) => {
    e.preventDefault()
    post('/login')
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-10 sm:px-6"
      style={{ backgroundImage: "url('https://cdn.wallpapersafari.com/80/94/AC21PJ.jpg')" }}
    >
      <Head title="Login" />
      <section className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0_30px_90px_rgba(0,0,0,0.38)]">
        <div className="grid min-h-[520px] grid-cols-1 md:grid-cols-2">
          <form
            onSubmit={submit}
            className="relative flex flex-col justify-center gap-4 bg-gradient-to-br from-[#fda101] via-[#f08f00] to-[#cf6e00] px-8 py-10 text-white md:px-10"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold tracking-wide">UNO Trips</p>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                Staff login
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold uppercase leading-tight">Login</h1>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-white/90">Welcome back</p>
            </div>

            {flash?.success ? (
              <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-50">{flash.success}</div>
            ) : null}

            <div className="space-y-3">
              <input
                type="email"
                className="w-full rounded-md border border-white/30 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-white"
                placeholder="Email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
              />
              {errors.email && <p className="mt-1.5 text-xs text-rose-100">{errors.email}</p>}

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-md border border-white/30 bg-white px-3 py-2.5 pr-16 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-white"
                  placeholder="Password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-purple-700"
                >
                  {showPassword ? 'Hide' : 'View'}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-rose-100">{errors.password}</p>}
            </div>

            <div className="mt-1 flex items-center justify-between text-[11px] text-white/90">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                  className="h-3.5 w-3.5 rounded border border-white/40"
                />
                Remember me
              </label>
              <a href="/forgot-password" className="text-amber-100 underline decoration-white/40 hover:text-white">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="mt-2 w-full rounded-md bg-[#5d1d85] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#521875]"
            >
              {processing ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="hidden bg-[#f5f5f8] md:block">
            <img
              src="https://static.vecteezy.com/system/resources/thumbnails/003/689/228/small_2x/online-registration-or-sign-up-login-for-account-on-smartphone-app-user-interface-with-secure-password-mobile-application-for-ui-web-banner-access-cartoon-people-illustration-vector.jpg"
              alt="Login illustration"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
