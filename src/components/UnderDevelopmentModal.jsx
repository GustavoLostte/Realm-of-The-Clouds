import React, { useEffect } from 'react'
import { Crown, Sparkles, Globe, X, BellRing, ShieldCheck, Swords } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { openExternalUrl } from '../utils/openExternalUrl'
import './UnderDevelopmentModal.css'

export function UnderDevelopmentModal({ isOpen, onClose, onEnterGuest }) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        soundManager.playClick?.()
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleDiscordClick = (e) => {
    soundManager.playClick?.()
    openExternalUrl('https://discord.gg/ThNaG4pzy', e)
  }

  const handleWebsiteClick = (e) => {
    soundManager.playClick?.()
    openExternalUrl('https://rok-web-site.vercel.app/', e)
  }

  const handleClose = () => {
    soundManager.playButtonClick?.()
    onClose?.()
  }

  return (
    <div 
      className="dev-notice-backdrop"
      onClick={(e) => {
        e.stopPropagation()
        handleClose()
      }}
    >
      <div 
        className="dev-notice-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dev-notice-title"
      >
        {/* Subtle Ambient Gold Particle FX */}
        <div className="dev-notice-glow" />

        {/* Close Button */}
        <button
          type="button"
          className="dev-notice-close-btn"
          onClick={handleClose}
          title={t('common.close') || 'Cerrar'}
          aria-label={t('common.close') || 'Cerrar'}
        >
          <X size={18} />
        </button>

        {/* Header Icon with Radiant Glow */}
        <div className="dev-notice-icon-container">
          <div className="dev-notice-icon-halo" />
          <div className="dev-notice-icon-box">
            <Crown className="dev-notice-crown-icon" />
            <Sparkles className="dev-notice-sparkle-icon" />
          </div>
        </div>

        {/* Pill Badge */}
        <div className="dev-notice-badge">
          <span className="dev-notice-pulse-dot" />
          <span>{t('start.devNoticeBadge') || 'ACCESO ANTICIPADO • EN DESARROLLO'}</span>
        </div>

        {/* Title & Subtitle */}
        <h2 id="dev-notice-title" className="dev-notice-title">
          {t('start.devNoticeTitle') || 'Las Puertas del Reino se Están Forjando'}
        </h2>
        <span className="dev-notice-subtitle">
          {t('start.devNoticeSubtitle') || 'Apertura Oficial Próximamente'}
        </span>

        {/* Scrollable / Padded Body Text */}
        <div className="dev-notice-body">
          <p className="dev-notice-greeting">
            {t('start.devNoticeGreeting') || '¡Saludos, noble Soberano! 🛡️✨'}
          </p>
          <p className="dev-notice-text">
            {t('start.devNoticeBody1') ||
              'El universo de Realm of the Clouds se encuentra actualmente en su fase final de desarrollo y pulido artesanal para entregarte una experiencia legendaria e inolvidable.'}
          </p>
          <p className="dev-notice-text highlight">
            {t('start.devNoticeBody2') ||
              'Muy pronto abriremos de par en par las puertas del Reino para recibirte en sus tierras y dar inicio a tu reinado.'}
          </p>

          {/* Heartfelt Gratitude Card */}
          <div className="dev-notice-thanks-card">
            <div className="dev-notice-thanks-icon">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <p className="dev-notice-thanks-text">
              {t('start.devNoticeThanks') ||
                'Queremos agradecerte de todo corazón por instalar la aplicación, por tu valiosa paciencia y por tu apoyo incondicional. ¡Tu presencia aquí significa el mundo para nosotros!'}
            </p>
          </div>

          <p className="dev-notice-community-call">
            <BellRing className="w-4 h-4 text-sky-400 inline-block mr-1.5 flex-shrink-0" />
            {t('start.devNoticeDiscordCta') ||
              'Únete a nuestro Discord oficial y visita nuestro sitio web para ser el primero en recibir avances exclusivos y la fecha exacta de apertura.'}
          </p>
        </div>

        {/* External Community Links Row */}
        <div className="dev-notice-links-row">
          <button
            type="button"
            className="dev-notice-social-btn discord-btn"
            onClick={handleDiscordClick}
            title="Unirse a Discord"
          >
            <div className="dev-notice-social-icon-wrap discord">
              <svg className="w-4 h-4 text-white" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
            </div>
            <div className="dev-notice-social-text">
              <span className="dev-notice-social-title">Discord Oficial</span>
              <span className="dev-notice-social-sub">Comunidad & Avisos</span>
            </div>
          </button>

          <button
            type="button"
            className="dev-notice-social-btn website-btn"
            onClick={handleWebsiteClick}
            title="Visitar Sitio Web"
          >
            <div className="dev-notice-social-icon-wrap website">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div className="dev-notice-social-text">
              <span className="dev-notice-social-title">Sitio Web</span>
              <span className="dev-notice-social-sub">rok-web-site.vercel.app</span>
            </div>
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="dev-notice-action-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {onEnterGuest && (
            <button
              type="button"
              className="dev-notice-primary-btn"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #f59e0b 100%)',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                border: '1.5px solid rgba(254, 240, 138, 0.7)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.92rem',
              }}
              onClick={() => {
                soundManager.playButtonClick?.()
                onEnterGuest()
              }}
            >
              <Swords className="w-4 h-4 text-amber-200" />
              <span>MODO INVITADO (PROBAR CAMPEONES)</span>
            </button>
          )}

          <button
            type="button"
            className="dev-notice-secondary-btn"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={handleClose}
          >
            <span>{t('start.devNoticeCloseBtn') || 'Cerrar aviso'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

