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
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <LanguageProvider>
      <Suspense fallback={<div style={{ background: '#090c10', width: '100vw', height: '100vh' }} />}>
        <App />
      </Suspense>
    </LanguageProvider>
  </ErrorBoundary>,
)

