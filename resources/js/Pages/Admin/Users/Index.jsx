import { Head, router, useForm } from '@inertiajs/react'
import { useState } from 'react'
import AdminLayout from '../../../Layouts/AdminLayout'

export default function UsersIndex({ users, filters }) {
  const [open, setOpen] = useState(false)
  const form = useForm({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'executive',
    status: 'active',
  })

  const editForm = useForm({
    id: null,
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'active',
  })

  const submitCreate = (e) => {
    e.preventDefault()
    form.post('/admin/users', {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false)
        form.reset()
      },
    })
  }

  const submitEdit = (e) => {
    e.preventDefault()
    if (!editForm.data.id) return
    editForm.put(`/admin/users/${editForm.data.id}`, {
      preserveScroll: true,
      onSuccess: () => editForm.reset(),
    })
  }

  const badge = (status) =>
    status === 'active'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200'

  return (
    <AdminLayout title="Users">
      <Head title="User management" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-amber-50">Executives</h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-amber-100/70">Create and manage executive accounts.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500"
          >
            Add executive
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.target)
            router.get('/admin/users', { search: fd.get('search') || undefined, status: fd.get('status') || undefined }, { preserveState: true })
          }}
          className="flex flex-wrap gap-2 rounded-2xl border border-amber-200/70 bg-white/80 p-3 dark:border-stone-700 dark:bg-stone-900/70"
        >
          <input name="search" defaultValue={filters.search} placeholder="Search…" className="min-w-[200px] flex-1 rounded-xl border border-amber-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950" />
          <select name="status" defaultValue={filters.status} className="rounded-xl border border-amber-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <button type="submit" className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white dark:bg-amber-500 dark:text-stone-900">
            Filter
          </button>
        </form>

        <div className="overflow-x-auto rounded-2xl border border-amber-200/70 bg-white/90 shadow-sm dark:border-stone-700 dark:bg-stone-900/80">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-amber-100 text-left text-xs uppercase text-stone-500 dark:border-stone-700 dark:text-amber-200/70">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Packages</th>
                <th className="px-4 py-3">Blogs</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.data?.map((u) => (
                <tr key={u.id} className="border-b border-amber-50 dark:border-stone-800">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900 dark:text-amber-50">{u.name}</p>
                    <p className="text-xs text-stone-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-700 dark:text-amber-100/80">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge(u.status)}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{u.packages_count}</td>
                  <td className="px-4 py-3 tabular-nums">{u.blogs_count}</td>
                  <td className="px-4 py-3 text-xs text-stone-500">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="rounded-lg border border-amber-200 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-amber-50 dark:border-stone-600 dark:text-amber-100 dark:hover:bg-stone-800"
                      onClick={() =>
                        editForm.setData({
                          id: u.id,
                          name: u.name,
                          email: u.email,
                          phone: u.phone || '',
                          password: '',
                          status: u.status,
                        })
                      }
                    >
                      Edit
                    </button>
                    {u.role !== 'super_admin' ? (
                      <button
                        type="button"
                        className="ml-2 rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200"
                        onClick={() => {
                          if (window.confirm('Delete this user?')) router.delete(`/admin/users/${u.id}`)
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users?.links?.length ? (
          <div className="flex flex-wrap gap-2">
            {users.links.map((link, idx) => (
              <button
                key={`${link.url}-${idx}`}
                type="button"
                disabled={!link.url}
                onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                className={`rounded-lg border px-2.5 py-1 text-xs ${link.active ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/50' : 'border-amber-200 dark:border-stone-600'}`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        ) : null}

        {open ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/50 p-4 backdrop-blur-sm">
            <form onSubmit={submitCreate} className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-xl dark:border-stone-700 dark:bg-stone-900">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-amber-50">New executive</h3>
              <div className="mt-4 grid gap-3">
                <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Phone" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Password" type="password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-3 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={form.processing} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
                  Save
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {editForm.data.id ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/50 p-4 backdrop-blur-sm">
            <form onSubmit={submitEdit} className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-xl dark:border-stone-700 dark:bg-stone-900">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-amber-50">Edit user</h3>
              <div className="mt-4 grid gap-3">
                <input className="rounded-xl border px-3 py-2 text-sm" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                <input className="rounded-xl border px-3 py-2 text-sm" type="email" value={editForm.data.email} onChange={(e) => editForm.setData('email', e.target.value)} />
                <input className="rounded-xl border px-3 py-2 text-sm" value={editForm.data.phone} onChange={(e) => editForm.setData('phone', e.target.value)} />
                <input className="rounded-xl border px-3 py-2 text-sm" type="password" placeholder="New password (optional)" value={editForm.data.password} onChange={(e) => editForm.setData('password', e.target.value)} />
                <select className="rounded-xl border px-3 py-2 text-sm" value={editForm.data.status} onChange={(e) => editForm.setData('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => editForm.reset()} className="rounded-xl border px-3 py-2 text-sm">
                  Close
                </button>
                <button type="submit" disabled={editForm.processing} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
                  Update
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  )
}
