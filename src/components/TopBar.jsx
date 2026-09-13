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



  const isShieldActive = peaceShieldUntil > Date.now()
  const resolvedPlayerName = (!playerName || playerName === 'Lord Soberano' || playerName === 'LORD SOBERANO' || playerName === 'Sovereign Lord' || playerName === 'Lorde Soberano') ? 'Lord King' : playerName

  return (
    <header className="game-topbar">
      {/* Kingdom Crest & Profile */}
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

      {/* Competitive Trophies & Ranking Pill */}
      <div 
        className="hud-trophies-pill"
        onClick={isTutorialActive ? undefined : () => {
          if (onOpenRanking) onOpenRanking('arena')
          else onOpenArena?.()
        }}
        title={t('hud.arenaCrownsTooltip', { trophies: formatFullNumber(trophies) })}
        role="button"
        tabIndex={isTutorialActive ? -1 : 0}
      >
        <img src="/assets/hud_icons/btn_ranking.webp" alt="Coronas" className="trophies-icon-img" draggable="false" />
        <span className="trophies-val">{formatCompactNumber(trophies)}</span>
        {isShieldActive && (
          <span className="peace-shield-tag" title={t('hud.peaceShieldActive')}>
            <Shield size={14} className="peace-shield-svg" />
          </span>
        )}
      </div>

      {/* Resource Badges */}
      <div className="resources-strip" id="hud-topbar-resources">
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

        <div 
          className={`resource-pill ${storageCapacity && resources.wood >= storageCapacity ? 'storage-full' : ''}`}
          title={storageCapacity 
            ? `${t('hud.resWood', { val: formatFullNumber(resources.wood) })} • ${t('buildings.storageCapacityTitle')}: ${formatFullNumber(storageCapacity)}${resources.wood >= storageCapacity ? ` • ${t('buildings.storageFull')}` : ''}`
            : t('hud.resWood', { val: formatFullNumber(resources.wood) })
          }
        >
          <div className="res-icon-wrap wood">
            <img src="/assets/hud_icons/icon_wood.webp" alt={t('resources.wood')} className="hud-res-icon" draggable="false" />
          </div>
          <div className="res-meta">
            <span className="res-name">{t('resources.wood')}</span>
            <span className="res-val">{formatCompactNumber(resources.wood)}</span>
          </div>
        </div>

        <div 
          className={`resource-pill ${storageCapacity && resources.stone >= storageCapacity ? 'storage-full' : ''}`}
          title={storageCapacity 
            ? `${t('hud.resStone', { val: formatFullNumber(resources.stone) })} • ${t('buildings.storageCapacityTitle')}: ${formatFullNumber(storageCapacity)}${resources.stone >= storageCapacity ? ` • ${t('buildings.storageFull')}` : ''}`
            : t('hud.resStone', { val: formatFullNumber(resources.stone) })
          }
        >
          <div className="res-icon-wrap stone">
            <img src="/assets/hud_icons/icon_stone.webp" alt={t('resources.stone')} className="hud-res-icon" draggable="false" />
          </div>
          <div className="res-meta">
            <span className="res-name">{t('resources.stone')}</span>
            <span className="res-val">{formatCompactNumber(resources.stone)}</span>
          </div>
        </div>

        <div 
          className={`resource-pill ${storageCapacity && resources.food >= storageCapacity ? 'storage-full' : ''}`}
          title={storageCapacity 
            ? `${t('hud.resFood', { val: formatFullNumber(resources.food) })} • ${t('buildings.storageCapacityTitle')}: ${formatFullNumber(storageCapacity)}${resources.food >= storageCapacity ? ` • ${t('buildings.storageFull')}` : ''}`
            : t('hud.resFood', { val: formatFullNumber(resources.food) })
          }
        >
          <div className="res-icon-wrap food">
            <img src="/assets/hud_icons/icon_food.webp" alt={t('resources.food')} className="hud-res-icon" draggable="false" />
          </div>
          <div className="res-meta">
            <span className="res-name">{t('resources.food')}</span>
            <span className="res-val">{formatCompactNumber(resources.food)}</span>
          </div>
        </div>

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

        <div 
          className="resource-pill" 
          title={t('hud.resPop', { val: formatFullNumber(resources.populationUsed), max: formatFullNumber(resources.populationMax) })}
        >
          <div className="res-icon-wrap pop">
            <img src="/assets/hud_icons/icon_population.webp" alt={t('resources.population')} className="hud-res-icon" draggable="false" />
          </div>
          <div className="res-meta">
            <span className="res-name">{t('resources.population')}</span>
            <span className="res-val">{formatCompactNumber(resources.populationUsed)}/{formatCompactNumber(resources.populationMax)}</span>
          </div>
        </div>

        {/* Candy Quick Harvest Button */}
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
      </div>

      {/* Quick Controls */}
      <div className="topbar-controls">
        <button 
          className="control-btn menu-btn"
          onClick={onOpenMenu}
          title={t('hud.settingsTitle')}
          aria-label={t('hud.settingsTitle')}
        >
          <img 
            src="/assets/hud_icons/btn_settings.webp" 
            alt="Menú" 
            className="control-candy-icon" 
            draggable="false" 
          />
        </button>

        <button 
          className={`control-btn sound-btn ${soundEnabled ? 'active playing' : ''}`}
          onClick={onToggleSound}
          title={soundEnabled ? t('hud.soundMute') : t('hud.soundUnmute')}
          aria-label="Toggle Sound"
        >
          <img 
            src="/assets/hud_icons/btn_sound.webp" 
            alt="Sonido" 
            className={`control-candy-icon ${!soundEnabled ? 'muted' : ''}`} 
            draggable="false" 
          />
          {soundEnabled && <span className="audio-wave-anim" />}
        </button>

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
    </header>
  )
}
