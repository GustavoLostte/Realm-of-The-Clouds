import React from 'react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './RightActionControls.css'

export function RightActionControls({
  onOpenBattle,
  onOpenSettings,
  arenaTickets = 0,
  isTutorialActive = false,
}) {
  const { t } = useTranslation()

  const handleTap = (fn) => {
    if (isTutorialActive) return
    soundManager?.playClick?.()
    fn?.()
  }

  return (
    <aside className="right-action-controls" aria-label="Acciones de Batalla y Configuración">
      {/* Botón Candy de Configuración / Ajustes (Arriba de Batalla) */}
      <button
        id="right-btn-settings"
        className="right-settings-candy-btn"
        onClick={() => handleTap(onOpenSettings)}
        title={t('hud.settingsTitle') || 'Configuración'}
        aria-label={t('hud.settingsTitle') || 'Configuración'}
      >
        <img
          src="/assets/hud_icons/btn_settings.webp"
          alt={t('hud.settingsTitle') || 'Configuración'}
          className="right-settings-candy-icon"
          draggable="false"
        />
      </button>

      {/* Botón Grande: BATALLA (PvP & PvE) - En la esquina inferior derecha */}
      <button
        id="right-btn-battle"
        className={`right-action-btn battle-btn ${arenaTickets > 0 ? 'pulse-ready' : ''}`}
        onClick={() => handleTap(onOpenBattle)}
        title={t('rightControls.battleTooltip') || 'Combates por turnos (PvP y PvE)'}
        aria-label={t('rightControls.battle') || 'Batalla'}
      >
        <div className="btn-glow-aura"></div>
        <div className="btn-icon-wrapper">
          <img
            src="/assets/hud_icons/btn_arena.webp"
            alt={t('rightControls.battle') || 'Batalla'}
            className="right-btn-candy-icon battle-icon"
            draggable="false"
          />
          {arenaTickets > 0 && (
            <span className="right-btn-badge tickets" title={`${arenaTickets} Asaltos`}>
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
