import React, { useRef, useEffect, useState } from 'react'

export function AnimatedMap({ 
  className = 'island-background', 
  isPaused = false,
  fpsMode = '60fps',
  forceStatic = false,
}) {
  const videoRef = useRef(null)
  const [useVideo, setUseVideo] = useState(true)

  const isEcoMode = fpsMode === 'eco'
  const effectiveUseVideo = useVideo && !forceStatic && !isEcoMode

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

  // Video playback lifecycle management (pause during modals, dragging, background tabs)
  useEffect(() => {
    if (!effectiveUseVideo || !videoRef.current) return

    const videoEl = videoRef.current
    let cleanupInteraction = null

    const safePlay = () => {
      if (videoEl && videoEl.paused && !isPaused && !document.hidden) {
        videoEl.play().catch(() => {})
      }
    }

    const safePause = () => {
      if (videoEl && !videoEl.paused) {
        videoEl.pause()
      }
    }

    if (!isPaused && !document.hidden) {
      videoEl.playbackRate = 1.0
      videoEl.play().catch(() => {
        // Start on first user interaction if browser policy requires it
        const handleInteraction = () => {
          safePlay()
          window.removeEventListener('pointerdown', handleInteraction)
          cleanupInteraction = null
        }
        cleanupInteraction = handleInteraction
        window.addEventListener('pointerdown', handleInteraction, { once: true })
      })
    } else {
      safePause()
    }

    // Pause video when browser tab is minimized or in background to save battery
    const handleVisibilityChange = () => {
      if (document.hidden) {
        safePause()
      } else if (!isPaused) {
        // Defer playback resume by one animation frame for buttery-smooth tab transition
        requestAnimationFrame(() => {
          safePlay()
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (cleanupInteraction) {
        window.removeEventListener('pointerdown', cleanupInteraction)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [effectiveUseVideo, isPaused])

  return (
    <div className="animated-map-wrapper">
      {effectiveUseVideo ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
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
          alt="Ciudadela del Reino de las Nubes"
          className={`${className} map-static-poster`}
          draggable="false"
          loading="eager"
        />
      )}
    </div>
  )
}
