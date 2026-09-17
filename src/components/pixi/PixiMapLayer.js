import { Container, Sprite, AnimatedSprite, Texture, Rectangle } from 'pixi.js'
import { loadPixiTexture } from './PixiTextureLoader'

/**
 * PixiMapLayer
 * High-performance hybrid map layer for Pixi.js v8.
 * - Base Layer: 1920x1080 Native Full HD crystal-clear map (zero blur, zero noise).
 * - Overlay Layer: Temporally denoised animated water & cloud effects from WebP texture atlas.
 */
export class PixiMapLayer {
  constructor(options = {}) {
    this.options = options
    this.container = new Container()
    this.container.label = 'map-background-layer'
    this.container.zIndex = 0

    this.baseSprite = null
    this.animSprite = null
    this.isSuspended = false
    this.isDestroyed = false
    this.audioElement = null

    this.initMap()
    this.initAudio()
  }

  async initMap() {
    try {
      // 1. Permanent 1080p Native Base: Crystal clear 1920x1080 Full HD uncompressed sharpness
      const base1080Tex = await loadPixiTexture('/assets/map/map_base_1080p.webp')
      if (this.isDestroyed) return

      if (base1080Tex && base1080Tex.source) {
        base1080Tex.source.autoGenerateMipmaps = false
        if (base1080Tex.source.style) {
          base1080Tex.source.style.scaleMode = 'linear'
        }

        this.baseSprite = new Sprite(base1080Tex)
        this.baseSprite.label = 'map-base-1080p'
        this.baseSprite.position.set(0, 0)
        this.baseSprite.width = 1920
        this.baseSprite.height = 1080
        this.baseSprite.zIndex = 0
        this.container.addChild(this.baseSprite)
      }

      // 2. Fetch master motion overlay metadata
      const res = await fetch('/assets/map/map_master.json')
      if (!res.ok) throw new Error(`HTTP ${res.status} loading map_master.json`)
      const masterData = await res.json()
      if (this.isDestroyed) return

      // 3. Load all 25 atlas texture pages in parallel chunks of 4
      const loadedBaseTextures = new Map()
      const CHUNK_SIZE = 4
      for (let i = 0; i < masterData.textures.length; i += CHUNK_SIZE) {
        if (this.isDestroyed) return
        const chunk = masterData.textures.slice(i, i + CHUNK_SIZE)
        await Promise.all(
          chunk.map(async (t) => {
            const url = `/assets/map/${t.image}`
            const tex = await loadPixiTexture(url)
            if (tex?.source) {
              tex.source.autoGenerateMipmaps = false
              if (tex.source.style) {
                tex.source.style.scaleMode = 'linear'
              }
            }
            loadedBaseTextures.set(t.image, tex)
          })
        )
      }

      if (this.isDestroyed) return

      // 4. Build individual frame textures with alpha transparency in static areas
      const frameTexturesMap = new Map()
      for (const t of masterData.textures) {
        const baseTex = loadedBaseTextures.get(t.image)
        if (!baseTex || !baseTex.source) continue

        for (const f of t.frames) {
          const rect = new Rectangle(f.frame.x, f.frame.y, f.frame.w, f.frame.h)
          const frameTex = new Texture({
            source: baseTex.source,
            frame: rect
          })
          frameTexturesMap.set(f.filename, frameTex)
        }
      }

      // 5. Construct animation array in strict chronological sequence
      const animList = masterData.animations?.play || []
      const animTextures = animList
        .map((name) => frameTexturesMap.get(name))
        .filter(Boolean)

      if (animTextures.length === 0) {
        console.warn('[PixiMapLayer] No valid animation textures resolved.')
        return
      }

      // 6. Create AnimatedSprite for motion overlay (water ripples, clouds)
      const anim = new AnimatedSprite(animTextures)
      anim.label = 'map-motion-overlay'
      anim.position.set(0, 0)
      anim.width = 1920
      anim.height = 1080
      anim.zIndex = 1
      // 149 frames in 9.38s ≈ 15.88 fps -> 15.88 / 60 ≈ 0.265 animationSpeed
      anim.animationSpeed = 0.265
      anim.loop = true

      // Unconditional playback: map motion is permanent and continuous on all devices
      anim.play()

      this.animSprite = anim
      this.container.addChild(anim)

      console.log(`[PixiMapLayer] 1080p Native Base Map + Motion Overlay active with ${animTextures.length} frames.`)
    } catch (err) {
      console.error('[PixiMapLayer] Error loading map atlas sequence:', err)
    }
  }

  initAudio() {
    if (typeof window === 'undefined') return
    try {
      this.audioElement = new Audio('/assets/map/sound_effect.mp3')
      this.audioElement.loop = true
      this.audioElement.volume = 0.45
      this.audioElement.preload = 'auto'

      // Play audio on first user interaction or when sound is unmuted
      const startAudio = () => {
        if (!this.isSuspended && this.audioElement && this.audioElement.paused) {
          this.audioElement.play().catch(() => {})
        }
      }

      window.addEventListener('click', startAudio, { once: true })
      window.addEventListener('touchstart', startAudio, { once: true })
    } catch (err) {
      console.warn('[PixiMapLayer] Audio initialization warning:', err)
    }
  }

  setSuspended(isSuspended) {
    this.isSuspended = isSuspended
    // CRITICAL: Map motion (textures and sprite frames) MUST NEVER STOP on any mode or suspension!
    if (this.animSprite && !this.animSprite.playing) {
      this.animSprite.play()
    }
    if (this.audioElement) {
      if (isSuspended) {
        this.audioElement.volume = 0
        try {
          this.audioElement.pause()
          this.audioElement.currentTime = 0
        } catch {}
      } else {
        this.audioElement.volume = 0.45
        this.audioElement.play().catch(() => {})
      }
    }
  }

  setSoundEnabled(enabled) {
    if (!this.audioElement) return
    if (enabled) {
      if (!this.isSuspended) {
        this.audioElement.volume = 0.45
        this.audioElement.play().catch(() => {})
      }
    } else {
      this.audioElement.volume = 0
      try {
        this.audioElement.pause()
      } catch {}
    }
  }

  destroy() {
    this.isDestroyed = true
    if (this.audioElement) {
      try {
        this.audioElement.pause()
        this.audioElement.src = ''
        this.audioElement = null
      } catch {}
    }
    if (this.baseSprite) {
      this.container.removeChild(this.baseSprite)
      this.baseSprite.destroy()
      this.baseSprite = null
    }
    if (this.animSprite) {
      this.container.removeChild(this.animSprite)
      this.animSprite.destroy()
      this.animSprite = null
    }
    this.container.destroy({ children: true })
  }
}
