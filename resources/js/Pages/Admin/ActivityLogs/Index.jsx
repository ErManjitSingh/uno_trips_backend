import { Head } from '@inertiajs/react'
import AdminLayout from '../../../Layouts/AdminLayout'

export default function ActivityLogsIndex({ logs }) {
  return (
    <AdminLayout title="Activity Logs">
      <Head title="Activity Logs" />
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th>When</th><th>Action</th><th>Actor</th><th>Target</th>
            </tr>
          </thead>
          <tbody>
            {logs.data.map((log) => (
              <tr key={log.id} className="border-t border-white/10">
                <td className="py-2">{log.created_at}</td>
                <td>{log.action}</td>
                <td>{log.actor?.name || 'System'}</td>
                <td>{log.target_type || '-'} #{log.target_id || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
