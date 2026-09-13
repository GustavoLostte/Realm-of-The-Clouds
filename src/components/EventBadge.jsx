import React from 'react'
import { Scroll, Bell, Clock, ChevronRight, X } from 'lucide-react'
import { useTranslation } from '../i18n/index.jsx'
import { soundManager } from '../utils/audio'

export function EventBadge({ activeEvent, timeLeft, onClick, onDismiss }) {
  const { t } = useTranslation()
  if (!activeEvent) return null

  return (
    <div 
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
          <span>{t('events.secondsToAnswer', { time: timeLeft })}</span>
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
              onDismiss()
            }}
            title={t('common.close') || 'Cerrar'}
            aria-label={t('common.close') || 'Cerrar'}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
