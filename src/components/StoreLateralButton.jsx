import React from 'react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './StoreLateralButton.css'

export function StoreLateralButton({
  onOpenShop,
  wheelFreeSpinReady = false,
  isTutorialActive = false,
}) {
  const { t } = useTranslation()

  const handleTap = () => {
    if (isTutorialActive) return
    soundManager?.playClick?.()
    onOpenShop?.('offers')
  }

  return (
    <aside className="store-lateral-container" aria-label="Bazar y Tienda Real">
      <button
        id="lateral-btn-store"
        className={`store-lateral-btn ${wheelFreeSpinReady ? 'has-free-spin' : ''}`}
        onClick={handleTap}
        title={t('kingdomHub.shopDesc') || 'Bazar Imperial • Ofertas y Ruleta'}
        aria-label="Abrir Tienda"
      >
        <div className="store-glow-aura" />

        <div className="store-icon-wrapper">
          <img
            src="/assets/hud_icons/icon_gem.webp"
            alt="Tienda"
            className="store-candy-icon"
            draggable="false"
          />
          {wheelFreeSpinReady && (
            <span 
              className="store-free-tag" 
              title="Giro Gratis Disponible"
            >
              ★
            </span>
          )}
        </div>

        <div className="store-info-box">
          <span className="store-title-label">
            {t('hud.shop') || 'Tienda'}
          </span>
          <span className="store-tag-pill">
            {wheelFreeSpinReady ? '¡Gratis!' : 'Bazar'}
          </span>
        </div>
      </button>
    </aside>
  )
}
