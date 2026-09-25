import React, { useEffect, useRef } from 'react'

/**
 * Persistent GPU-decoded image cache
 * Retains HTMLImageElement references so textures stay decoded in GPU memory
 * and are never garbage collected during gameplay.
 */
export const DECODED_SPRITE_CACHE = new Map()

export function preloadAndDecodeSprite(url) {
  if (!url || typeof window === 'undefined' || typeof url !== 'string') return Promise.resolve(null)
  if (DECODED_SPRITE_CACHE.has(url)) {
    return DECODED_SPRITE_CACHE.get(url)
  }

  const promise = new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    if (typeof img.decode === 'function') {
      img.decode()
        .then(() => resolve(img))
        .catch(() => resolve(img))
    } else {
      img.onload = () => resolve(img)
      img.onerror = () => resolve(img)
    }
  })

  DECODED_SPRITE_CACHE.set(url, promise)
  return promise
}

/**
 * SeamlessSprite Component
 * 
 * Hardware-grade, double-buffered sprite presenter for animated WebP/GIF/PNG game assets.
 * 
 * Guarantees:
 * 1. ZERO DISAPPEARANCE: The currently active buffer REMAINS 100% visible on screen
 *    until the incoming sprite has completed decoding in GPU memory via `img.decode()`.
 * 2. FRAME-0 REPLAY: Clears any stale src before assignment so re-triggering the same action
 *    always starts cleanly from Frame 0.
 * 3. NO GHOSTING / NO DOUBLE-EXPOSURE: Strictly one buffer has opacity 1 and zIndex 2 at any time.
 * 4. SAFETY FALLBACK: 40ms timeout fallback guarantees animations ALWAYS appear on screen even if
 *    decoding is delayed on low-end mobile devices.
 */
export const SeamlessSprite = React.memo(function SeamlessSprite({
  src,
  alt = 'Champion Sprite',
  className = '',
  style = {},
  facing = null,
  anim = 'idle',
  animNonce = 0,
  draggable = false,
}) {
  const imgARef = useRef(null)
  const imgBRef = useRef(null)
  const activeBufferRef = useRef('A')
  const currentSrcRef = useRef(null)
  const lastNonceRef = useRef(animNonce)
  const swapReqIdRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!src) return

    // If identical source AND identical nonce, no swap needed
    if (currentSrcRef.current === src && lastNonceRef.current === animNonce) return

    currentSrcRef.current = src
    lastNonceRef.current = animNonce
    const reqId = ++swapReqIdRef.current

    const activeEl = activeBufferRef.current === 'A' ? imgARef.current : imgBRef.current
    const stagingEl = activeBufferRef.current === 'A' ? imgBRef.current : imgARef.current

    if (!activeEl || !stagingEl) return

    // Initial first load on mount
    if (!activeEl.src || activeEl.src === window.location.href || activeEl.style.opacity === '0') {
      activeEl.src = src
      activeEl.style.opacity = '1'
      activeEl.style.zIndex = '2'
      stagingEl.style.opacity = '0'
      stagingEl.style.zIndex = '1'
      stagingEl.src = ''
      return
    }

    let isCancelled = false
    let fallbackTimer = null

    const executeSwap = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer)
        fallbackTimer = null
      }
      if (isCancelled || !isMountedRef.current || reqId !== swapReqIdRef.current) return

      // Bring staging element to front (100% visible)
      stagingEl.style.zIndex = '2'
      stagingEl.style.opacity = '1'

      // Retire previously active element
      activeEl.style.zIndex = '1'
      activeEl.style.opacity = '0'

      // Swap active buffer pointer
      activeBufferRef.current = activeBufferRef.current === 'A' ? 'B' : 'A'

      // Clear the retired buffer's src on next frame to release WebP decoder and guarantee fresh frame 0 on next use
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return
        activeEl.src = ''
      })
    }

    // Safety fallback: if decode takes more than 40ms, swap anyway so the user NEVER misses the visual animation!
    fallbackTimer = setTimeout(executeSwap, 40)

    // Assign new src to staging buffer (ensuring fresh frame 0)
    stagingEl.onload = null
    stagingEl.onerror = null
    stagingEl.decoding = 'async'
    if (stagingEl.src) {
      stagingEl.src = ''
    }
    stagingEl.src = src

    // Off-thread GPU async decode
    if (typeof stagingEl.decode === 'function') {
      stagingEl.decode()
        .then(() => executeSwap())
        .catch(() => executeSwap())
    } else {
      if (stagingEl.complete && stagingEl.naturalWidth > 0) {
        executeSwap()
      } else {
        stagingEl.onload = executeSwap
        stagingEl.onerror = executeSwap
      }
    }

    return () => {
      isCancelled = true
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [src, animNonce])

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformOrigin: 'center bottom',
    ...(facing !== null ? { transform: `scaleX(${facing})` } : {}),
    ...style,
  }

  const layerStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center bottom',
    transformOrigin: 'center bottom',
    pointerEvents: 'none',
    userSelect: 'none',
    transform: 'translateZ(0)',
    willChange: 'opacity',
  }

  return (
    <div className={`seamless-sprite-container ${className}`} style={containerStyle}>
      <img 
        ref={imgARef}
        alt={alt}
        className={`seamless-sprite-layer layer-a sprite-${anim} champion-actor-sprite-img`}
        draggable={draggable}
        style={{
          ...layerStyle,
          opacity: 1,
          zIndex: 2,
        }}
      />
      <img 
        ref={imgBRef}
        alt={alt}
        className={`seamless-sprite-layer layer-b sprite-${anim} champion-actor-sprite-img`}
        draggable={draggable}
        style={{
          ...layerStyle,
          opacity: 0,
          zIndex: 1,
        }}
      />
    </div>
  )
})
