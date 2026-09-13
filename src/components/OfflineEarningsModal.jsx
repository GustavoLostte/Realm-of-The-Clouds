import React from 'react'
import { Sparkles, Clock } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'

export function OfflineEarningsModal({
  isOpen,
  earnings,
  onCollect,
}) {
  const { t } = useTranslation()

  if (!isOpen || !earnings) return null

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const handleCollect = () => {
    soundManager.playCollect()
    onCollect(earnings)
  }

  return (
    <div className="modal-backdrop offline-backdrop" onClick={handleCollect}>
      <div className="game-modal offline-earnings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="offline-header">
          <div className="offline-crest-icon">
            <img 
              src="/assets/hud_icons/btn_ranking.webp" 
              alt="Corona Imperial" 
              className="offline-crown-sprite" 
              draggable="false" 
            />
          </div>
          <h3>{t('offline.title')}</h3>
          <div className="offline-time-badge">
            <Clock size={13} />
            <span>{formatTime(earnings.elapsedSec)}</span>
          </div>
        </div>

        <div className="offline-body">
          <p className="offline-message">
            {t('offline.subtitle')}
          </p>

          <div className="offline-pills-grid">
            {earnings.gold > 0 && (
              <div className="offline-pill gold">
                <img src="/assets/hud_icons/icon_gold.webp" alt="Gold" />
                <div className="offline-pill-data">
                  <span className="pill-qty">+{earnings.gold}</span>
                  <span className="pill-name">{t('resources.gold')}</span>
                </div>
              </div>
            )}
            {earnings.wood > 0 && (
              <div className="offline-pill wood">
                <img src="/assets/hud_icons/icon_wood.webp" alt="Wood" />
                <div className="offline-pill-data">
                  <span className="pill-qty">+{earnings.wood}</span>
                  <span className="pill-name">{t('resources.wood')}</span>
                </div>
              </div>
            )}
            {earnings.stone > 0 && (
              <div className="offline-pill stone">
                <img src="/assets/hud_icons/icon_stone.webp" alt="Stone" />
                <div className="offline-pill-data">
                  <span className="pill-qty">+{earnings.stone}</span>
                  <span className="pill-name">{t('resources.stone')}</span>
                </div>
              </div>
            )}
            {earnings.food > 0 && (
              <div className="offline-pill food">
                <img src="/assets/hud_icons/icon_food.webp" alt="Food" />
                <div className="offline-pill-data">
                  <span className="pill-qty">+{earnings.food}</span>
                  <span className="pill-name">{t('resources.food')}</span>
                </div>
              </div>
            )}
            {earnings.gems > 0 && (
              <div className="offline-pill gems">
                <img src="/assets/hud_icons/icon_gem.webp" alt="Gems" />
                <div className="offline-pill-data">
                  <span className="pill-qty">+{earnings.gems}</span>
                  <span className="pill-name">{t('resources.gems')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="offline-footer">
          <button className="offline-collect-btn" onClick={handleCollect}>
            <Sparkles size={18} /> {t('offline.collectBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
