import React, { useState, useEffect, useRef } from 'react'
import { Scroll, Bell, Clock, ChevronRight, X } from 'lucide-react'
import { useTranslation } from '../i18n/index.jsx'
import { soundManager } from '../utils/audio'
import './EventBadge.css'

export function EventBadge({ activeEvent, timeLeft: externalTimeLeft, onClick, onDismiss, onExpire }) {
  const { t } = useTranslation()
  const [isMinimized, setIsMinimized] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Stable callback ref prevents interval churn on parent re-renders
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  // Autonomous local 1-second countdown: keeps ticks strictly inside EventBadge
  useEffect(() => {
    if (!activeEvent || !activeEvent.expiresAt) return
    const interval = setInterval(() => {
      const currentNow = Date.now()
      setNow(currentNow)
      if (currentNow >= activeEvent.expiresAt) {
        onExpireRef.current?.()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [activeEvent?.expiresAt])

  if (!activeEvent) return null

  const displayTimeLeft = activeEvent.expiresAt
    ? Math.max(0, Math.ceil((activeEvent.expiresAt - now) / 1000))
    : (externalTimeLeft ?? 0)

  const handleExpand = (e) => {
    e.stopPropagation()
    soundManager?.playClick?.()
    setIsMinimized(false)
  }

  if (isMinimized) {
    return (
      <button
        type="button"
        className="lateral-event-bubble"
        onClick={handleExpand}
        title={t('events.audienceRequested')}
        aria-label={t('events.audienceRequested')}
      >
        <img 
          src={activeEvent.avatar} 
          alt="Emissary" 
          className="lateral-event-bubble-img" 
          style={{ borderRadius: '50%' }}
          draggable="false" 
        />
        <div className="lateral-event-bubble-badge">
          <Bell size={10} color="#fff" />
        </div>
      </button>
    )
  }

  return (
    <div 
      id="hud-kingdom-event-badge"
      className="kingdom-event-badge"
      onClick={onClick}
      title={t('events.audienceRequested')}
    >
      <div className="event-badge-glow" />

      <div className="event-badge-avatar-wrap">
        <img 
          src={activeEvent.avatar} 
          alt={t(`kingdomEvents.${activeEvent.id}.emissaryName`) || activeEvent.emissaryName} 
          className="event-badge-avatar"
          draggable="false" 
        />
        <div className="event-badge-bell-icon">
          <Bell size={12} />
        </div>
      </div>

      <div className="event-badge-content">
        <div className="event-badge-tag">
          <Scroll size={11} />
          <span>{t('events.royalMessenger')}</span>
        </div>
        <span className="event-badge-title">{t(`kingdomEvents.${activeEvent.id}.title`) || activeEvent.title}</span>
        <div className="event-badge-timer">
          <Clock size={11} />
          <span>{t('events.secondsToAnswer', { time: displayTimeLeft })}</span>
        </div>
      </div>

      <div className="event-badge-actions">
        <div className="event-badge-arrow">
          <ChevronRight size={18} />
        </div>

        {onDismiss && (
          <button
            type="button"
            className="event-badge-close-btn"
            onClick={(e) => {
              e.stopPropagation()
              soundManager?.playClick?.()
              setIsMinimized(true)
            }}
            title={t('common.minimize') || 'Minimizar'}
            aria-label={t('common.minimize') || 'Minimizar'}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
