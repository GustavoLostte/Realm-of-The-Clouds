import React, { useState, useEffect } from 'react'
import { Shield, Maximize2, Minimize2 } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { formatCompactNumber, formatFullNumber } from '../utils/formatters'
import { useTranslation } from '../i18n'
import { toggleGameFullscreen, isFullscreenActive, isMobileOrTouch } from '../utils/fullscreen'

export function TopBar({ 
  resources, 
  soundEnabled, 
  onToggleSound, 
  onOpenProfile, 
  onOpenMenu, 
  onOpenShop,
  onOpenArena,
  onOpenRanking,
  trophies = 250,
  peaceShieldUntil = 0,
  onOneClickHarvest,
  onOpenHarvestModal,
  hasOneClickHarvest = false,
  kingdomLevel = 1,
  xpProgress = { current: 0, max: 400, percent: 0, nextTitle: 'Feudo Fortificado' },
  poppingResource = null,
  onToggleCinematic,
  isCinematicMode = false,
  playerName = 'Lord King',
  playerAvatar = '/assets/avatars/avatar_king.webp',
  onOpenChangeName,
  storageCapacity = null,
  isTutorialActive = false,
  isFullscreen: externalIsFullscreen,
  onToggleFullscreen,
  notificationBellNode,
  toastDockNode,
  questHeraldNode,
}) {
  const { t } = useTranslation()
  const [internalIsFullscreen, setInternalIsFullscreen] = useState(isFullscreenActive)
  const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalIsFullscreen

  useEffect(() => {
    const handleFsChange = () => {
      setInternalIsFullscreen(isFullscreenActive())
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    document.addEventListener('webkitfullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      document.removeEventListener('webkitfullscreenchange', handleFsChange)
    }
  }, [])

  const toggleFullscreen = () => {
    soundManager.playClick()
    if (onToggleFullscreen) {
      onToggleFullscreen()
    } else {
      toggleGameFullscreen()
    }
  }

  // Fallback player name if empty
  const resolvedPlayerName = playerName?.trim() ? playerName : t('common.sovereign')

  return (
    <header className="game-topbar" aria-label="HUD Principal">
      {/* TopBar Left Cluster: Player Profile Crest + Notifications */}
      <div className="topbar-left-cluster">
        <div 
          className={`topbar-crest ${isTutorialActive ? '' : 'clickable'}`}
          onClick={isTutorialActive ? undefined : onOpenProfile} 
          title={t('hud.profileTooltip', { name: resolvedPlayerName, level: kingdomLevel, current: xpProgress.current, max: xpProgress.max })}
          role="button"
          tabIndex={isTutorialActive ? -1 : 0}
        >
          <div className="crest-badge">
            <img 
              src={playerAvatar || "/assets/avatars/avatar_king.webp"} 
              alt="Avatar Soberano" 
              className="crest-crown-icon" 
              draggable="false" 
            />
            <span className="crest-level">{t('common.levelShort')} {kingdomLevel}</span>
          </div>
          <div className="crest-details">
            <div className="crest-title-row">
              <span className="kingdom-title" title={resolvedPlayerName}>
                {resolvedPlayerName}
              </span>
              <span className="kingdom-xp-text">{xpProgress.current}/{xpProgress.max} {t('common.xp')}</span>
            </div>
            {/* Mini XP progress track */}
            <div className="crest-xp-bar-track">
              <div 
                className="crest-xp-bar-fill" 
                style={{ width: `${Math.min(100, Math.max(0, xpProgress.percent))}%` }}
              />
            </div>
          </div>
        </div>
        {questHeraldNode}
        {notificationBellNode}
        <div style={{ position: 'relative' }}>
          {toastDockNode}
        </div>
      </div>

      {/* TopBar Right Cluster: Harvest (Left) + Resource Badges (Gold, Gems, Shards) + Controls */}
      <div className="topbar-right-cluster">
        {/* Candy Quick Harvest Button - Al lado izquierdo del HUD de recursos */}
        <button 
          id="hud-btn-harvest"
          className={`harvest-candy-btn ${hasOneClickHarvest ? 'is-vip' : 'needs-gem'} ${isTutorialActive ? 'is-tutorial-blocked' : ''}`}
          onClick={() => {
            if (isTutorialActive) return
            soundManager.playClick()
            if (onOpenHarvestModal) {
              onOpenHarvestModal()
            } else {
              onOneClickHarvest?.()
            }
          }}
          disabled={isTutorialActive}
          title={hasOneClickHarvest ? t('hud.quickHarvestHorn') : t('hud.quickHarvestCost')}
          aria-label={t('hud.quickHarvest')}
        >
          <img 
            src="/assets/hud_icons/btn_harvest_all.webp" 
            alt="Cobrar Todo" 
            className="harvest-candy-icon-img" 
            draggable="false" 
          />
          {hasOneClickHarvest ? (
            <span className="harvest-candy-badge vip">VIP</span>
          ) : (
            <span className="harvest-candy-badge cost">
              <img 
                src="/assets/hud_icons/icon_gem.webp" 
                alt="Cristales" 
                className="gem-badge-mini-img" 
                draggable="false" 
              />
              <span>5</span>
            </span>
          )}
        </button>

        {/* Resource Badges: Exactly 3 - Gold, Gems, Celestial Shards */}
        <div className="resources-strip" id="hud-topbar-resources">
          {/* 1. Oro */}
          <div 
            className={`resource-pill ${storageCapacity && resources.gold >= storageCapacity ? 'storage-full' : ''}`}
            title={storageCapacity 
              ? `${t('hud.resGold', { val: formatFullNumber(resources.gold) })} • ${t('buildings.storageCapacityTitle')}: ${formatFullNumber(storageCapacity)}${resources.gold >= storageCapacity ? ` • ${t('buildings.storageFull')}` : ''}`
              : t('hud.resGold', { val: formatFullNumber(resources.gold) })
            }
          >
            <div className="res-icon-wrap gold">
              <img src="/assets/hud_icons/icon_gold.webp" alt={t('resources.gold')} className="hud-res-icon" draggable="false" />
            </div>
            <div className="res-meta">
              <span className="res-name">{t('resources.gold')}</span>
              <span className="res-val">{formatCompactNumber(resources.gold)}</span>
            </div>
          </div>

          {/* 2. Gemas (Cristales) */}
          <div 
            id="hud-res-gems"
            className="resource-pill gems-interactive" 
            title={t('hud.resGems', { val: formatFullNumber(resources.gems) })}
            onClick={() => onOpenShop?.('gems')}
            role="button"
            tabIndex={0}
          >
            <div className="res-icon-wrap gems">
              <img src="/assets/hud_icons/icon_gem.webp" alt={t('resources.gems')} className="hud-res-icon" draggable="false" />
            </div>
            <div className="res-meta">
              <span className="res-name">{t('resources.gems')}</span>
              <span className="res-val">{formatCompactNumber(resources.gems)}</span>
            </div>
            <button 
              className="gem-plus-btn" 
              title={t('hud.getGems')}
              onClick={(e) => {
                e.stopPropagation()
                onOpenShop?.('gems')
              }}
            >
              +
            </button>
          </div>

          {/* 3. Fragmentos Celestiales */}
          <div 
            id="hud-res-shards"
            className="resource-pill celestial-interactive" 
            title={t('hud.resCelestialShards', { val: formatFullNumber(resources.celestialShards ?? 75) })}
            role="button"
            tabIndex={0}
          >
            <div className="res-icon-wrap celestial">
              <img src="/assets/hud_icons/icon_star.webp" alt={t('resources.celestialShards')} className="hud-res-icon celestial-pulse" draggable="false" />
            </div>
            <div className="res-meta">
              <span className="res-name">{t('resources.celestialShards')}</span>
              <span className="res-val">{formatCompactNumber(resources.celestialShards ?? 75)}</span>
            </div>
          </div>
        </div>

        {/* Quick Controls */}
        <div className="topbar-controls">
          {isMobileOrTouch() && (
            <button 
              className={`control-btn fullscreen-btn ${isFullscreen ? 'active is-fullscreen' : ''}`}
              onClick={toggleFullscreen}
              title={isFullscreen ? `${t('hud.fullscreen')} (Esc)` : t('hud.fullscreen')}
              aria-label={t('hud.fullscreen')}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
