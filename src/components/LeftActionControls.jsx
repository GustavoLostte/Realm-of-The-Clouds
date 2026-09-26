import React from 'react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './LeftActionControls.css'

export function LeftActionControls({
  onOpenKingdom,
  onOpenChat,
  unreadChatCount = 0,
  questPendingCount = 0,
  wheelFreeSpinReady = false,
  isTutorialActive = false,
}) {
  const { t } = useTranslation()

  const handleTap = () => {
    if (isTutorialActive) return
    soundManager?.playClick?.()
    onOpenKingdom?.()
  }

  const hasKingdomAlert = questPendingCount > 0 || wheelFreeSpinReady

  return (
    <aside className="left-action-controls" aria-label="Acciones del Reino y Chat">
      {/* Botón de Chat desactivado temporalmente por solicitud */}

      {/* Botón Grande: REINO / MENÚ - Alineado en la esquina inferior izquierda */}
      <button
        id="left-btn-kingdom"
        className={`left-action-btn kingdom-btn ${hasKingdomAlert ? 'has-alert' : ''}`}
        onClick={handleTap}
        title={t('rightControls.kingdomTooltip') || 'Menú del reino'}
        aria-label={t('rightControls.kingdom') || 'Reino'}
      >
        <div className="btn-glow-aura"></div>
        <div className="btn-icon-wrapper">
          <img
            src="/assets/hud_icons/icon_crown.webp"
            alt={t('rightControls.kingdom') || 'Reino'}
            className="left-btn-candy-icon kingdom-icon"
            draggable="false"
          />
          {hasKingdomAlert && (
            <span className="left-btn-badge alert">
              {questPendingCount > 0 ? questPendingCount : '★'}
            </span>
          )}
        </div>
        <div className="btn-label-box">
          <span className="btn-main-label">{t('rightControls.kingdom') || 'Reino'}</span>
          <span className="btn-sub-label">{t('rightControls.kingdomSub') || 'Menú'}</span>
        </div>
      </button>
    </aside>
  )
}
