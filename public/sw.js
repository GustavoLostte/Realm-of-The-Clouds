/**
 * Service Worker: Throne of Chaos - Forge of Empire (TOC FOE)
 * High-performance PWA caching engine for fast loads and offline gameplay.
 */

const CACHE_VERSION = 'v1.0.2'
const CACHE_STATIC = `toc-foe-static-${CACHE_VERSION}`
const CACHE_ASSETS = `toc-foe-assets-${CACHE_VERSION}`
const CACHE_FONTS = `toc-foe-fonts-${CACHE_VERSION}`

const PRECACHE_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-180.png',
  '/assets/logo/logo.webp',
  '/assets/click_sound.ogg',
]

// 1. Install Phase: Precaching shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_STATIC)
      .then(async (cache) => {
        // Resilient precache: add each item catching potential 404s during initial dev
        for (const url of PRECACHE_SHELL) {
          try {
            await cache.add(url)
          } catch (err) {
            console.warn(`[SW] Precache item failed (${url}):`, err.message)
          }
        }
      })
      .then(() => self.skipWaiting())
  )
})

// 2. Activate Phase: Purge legacy caches and take control
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_STATIC, CACHE_ASSETS, CACHE_FONTS]
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name.startsWith('toc-foe-') && !currentCaches.includes(name)) {
              console.log(`[SW] Removing outdated cache: ${name}`)
              return caches.delete(name)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// 3. Fetch Phase: Multi-tiered caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request

  // Only handle GET requests
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // A. Bypass Supabase API / Auth calls & external mutations
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/')
  ) {
    return
  }

  // B. Bypass Vite Dev Server HMR, live reloading, localhost & /src/ files
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@fs') ||
    url.pathname.startsWith('/@id') ||
    url.pathname.includes('node_modules') ||
    url.search.includes('t=')
  ) {
    return
  }

  // C. Bypass streaming video files (.mp4, .webm) and HTTP Range requests
  // Browsers (especially Safari iOS and Chrome Mobile) stall or freeze for 3-5s
  // when Service Workers intercept video streaming or Range requests without full 206 support.
  if (
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.webm') ||
    request.headers.get('range')
  ) {
    return
  }

  // D. Strategy: Navigation Requests (HTML) -> Network-First with Offline Shell Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, responseClone))
          }
          return networkResponse
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request)
          if (cachedResponse) return cachedResponse
          return (await caches.match('/index.html')) || (await caches.match('/'))
        })
    )
    return
  }

  // D. Strategy: Google Fonts -> Stale-While-Revalidate
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_FONTS).then(async (cache) => {
        const cachedResponse = await cache.match(request)
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          })
          .catch(() => cachedResponse)

        return cachedResponse || fetchPromise
      })
    )
    return
  }

  // E. Strategy: Game Assets & Media (WebP, PNG, SVG, Audio, Atlases) -> Cache-First
  const isAsset =
    !url.pathname.startsWith('/src/') &&
    (
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ogg') ||
      url.pathname.endsWith('.mp3') ||
      (url.pathname.startsWith('/assets/') && (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')))
    )

  if (isAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse
            }
            const responseClone = networkResponse.clone()
            caches.open(CACHE_ASSETS).then((cache) => {
              cache.put(request, responseClone)
            })
            return networkResponse
          })
          .catch((err) => {
            console.warn(`[SW] Failed to fetch asset (${request.url}):`, err.message)
            // Return empty response or null if offline and not in cache
            return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' })
          })
      })
    )
    return
  }

  // F. Default fallback: Network with cache fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone()
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone))
          }
          return networkResponse
        })
      )
    })
  )
})

// 4. Message Phase: Client Communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
