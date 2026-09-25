import React, { useState, useEffect, useRef } from 'react'
import './StudioIntroSplash.css'

export function StudioIntroSplash({ onComplete }) {
  const [phase, setPhase] = useState('entering') // 'entering' | 'holding' | 'exiting'
  const audioRef = useRef(null)
  const hasFinishedRef = useRef(false)
  const hasPlayedAudioRef = useRef(false)
  const canSkipRef = useRef(false)

  const finishSplash = () => {
    if (hasFinishedRef.current) return
    hasFinishedRef.current = true
    setPhase('exiting')
    setTimeout(() => {
      onComplete?.()
    }, 550) // wait for exit fade-out transition
  }

  const tryPlayAudio = () => {
    if (hasPlayedAudioRef.current) return
    try {
      if (!audioRef.current) {
        const audio = new Audio('/assets/audio/universfield-bright-notification-352449.ogg')
        audio.volume = 0.95
        audioRef.current = audio
      }
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            hasPlayedAudioRef.current = true
          })
          .catch((err) => {
            console.log('[StudioSplash] Audio playback deferred until user interaction:', err)
          })
      }
    } catch (e) {
      console.warn('[StudioSplash] Audio error:', e)
    }
  }

  useEffect(() => {
    console.log('[StudioSplash] Mounting cinematic studio intro...')
    // 1. Play branding chime
    tryPlayAudio()

    // 2. Gesture listener for browsers/WebViews with strict autoplay policies
    const handleFirstGesture = () => {
      tryPlayAudio()
      window.removeEventListener('pointerdown', handleFirstGesture)
      window.removeEventListener('keydown', handleFirstGesture)
    }
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true })
    window.addEventListener('keydown', handleFirstGesture, { passive: true })

    // 3. Phase transitions
    const enterTimer = setTimeout(() => {
      setPhase('holding')
    }, 600)

    // Allow skip only after 800ms to prevent accidental immediate clicks on window focus
    const skipTimer = setTimeout(() => {
      canSkipRef.current = true
    }, 800)

    // Auto-finish after 2.8s
    const exitTimer = setTimeout(() => {
      finishSplash()
    }, 2800)

    // Keyboard listener to skip after grace period
    const handleKeyDown = (e) => {
      if (!canSkipRef.current) return
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        finishSplash()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(skipTimer)
      clearTimeout(exitTimer)
      window.removeEventListener('pointerdown', handleFirstGesture)
      window.removeEventListener('keydown', handleFirstGesture)
      window.removeEventListener('keydown', handleKeyDown)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleOverlayClick = () => {
    if (!canSkipRef.current) return
    finishSplash()
  }

  return (
    <div 
      className={`studio-splash-overlay phase-${phase}`}
      onClick={handleOverlayClick}
      role="banner"
      aria-label="WizzarDev Studios Intro"
    >
      {/* Atmospheric Background Glow */}
      <div className="studio-splash-bg-glow" />

      {/* Cinematic Logo Container */}
      <div className="studio-splash-content">
        <div className="studio-splash-logo-wrap">
          <div className="studio-splash-flare" />
          <img 
            src="/assets/branding/LogoWizzarDev.webp" 
            alt="WizzarDev Studios" 
            className="studio-splash-logo"
            draggable="false"
          />
        </div>
      </div>
    </div>
  )
}

