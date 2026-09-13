// smartAssetLoader.js - Intelligent On-Demand Asset Preloader
// Preloads strictly the critical assets required for the active view to avoid bandwidth bloat and eliminate visual pop-in.

const preloadedUrlCache = new Set()

/**
 * Preload a single image with timeout guarantee
 */
export function preloadImage(src, timeoutMs = 4000) {
  if (!src) return Promise.resolve(src)
  if (preloadedUrlCache.has(src)) return Promise.resolve(src)

  return new Promise((resolve) => {
    const img = new Image()
    let isSettled = false

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true
        preloadedUrlCache.add(src)
        resolve(src)
      }
    }, timeoutMs)

    img.onload = () => {
      if (!isSettled) {
        isSettled = true
        clearTimeout(timer)
        preloadedUrlCache.add(src)
        resolve(src)
      }
    }

    img.onerror = () => {
      if (!isSettled) {
        isSettled = true
        clearTimeout(timer)
        preloadedUrlCache.add(src)
        resolve(src)
      }
    }

    img.src = src
  })
}

/**
 * Preload multiple image assets with progress tracking and minimum animation pacing
 */
export async function preloadImages(urls = [], onProgress = null, minDurationMs = 0) {
  const validUrls = Array.from(new Set(urls.filter(Boolean)))
  if (validUrls.length === 0) {
    if (onProgress) onProgress(100)
    return
  }

  const startTime = Date.now()
  let loadedCount = 0
  const total = validUrls.length

  const promises = validUrls.map(async (url) => {
    await preloadImage(url)
    loadedCount++
    if (onProgress) {
      const pct = Math.round((loadedCount / total) * 100)
      onProgress(pct)
    }
  })

  await Promise.all(promises)

  const elapsed = Date.now() - startTime
  if (minDurationMs > elapsed) {
    await new Promise((r) => setTimeout(r, minDurationMs - elapsed))
  }
  if (onProgress) onProgress(100)
}

/**
 * Preload video buffer so first frame or loop begins immediately without a black frame
 */
export function preloadVideo(url, timeoutMs = 2000) {
  if (!url) return Promise.resolve(url)
  if (preloadedUrlCache.has(url)) return Promise.resolve(url)

  return new Promise((resolve) => {
    let isSettled = false
    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true
        preloadedUrlCache.add(url)
        resolve(url)
      }
    }, timeoutMs)

    try {
      const video = document.createElement('video')
      video.preload = 'auto'
      video.muted = true
      video.playsInline = true

      const onReady = () => {
        if (!isSettled) {
          isSettled = true
          clearTimeout(timer)
          preloadedUrlCache.add(url)
          try {
            video.src = ''
          } catch {}
          resolve(url)
        }
      }

      video.addEventListener('loadeddata', onReady, { once: true })
      video.addEventListener('canplay', onReady, { once: true })
      video.addEventListener('error', onReady, { once: true })
      video.src = url
      video.load()
    } catch {
      if (!isSettled) {
        isSettled = true
        clearTimeout(timer)
        resolve(url)
      }
    }
  })
}

/**
 * Extracts ONLY the critical assets currently rendered in the City:
 * - Map background image
 * - Active citizen sprites on the avenue
 * - Constructed buildings placed on the player's plots
 * - Primary HUD icons
 */
export function getCityCriticalAssets(slots = []) {
  const assets = [
    // 1. Map island ground & water background
    '/assets/map_background.webp',

    // 2. Active citizens (front & back sprites for all 3 citizen types)
    '/assets/npcs/soldado_walk_front.webp',
    '/assets/npcs/soldado_walk_back.webp',
    '/assets/npcs/aldeana_walk_front.webp',
    '/assets/npcs/aldeana_walk_back.webp',
    '/assets/npcs/lumberjack_walk_front.webp',
    '/assets/npcs/lumberjack_walk_back.webp',

    // 3. Core HUD icons
    '/assets/hud_icons/icon_gold.webp',
    '/assets/hud_icons/icon_wood.webp',
    '/assets/hud_icons/icon_stone.webp',
    '/assets/hud_icons/icon_food.webp',
    '/assets/hud_icons/icon_gem.webp',
    '/assets/hud_icons/btn_build.webp',
    '/assets/hud_icons/btn_army.webp',
    '/assets/hud_icons/btn_arena.webp',
    '/assets/hud_icons/btn_ranking.webp',
    '/assets/hud_icons/btn_expedition.webp',
    '/assets/hud_icons/btn_quests.webp',
    '/assets/hud_icons/btn_shop.webp',
    '/assets/hud_icons/btn_settings.webp',
  ]

  // 4. Extract ONLY active buildings present in slots
  if (Array.isArray(slots)) {
    slots.forEach((s) => {
      if (s.buildingId) {
        assets.push(`/assets/buildings/${s.buildingId}/${s.buildingId}_idle.webp`)
        if (s.isConstructing) {
          assets.push(`/assets/buildings/${s.buildingId}/${s.buildingId}_construccion.webp`)
        }
      }
    })
  }

  // Always ensure Ayuntamiento / Castillo is included as baseline
  assets.push('/assets/buildings/castillo/castillo_idle.webp')

  return Array.from(new Set(assets))
}

/**
 * Extracts ONLY critical assets needed for a Campaign combat encounter
 */
export function getCombatCriticalAssets(enemyConfig) {
  if (!enemyConfig) return []
  const assets = [
    '/assets/mazmorras/hero_avatar.webp',
    enemyConfig.poster,
    enemyConfig.avatar,
  ].filter(Boolean)

  return Array.from(new Set(assets))
}

/**
 * Extracts ONLY critical assets needed for an Arena siege battle
 */
export function getArenaCriticalAssets(rival) {
  const assets = [
    '/assets/arena_battle_bg.webp',
    '/assets/buildings/castillo/castillo_idle.webp',
    '/assets/buildings/cuartel/cuartel_idle.webp',
    '/assets/buildings/archer_tower/archer_tower_idle.webp',
    '/assets/hud_icons/icon_crown.webp',
    rival?.avatar,
    rival?.profile?.avatar,
  ].filter(Boolean)

  return Array.from(new Set(assets))
}
