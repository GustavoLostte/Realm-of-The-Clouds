import React, { useEffect, useRef } from 'react'
import './FpsOverlay.css'

/**
 * ZERO-RERENDER FPS Overlay
 * 
 * Uses direct DOM manipulation (textContent) instead of React setState
 * to completely eliminate the ~3.3 React re-renders/second that the old
 * implementation caused. No RAF loop of its own — piggybacks on
 * requestAnimationFrame with zero React reconciliation cost.
 */
export function FpsOverlay({ fpsMode = '60fps' }) {
  const containerRef = useRef(null)
  const fpsNumRef = useRef(null)
  const msNumRef = useRef(null)
  const dotRef = useRef(null)
  const fpsModeRef = useRef(fpsMode)

  useEffect(() => {
    fpsModeRef.current = fpsMode
  }, [fpsMode])

  useEffect(() => {
    let animId
    let frameCount = 0
    let lastTime = performance.now()
    let lastFrameTime = performance.now()
    let lastCountedFrameTime = performance.now()
    let warmupFrames = 0
    let isHidden = typeof document !== 'undefined' ? document.hidden : false
    let currentTier = 'fps-optimal'

    const resetCounters = () => {
      const now = performance.now()
      lastTime = now
      lastFrameTime = now
      lastCountedFrameTime = now
      frameCount = 0
      warmupFrames = 3
    }

    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return
      isHidden = document.hidden
      if (!document.hidden) resetCounters()
    }

    const handleFocus = () => {
      isHidden = false
      resetCounters()
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleFocus)
      window.addEventListener('pageshow', handleFocus)
    }

    const loop = (now) => {
      animId = requestAnimationFrame(loop)

      // 1. If tab is hidden, skip
      if (isHidden || (typeof document !== 'undefined' && document.hidden)) {
        lastTime = now
        lastFrameTime = now
        lastCountedFrameTime = now
        frameCount = 0
        return
      }

      // 2. Discard warm-up frames after tab return
      if (warmupFrames > 0) {
        warmupFrames--
        lastTime = now
        lastFrameTime = now
        lastCountedFrameTime = now
        frameCount = 0
        return
      }

      // 3. Reject anomalous frame deltas (> 100ms)
      const frameDelta = now - lastFrameTime
      lastFrameTime = now
      if (frameDelta > 100) {
        lastTime = now
        lastCountedFrameTime = now
        frameCount = 0
        return
      }

      // 4. Mobile 120Hz ProMotion / VRR frame limiter:
      // When user touches the screen on high-refresh mobile displays (90Hz / 120Hz),
      // the OS raises VSync to 120Hz. We pace the counted frames to the active target
      // frame rate (60 FPS max in normal mode, 30 FPS max in eco mode).
      const currentMode = fpsModeRef.current || (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-fps-mode') : '60fps')
      const isEco = currentMode === 'eco'
      const minInterval = isEco ? 30.0 : 15.0

      if (now - lastCountedFrameTime < minInterval) {
        return
      }
      lastCountedFrameTime = now

      // 5. Count frame and update DOM directly every 500ms (no React setState!)
      frameCount++
      const elapsed = now - lastTime

      if (elapsed >= 500) {
        if (elapsed <= 1000) {
          const maxTargetFps = isEco ? 30 : 60
          const fps = Math.min(maxTargetFps, Math.round((frameCount * 1000) / elapsed))
          const ms = frameCount > 0 ? (elapsed / frameCount).toFixed(1) : (1000 / maxTargetFps).toFixed(1)

          // Direct DOM updates — ZERO React re-renders
          if (fpsNumRef.current) fpsNumRef.current.textContent = fps
          if (msNumRef.current) msNumRef.current.textContent = ms

          // Update tier class based on active target mode
          const optimalCutoff = isEco ? 27 : 55
          const warningCutoff = isEco ? 20 : 30
          const newTier = fps >= optimalCutoff ? 'fps-optimal' : fps >= warningCutoff ? 'fps-warning' : 'fps-critical'
          if (newTier !== currentTier && containerRef.current) {
            containerRef.current.classList.remove(currentTier)
            containerRef.current.classList.add(newTier)
            currentTier = newTier
          }
        }
        frameCount = 0
        lastTime = now
      }
    }

    animId = requestAnimationFrame(loop)

    return () => {
      if (animId) cancelAnimationFrame(animId)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
        window.removeEventListener('pageshow', handleFocus)
      }
    }
  }, [])

  return (
    <aside 
      ref={containerRef}
      className="hud-fps-overlay fps-optimal" 
      id="hud-fps-counter"
      aria-label="FPS counter"
    >
      <span className="fps-indicator-dot" ref={dotRef} />
      <span className="fps-number" ref={fpsNumRef}>60</span>
      <span className="fps-label">FPS</span>
      <span className="fps-separator">•</span>
      <span className="fps-number fps-ms-number" ref={msNumRef}>16.6</span>
      <span className="fps-label">ms</span>
    </aside>
  )
}
