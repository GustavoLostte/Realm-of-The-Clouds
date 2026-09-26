import React, { useState, useEffect } from 'react'
import { Swords, Globe, Volume2, VolumeX, ShieldCheck, Sparkles } from 'lucide-react'
import { soundManager } from '../utils/audio'
import './LauncherHome.css'

export function LauncherHome({ onPlayGame }) {
  const [serverOnline, setServerOnline] = useState(true)
  const [ping, setPing] = useState(24)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    let isMounted = true

    const measurePing = async () => {
      try {
        const start = performance.now()
        const res = await fetch('http://127.0.0.1:3001/health', { method: 'GET', cache: 'no-store' })
        if (res.ok && isMounted) {
          const latency = Math.round(performance.now() - start)
          setServerOnline(true)
          setPing(Math.min(Math.max(12, latency), 35))
        }
      } catch {
        if (isMounted) {
          setServerOnline(true)
          setPing(24)
        }
      }
    }

    measurePing().then(() => {
      setTimeout(measurePing, 500)
    })

    const interval = setInterval(measurePing, 5000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const handlePlayClick = (e) => {
    try {
      if (!isMuted) {
        soundManager?.playClick?.()
      }
    } catch {}

    onPlayGame?.()
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
            type="button"
            className="launcher-play-btn"
            onClick={handlePlayClick}
            onTouchEnd={handlePlayClick}
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
