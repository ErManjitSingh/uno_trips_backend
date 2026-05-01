import { Head, router, useForm } from '@inertiajs/react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import AdminLayout from '../../../Layouts/AdminLayout'

const defaultForm = {
  id: null,
  country: '',
  state: '',
  district: '',
  districts_input: '',
  city: '',
  cities_input: '',
  district_city_map_input: '',
  slug: '',
  short_description: '',
  description: '',
  is_featured: false,
}

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

export default function DestinationsIndex({ destinations }) {
  const items = useMemo(() => destinations?.data || [], [destinations])
  const [activeMode, setActiveMode] = useState('create')
  const { data, setData, processing, errors, reset } = useForm(defaultForm)
  const isEdit = Boolean(data.id)

  const openCreateForm = () => {
    setActiveMode('create')
    reset()
    setData(defaultForm)
  }

  const openEditForm = (item) => {
    setActiveMode('edit')
    setData({
      id: item.id,
      country: item.country || '',
      state: item.state || '',
      district: item.district || '',
      districts_input: '',
      city: item.city || item.name || '',
      cities_input: '',
      district_city_map_input: '',
      slug: item.slug || '',
      short_description: item.short_description || '',
      description: item.description || '',
      is_featured: Boolean(item.is_featured),
    })
  }

  const onSave = (e) => {
    e.preventDefault()

    const firstBulkDistrict = String(data.districts_input || '')
      .split(/[\r\n,]+/)
      .map((item) => item.trim())
      .find(Boolean) || ''
    const cityName = String(data.city || '').trim()
    const firstBulkCity = String(data.cities_input || '')
      .split(/[\r\n,]+/)
      .map((item) => item.trim())
      .find(Boolean) || ''

    const districtName = String(data.district || '').trim() || firstBulkDistrict
    const slugSource = cityName || firstBulkCity || districtName
    const payload = {
      ...data,
      district: districtName,
      name: cityName || firstBulkCity || districtName,
      city: cityName,
      slug: data.slug || slugify(slugSource),
    }

    if (isEdit) {
      router.post(`/admin/destinations/${data.id}`, { ...payload, _method: 'put' }, { preserveScroll: true, onSuccess: openCreateForm })
      return
    }
    router.post('/admin/destinations', payload, { preserveScroll: true, onSuccess: openCreateForm })
  }

  const onDelete = (id) => {
    if (!window.confirm('Destination delete karna hai?')) return
    router.delete(`/admin/destinations/${id}`, { preserveScroll: true })
  }

  const [countriesCount, statesCount, districtsCount] = useMemo(() => {
    const countries = new Set(items.map((item) => item.country).filter(Boolean))
    const states = new Set(items.map((item) => `${item.country}-${item.state}`).filter(Boolean))
    const districts = new Set(items.map((item) => `${item.country}-${item.state}-${item.district}`).filter(Boolean))
    return [countries.size, states.size, districts.size]
  }, [items])

  return (
    <AdminLayout title="Destinations Management">
      <Head title="Destinations Management" />

      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-6 text-white shadow-2xl premium-hover">
          <div className="absolute -left-20 top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-12 right-8 h-36 w-36 rounded-full bg-cyan-200/25 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Destinations Management</h2>
              <p className="mt-2 max-w-2xl text-sm text-cyan-50 md:text-base">
                Country, State, District aur multiple City manage karo. Yehi hierarchy Add Package me select hogi.
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
            >
              <Plus className="h-4 w-4" />
              {isEdit ? 'New Destination' : 'Add Destination'}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{isEdit ? 'Edit Destination' : 'Add Destination'}</h3>
              <p className="text-xs text-slate-500">No modal. Country, state, district aur city yahi page par manage karo.</p>
            </div>
            {activeMode === 'edit' ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              Country *
              <input value={data.country} onChange={(e) => setData('country', e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring" />
            </label>
            <label className="text-sm text-slate-600">
              State *
              <input value={data.state} onChange={(e) => setData('state', e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring" />
            </label>
            <label className="text-sm text-slate-600">
              District *
              <input value={data.district} onChange={(e) => setData('district', e.target.value)} required={isEdit} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring" />
            </label>
            <label className="text-sm text-slate-600">
              City {isEdit ? '*' : '(single optional)'}
              <input value={data.city} onChange={(e) => setData('city', e.target.value)} required={isEdit} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring" />
            </label>
            {!isEdit ? (
              <label className="md:col-span-2 text-sm text-slate-600">
                District to Cities Mapping (recommended)
                <textarea value={data.district_city_map_input} onChange={(e) => setData('district_city_map_input', e.target.value)} rows={4} placeholder={'Jaipur District: Jaipur, Amer, Sanganer\nUdaipur District: Udaipur, Gogunda'} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs outline-none ring-blue-300 focus:ring" />
              </label>
            ) : null}
            {!isEdit ? (
              <label className="md:col-span-2 text-sm text-slate-600">
                Bulk Districts (comma/newline)
                <textarea value={data.districts_input} onChange={(e) => setData('districts_input', e.target.value)} rows={3} placeholder="Jaipur District, Udaipur District" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring" />
              </label>
            ) : null}
            {!isEdit ? (
              <label className="md:col-span-2 text-sm text-slate-600">
                Bulk Cities (comma/newline)
                <textarea value={data.cities_input} onChange={(e) => setData('cities_input', e.target.value)} rows={3} placeholder="Jaipur, Amer, Sanganer" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring" />
              </label>
            ) : null}
            <label className="text-sm text-slate-600">
              Slug
              <input value={data.slug} onChange={(e) => setData('slug', slugify(e.target.value))} placeholder="auto from city" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring" />
            </label>
            <label className="md:col-span-2 text-sm text-slate-600">
              Short Description
              <textarea value={data.short_description} onChange={(e) => setData('short_description', e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring" />
            </label>
            <label className="md:col-span-2 text-sm text-slate-600">
              Description
              <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-blue-300 focus:ring" />
            </label>
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <input type="checkbox" checked={data.is_featured} onChange={(e) => setData('is_featured', e.target.checked)} />
              Featured destination
            </label>
            <div className="md:col-span-2">{Object.keys(errors).length ? <p className="text-xs text-rose-600">{Object.values(errors)[0]}</p> : null}</div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button type="submit" disabled={processing} className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:opacity-90">
                {processing ? 'Saving...' : isEdit ? 'Update Destination' : 'Create Destination(s)'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white/85 p-4 shadow-xl backdrop-blur-xl md:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Destination Master List</h3>
              <p className="text-xs text-slate-500">Total: {destinations?.total || items.length} | Countries: {countriesCount} | States: {statesCount} | Districts: {districtsCount}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Country</th>
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2">District</th>
                  <th className="px-3 py-2">City</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Featured</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 text-slate-700">{item.country || '-'}</td>
                    <td className="px-3 py-3 text-slate-700">{item.state || '-'}</td>
                    <td className="px-3 py-3 text-slate-700">{item.district || '-'}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">{item.city || item.name || '-'}</td>
                    <td className="px-3 py-3 text-slate-500">{item.slug}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {item.is_featured ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditForm(item)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-blue-300 hover:text-blue-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => onDelete(item.id)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-rose-300 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length ? (
                  <tr><td className="px-3 py-8 text-center text-slate-500" colSpan={7}>No destinations yet.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

    </AdminLayout>
  )
}
