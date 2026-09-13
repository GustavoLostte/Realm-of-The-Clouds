/**
 * Universal Mobile Fullscreen & Orientation Lock Engine
 * STRICT: Fullscreen is EXCLUSIVELY for mobile devices (phones and tablets).
 * NEVER triggers or prompts on desktop or laptop computers.
 */

export function isMobileDevice() {
  if (typeof window === 'undefined') return false
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : ''
  const isMobileUa = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
  const isIPad = /iPad/i.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return isMobileUa || isIPad
}

export const isMobileOrTouch = isMobileDevice

export function isFullscreenActive() {
  if (typeof document === 'undefined') return false
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  )
}

export async function requestGameFullscreen(targetElement = null) {
  if (typeof document === 'undefined') return false
  // STRICT RULE: Fullscreen is strictly for mobile phones and tablets, NEVER for desktop / PC / laptops!
  if (!isMobileDevice()) return false

  const el = targetElement || document.documentElement

  try {
    if (!isFullscreenActive()) {
      if (el.requestFullscreen) {
        try {
          await el.requestFullscreen({ navigationUI: 'hide' })
        } catch (_) {
          // Fallback if browser doesn't accept navigationUI options
          await el.requestFullscreen()
        }
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen()
      } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen()
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen()
      }
    }
  } catch (err) {
    // Silently continue if browser policy requires different user activation
  }

  // Attempt to lock orientation to landscape on mobile devices
  try {
    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
      await window.screen.orientation.lock('landscape').catch(() => {
        return window.screen.orientation.lock('landscape-primary').catch(() => {})
      })
    }
  } catch (_) {}

  return isFullscreenActive()
}

export async function exitGameFullscreen() {
  if (typeof document === 'undefined') return
  try {
    if (isFullscreenActive()) {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    }
  } catch (_) {}
}

export async function toggleGameFullscreen() {
  // STRICT: Fullscreen is strictly for mobile devices only
  if (!isMobileDevice()) return

  if (isFullscreenActive()) {
    await exitGameFullscreen()
  } else {
    await requestGameFullscreen()
  }
}
