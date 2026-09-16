import React from 'react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './InventoryLateralButton.css'

export function InventoryLateralButton({
  onOpenInventory,
  itemCount = 0,
  isTutorialActive = false,
}) {
  const { t } = useTranslation()

  const handleTap = () => {
    if (isTutorialActive) return
    soundManager?.playClick?.()
    onOpenInventory?.()
  }

  return (
    <aside className="inventory-lateral-container" aria-label="Bóveda e Inventario Real">
      <button
        id="lateral-btn-inventory"
        className={`inventory-lateral-btn ${itemCount > 0 ? 'has-items' : ''}`}
        onClick={handleTap}
        title={t('dock.inventoryTooltip') || t('kingdomHub.inventoryDesc') || 'Bóveda Real • Reliquias y Consumibles'}
        aria-label="Abrir Inventario"
      >
        <div className="inventory-glow-aura" />

        <div className="inventory-icon-wrapper">
          <img
            src="/assets/hud_icons/btn_inventory.webp"
            alt="Inventario"
            className="inventory-candy-icon"
            draggable="false"
          />
          {itemCount > 0 && (
            <span 
              className="inventory-count-tag" 
              title={`${itemCount} artefactos`}
            >
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </div>

        <div className="inventory-info-box">
          <span className="inventory-title-label">
            {t('dock.inventory') || t('hud.inventory') || 'Inventario'}
          </span>
          <span className="inventory-tag-pill">
            {itemCount > 0 ? `${itemCount} ítems` : 'Bóveda'}
          </span>
        </div>
      </button>
    </aside>
  )
}
