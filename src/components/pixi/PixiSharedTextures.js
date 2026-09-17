import { Texture } from 'pixi.js'

let cachedShadowTexture = null
let cachedEmptyPlotTexture = null
let cachedHarvestDiscTexture = null
const badgeTextureCache = new Map()

/**
 * Single shared 64x32 soft radial gradient shadow texture.
 * Used by all buildings, citizens, sentries, and commanders.
 * Because all shadows are Sprites sharing this single texture,
 * Pixi.js v8 batches them into the main sprite draw call, eliminating
 * over 20 pipeline state breaks per frame.
 */
export function getSharedShadowTexture() {
  if (cachedShadowTexture) return cachedShadowTexture

  if (typeof document === 'undefined') return Texture.WHITE

  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 16, 0, 32, 16, 32)
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)')
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.22)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(32, 16, 30, 14, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  cachedShadowTexture = Texture.from(canvas)
  return cachedShadowTexture
}

/**
 * Single shared 64x64 empty plot gold marker '+' texture.
 * Replaces vector Graphics + separate Text instances across 10+ empty plots.
 */
export function getSharedEmptyPlotTexture() {
  if (cachedEmptyPlotTexture) return cachedEmptyPlotTexture

  if (typeof document === 'undefined') return Texture.WHITE

  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.beginPath()
    ctx.arc(32, 32, 22, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 215, 0, 0.18)'
    ctx.fill()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.75)'
    ctx.stroke()

    ctx.font = 'bold 24px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#ffd700'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('+', 32, 32)
  }
  cachedEmptyPlotTexture = Texture.from(canvas)
  return cachedEmptyPlotTexture
}

/**
 * Shared level badge textures cached by level (e.g. 'Niv. 1', 'Niv. 2').
 * Avoids creating Graphics roundRect + dynamic 2D Text per building slot.
 */
export function getSharedBadgeTexture(level = 1) {
  if (badgeTextureCache.has(level)) return badgeTextureCache.get(level)

  if (typeof document === 'undefined') return Texture.WHITE

  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 28
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.beginPath()
    if (ctx.roundRect) {
      ctx.roundRect(4, 4, 56, 20, 10)
    } else {
      ctx.rect(4, 4, 56, 20)
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.85)'
    ctx.stroke()

    ctx.font = 'bold 11px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#ffd700'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`Niv. ${level}`, 32, 14)
  }
  const tex = Texture.from(canvas)
  badgeTextureCache.set(level, tex)
  return tex
}

/**
 * Shared harvest floating disc background texture (48x48 circular dark cyan pill).
 */
export function getSharedHarvestDiscTexture() {
  if (cachedHarvestDiscTexture) return cachedHarvestDiscTexture

  if (typeof document === 'undefined') return Texture.WHITE

  const canvas = document.createElement('canvas')
  canvas.width = 48
  canvas.height = 48
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.beginPath()
    ctx.arc(24, 24, 20, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.9)'
    ctx.stroke()
  }
  cachedHarvestDiscTexture = Texture.from(canvas)
  return cachedHarvestDiscTexture
}
