import React from 'react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './RightActionControls.css'

export function RightActionControls({
  onOpenHeroes,
  onOpenKingdom,
  onOpenSettings,
  questPendingCount = 0,
  wheelFreeSpinReady = false,
  isTutorialActive = false,
}) {
  const { t } = useTranslation()

  const handleTap = (fn) => {
    if (isTutorialActive) return
    soundManager?.playClick?.()
    fn?.()
  }

  const hasKingdomAlert = questPendingCount > 0 || wheelFreeSpinReady

  return (
    <aside className="right-action-controls" aria-label="Acciones del Reino">
      {/* Botón Candy de Configuración / Ajustes (Arriba de Reino) */}
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

      {/* NOTA: Botón de Héroes retirado momentáneamente; se accederá mediante una edificación clickeable en el feudo */}

      {/* Botón Grande: REINO / MENÚ (Alineado en la esquina inferior derecha con Batalla) */}
      <button
        id="right-btn-kingdom"
        className={`right-action-btn kingdom-btn ${hasKingdomAlert ? 'has-alert' : ''}`}
        onClick={() => handleTap(onOpenKingdom)}
        title={t('rightControls.kingdomTooltip') || 'Menú del reino'}
        aria-label={t('rightControls.kingdom') || 'Reino'}
      >
        <div className="btn-glow-aura"></div>
        <div className="btn-icon-wrapper">
          <img
            src="/assets/hud_icons/btn_build.webp"
            alt={t('rightControls.kingdom') || 'Reino'}
            className="right-btn-candy-icon kingdom-icon"
            draggable="false"
          />
          {hasKingdomAlert && (
            <span className="right-btn-badge alert">
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
