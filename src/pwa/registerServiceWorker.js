/**
 * PWA Service Worker Registration & Installation Manager
 * Handles Service Worker lifecycle, offline readiness, and native PWA install prompt.
 */

let deferredPrompt = null
const listeners = new Set()

function notifyListeners() {
  const state = {
    canInstall: !!deferredPrompt,
    isInstalled: isPWAInstalled(),
  }
  listeners.forEach((fn) => {
    try {
      fn(state)
    } catch (err) {
      console.error('[PWA] Listener error:', err)
    }
  })
}

/**
 * Checks if app is currently executing in standalone mode (installed PWA)
 */
export function isPWAInstalled() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/**
 * Checks if the browser has fired beforeinstallprompt and installation is available
 */
export function canInstallPWA() {
  return !!deferredPrompt
}

/**
 * Subscribes to changes in installation availability
 */
export function subscribePWAState(callback) {
  listeners.add(callback)
  // Immediate trigger with current state
  callback({
    canInstall: !!deferredPrompt,
    isInstalled: isPWAInstalled(),
  })
  return () => {
    listeners.delete(callback)
  }
}

/**
 * Triggers the native browser PWA installation dialog
 */
export async function promptPWAInstall() {
  if (!deferredPrompt) {
    console.warn('[PWA] No install prompt available')
    return { outcome: 'unavailable' }
  }

  try {
    deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice
    console.log(`[PWA] User response to install prompt: ${choiceResult.outcome}`)
    if (choiceResult.outcome === 'accepted') {
      deferredPrompt = null
      notifyListeners()
    }
    return choiceResult
  } catch (err) {
    console.error('[PWA] Install prompt failed:', err)
    return { outcome: 'error', error: err }
  }
}

/**
 * Registers the Service Worker in supported browsers
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  // During development on localhost, ensure service workers are unregistered and caches are cleared
  // so Vite's live ES module transforms and HMR are never intercepted or served from stale cache
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister()
        console.log('[PWA] Unregistered development service worker:', reg.scope)
      }
    })
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          if (name.startsWith('toc-foe-')) {
            caches.delete(name)
            console.log('[PWA] Cleared stale cache in dev:', name)
          }
        }
      })
    }
    return
  }

  // 1. Capture PWA install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar from appearing on mobile Chrome
    e.preventDefault()
    deferredPrompt = e
    console.log('[PWA] beforeinstallprompt event captured and ready')
    notifyListeners()
  })

  // 2. Capture appinstalled event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Application successfully installed')
    deferredPrompt = null
    notifyListeners()
  })

  // 3. Register Service Worker on window load
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope)

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (!installingWorker) return

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[PWA] New version of TOC FOE available! Reload to update.')
              } else {
                console.log('[PWA] Offline caching complete. Ready for offline play!')
              }
            }
          })
        })
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error)
      })
  })
}
