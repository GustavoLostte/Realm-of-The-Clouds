/**
 * analytics.js - Google Analytics 4 Integration for Realm of the Clouds
 * 
 * Provides a clean API to track game events without polluting game logic.
 * Events are queued if GA hasn't loaded yet and flushed once ready.
 * 
 * Usage:
 *   import { analytics } from './utils/analytics'
 *   analytics.trackEvent('building_built', { building: 'castle', level: 2 })
 */

const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX' // ← Replace with your real GA4 Measurement ID

let isInitialized = false
const eventQueue = []

/**
 * Initialize Google Analytics 4 via gtag.js
 * Call this once on app startup.
 */
export function initAnalytics() {
  if (typeof window === 'undefined') return
  if (isInitialized) return

  // Don't load in development
  if (GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    console.log('[Analytics] Skipped: Replace GA_MEASUREMENT_ID with your real ID')
    isInitialized = true // Mark as init so events just log to console
    return
  }

  try {
    // Load gtag.js script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(script)

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || []
    window.gtag = function () {
      window.dataLayer.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false, // We'll track game screens manually
      cookie_flags: 'SameSite=None;Secure',
    })

    isInitialized = true

    // Flush queued events
    while (eventQueue.length > 0) {
      const { name, params } = eventQueue.shift()
      trackEvent(name, params)
    }

    console.log('[Analytics] GA4 initialized successfully')
  } catch (err) {
    console.warn('[Analytics] Failed to initialize:', err)
  }
}

/**
 * Track a custom event in GA4
 * @param {string} eventName - Event name (e.g., 'building_built', 'arena_battle')
 * @param {Object} params - Event parameters (e.g., { building: 'castle', level: 2 })
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return

  // In dev mode or before init, just log to console
  if (!isInitialized || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    if (import.meta.env?.DEV) {
      console.log(`[Analytics] Event: ${eventName}`, params)
    }
    return
  }

  if (window.gtag) {
    window.gtag('event', eventName, params)
  } else {
    eventQueue.push({ name: eventName, params })
  }
}

/**
 * Track a virtual page/screen view (for SPA navigation)
 * @param {string} screenName - Screen name (e.g., 'main_kingdom', 'arena', 'shop')
 */
export function trackScreen(screenName) {
  trackEvent('screen_view', {
    screen_name: screenName,
    app_name: 'Realm of the Clouds',
  })
}

/**
 * Set user properties (e.g., kingdom level, language)
 * @param {Object} properties - User properties
 */
export function setUserProperties(properties = {}) {
  if (typeof window === 'undefined') return
  if (!window.gtag || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return

  window.gtag('set', 'user_properties', properties)
}

// ─────────────────────────────────────────────────────────
// Pre-defined game events for consistency
// ─────────────────────────────────────────────────────────

export const analytics = {
  // Core lifecycle
  gameStart: (lang) => trackEvent('game_start', { language: lang }),
  tutorialBegin: () => trackEvent('tutorial_begin'),
  tutorialComplete: () => trackEvent('tutorial_complete'),
  sessionStart: () => trackEvent('session_start', { timestamp: Date.now() }),

  // Kingdom / Building
  buildingBuilt: (buildingId, level) => trackEvent('building_built', { building_id: buildingId, level }),
  buildingUpgraded: (buildingId, level) => trackEvent('building_upgraded', { building_id: buildingId, level }),
  resourceCollected: (type, amount) => trackEvent('resource_collected', { resource_type: type, amount }),

  // Combat
  arenaBattle: (result, trophies) => trackEvent('arena_battle', { result, trophies_change: trophies }),
  dungeonEnter: (biome, stage) => trackEvent('dungeon_enter', { biome, stage }),
  dungeonComplete: (biome, stage) => trackEvent('dungeon_complete', { biome, stage }),
  dungeonFail: (biome, stage) => trackEvent('dungeon_fail', { biome, stage }),

  // Economy
  shopOpen: () => trackEvent('shop_open'),
  shopPurchase: (itemId, priceValue, currency) => trackEvent('purchase', {
    item_id: itemId,
    value: priceValue,
    currency: currency || 'USD',
  }),
  gemSpend: (amount, context) => trackEvent('spend_virtual_currency', {
    value: amount,
    virtual_currency_name: 'Gems',
    item_name: context,
  }),
  adWatched: (placement) => trackEvent('ad_reward_watched', { placement }),

  // Engagement
  questComplete: (questId) => trackEvent('quest_complete', { quest_id: questId }),
  citizenClick: (citizenType) => trackEvent('citizen_click', { citizen_type: citizenType }),
  rouletteSpun: (reward) => trackEvent('roulette_spin', { reward }),
  levelUp: (level, title) => trackEvent('level_up', { level, character: title }),
  dailyLogin: (streak) => trackEvent('daily_login', { login_streak: streak }),

  // Social
  shareKingdom: (platform) => trackEvent('share', { method: platform, content_type: 'kingdom' }),
  referralSent: () => trackEvent('referral_sent'),

  // Screens
  screen: trackScreen,

  // User props
  setUser: setUserProperties,

  // Raw event
  trackEvent,

  // Init
  init: initAnalytics,
}

export default analytics
