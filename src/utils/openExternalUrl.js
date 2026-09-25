/**
 * Utility to reliably open external URLs across all platforms:
 * - Tauri Desktop App (macOS, Windows, Linux) via @tauri-apps/plugin-opener
 * - Web Browser (Chrome, Safari, Firefox, Edge) via window.open
 * - PWA / Mobile Webviews
 */

export const isTauriEnvironment = () => {
  return typeof window !== 'undefined' && Boolean(
    window.__TAURI_INTERNALS__ || window.__TAURI__
  )
}

export const openExternalUrl = async (url, event) => {
  if (event) {
    if (typeof event.preventDefault === 'function') event.preventDefault()
    if (typeof event.stopPropagation === 'function') event.stopPropagation()
  }

  if (!url) return

  // 1. If running inside Tauri desktop app, use official Tauri Opener plugin
  if (isTauriEnvironment()) {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener')
      await openUrl(url)
      return
    } catch (err) {
      console.warn('[openExternalUrl] Tauri opener failed, falling back to window.open:', err)
    }
  }

  // 2. Standard Web / PWA environment
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Pop-up blocker might have blocked it, try direct navigation
      window.location.assign(url)
    }
  } catch (err) {
    console.error('[openExternalUrl] Failed to open external URL:', err)
    try {
      window.location.href = url
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Initializes a global listener to intercept <a target="_blank"> clicks
 * in Tauri desktop environments, ensuring all external links open in the
 * system's default browser (Safari, Chrome, etc.).
 */
export const initGlobalLinkInterceptor = () => {
  if (typeof window === 'undefined') return

  document.addEventListener('click', (e) => {
    // Find closest anchor tag
    const anchor = e.target.closest ? e.target.closest('a') : null
    if (!anchor) return

    const href = anchor.getAttribute('href')
    const target = anchor.getAttribute('target')

    // If it's an external link or target="_blank"
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      if (isTauriEnvironment() || target === '_blank') {
        e.preventDefault()
        e.stopPropagation()
        openExternalUrl(href)
      }
    }
  }, { capture: true })
}
