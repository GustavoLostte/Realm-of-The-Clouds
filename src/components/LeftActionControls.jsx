import React from 'react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './LeftActionControls.css'

export function LeftActionControls({
  onOpenBattle,
  arenaTickets = 0,
  isTutorialActive = false,
}) {
  const { t } = useTranslation()

  const handleTap = () => {
    if (isTutorialActive) return
    soundManager?.playClick?.()
    onOpenBattle?.()
  }

  return (
    <aside className="left-action-controls" aria-label="Combate y PvP">
      {/* Botón Grande: BATALLA (PvP & PvE) - Alineado a la izquierda inferior */}
      <button
        id="left-btn-battle"
        className={`left-action-btn battle-btn ${arenaTickets > 0 ? 'pulse-ready' : ''}`}
        onClick={handleTap}
        title={t('rightControls.battleTooltip') || 'Combates por turnos (PvP y PvE)'}
        aria-label={t('rightControls.battle') || 'Batalla'}
      >
        <div className="btn-glow-aura"></div>
        <div className="btn-icon-wrapper">
          <img
            src="/assets/hud_icons/btn_arena.webp"
            alt={t('rightControls.battle') || 'Batalla'}
            className="left-btn-candy-icon battle-icon"
            draggable="false"
          />
          {arenaTickets > 0 && (
            <span className="left-btn-badge tickets" title={`${arenaTickets} Asaltos`}>
              {arenaTickets}
            </span>
          )}
        </div>
        <div className="btn-label-box">
          <span className="btn-main-label">{t('rightControls.battle') || 'Batalla'}</span>
          <span className="btn-sub-label">{t('rightControls.battleSub') || 'PvP / PvE'}</span>
        </div>
      </button>
    </aside>
  )
}
