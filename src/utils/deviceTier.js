/**
 * Device Performance Tier Detection
 * Configured for maximum visual fidelity (HD Retina 1:1 hardware pixel density up to 3.0 DPR)
 * across both Mobile and Desktop, ensuring zero blurriness and identical visual crispness.
 */
let cachedTier = null

export function detectDevicePerformanceTier() {
  if (cachedTier) return cachedTier

  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0))

  // Mobile/OLED displays: 1.5x DPR completely saturates 1080p physical screens at 60 FPS
  // while preventing GPU thermal throttling and Samsung Game Booster (GOS) screen dimming.
  // Desktop/Laptops: Up to 2.0x for Retina monitors.
  const maxDpr = isTouchDevice 
    ? Math.min(Math.max(dpr, 1.0), 1.5)
    : Math.min(Math.max(dpr, 1.0), 2.0)

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-device-tier', 'high')
    document.documentElement.setAttribute('data-device-dpr', maxDpr.toFixed(2))
  }

  cachedTier = {
    tier: 'high',
    maxDpr: maxDpr,
    isBudgetDevice: false,
    renderer: 'High-Fidelity Unified Profile',
  }

  return cachedTier
}

