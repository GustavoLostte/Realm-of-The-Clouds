import React from 'react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'

export function BottomDock({ 
  onOpenArmy, 
  onOpenArena,
  onOpenRanking,
  onOpenTechTree,
  onOpenInventory,
  onOpenShop,
  onOpenQuests, 
  onOpenExpedition,
  onOpenSettings,
  questPendingCount = 0,
  arenaTickets = 0,
  wheelFreeSpinReady = false,
  isTutorialActive = false,
}) {
  const { t } = useTranslation()
  const handleClick = (fn) => {
    if (isTutorialActive) return
    soundManager.playClick()
    fn?.()
  }

  return (
    <nav className="game-bottom-dock" aria-label="Acciones del Reino">
      <div className="dock-container">

        {/* 2. Ejército */}
        <button 
          id="dock-btn-army"
          className="dock-item" 
          onClick={() => handleClick(onOpenArmy)}
          title={t('dock.armyTooltip')}
        >
          <div className="dock-icon-box">
            <img 
              src="/assets/hud_icons/btn_army.webp" 
              alt={t('dock.army')} 
              className="hud-candy-icon" 
              draggable="false" 
            />
          </div>
          <span className="dock-label">{t('dock.army')}</span>
        </button>

        {/* 3. Arena / Coliseo Competitivo (PvP) */}
        <button 
          id="dock-btn-arena"
          className={`dock-item arena-highlight ${arenaTickets > 0 ? 'has-tickets-ready' : ''}`} 
          onClick={() => handleClick(onOpenArena)}
          title={arenaTickets > 0 ? t('dock.arenaTooltipReady', { count: arenaTickets }) : t('dock.arenaTooltip')}
        >
          <div className="dock-icon-box">
            <img 
              src="/assets/hud_icons/btn_arena.webp" 
              alt={t('dock.arena')} 
              className={`hud-candy-icon arena-glow ${arenaTickets > 0 ? 'pulse-anim' : ''}`} 
              draggable="false" 
            />
            {arenaTickets > 0 && (
              <span className="dock-badge arena" title={`${arenaTickets} Asaltos PvP`}>{arenaTickets}</span>
            )}
          </div>
          <span className="dock-label">{t('dock.arena')}</span>
        </button>

        {/* 4. Ranking de Soberanos */}
        <button 
          className="dock-item ranking-highlight" 
          onClick={() => handleClick(onOpenRanking)}
          title={t('dock.rankingTooltip')}
        >
          <div className="dock-icon-box">
            <img 
              src="/assets/hud_icons/btn_ranking.webp" 
              alt={t('dock.ranking')} 
              className="hud-candy-icon ranking-glow" 
              draggable="false" 
            />
          </div>
          <span className="dock-label">{t('dock.ranking')}</span>
        </button>

        {/* 5. Investigar (Tech Tree) */}
        <button 
          className="dock-item" 
          onClick={() => handleClick(onOpenTechTree)}
          title={t('dock.researchTooltip')}
        >
          <div className="dock-icon-box">
            <img 
              src="/assets/hud_icons/btn_upgrade.webp" 
              alt={t('dock.research')} 
              className="hud-candy-icon" 
              draggable="false" 
            />
          </div>
          <span className="dock-label">{t('dock.research')}</span>
        </button>

        {/* 4. Inventario (Reliquias y Mochila) */}
        <button 
          className="dock-item" 
          onClick={() => handleClick(onOpenInventory)}
          title={t('dock.inventoryTooltip')}
        >
          <div className="dock-icon-box">
            <img 
              src="/assets/hud_icons/btn_inventory.webp" 
              alt={t('dock.inventory')} 
              className="hud-candy-icon" 
              draggable="false" 
            />
          </div>
          <span className="dock-label">{t('dock.inventory')}</span>
        </button>

        {/* 5. Tienda / Bazar Imperial */}
        <button 
          id="dock-btn-shop"
          className={`dock-item shop-highlight ${wheelFreeSpinReady ? 'has-wheel-alert' : ''}`} 
          onClick={() => handleClick(onOpenShop)}
          title={wheelFreeSpinReady ? t('dock.shopTooltipReady') : t('dock.shopTooltip')}
        >
          <div className="dock-icon-box">
            <img 
              src="/assets/hud_icons/icon_gem.webp" 
              alt={t('dock.shop')} 
              className="hud-candy-icon gem-glow" 
              draggable="false" 
            />
            {wheelFreeSpinReady && (
              <span className="dock-badge wheel-badge" title={t('dock.shopTooltipReady')}>
                ★
              </span>
            )}
          </div>
          <span className="dock-label">{t('dock.shop')}</span>
        </button>

        {/* 6. Misiones */}
        <button 
          className="dock-item" 
          onClick={() => handleClick(onOpenQuests)}
          title={t('dock.questsTooltip')}
        >
          <div className="dock-icon-box">
            <img 
              src="/assets/hud_icons/btn_quests.webp" 
              alt={t('dock.quests')} 
              className="hud-candy-icon" 
              draggable="false" 
            />
            {questPendingCount > 0 && (
              <span className="dock-badge">{questPendingCount}</span>
            )}
          </div>
          <span className="dock-label">{t('dock.quests')}</span>
        </button>

        {/* 6. Expedición */}
        <button 
          className="dock-item" 
          onClick={() => handleClick(onOpenExpedition)}
          title={t('dock.expeditionTooltip')}
        >
          <div className="dock-icon-box">
            <img 
              src="/assets/hud_icons/btn_expedition.webp" 
              alt={t('dock.expedition')} 
              className="hud-candy-icon" 
              draggable="false" 
            />
          </div>
          <span className="dock-label">{t('dock.expedition')}</span>
        </button>

        {/* 7. Configuración / Ajustes */}
        <button 
          className="dock-item" 
          onClick={() => handleClick(onOpenSettings)}
          title={t('dock.settingsTooltip')}
        >
          <div className="dock-icon-box">
            <img 
              src="/assets/hud_icons/btn_settings.webp" 
              alt={t('dock.settings')} 
              className="hud-candy-icon" 
              draggable="false" 
            />
          </div>
          <span className="dock-label">{t('dock.settings')}</span>
        </button>
      </div>
    </nav>
  )
}
