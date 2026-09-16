import React, { useRef, useEffect, useState } from 'react'

export function AnimatedMap({ className = 'island-background', isPaused = false }) {
  const videoRef = useRef(null)
  const [useVideo, setUseVideo] = useState(true)

  // Autoplay management and tab visibility handling
  useEffect(() => {
    let cleanupInteraction = null

    const safePlay = () => {
      if (videoRef.current && videoRef.current.paused && !isPaused && !document.hidden) {
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
      if (!isPaused && !document.hidden) {
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
      } else if (isPaused) {
        safePause()
      }
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
          alt="Ciudadela del Reino de las Nubes"
          className={className}
          draggable="false"
        />
      )}
    </div>
  )
}
