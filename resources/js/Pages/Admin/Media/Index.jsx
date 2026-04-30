import { Head, router, useForm } from '@inertiajs/react'
import AdminLayout from '../../../Layouts/AdminLayout'

export default function MediaIndex({ assets, folder }) {
  const { data, setData, post, processing, reset } = useForm({
    folder: folder || 'general',
    asset: null,
    alt_text: '',
  })

  return (
    <AdminLayout title="Media Library">
      <Head title="Media Library" />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          post('/admin/media-library', { forceFormData: true, onSuccess: () => reset('asset', 'alt_text') })
        }}
        className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5 md:grid-cols-4"
      >
        <input className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm" value={data.folder} onChange={(e) => setData('folder', e.target.value)} placeholder="Folder name" />
        <input type="file" accept="image/*" className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm" onChange={(e) => setData('asset', e.target.files[0])} />
        <input className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm" value={data.alt_text} onChange={(e) => setData('alt_text', e.target.value)} placeholder="Alt text" />
        <button disabled={processing} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium">Upload</button>
      </form>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {assets.data.map((item) => (
          <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <img src={`/storage/${item.file_path}`} alt={item.alt_text || item.file_name} className="h-36 w-full rounded-xl object-cover" loading="lazy" />
            <p className="mt-2 truncate text-xs text-slate-300">{item.file_name}</p>
            <button onClick={() => router.delete(`/admin/media-library/${item.id}`)} className="mt-2 rounded-md bg-rose-500 px-2.5 py-1 text-xs text-white">Delete</button>
          </article>
        ))}
      </div>
    </AdminLayout>
  )
}
