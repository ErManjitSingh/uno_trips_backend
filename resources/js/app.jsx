import '../css/app.css'
import './bootstrap'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'

// Inertia XHR kabhi-kabhi timeout/502 par reject hota hai — uncaught promise browser console spam karta hai.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const r = event.reason
    const name = r && typeof r === 'object' ? r.name : ''
    const msg = r && typeof r === 'object' && typeof r.message === 'string' ? r.message : String(r || '')
    if (name === 'HttpNetworkError' || msg.includes('Network error')) {
      event.preventDefault()
    }
  })
}

createInertiaApp({
  resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
