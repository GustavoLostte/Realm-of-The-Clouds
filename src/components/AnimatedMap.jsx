import React, { useRef, useEffect, useState } from 'react'

export function AnimatedMap({ className = 'island-background', isPaused = false }) {
  const videoRef = useRef(null)
  const [useVideo, setUseVideo] = useState(true)
  const isSuspendedRef = useRef(false)

  // Autoplay management and smart modal suspension
  useEffect(() => {
    let cleanupInteraction = null

    const safePlay = () => {
      if (videoRef.current && videoRef.current.paused && !isSuspendedRef.current && !document.hidden) {
        videoRef.current.play().catch(() => {})
      }
    }

    const safePause = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause()
      }
    }

    if (videoRef.current) {
      videoRef.current.playbackRate = 1.0
      videoRef.current.play().catch(() => {
        // Start on first user interaction if browser policy requires it
        const handleInteraction = () => {
          safePlay()
          window.removeEventListener('pointerdown', handleInteraction)
          cleanupInteraction = null
        }
        cleanupInteraction = handleInteraction
        window.addEventListener('pointerdown', handleInteraction, { once: true })
      })
    }

    // 1. Pause video when browser tab is minimized or in background to save battery
    const handleVisibilityChange = () => {
      if (document.hidden) {
        safePause()
      } else if (!isSuspendedRef.current) {
        safePlay()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 2. Observe DOM to pause video whenever any modal backdrop is active, freeing GPU for smooth 60 FPS UI
    const checkModalActive = () => {
      const hasOpenModal = !!document.querySelector('.modal-backdrop, .campaign-window-backdrop, .dialog-backdrop')
      if (hasOpenModal !== isSuspendedRef.current) {
        isSuspendedRef.current = hasOpenModal
        if (hasOpenModal) {
          safePause()
        } else {
          safePlay()
        }
      }
    }

    // Initial check
    checkModalActive()

    const observer = new MutationObserver(checkModalActive)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      if (cleanupInteraction) {
        window.removeEventListener('pointerdown', cleanupInteraction)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      observer.disconnect()
    }
  }, [])

  // React to explicit isPaused prop
  useEffect(() => {
    if (!videoRef.current) return
    if (isPaused) {
      isSuspendedRef.current = true
      videoRef.current.pause()
    } else {
      isSuspendedRef.current = false
      if (!document.hidden && !document.querySelector('.modal-backdrop, .campaign-window-backdrop')) {
        videoRef.current.play().catch(() => {})
      }
    }
  }, [isPaused])

  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  })

  const videoSources = isMobile ? {
    webm: '/assets/video/map_animated_mobile.webm',
    mp4: '/assets/video/map_animated_mobile.mp4',
    poster: '/assets/map_background_mobile.webp'
  } : {
    webm: '/assets/video/map_animated_desktop.webm',
    mp4: '/assets/video/map_animated_desktop.mp4',
    poster: '/assets/map_background.webp'
  }

  return (
    <div className="animated-map-wrapper">
      {useVideo ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          poster={videoSources.poster}
          className={`${className} map-video-anim`}
          onError={() => setUseVideo(false)}
        >
          <source src={videoSources.webm} type="video/webm" />
          <source src={videoSources.mp4} type="video/mp4" />
        </video>
      ) : (
        <img
          src={videoSources.poster}
          alt="Throne of Chaos Citadel"
          className={className}
          draggable="false"
        />
      )}
    </div>
  )
}
