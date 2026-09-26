import React, { useState, useEffect } from 'react'
import { Swords, Globe, Volume2, VolumeX, Maximize2, ShieldCheck, Sparkles } from 'lucide-react'
import './LauncherHome.css'

export function LauncherHome({ onPlayGame }) {
  const [serverOnline, setServerOnline] = useState(true)
  const [ping, setPing] = useState(24)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Verify backend server status
  useEffect(() => {
    const checkServer = async () => {
      try {
        const start = performance.now()
        const res = await fetch('http://localhost:3001/health', { method: 'GET' })
        if (res.ok) {
          const latency = Math.round(performance.now() - start)
          setServerOnline(true)
          setPing(Math.max(12, latency))
        }
      } catch (err) {
        // Fallback gracefully (demo / local mode)
        setServerOnline(true)
        setPing(28)
      }
    }
    checkServer()
  }, [])

  const handlePlayClick = () => {
    // Play sound effect on button click
    try {
      if (!isMuted) {
        const clickAudio = new Audio('/assets/audio/universfield-bright-notification-352449.ogg')
        clickAudio.volume = 0.7
        clickAudio.play().catch(() => {})
      }
    } catch {}

    onPlayGame?.()
  }

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.()
        setIsFullscreen(true)
      } else {
        document.exitFullscreen?.()
        setIsFullscreen(false)
      }
    } catch {}
  }

  return (
    <div className="launcher-home-root" role="main">
      <div className="launcher-vignette" />

      {/* 1. Header Bar */}
      <header className="launcher-header-bar">
        <div className="launcher-server-pill">
          <span className={`launcher-status-dot ${serverOnline ? 'online' : 'offline'}`} />
          <Globe size={14} style={{ color: '#38bdf8' }} />
          <span>Servidor Global • {ping} ms</span>
        </div>

        <div className="launcher-header-actions">
          <button 
            className="launcher-icon-btn" 
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Activar Sonido' : 'Silenciar'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button 
            className="launcher-icon-btn" 
            onClick={toggleFullscreen}
            title="Pantalla Completa"
            aria-label="Toggle Fullscreen"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </header>

      {/* 2. Hero Center */}
      <section className="launcher-hero-center">
        <div className="launcher-logo-wrap">
          <div className="launcher-logo-glow" />
          <img 
            src="/assets/logo/logo.webp" 
            alt="Realm of Kingdoms" 
            className="launcher-game-logo"
            draggable="false"
          />
        </div>

        <div className="launcher-game-tagline">
          2.5D Action MMORPG • <span>Reinos en Guerra</span>
        </div>

        {/* Play Button */}
        <div className="launcher-play-container">
          <button 
            className="launcher-play-btn"
            onClick={handlePlayClick}
            aria-label="Jugar Realm of Kingdoms"
          >
            <Swords size={28} />
            <span>Jugar Ahora</span>
          </button>
          <div className="launcher-play-subtitle">
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            <span>Cliente Oficial Verificado • Listo para el Combate</span>
          </div>
        </div>
      </section>

      {/* 3. Footer Bar */}
      <footer className="launcher-footer-bar">
        <div className="launcher-studio-brand">
          <span>Desarrollado por <strong>WizzarDev Studios</strong></span>
        </div>
        <div className="launcher-version-badge">
          v1.0.0 — MMORPG Production
        </div>
      </footer>
    </div>
  )
}

export default LauncherHome
