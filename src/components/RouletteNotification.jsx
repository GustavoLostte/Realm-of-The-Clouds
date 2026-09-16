import React, { useState } from 'react'
import { Sparkles, X, RotateCw } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'

export function RouletteNotification({
  isFreeSpinReady,
  onOpenWheel,
}) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!isFreeSpinReady || dismissed) return null

  const handleClick = (e) => {
    e.stopPropagation()
    soundManager.playClick?.()
    setDismissed(true)
    onOpenWheel?.()
  }

  const handleDismiss = (e) => {
    e.stopPropagation()
    soundManager.playClick?.()
    setCollapsed(true)
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    soundManager.playClick?.()
    setCollapsed((prev) => !prev)
  }

  if (collapsed) {
    return (
      <button
        type="button"
        className="lateral-event-bubble"
        onClick={(e) => {
          e.stopPropagation()
          soundManager.playClick?.()
          setCollapsed(false)
        }}
        title={t('rouletteNotify.miniTooltip')}
        aria-label={t('rouletteNotify.miniTooltip')}
      >
        <img 
          src="/assets/hud_icons/icon_roulette.webp" 
          alt="Roulette" 
          className="lateral-event-bubble-img" 
          draggable="false" 
        />
        <div className="lateral-event-bubble-badge">★</div>
      </button>
    )
  }

  return (
    <div 
      className="roulette-hud-notification-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title={t('rouletteNotify.cardTooltip')}
    >
      {/* 3D Roulette Icon with ambient glow */}
      <div className="roulette-notify-icon-frame">
        <img 
          src="/assets/hud_icons/icon_roulette.webp" 
          alt={t('rouletteNotify.title')} 
          className="roulette-notify-img" 
          draggable="false" 
        />
        <div className="roulette-notify-sparkle">
          <Sparkles size={14} />
        </div>
      </div>

      {/* Notification Text Content */}
      <div className="roulette-notify-text-wrap">
        <div className="roulette-notify-badge-row">
          <span className="roulette-pill-free">{t('rouletteNotify.freeBadge')}</span>
          <span className="roulette-notify-tag">{t('rouletteNotify.bazaarTag')}</span>
        </div>
        <h4 className="roulette-notify-title">{t('rouletteNotify.title')}</h4>
        <p className="roulette-notify-sub">
          <RotateCw size={11} className="sub-spin-icon" />
          <span>{t('rouletteNotify.dailySpinReady')}</span>
        </p>
      </div>

      {/* Action Prompt Pill & Close Button (Aligned like Royal Message) */}
      <div className="roulette-notify-actions">
        <button 
          type="button" 
          className="roulette-notify-action-pill"
          onClick={handleClick}
        >
          <span>{t('rouletteNotify.spinBtn')}</span>
        </button>

        <button 
          type="button" 
          className="roulette-notify-close-btn"
          onClick={handleDismiss}
          title={t('rouletteNotify.minimizeTooltip')}
          aria-label={t('common.close')}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
