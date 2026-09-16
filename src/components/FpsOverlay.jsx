import React, { useState, useEffect, useRef } from 'react'
import './FpsOverlay.css'

export function FpsOverlay() {
  const [fps, setFps] = useState(60)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useEffect(() => {
    let animId
    const isHiddenRef = { current: typeof document !== 'undefined' ? document.hidden : false }
    const warmupFramesRef = { current: 0 }
    const lastFrameTimeRef = { current: performance.now() }

    const resetCounters = () => {
      lastTimeRef.current = performance.now()
      lastFrameTimeRef.current = performance.now()
      frameCountRef.current = 0
      warmupFramesRef.current = 3 // Discard first 3 frames during compositor reactivation
    }

    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return
      isHiddenRef.current = document.hidden
      if (!document.hidden) {
        resetCounters()
      }
    }

    const handleFocus = () => {
      isHiddenRef.current = false
      resetCounters()
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleFocus)
      window.addEventListener('pageshow', handleFocus)
    }

    const loop = (now) => {
      // 1. If tab is backgrounded or hidden, pause calculation and do NOT lower FPS
      if (isHiddenRef.current || (typeof document !== 'undefined' && document.hidden)) {
        lastTimeRef.current = now
        lastFrameTimeRef.current = now
        frameCountRef.current = 0
        animId = requestAnimationFrame(loop)
        return
      }

      // 2. Discard warm-up frames immediately following tab return so browser transition lag is ignored
      if (warmupFramesRef.current > 0) {
        warmupFramesRef.current--
        lastTimeRef.current = now
        lastFrameTimeRef.current = now
        frameCountRef.current = 0
        animId = requestAnimationFrame(loop)
        return
      }

      // 3. Reject anomalous frame deltas caused by tab pauses or system interruptions (> 100ms)
      const frameDelta = now - lastFrameTimeRef.current
      lastFrameTimeRef.current = now
      if (frameDelta > 100) {
        lastTimeRef.current = now
        frameCountRef.current = 0
        animId = requestAnimationFrame(loop)
        return
      }

      // 4. Count frame and calculate stable FPS over a 300ms window
      frameCountRef.current++
      const elapsed = now - lastTimeRef.current

      if (elapsed >= 300) {
        // Enforce valid time window and reject stale intervals
        if (elapsed <= 600) {
          const calculatedFps = Math.min(120, Math.round((frameCountRef.current * 1000) / elapsed))
          setFps(calculatedFps)
        }
        frameCountRef.current = 0
        lastTimeRef.current = now
      }

      animId = requestAnimationFrame(loop)
    }

    lastTimeRef.current = performance.now()
    lastFrameTimeRef.current = performance.now()
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

  // Performance tier color class
  const getTierClass = () => {
    if (fps >= 55) return 'fps-optimal'
    if (fps >= 30) return 'fps-warning'
    return 'fps-critical'
  }

  return (
    <aside 
      className={`hud-fps-overlay ${getTierClass()}`} 
      id="hud-fps-counter"
      aria-label={`${fps} fotogramas por segundo`}
    >
      <span className="fps-indicator-dot" />
      <span className="fps-number">{fps}</span>
      <span className="fps-label">FPS</span>
    </aside>
  )
}
