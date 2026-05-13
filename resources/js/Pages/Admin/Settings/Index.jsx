import { Head, router, useForm, usePage } from '@inertiajs/react'
import {
  BadgeCheck,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  CircleHelp,
  Copy,
  Eye,
  EyeOff,
  Globe,
  ImagePlus,
  LayoutPanelTop,
  MapPin,
  MessageCircle,
  MousePointerClick,
  Palette,
  Phone,
  Send,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  Timer,
  Upload,
} from 'lucide-react'
import { Children, cloneElement, isValidElement, useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../../Layouts/AdminLayout'

import { imageTooLargeMessage } from '../../../lib/imageUploadLimits'

const inputBase =
  'w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'
const textAreaBase =
  'w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

function Field({ label, children, hint, error }) {
  const hydratePlaceholders = (node) => {
    if (!isValidElement(node)) return node

    const type = typeof node.type === 'string' ? node.type : ''
    const hasChildren = node.props?.children !== undefined
    const placeholderValue = String(node.props?.placeholder ?? '').trim()
    const shouldSetPlaceholder = (type === 'input' || type === 'textarea') && placeholderValue.length === 0

    const nextProps = {}

    if (hasChildren) {
      nextProps.children = Children.map(node.props.children, hydratePlaceholders)
    }

    if (shouldSetPlaceholder) {
      nextProps.placeholder = `Enter ${label}`
    }

    if (Object.keys(nextProps).length === 0) return node
    return cloneElement(node, nextProps)
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <div>{Children.map(children, hydratePlaceholders)}</div>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </label>
  )
}

function Card({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export default function SettingsIndex({ settings }) {
  const { url, props } = usePage()
  const isContactTab = url.includes('tab=contact')
  const isWhatsappTab = url.includes('tab=whatsapp')
  const isSmtpTab = url.includes('tab=smtp')
  const isGa4Tab = url.includes('tab=ga4')
  const isSeoTab = url.includes('tab=seo')
  const defaultHours = [
    { day: 'Monday', is_open: true, open: '09:00', close: '18:00' },
    { day: 'Tuesday', is_open: true, open: '09:00', close: '18:00' },
    { day: 'Wednesday', is_open: true, open: '09:00', close: '18:00' },
    { day: 'Thursday', is_open: true, open: '09:00', close: '18:00' },
    { day: 'Friday', is_open: true, open: '09:00', close: '18:00' },
    { day: 'Saturday', is_open: true, open: '10:00', close: '16:00' },
    { day: 'Sunday', is_open: false, open: '10:00', close: '16:00' },
  ]

  const resolveMedia = (path) => {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `/storage/${path}`
  }

  const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
    _method: 'put',
    site_name: settings.site_name ?? '',
    company_name: settings.company_name ?? '',
    tagline: settings.tagline ?? '',
    support_email: settings.support_email ?? '',
    sales_email: settings.sales_email ?? '',
    contact_email: settings.contact_email ?? '',
    primary_phone: settings.primary_phone ?? settings.contact_phone ?? '',
    secondary_phone: settings.secondary_phone ?? '',
    contact_phone: settings.contact_phone ?? '',
    whatsapp_number: settings.whatsapp_number ?? '',
    whatsapp_default_message: settings.whatsapp_default_message ?? 'Hi! I want to know more about your packages.',
    whatsapp_floating_enabled: settings.whatsapp_floating_enabled ?? true,
    whatsapp_button_position: settings.whatsapp_button_position ?? 'right',
    whatsapp_button_style: settings.whatsapp_button_style ?? 'rounded',
    whatsapp_auto_reply_message: settings.whatsapp_auto_reply_message ?? '',
    whatsapp_business_hours_auto_response: settings.whatsapp_business_hours_auto_response ?? false,
    whatsapp_agent_numbers: Array.isArray(settings.whatsapp_agent_numbers) && settings.whatsapp_agent_numbers.length
      ? settings.whatsapp_agent_numbers
      : [{ name: 'Primary Agent', number: settings.whatsapp_number ?? '' }],
    call_tracking_enabled: Boolean(settings.call_tracking_enabled),
    office_locations: Array.isArray(settings.office_locations) && settings.office_locations.length
      ? settings.office_locations
      : [{ address: '', city: '', map_link: '' }],
    working_hours: Array.isArray(settings.working_hours) && settings.working_hours.length
      ? settings.working_hours
      : defaultHours,
    footer_content: settings.footer_content ?? '',
    copyright_text: settings.copyright_text ?? '',
    facebook_url: settings.facebook_url ?? '',
    instagram_url: settings.instagram_url ?? '',
    youtube_url: settings.youtube_url ?? '',
    seo_meta_title: settings.seo_meta_title ?? '',
    seo_title_template: settings.seo_title_template ?? '{title} | Brand',
    seo_meta_description: settings.seo_meta_description ?? '',
    seo_keywords: settings.seo_keywords ?? '',
    seo_robots_index: settings.seo_robots_index ?? true,
    seo_canonical_base: settings.seo_canonical_base ?? '',
    seo_og_title: settings.seo_og_title ?? '',
    seo_og_description: settings.seo_og_description ?? '',
    seo_auto_slug_rules: settings.seo_auto_slug_rules ?? 'lowercase-hyphen',
    seo_schema_enabled: settings.seo_schema_enabled ?? true,
    google_analytics_code: settings.google_analytics_code ?? '',
    ga4_property_id: settings.ga4_property_id ?? '',
    ga4_service_account_email: settings.ga4_service_account_email ?? '',
    ga4_json_key_file: null,
    smtp_settings: {
      driver: settings.smtp_settings?.driver ?? 'smtp',
      host: settings.smtp_settings?.host ?? '',
      port: settings.smtp_settings?.port ?? '',
      username: settings.smtp_settings?.username ?? '',
      password: settings.smtp_settings?.password ?? '',
      encryption: settings.smtp_settings?.encryption ?? 'tls',
    },
    logo_file: null,
    favicon_file: null,
    seo_og_image_file: null,
  })
  const [toastOpen, setToastOpen] = useState(false)
  const [logoPreview, setLogoPreview] = useState(() => resolveMedia(settings.logo))
  const [faviconPreview, setFaviconPreview] = useState(() => resolveMedia(settings.favicon))
  const [ogPreview, setOgPreview] = useState(() => resolveMedia(settings.seo_og_image))
  const [callToast, setCallToast] = useState(false)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [testEmail, setTestEmail] = useState(settings.contact_email ?? '')
  const [showGa4Guide, setShowGa4Guide] = useState(true)
  const [ga4KeyName, setGa4KeyName] = useState(settings.ga4_json_key_path ? 'Existing key uploaded' : '')

  const submit = (e) => {
    e.preventDefault()
    post('/admin/settings', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => setToastOpen(true),
      onError: () => {},
    })
  }

  useEffect(() => {
    if (!recentlySuccessful) return
    const timer = setTimeout(() => setToastOpen(false), 2600)
    return () => clearTimeout(timer)
  }, [recentlySuccessful])

  const seoTitlePreview = data.seo_meta_title || data.seo_title_template.replace('{title}', 'Sample Page') || data.site_name || 'Website Title'
  const seoDescriptionPreview = data.seo_meta_description || data.tagline || 'Your default SEO description will appear here.'
  const facebookTitlePreview = data.seo_og_title || seoTitlePreview
  const facebookDescriptionPreview = data.seo_og_description || seoDescriptionPreview
  const whatsappTestUrl = useMemo(() => {
    const digits = (data.whatsapp_number || '').replace(/[^\d]/g, '')
    return digits ? `https://wa.me/${digits}` : null
  }, [data.whatsapp_number])
  const waChatUrl = useMemo(() => {
    const digits = (data.whatsapp_number || '').replace(/[^\d]/g, '')
    if (!digits) return ''
    const text = encodeURIComponent(data.whatsapp_default_message || '')
    return `https://wa.me/${digits}${text ? `?text=${text}` : ''}`
  }, [data.whatsapp_number, data.whatsapp_default_message])

  const handleFilePreview = (event, field, setter) => {
    const file = event.target.files?.[0]
    const imageFields = new Set(['logo_file', 'favicon_file', 'seo_og_image_file'])
    if (file && imageFields.has(field)) {
      const msg = imageTooLargeMessage(file, props?.max_upload_image_kb ?? 500)
      if (msg) {
        window.alert(msg)
        event.target.value = ''
        return
      }
    }
    setData(field, file || null)
    if (!file) return
    setter(URL.createObjectURL(file))
  }

  const updateLocation = (index, key, value) => {
    setData(
      'office_locations',
      data.office_locations.map((location, i) => (i === index ? { ...location, [key]: value } : location))
    )
  }

  const addLocation = () => {
    setData('office_locations', [...data.office_locations, { address: '', city: '', map_link: '' }])
  }

  const updateAgent = (index, key, value) => {
    setData(
      'whatsapp_agent_numbers',
      data.whatsapp_agent_numbers.map((agent, i) => (i === index ? { ...agent, [key]: value } : agent))
    )
  }

  const addAgent = () => {
    setData('whatsapp_agent_numbers', [...data.whatsapp_agent_numbers, { name: '', number: '' }])
  }

  const setSmtpField = (key, value) => {
    setData('smtp_settings', { ...data.smtp_settings, [key]: value })
  }

  const updateHours = (index, key, value) => {
    setData(
      'working_hours',
      data.working_hours.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    )
  }

  const copyToClipboard = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setToastOpen(true)
    } catch {
      // no-op for environments without clipboard permission
    }
  }

  const sendTestEmail = (e) => {
    e.preventDefault()
    router
      .post(
        '/admin/settings/test-email',
        {
          test_email: testEmail,
          smtp_settings: data.smtp_settings,
        },
        { preserveScroll: true },
      )
      .catch(() => {})
  }

  const sendGa4Test = (e) => {
    e.preventDefault()
    router
      .post(
        '/admin/settings/test-ga4',
        {
          ga4_property_id: data.ga4_property_id,
          ga4_service_account_email: data.ga4_service_account_email,
          ga4_json_key_file: data.ga4_json_key_file,
        },
        { preserveScroll: true, forceFormData: true },
      )
      .catch(() => {})
  }

  return (
    <>
      <Head title="Website Settings" />
      <div className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-indigo-50/70 to-cyan-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Website Control / {isSeoTab ? 'SEO Defaults' : isGa4Tab ? 'GA4 Analytics' : isSmtpTab ? 'SMTP / Email' : isWhatsappTab ? 'WhatsApp Settings' : isContactTab ? 'Contact Details' : 'General Settings'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {isSeoTab ? 'SEO Defaults Configuration' : isGa4Tab ? 'Google Analytics 4 Integration' : isSmtpTab ? 'Email Delivery Settings' : isContactTab ? 'Contact Details Management' : isWhatsappTab ? 'WhatsApp Conversion Settings' : 'Premium Configuration Panel'}
          </h1>
          <p className="text-sm text-slate-600">
            {isSeoTab
              ? 'Control global metadata, social previews, slug rules, and schema defaults like a pro SEO suite.'
              : isGa4Tab
              ? 'Connect GA4 securely and validate data flow with instant preview cards.'
              : isSmtpTab
              ? 'Configure SMTP credentials and verify connection with test email.'
              : isWhatsappTab
              ? 'Optimize click-to-chat, auto-replies, and floating CTA behavior for higher conversion.'
              : isContactTab
              ? 'Modern CRM-style contact settings with offices, working hours, and phone management.'
              : 'Manage branding, communication, SEO defaults, and tracking in one place.'}
          </p>
        </div>

        <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2">
          {isSeoTab ? (
            <>
              <Card icon={Search} title="Default SEO Rules" subtitle="Global template and crawler directives">
                <Field label="Default Title Template" hint="Use {title} placeholder">
                  <input className={inputBase} value={data.seo_title_template} onChange={(e) => setData('seo_title_template', e.target.value)} placeholder=" " />
                </Field>
                <Field label="Default Meta Description">
                  <textarea className={`${textAreaBase} min-h-24`} value={data.seo_meta_description} onChange={(e) => setData('seo_meta_description', e.target.value)} placeholder=" " />
                </Field>
                <Field label="Default Keywords" hint="Comma separated keywords">
                  <textarea className={`${textAreaBase} min-h-20`} value={data.seo_keywords} onChange={(e) => setData('seo_keywords', e.target.value)} placeholder=" " />
                </Field>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Robots Meta</p>
                    <p className="text-xs text-slate-500">{data.seo_robots_index ? 'index,follow' : 'noindex,nofollow'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setData('seo_robots_index', !data.seo_robots_index)}
                    className={`h-7 w-12 rounded-full transition ${data.seo_robots_index ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-white transition ${data.seo_robots_index ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
                <Field label="Canonical URL Base" error={errors.seo_canonical_base}>
                  <input className={inputBase} value={data.seo_canonical_base} onChange={(e) => setData('seo_canonical_base', e.target.value)} placeholder=" " />
                </Field>
              </Card>

              <Card icon={Globe} title="Social SEO" subtitle="Open Graph defaults for social sharing">
                <Field label="OG Title">
                  <input className={inputBase} value={data.seo_og_title} onChange={(e) => setData('seo_og_title', e.target.value)} placeholder=" " />
                </Field>
                <Field label="OG Description">
                  <textarea className={`${textAreaBase} min-h-24`} value={data.seo_og_description} onChange={(e) => setData('seo_og_description', e.target.value)} placeholder=" " />
                </Field>
                <Field label="OG Image Upload">
                  <div className="rounded-2xl border border-dashed border-slate-300 p-3">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="grid h-16 w-24 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        {ogPreview ? <img src={ogPreview} alt="OG preview" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-slate-400" />}
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        <Upload className="h-4 w-4" /> Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFilePreview(e, 'seo_og_image_file', setOgPreview)} />
                      </label>
                    </div>
                  </div>
                </Field>
              </Card>

              <Card icon={CheckCircle2} title="Preview" subtitle="Search and social snippets">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-500">Google Search Preview</p>
                  <p className="mt-2 text-lg text-blue-700">{seoTitlePreview}</p>
                  <p className="text-xs text-emerald-700">{data.seo_canonical_base || 'https://example.com'}/sample-page</p>
                  <p className="mt-1 text-sm text-slate-600">{seoDescriptionPreview.slice(0, 160)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-500">Facebook Share Preview</p>
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                    <div className="h-24 bg-slate-100">{ogPreview ? <img src={ogPreview} alt="OG visual" className="h-full w-full object-cover" /> : null}</div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-slate-900">{facebookTitlePreview}</p>
                      <p className="mt-1 text-xs text-slate-600">{facebookDescriptionPreview.slice(0, 120)}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card icon={CircleHelp} title="Bonus SEO Automation" subtitle="Slug behavior and schema defaults">
                <Field label="Auto Slug Rules">
                  <select className={inputBase} value={data.seo_auto_slug_rules} onChange={(e) => setData('seo_auto_slug_rules', e.target.value)}>
                    <option value="lowercase-hyphen">lowercase-hyphen</option>
                    <option value="keep-case-hyphen">keep-case-hyphen</option>
                    <option value="lowercase-underscore">lowercase_underscore</option>
                  </select>
                </Field>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Schema Enabled</p>
                    <p className="text-xs text-slate-500">Inject default structured data blocks</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setData('seo_schema_enabled', !data.seo_schema_enabled)}
                    className={`h-7 w-12 rounded-full transition ${data.seo_schema_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-white transition ${data.seo_schema_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
              </Card>
            </>
          ) : isGa4Tab ? (
            <>
              <Card icon={BarChart3} title="GA4 Credentials" subtitle="Secure analytics data access">
                <Field label="GA4 Property ID" error={errors.ga4_property_id}>
                  <input className={inputBase} value={data.ga4_property_id} onChange={(e) => setData('ga4_property_id', e.target.value)} placeholder=" " />
                </Field>
                <Field label="Service Account Email" error={errors.ga4_service_account_email}>
                  <input className={inputBase} value={data.ga4_service_account_email} onChange={(e) => setData('ga4_service_account_email', e.target.value)} placeholder=" " />
                </Field>
                <Field label="JSON Key Upload (drag-drop)" error={errors.ga4_json_key_file}>
                  <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                    <input
                      type="file"
                      accept=".json,application/json,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setData('ga4_json_key_file', file)
                        setGa4KeyName(file?.name || '')
                      }}
                    />
                    <p className="text-sm font-medium text-slate-700">{ga4KeyName || 'Drop or select service account JSON key'}</p>
                    <p className="mt-1 text-xs text-slate-500">Use Google service account key with Analytics Data API access</p>
                  </label>
                </Field>
                <button type="button" onClick={sendGa4Test} className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                  <MousePointerClick className="h-4 w-4" />
                  Test Connection
                </button>
                <div
                  className={`rounded-2xl border px-3 py-2 text-sm ${
                    props.flash?.ga4_test_status === 'connected'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : props.flash?.ga4_test_status === 'failed'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  Connection Status:{' '}
                  <span className="font-semibold">
                    {props.flash?.ga4_test_status === 'connected'
                      ? 'Connected'
                      : props.flash?.ga4_test_status === 'failed'
                      ? 'Error'
                      : 'Not tested'}
                  </span>
                  <p className="mt-1 text-xs">{props.flash?.ga4_test_message || 'Run connection test to verify analytics access.'}</p>
                </div>
              </Card>

              <Card icon={CircleHelp} title="Setup Guide" subtitle="Step-by-step integration (collapsible)">
                <button
                  type="button"
                  onClick={() => setShowGa4Guide((v) => !v)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-slate-800">GA4 Setup Steps</span>
                  {showGa4Guide ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </button>
                {showGa4Guide ? (
                  <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
                    <li>Create a service account in Google Cloud Console.</li>
                    <li>Enable Analytics Data API for your project.</li>
                    <li>Grant Viewer access to this service account in GA4 property.</li>
                    <li>Download JSON key and upload it here.</li>
                    <li>Enter Property ID and click Test Connection.</li>
                  </ol>
                ) : null}
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  Error tip: Ensure property ID format is numeric and service account email has access.
                </div>
              </Card>

              <Card icon={CheckCircle2} title="Dashboard Preview" subtitle="Mini analytics snapshot">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Visitors</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{settings.ga4_last_snapshot?.visitors ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Page Views</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{settings.ga4_last_snapshot?.page_views ?? 0}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Top Pages</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {(settings.ga4_last_snapshot?.top_pages || []).length ? (
                      settings.ga4_last_snapshot.top_pages.map((item, idx) => (
                        <li key={`top-page-${idx}`} className="flex items-center justify-between">
                          <span className="truncate">{item.path}</span>
                          <span className="font-semibold">{item.views}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500">No data yet. Run test connection.</li>
                    )}
                  </ul>
                </div>
              </Card>
            </>
          ) : isSmtpTab ? (
            <>
              <Card icon={ShieldEllipsis} title="SMTP Configuration" subtitle="Secure and reliable email delivery">
                <Field label="Mail Driver" error={errors['smtp_settings.driver']}>
                  <select className={inputBase} value={data.smtp_settings.driver} onChange={(e) => setSmtpField('driver', e.target.value)}>
                    <option value="smtp">SMTP</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="gmail">Gmail</option>
                  </select>
                </Field>
                <div className="grid gap-2 md:grid-cols-2">
                  <Field label="SMTP Host" error={errors['smtp_settings.host']}>
                    <input className={inputBase} value={data.smtp_settings.host} onChange={(e) => setSmtpField('host', e.target.value)} placeholder=" " />
                  </Field>
                  <Field label="SMTP Port" error={errors['smtp_settings.port']}>
                    <input className={inputBase} value={data.smtp_settings.port} onChange={(e) => setSmtpField('port', e.target.value)} placeholder=" " />
                  </Field>
                </div>
                <Field label="Username" error={errors['smtp_settings.username']}>
                  <input className={inputBase} value={data.smtp_settings.username} onChange={(e) => setSmtpField('username', e.target.value)} placeholder=" " />
                </Field>
                <Field label="Password" error={errors['smtp_settings.password']}>
                  <div className="flex gap-2">
                    <input
                      type={showSmtpPassword ? 'text' : 'password'}
                      className={`${inputBase} flex-1`}
                      value={data.smtp_settings.password}
                      onChange={(e) => setSmtpField('password', e.target.value)}
                      placeholder=" "
                    />
                    <button type="button" onClick={() => setShowSmtpPassword((v) => !v)} className="rounded-2xl border border-slate-200 px-3 text-slate-600">
                      {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Encryption" error={errors['smtp_settings.encryption']}>
                  <select className={inputBase} value={data.smtp_settings.encryption} onChange={(e) => setSmtpField('encryption', e.target.value)}>
                    <option value="ssl">SSL</option>
                    <option value="tls">TLS</option>
                  </select>
                </Field>
              </Card>

              <Card icon={Send} title="Connection Test" subtitle="Send a real test email instantly">
                <Field label="Test Recipient Email" error={errors.test_email}>
                  <input className={inputBase} value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder=" " />
                </Field>
                <button type="button" onClick={sendTestEmail} className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                  <Send className="h-4 w-4" />
                  Send Test Email
                </button>
                <div
                  className={`rounded-2xl border px-3 py-2 text-sm ${
                    props.flash?.smtp_test_status === 'connected'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : props.flash?.smtp_test_status === 'failed'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  Status:{' '}
                  <span className="font-semibold">
                    {props.flash?.smtp_test_status === 'connected'
                      ? 'Connected'
                      : props.flash?.smtp_test_status === 'failed'
                      ? 'Failed'
                      : 'Not tested'}
                  </span>
                  <p className="mt-1 text-xs">{props.flash?.smtp_test_message || 'Run test after entering SMTP credentials.'}</p>
                </div>
              </Card>
            </>
          ) : isWhatsappTab ? (
            <>
              <Card icon={MessageCircle} title="WhatsApp Core" subtitle="Primary conversion controls">
                <Field label="WhatsApp Number (with country code)">
                  <input className={inputBase} value={data.whatsapp_number} onChange={(e) => setData('whatsapp_number', e.target.value)} placeholder=" " />
                </Field>
                <Field label="Default Message">
                  <textarea className={`${textAreaBase} min-h-24`} value={data.whatsapp_default_message} onChange={(e) => setData('whatsapp_default_message', e.target.value)} placeholder=" " />
                </Field>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Enable Floating Button</p>
                    <p className="text-xs text-slate-500">Show sticky click-to-chat CTA on site.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setData('whatsapp_floating_enabled', !data.whatsapp_floating_enabled)}
                    className={`h-7 w-12 rounded-full transition ${data.whatsapp_floating_enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-white transition ${data.whatsapp_floating_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
                <div className="grid gap-2 md:grid-cols-2">
                  <Field label="Button Position">
                    <select className={inputBase} value={data.whatsapp_button_position} onChange={(e) => setData('whatsapp_button_position', e.target.value)}>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </Field>
                  <Field label="Button Style">
                    <select className={inputBase} value={data.whatsapp_button_style} onChange={(e) => setData('whatsapp_button_style', e.target.value)}>
                      <option value="rounded">Rounded</option>
                      <option value="square">Square</option>
                    </select>
                  </Field>
                </div>
              </Card>

              <Card icon={CircleHelp} title="Advanced Automation" subtitle="Future-ready response setup">
                <Field label="Auto-reply Message">
                  <textarea className={`${textAreaBase} min-h-24`} value={data.whatsapp_auto_reply_message} onChange={(e) => setData('whatsapp_auto_reply_message', e.target.value)} placeholder=" " />
                </Field>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Business Hours Auto-response</p>
                    <p className="text-xs text-slate-500">Send auto message when team is offline.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setData('whatsapp_business_hours_auto_response', !data.whatsapp_business_hours_auto_response)}
                    className={`h-7 w-12 rounded-full transition ${data.whatsapp_business_hours_auto_response ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-white transition ${data.whatsapp_business_hours_auto_response ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Multiple Agent Numbers</p>
                  {data.whatsapp_agent_numbers.map((agent, idx) => (
                    <div key={`agent-${idx}`} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
                      <input className={inputBase} value={agent.name || ''} onChange={(e) => updateAgent(idx, 'name', e.target.value)} placeholder="Agent name" />
                      <input className={inputBase} value={agent.number || ''} onChange={(e) => updateAgent(idx, 'number', e.target.value)} placeholder="Agent number" />
                    </div>
                  ))}
                  <button type="button" onClick={addAgent} className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                    Add Agent Number
                  </button>
                </div>
              </Card>

              <Card icon={CheckCircle2} title="Live Preview & URL Generator" subtitle="Interactive conversion preview">
                <div className="relative h-56 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 p-4">
                  <p className="text-xs text-slate-500">Floating Button Preview</p>
                  {data.whatsapp_floating_enabled ? (
                    <button
                      type="button"
                      className={`absolute bottom-4 ${data.whatsapp_button_position === 'left' ? 'left-4' : 'right-4'} inline-flex items-center gap-2 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg ${
                        data.whatsapp_button_style === 'rounded' ? 'rounded-full' : 'rounded-lg'
                      }`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat on WhatsApp
                    </button>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">Floating button is disabled.</p>
                  )}
                </div>
                <Field label="Click-to-chat URL">
                  <div className="flex gap-2">
                    <input className={`${inputBase} flex-1`} value={waChatUrl} readOnly placeholder="Generated URL" />
                    <button type="button" onClick={() => copyToClipboard(waChatUrl)} className="rounded-2xl border border-slate-200 px-3 text-slate-600">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </Field>
                <a
                  href={waChatUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex w-fit items-center rounded-xl px-4 py-2 text-sm font-semibold ${
                    waChatUrl ? 'bg-emerald-600 text-white' : 'cursor-not-allowed bg-slate-200 text-slate-500'
                  }`}
                >
                  Test Click-to-chat
                </a>
              </Card>
            </>
          ) : isContactTab ? (
            <>
              <Card icon={Building2} title="Business Info" subtitle="Public identity and inboxes">
                <Field label="Company Name">
                  <div className="flex gap-2">
                    <input className={`${inputBase} flex-1`} value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} placeholder=" " />
                    <button type="button" onClick={() => copyToClipboard(data.company_name)} className="rounded-2xl border border-slate-200 px-3 text-slate-600"><Copy className="h-4 w-4" /></button>
                  </div>
                </Field>
                <Field label="Support Email">
                  <div className="flex gap-2">
                    <input className={`${inputBase} flex-1`} type="email" value={data.support_email} onChange={(e) => setData('support_email', e.target.value)} placeholder=" " />
                    <button type="button" onClick={() => copyToClipboard(data.support_email)} className="rounded-2xl border border-slate-200 px-3 text-slate-600"><Copy className="h-4 w-4" /></button>
                  </div>
                </Field>
                <Field label="Sales Email">
                  <div className="flex gap-2">
                    <input className={`${inputBase} flex-1`} type="email" value={data.sales_email} onChange={(e) => setData('sales_email', e.target.value)} placeholder=" " />
                    <button type="button" onClick={() => copyToClipboard(data.sales_email)} className="rounded-2xl border border-slate-200 px-3 text-slate-600"><Copy className="h-4 w-4" /></button>
                  </div>
                </Field>
              </Card>

              <Card icon={Phone} title="Phone System" subtitle="Calling and tracking controls">
                <Field label="Primary Phone">
                  <div className="flex gap-2">
                    <input className={`${inputBase} flex-1`} value={data.primary_phone} onChange={(e) => setData('primary_phone', e.target.value)} placeholder=" " />
                    <button type="button" onClick={() => copyToClipboard(data.primary_phone)} className="rounded-2xl border border-slate-200 px-3 text-slate-600"><Copy className="h-4 w-4" /></button>
                  </div>
                </Field>
                <Field label="Secondary Phone">
                  <div className="flex gap-2">
                    <input className={`${inputBase} flex-1`} value={data.secondary_phone} onChange={(e) => setData('secondary_phone', e.target.value)} placeholder=" " />
                    <button type="button" onClick={() => copyToClipboard(data.secondary_phone)} className="rounded-2xl border border-slate-200 px-3 text-slate-600"><Copy className="h-4 w-4" /></button>
                  </div>
                </Field>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Call Tracking</p>
                    <p className="text-xs text-slate-500">Enable inbound call attribution.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setData('call_tracking_enabled', !data.call_tracking_enabled)}
                    className={`h-7 w-12 rounded-full transition ${data.call_tracking_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-white transition ${data.call_tracking_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCallToast(true)
                    setTimeout(() => setCallToast(false), 1800)
                  }}
                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Test Call Button
                </button>
              </Card>

              <Card icon={MapPin} title="Office Locations" subtitle="Repeatable location cards">
                <div className="space-y-3">
                  {data.office_locations.map((location, index) => (
                    <div key={`location-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Address">
                          <input className={inputBase} value={location.address || ''} onChange={(e) => updateLocation(index, 'address', e.target.value)} placeholder=" " />
                        </Field>
                        <Field label="City">
                          <input className={inputBase} value={location.city || ''} onChange={(e) => updateLocation(index, 'city', e.target.value)} placeholder=" " />
                        </Field>
                        <div className="md:col-span-2">
                          <Field label="Google Map Embed Link">
                            <input className={inputBase} value={location.map_link || ''} onChange={(e) => updateLocation(index, 'map_link', e.target.value)} placeholder=" " />
                          </Field>
                        </div>
                      </div>
                      {location.map_link ? (
                        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                          <iframe title={`map-preview-${index}`} src={location.map_link} className="h-44 w-full" loading="lazy" />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addLocation} className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                  Add New Location
                </button>
              </Card>

              <Card icon={Timer} title="Working Hours" subtitle="Day-wise availability">
                <div className="space-y-2">
                  {data.working_hours.map((row, index) => (
                    <div key={row.day || index} className="grid items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
                      <p className="text-sm font-medium text-slate-800">{row.day}</p>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" checked={Boolean(row.is_open)} onChange={(e) => updateHours(index, 'is_open', e.target.checked)} />
                        {row.is_open ? 'Open' : 'Closed'}
                      </label>
                      <input type="time" className={inputBase} value={row.open || '09:00'} onChange={(e) => updateHours(index, 'open', e.target.value)} disabled={!row.is_open} />
                      <input type="time" className={inputBase} value={row.close || '18:00'} onChange={(e) => updateHours(index, 'close', e.target.value)} disabled={!row.is_open} />
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <>
          <Card icon={Palette} title="Brand Identity" subtitle="Core visual identity">
            <Field label="Website Name">
              <input className={inputBase} value={data.site_name} onChange={(e) => setData('site_name', e.target.value)} placeholder=" " />
            </Field>
            <Field label="Tagline">
              <input className={inputBase} value={data.tagline} onChange={(e) => setData('tagline', e.target.value)} placeholder=" " />
            </Field>
            <Field label="Logo Upload" hint="PNG/JPG up to 2MB">
              <div className="rounded-2xl border border-dashed border-slate-300 p-3">
                <div className="mb-2 flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {logoPreview ? <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-slate-400" />}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <Upload className="h-4 w-4" /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFilePreview(e, 'logo_file', setLogoPreview)} />
                  </label>
                </div>
              </div>
            </Field>
            <Field label="Favicon Upload" hint="Square image works best">
              <div className="rounded-2xl border border-dashed border-slate-300 p-3">
                <div className="mb-2 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {faviconPreview ? <img src={faviconPreview} alt="Favicon preview" className="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4 text-slate-400" />}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <Upload className="h-4 w-4" /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFilePreview(e, 'favicon_file', setFaviconPreview)} />
                  </label>
                </div>
              </div>
            </Field>
          </Card>

          <Card icon={Phone} title="Contact Basics" subtitle="Primary support channels">
            <Field label="Phone Number">
              <input className={inputBase} value={data.contact_phone} onChange={(e) => setData('contact_phone', e.target.value)} placeholder=" " />
            </Field>
            <Field label="WhatsApp Number">
              <div className="flex gap-2">
                <input className={`${inputBase} flex-1`} value={data.whatsapp_number} onChange={(e) => setData('whatsapp_number', e.target.value)} placeholder=" " />
                <a
                  href={whatsappTestUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center rounded-2xl px-3 text-sm ${whatsappTestUrl ? 'bg-emerald-600 text-white' : 'cursor-not-allowed bg-slate-200 text-slate-500'}`}
                >
                  Test
                </a>
              </div>
            </Field>
            <Field label="Email Address">
              <input className={inputBase} type="email" value={data.contact_email} onChange={(e) => setData('contact_email', e.target.value)} placeholder=" " />
            </Field>
          </Card>

          <Card icon={Globe} title="Social Links" subtitle="Public brand channels">
            <Field label="Facebook URL">
              <input className={inputBase} value={data.facebook_url} onChange={(e) => setData('facebook_url', e.target.value)} placeholder=" " />
            </Field>
            <Field label="Instagram URL">
              <input className={inputBase} value={data.instagram_url} onChange={(e) => setData('instagram_url', e.target.value)} placeholder=" " />
            </Field>
            <Field label="YouTube URL">
              <input className={inputBase} value={data.youtube_url} onChange={(e) => setData('youtube_url', e.target.value)} placeholder=" " />
            </Field>
          </Card>

          <Card icon={Search} title="SEO Defaults" subtitle="Global metadata baseline">
            <Field label="Default SEO Title">
              <input className={inputBase} value={data.seo_meta_title} onChange={(e) => setData('seo_meta_title', e.target.value)} placeholder=" " />
            </Field>
            <Field label="Default Meta Description">
              <textarea className={`${textAreaBase} min-h-24`} value={data.seo_meta_description} onChange={(e) => setData('seo_meta_description', e.target.value)} placeholder=" " />
            </Field>
            <Field label="Default OG Image Upload">
              <div className="rounded-2xl border border-dashed border-slate-300 p-3">
                <div className="mb-2 flex items-center gap-3">
                  <div className="grid h-16 w-24 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {ogPreview ? <img src={ogPreview} alt="OG preview" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-slate-400" />}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <Upload className="h-4 w-4" /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFilePreview(e, 'seo_og_image_file', setOgPreview)} />
                  </label>
                </div>
              </div>
            </Field>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">SEO Preview</p>
              <p className="mt-2 text-base font-semibold text-indigo-700">{seoTitlePreview}</p>
              <p className="mt-1 text-sm text-slate-600">{seoDescriptionPreview.slice(0, 155)}</p>
            </div>
          </Card>

          <Card icon={LayoutPanelTop} title="Footer Settings" subtitle="Bottom-of-site content">
            <Field label="Footer Content (Rich Text)">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex gap-2">
                  <button type="button" onClick={() => document.execCommand('bold')} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Bold</button>
                  <button type="button" onClick={() => document.execCommand('italic')} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Italic</button>
                  <button type="button" onClick={() => document.execCommand('insertUnorderedList')} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">List</button>
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setData('footer_content', e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: data.footer_content || '' }}
                  className="min-h-24 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 outline-none"
                />
              </div>
            </Field>
            <Field label="Copyright Text">
              <input className={inputBase} value={data.copyright_text} onChange={(e) => setData('copyright_text', e.target.value)} placeholder=" " />
            </Field>
          </Card>

          <Card icon={BarChart3} title="Tracking" subtitle="Analytics scripts and snippets">
            <Field label="GA4 Code">
              <textarea className={`${textAreaBase} min-h-40 font-mono`} value={data.google_analytics_code} onChange={(e) => setData('google_analytics_code', e.target.value)} placeholder=" " />
            </Field>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700">
              Keep only trusted analytics snippets. Scripts are injected site-wide.
            </div>
          </Card>
            </>
          )}
        </form>

        {(toastOpen || recentlySuccessful) && (
          <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-lg">
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-slate-700">Settings saved successfully.</span>
          </div>
        )}
        {callToast && (
          <div className="fixed right-6 top-20 z-50 rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-sm text-indigo-700 shadow-lg">
            Test call triggered (UI only).
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {Object.values(errors)[0]}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={processing}
          className="fixed bottom-6 right-6 z-40 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(79,70,229,0.35)] transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {processing ? 'Saving...' : 'Save Settings'}
          </span>
        </button>
      </div>
    </>
  )
}

SettingsIndex.layout = (page) => <AdminLayout title="Website Settings">{page}</AdminLayout>
