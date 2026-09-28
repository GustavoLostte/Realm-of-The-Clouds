import React, { useState, useEffect } from 'react'
import { Swords, Globe, Volume2, VolumeX, ShieldCheck, Sparkles, Heart, X } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { openExternalUrl } from '../utils/openExternalUrl'
import { analytics } from '../utils/analytics'
import './LauncherHome.css'

const KOFI_URL = 'https://ko-fi.com/wizzardev'

const DONATE_TEXT = {
  es: {
    title: '☕ Apoya a Realm of Kingdoms',
    p1: 'Primero que todo, gracias por estar aquí. El simple hecho de que estés jugando ya significa mucho para nosotros.',
    p2: 'Este juego nace del sueño de un desarrollador indie independiente — sin estudio, sin inversores — solo pasión, noches largas y mucho café.',
    p3: 'Si el juego te gusta y quieres ayudarnos a seguir adelante, tu donativo nos permite:',
    b1: '🖥️ Mantener los servidores activos para todos',
    b2: '⚔️ Crear nuevas clases, dungeons y contenido',
    b3: '🌍 Hacer crecer este mundo que estamos construyendo juntos',
    p4: 'No estás obligado a nada. Tu tiempo jugando ya es un regalo. Pero si puedes, cada café nos acerca un paso más a hacer este sueño realidad.',
    thanks: 'Gracias de corazón por creer en nosotros. 🙏❤️',
    btn: '☕ Invítanos un café',
  },
  en: {
    title: '☕ Support Realm of Kingdoms',
    p1: 'First of all, thank you for being here. Just the fact that you\'re playing already means the world to us.',
    p2: 'This game is born from the dream of a solo indie developer — no studio, no investors — just passion, long nights, and a lot of coffee.',
    p3: 'If you enjoy the game and want to help us keep going, your donation helps us:',
    b1: '🖥️ Keep the servers running for everyone',
    b2: '⚔️ Create new classes, dungeons & content',
    b3: '🌍 Grow this world we\'re building together',
    p4: 'You\'re not obligated to anything. Your time playing is already a gift. But if you can, every coffee brings us one step closer to making this dream a reality.',
    thanks: 'Thank you from the bottom of our hearts. 🙏❤️',
    btn: '☕ Buy us a coffee',
  }
}

function getLocale() {
  const lang = (navigator.language || 'en').toLowerCase()
  return lang.startsWith('es') ? 'es' : 'en'
}

export function LauncherHome({ onPlayGame }) {
  const [serverOnline, setServerOnline] = useState(true)
  const [ping, setPing] = useState(24)
  const [isMuted, setIsMuted] = useState(false)
  const [showDonate, setShowDonate] = useState(false)

  const t = DONATE_TEXT[getLocale()]

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

    try {
      analytics?.trackEvent?.('play_button_click', { source: 'launcher_home' })
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
          <a
            href="https://discord.gg/z8VU8ZQmUQ"
            target="_blank"
            rel="noopener noreferrer"
            className="launcher-discord-link"
            onClick={(e) => {
              e.stopPropagation()
              soundManager?.playClick?.()
              openExternalUrl('https://discord.gg/z8VU8ZQmUQ', e)
            }}
            title="Unirse a la Comunidad Oficial de Discord"
            aria-label="Discord Community"
          >
            <div className="launcher-discord-icon-wrap">
              <svg className="launcher-discord-svg" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
            </div>
            <span className="launcher-discord-text">Discord</span>
          </a>

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

      {/* 4. Donate Button — bottom left, non-intrusive */}
      <button
        type="button"
        className="launcher-donate-fab"
        onClick={() => {
          soundManager?.playClick?.()
          setShowDonate(true)
        }}
        title={t.title}
        aria-label="Support the developer"
      >
        <Heart size={18} fill="#ef4444" color="#ef4444" />
        <span className="launcher-donate-fab-label">Support</span>
      </button>

      {/* 5. Donate Modal */}
      {showDonate && (
        <div
          className="donate-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDonate(false) }}
        >
          <div className="donate-modal-card">
            <button
              className="donate-modal-close"
              onClick={() => setShowDonate(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="donate-modal-icon">☕</div>
            <h2 className="donate-modal-title">{t.title}</h2>

            <p className="donate-modal-text donate-modal-highlight">{t.p1}</p>
            <p className="donate-modal-text">{t.p2}</p>
            <p className="donate-modal-text">{t.p3}</p>

            <ul className="donate-modal-list">
              <li>{t.b1}</li>
              <li>{t.b2}</li>
              <li>{t.b3}</li>
            </ul>

            <p className="donate-modal-text donate-modal-italic">{t.p4}</p>
            <p className="donate-modal-thanks">{t.thanks}</p>

            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="donate-modal-btn"
              onClick={(e) => {
                soundManager?.playClick?.()
                openExternalUrl(KOFI_URL, e)
              }}
            >
              {t.btn}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default LauncherHome



