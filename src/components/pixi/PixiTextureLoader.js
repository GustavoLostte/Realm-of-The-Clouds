import { Assets, Texture, Spritesheet, TextureSource } from 'pixi.js'
import { detectDevicePerformanceTier } from '../../utils/deviceTier'

// CRITICAL: Disable mipmap pyramid generation for all 2D textures.
// In 2D isometric games, sprites and atlases are rendered near 1:1 scale without 3D perspective receding.
// Generating mipmaps wastes 33% extra VRAM (~140MB+) and triggers Samsung GOS thermal dimming.
TextureSource.defaultOptions.autoGenerateMipmaps = false

const textureCache = new Map()
const loadingPromises = new Map()
const spritesheetCache = new Map()
const spritesheetPromises = new Map()

/**
 * Safely load a texture by URL with caching and error fallback
 */
export async function loadPixiTexture(url) {
  if (!url) return Texture.EMPTY
  if (textureCache.has(url)) return textureCache.get(url)

  if (loadingPromises.has(url)) {
    return loadingPromises.get(url)
  }

  const promise = (async () => {
    try {
      // In Pixi v8, Assets.load is the standard way to load textures
      const tex = await Assets.load(url)
      if (tex?.source) {
        tex.source.autoGenerateMipmaps = false
        if (tex.source.style) {
          tex.source.style.scaleMode = 'linear'
        }
      }
      textureCache.set(url, tex)
      return tex
    } catch (err) {
      console.warn(`[PixiTextureLoader] Failed to load texture: ${url}`, err)
      return Texture.WHITE
    } finally {
      loadingPromises.delete(url)
    }
  })()

  loadingPromises.set(url, promise)
  return promise
}

/**
 * Load and parse a Spritesheet JSON + Atlas WebP
 */
export async function loadPixiSpritesheet(jsonUrl) {
  if (!jsonUrl) return null
  if (spritesheetCache.has(jsonUrl)) return spritesheetCache.get(jsonUrl)
  if (spritesheetPromises.has(jsonUrl)) return spritesheetPromises.get(jsonUrl)

  const promise = (async () => {
    try {
      const res = await fetch(jsonUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${jsonUrl}`)
      const data = await res.json()

      const baseUrl = jsonUrl.substring(0, jsonUrl.lastIndexOf('/') + 1)
      const atlasUrl = baseUrl + data.meta.image

      const baseTexture = await loadPixiTexture(atlasUrl)
      if (baseTexture?.source) {
        baseTexture.source.autoGenerateMipmaps = false
        if (baseTexture.source.style) {
          baseTexture.source.style.scaleMode = 'linear'
        }
      }
      const sheet = new Spritesheet(baseTexture, data)
      await sheet.parse()

      spritesheetCache.set(jsonUrl, sheet)
      return sheet
    } catch (err) {
      console.warn(`[PixiTextureLoader] Failed to parse spritesheet: ${jsonUrl}`, err)
      return null
    } finally {
      spritesheetPromises.delete(jsonUrl)
    }
  })()

  spritesheetPromises.set(jsonUrl, promise)
  return promise
}

/**
 * Preload critical game assets (Map + NPC Spritesheets + Core Buildings)
 */
export async function preloadPixiAssets() {
  const criticalUrls = [
    '/assets/npcs/spritesheets/angel_chica_walk_front.json',
    '/assets/npcs/spritesheets/angel_chica_walk_back.json',
    '/assets/npcs/spritesheets/soldado_walk_front.json',
    '/assets/npcs/spritesheets/soldado_walk_back.json',
    '/assets/npcs/spritesheets/worker_walk_front.json',
    '/assets/npcs/spritesheets/worker_walk_back.json',
    '/assets/npcs/spritesheets/comandante_idle.json',
    '/assets/npcs/spritesheets/soldado_vigia_idle.json',
    '/assets/map/map_base_1080p.webp',
  ]

  const loadJobs = criticalUrls.map((url) => {
    if (url.endsWith('.json')) {
      return loadPixiSpritesheet(url)
    }
    return loadPixiTexture(url)
  })

  await Promise.allSettled(loadJobs)
}
