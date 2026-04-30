import { Head, router, useForm } from '@inertiajs/react'
import AdminLayout from '../../../Layouts/AdminLayout'

export default function LeadsIndex({ leads, staff, filters = {} }) {
  const { data, setData, post, processing, reset } = useForm({
    name: '',
    email: '',
    phone: '',
    source: 'website',
    status: 'new',
    message: '',
    assigned_to: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post('/admin/leads', { onSuccess: () => reset() })
  }

  return (
    <>
      <Head title="Leads CRM" />
      <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:grid-cols-4">
        <input
          defaultValue={filters.search || ''}
          onChange={(e) => router.get('/admin/leads', { ...filters, search: e.target.value || undefined }, { preserveState: true, replace: true })}
          className="rounded-lg border border-white/10 bg-transparent px-3 py-2"
          placeholder="Search lead"
        />
        <select
          value={filters.status || ''}
          onChange={(e) => router.get('/admin/leads', { ...filters, status: e.target.value || undefined }, { preserveState: true, replace: true })}
          className="rounded-lg border border-white/10 bg-transparent px-3 py-2"
        >
          <option value="">All Status</option><option value="new">New</option><option value="contacted">Contacted</option><option value="won">Won</option><option value="lost">Lost</option>
        </select>
        <select
          value={filters.source || ''}
          onChange={(e) => router.get('/admin/leads', { ...filters, source: e.target.value || undefined }, { preserveState: true, replace: true })}
          className="rounded-lg border border-white/10 bg-transparent px-3 py-2"
        >
          <option value="">All Source</option><option value="website">Website</option><option value="whatsapp">WhatsApp</option><option value="call_back">Call Back</option><option value="ads">Ads</option><option value="other">Other</option>
        </select>
        <a href={`/admin/leads-export?status=${filters.status || ''}&source=${filters.source || ''}`} className="grid place-items-center rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white">
          Export CSV
        </a>
      </div>
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5 md:grid-cols-3">
        <input className="rounded-lg border border-white/10 bg-transparent px-3 py-2" placeholder="Name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
        <input className="rounded-lg border border-white/10 bg-transparent px-3 py-2" placeholder="Email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
        <input className="rounded-lg border border-white/10 bg-transparent px-3 py-2" placeholder="Phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
        <select className="rounded-lg border border-white/10 bg-transparent px-3 py-2" value={data.source} onChange={(e) => setData('source', e.target.value)}>
          <option value="website">Website</option><option value="call_back">Call Back</option><option value="whatsapp">WhatsApp</option><option value="ads">Ads</option><option value="other">Other</option>
        </select>
        <select className="rounded-lg border border-white/10 bg-transparent px-3 py-2" value={data.assigned_to} onChange={(e) => setData('assigned_to', e.target.value)}>
          <option value="">Assign to staff</option>{staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
        <textarea className="rounded-lg border border-white/10 bg-transparent px-3 py-2 md:col-span-2" placeholder="Inquiry message" value={data.message} onChange={(e) => setData('message', e.target.value)} />
        <button disabled={processing} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium">Save Lead</button>
      </form>

      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <h3 className="mb-4 text-base font-semibold">Lead Pipeline</h3>
        <div className="mb-6 grid gap-3 md:grid-cols-4">
          {['new', 'contacted', 'won', 'lost'].map((status) => (
            <div key={status} className="rounded-xl border border-white/10 bg-slate-800/60 p-3">
              <p className="text-xs uppercase text-slate-400">{status}</p>
              <div className="mt-2 space-y-2">
                {leads.data.filter((lead) => lead.status === status).slice(0, 4).map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    className="w-full rounded-lg bg-slate-900 px-2 py-2 text-left text-xs"
                    onClick={() => {
                      const next = status === 'new' ? 'contacted' : status === 'contacted' ? 'won' : status
                      if (next === status) return
                      router.put(`/admin/leads/${lead.id}`, { status: next, assigned_to: lead.assigned_to || null })
                    }}
                  >
                    <p className="font-semibold text-slate-200">{lead.name}</p>
                    <p className="text-slate-400">{lead.source}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400"><th>Name</th><th>Source</th><th>Status</th><th>Assigned</th><th>Follow Up</th></tr></thead>
          <tbody>{leads.data.map((lead) => <tr key={lead.id} className="border-t border-white/10"><td className="py-2">{lead.name}</td><td>{lead.source}</td><td>{lead.status}</td><td>{lead.assignee?.name ?? '-'}</td><td>{lead.follow_up_at ?? '-'}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  )
}

LeadsIndex.layout = (page) => <AdminLayout title="Leads CRM">{page}</AdminLayout>
