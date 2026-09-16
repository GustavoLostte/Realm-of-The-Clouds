import React from 'react'
import { Crown, Hammer, ShoppingBag, Shield, ScrollText, Trophy, Settings, X } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './KingdomHubModal.css'

export function KingdomHubModal({
  isOpen,
  onClose,
  onOpenBuild,
  onOpenShop,
  onOpenInventory,
  onOpenQuests,
  onOpenRanking,
  onOpenSettings,
  questPendingCount = 0,
  wheelFreeSpinReady = false,
}) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const handleAction = (fn) => {
    soundManager?.playClick?.()
    onClose?.()
    fn?.()
  }

  const hubItems = [
    {
      id: 'build',
      icon: '/assets/hud_icons/btn_build.webp',
      title: t('kingdomHub.build') || 'Construcción',
      desc: t('kingdomHub.buildDesc') || 'Erige y mejora fortalezas celestiales',
      action: onOpenBuild,
      badge: null,
      glowColor: '#38bdf8',
    },
    {
      id: 'shop',
      icon: '/assets/hud_icons/icon_gem.webp',
      title: t('kingdomHub.shop') || 'Bazar Imperial',
      desc: t('kingdomHub.shopDesc') || 'Tesoros, gemas y ruleta de la fortuna',
      action: onOpenShop,
      badge: wheelFreeSpinReady ? '★' : null,
      glowColor: '#c084fc',
    },
    {
      id: 'inventory',
      icon: '/assets/hud_icons/btn_inventory.webp',
      title: t('kingdomHub.inventory') || 'Reliquias',
      desc: t('kingdomHub.inventoryDesc') || 'Artefactos y equipo sagrado',
      action: onOpenInventory,
      badge: null,
      glowColor: '#fbbf24',
    },
    {
      id: 'quests',
      icon: '/assets/hud_icons/btn_quests.webp',
      title: t('kingdomHub.quests') || 'Misiones',
      desc: t('kingdomHub.questsDesc') || 'Hazañas y decretos imperiales',
      action: onOpenQuests,
      badge: questPendingCount > 0 ? questPendingCount : null,
      glowColor: '#34d399',
    },
    {
      id: 'ranking',
      icon: '/assets/hud_icons/btn_ranking.webp',
      title: t('kingdomHub.ranking') || 'Ranking',
      desc: t('kingdomHub.rankingDesc') || 'Tabla de soberanos supremos',
      action: onOpenRanking,
      badge: null,
      glowColor: '#f59e0b',
    },
    {
      id: 'settings',
      icon: '/assets/hud_icons/btn_settings.webp',
      title: t('kingdomHub.settings') || 'Ajustes',
      desc: t('kingdomHub.settingsDesc') || 'Audio, idioma y cuenta',
      action: onOpenSettings,
      badge: null,
      glowColor: '#94a3b8',
    },
  ]

  return (
    <div className="kingdom-hub-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="kingdom-hub-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="kingdom-hub-header">
          <div className="kingdom-hub-title-box">
            <div className="kingdom-hub-crest-wrap">
              <Crown size={28} className="kingdom-crest-svg" />
            </div>
            <div>
              <h2 className="kingdom-hub-title">{t('kingdomHub.title') || 'Cámara de Gobierno'}</h2>
              <p className="kingdom-hub-subtitle">
                {t('kingdomHub.subtitle') || 'Gestión centralizada de tu soberanía y fortalezas'}
              </p>
            </div>
          </div>
          <button 
            className="kingdom-hub-close-btn" 
            onClick={() => {
              soundManager?.playClick?.()
              onClose?.()
            }}
            aria-label={t('common.close') || 'Cerrar'}
          >
            <X size={20} />
          </button>
        </div>

        {/* 6 Grid items */}
        <div className="kingdom-hub-grid">
          {hubItems.map((item) => (
            <div 
              key={item.id}
              className="kingdom-hub-card"
              onClick={() => handleAction(item.action)}
              role="button"
              tabIndex={0}
              style={{ '--card-glow': item.glowColor }}
            >
              <div className="hub-card-icon-wrap">
                <img 
                  src={item.icon} 
                  alt={item.title} 
                  className="hub-card-img" 
                  draggable="false" 
                />
                {item.badge && (
                  <span className="hub-card-badge">{item.badge}</span>
                )}
              </div>
              <div className="hub-card-text">
                <span className="hub-card-title">{item.title}</span>
                <span className="hub-card-desc">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
