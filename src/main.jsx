import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

// Global suppression of native HTML5 image dragging and generic browser dialogs
if (typeof window !== 'undefined') {
  window.addEventListener(
    'dragstart',
    (e) => {
      e.preventDefault()
      return false
    },
    { capture: true }
  )

  // Block native browser dialogs across the game
  window.alert = (msg) => {
    console.warn('[Royal UI Shield] Native alert suppressed:', msg)
  }
  window.confirm = (msg) => {
    console.warn('[Royal UI Shield] Native confirm suppressed:', msg)
    return false
  }
  window.prompt = (msg) => {
    console.warn('[Royal UI Shield] Native prompt suppressed:', msg)
    return null
  }
}

import { LanguageProvider } from './i18n/index.jsx'
import { registerServiceWorker } from './pwa/registerServiceWorker'
import { analytics } from './utils/analytics'
import { initGlobalLinkInterceptor } from './utils/openExternalUrl'

// Initialize global link interceptor for external links (Tauri desktop & web)
initGlobalLinkInterceptor()

// Register Service Worker for PWA support and offline asset caching
registerServiceWorker()

// Initialize Google Analytics 4 for game metrics
analytics.init()

import React, { lazy, Suspense } from 'react'

const isTeaser = import.meta.env.VITE_APP_MODE === 'teaser'
const isWorkbenchMode = typeof window !== 'undefined' && (
  window.location.search.includes('workbench=true') ||
  window.location.search.includes('scale-lab') ||
  window.location.search.includes('scale=true') ||
  window.location.pathname.endsWith('/workbench') ||
  window.location.hash.includes('workbench')
)

const StandaloneWorkbench = isWorkbenchMode
  ? lazy(() => 
      import('./components/ChampionsScaleWorkbenchModal.jsx').then(m => ({ 
        default: (props) => <m.ChampionsScaleWorkbenchModal standalone={true} isOpen={true} {...props} /> 
      }))
    )
  : null

const ActiveApp = isTeaser
  ? lazy(() => import('./AppTeaser.jsx'))
  : lazy(() => import('./App.jsx'))

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <LanguageProvider>
      <Suspense fallback={<div style={{ background: '#090c10', width: '100vw', height: '100vh' }} />}>
        {isWorkbenchMode && StandaloneWorkbench ? <StandaloneWorkbench /> : <ActiveApp />}
      </Suspense>
    </LanguageProvider>
  </ErrorBoundary>,
)

