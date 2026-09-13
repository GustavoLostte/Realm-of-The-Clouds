import React, { useEffect } from 'react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './RoyalConfirmModal.css'

/**
 * RoyalConfirmModal
 * Elegant, custom-styled medieval confirmation dialog replacing all generic browser alert/confirm popups.
 */
export function RoyalConfirmModal({
  isOpen,
  title,
  message,
  icon,
  confirmText,
  cancelText,
  danger = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        soundManager.playClick?.()
        onCancel?.()
      } else if (e.key === 'Enter') {
        soundManager.playButtonClick?.()
        onConfirm?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onConfirm, onCancel])

  if (!isOpen) return null

  const defaultIcon = danger 
    ? '/assets/hud_icons/icon_shield.webp' 
    : '/assets/hud_icons/btn_ranking.webp'

  return (
    <div 
      className="royal-confirm-backdrop" 
      onClick={(e) => {
        e.stopPropagation()
        soundManager.playClick?.()
        onCancel?.()
      }}
    >
      <div 
        className={`royal-confirm-card ${danger ? 'danger' : 'royal'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="royal-confirm-icon-box">
          <img 
            src={icon || defaultIcon} 
            alt="Confirmación" 
            className="royal-confirm-icon-img" 
            draggable="false" 
          />
        </div>

        <h3 className="royal-confirm-title">
          {title || t('common.confirm') || 'Confirmación Real'}
        </h3>

        <p className="royal-confirm-message">
          {message}
        </p>

        <div className="royal-confirm-actions">
          <button
            type="button"
            className="royal-confirm-btn royal-confirm-btn-cancel"
            onClick={() => {
              soundManager.playClick?.()
              onCancel?.()
            }}
          >
            {cancelText || t('common.cancel') || 'Cancelar'}
          </button>

          <button
            type="button"
            className={`royal-confirm-btn royal-confirm-btn-confirm ${danger ? 'danger' : 'primary'}`}
            onClick={() => {
              soundManager.playButtonClick?.()
              onConfirm?.()
            }}
          >
            {confirmText || t('common.confirm') || 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoyalConfirmModal
