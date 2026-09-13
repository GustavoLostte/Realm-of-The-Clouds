import React, { useState, useEffect } from 'react'
import { Hammer, Clock, Coins, Trees, Mountain, Gem, AlertCircle, Lock, Sparkles, Shield } from 'lucide-react'
import { BUILDING_TYPES, getBuildingMaxAllowed, getBuildingCurrentCount } from '../data/buildingsData'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'

export function BuildModal({ 
  isOpen, 
  onClose, 
  onSelectBuilding, 
  targetSlot, 
  resources,
  kingdomLevel = 1,
  recommendedBuildingId = null,
  slots = [],
}) {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState('todos')

  useEffect(() => {
    if (isOpen && recommendedBuildingId) {
      setActiveCategory('todos')
    }
  }, [isOpen, recommendedBuildingId])

  if (!isOpen) return null

  const categories = [
    { id: 'todos', label: t('build.tabAll') },
    { id: 'gobierno', label: t('build.tabGovernment') },
    { id: 'produccion', label: t('build.tabProduction') },
    { id: 'militar', label: t('build.tabMilitary') },
    { id: 'arcano', label: t('build.tabArcane') },
  ]

  const buildingsList = Object.values(BUILDING_TYPES).filter((b) => {
    if (activeCategory === 'todos') return true
    if (activeCategory === 'arcano') return b.category === 'arcano' || b.category === 'social'
    return b.category === activeCategory
  })

  const formatBuildDuration = (seconds) => {
    if (!seconds) return '30s'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m > 0 && s > 0) return `${m}m ${s}s`
    if (m > 0) return `${m}m`
    return `${s}s`
  }

  const canAfford = (cost) => {
    if (cost.gold && resources.gold < cost.gold) return false
    if (cost.wood && resources.wood < cost.wood) return false
    if (cost.stone && resources.stone < cost.stone) return false
    if (cost.gems && resources.gems < cost.gems) return false
    return true
  }

  const handleBuild = (bld) => {
    if (bld.minKingdomLevel && kingdomLevel < bld.minKingdomLevel) return
    const currentBuilt = getBuildingCurrentCount(bld.id, slots)
    const maxAllowed = getBuildingMaxAllowed(bld.id)
    if (currentBuilt >= maxAllowed) return
    if (!canAfford(bld.cost)) return
    soundManager.playBuildingSound(bld.id, true)
    onSelectBuilding(bld.id, targetSlot)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="game-modal build-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Hammer className="modal-title-icon" size={22} />
            <div>
              <h3>{t('build.modalTitle')}</h3>
              <p className="modal-subtitle">{t('build.modalSubtitle', { level: kingdomLevel })}</p>
            </div>
          </div>
          <button className="modal-close-candy-btn" onClick={() => { soundManager.playClick(); onClose() }} title={t('common.close')}>
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        </div>

        {/* Categories Tabs */}
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => { soundManager.playClick(); setActiveCategory(cat.id) }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Buildings Grid */}
        <div className="buildings-grid">
          {buildingsList.map((bld) => {
            const isLevelLocked = Boolean(bld.minKingdomLevel && kingdomLevel < bld.minKingdomLevel)
            const currentBuilt = getBuildingCurrentCount(bld.id, slots)
            const maxAllowed = getBuildingMaxAllowed(bld.id)
            const isLimitReached = currentBuilt >= maxAllowed
            const affordable = canAfford(bld.cost)
            const isRecommended = recommendedBuildingId === bld.id
            const bldName = t('buildings.slots.' + bld.id + '.name') || bld.name
            const bldDesc = t('buildings.slots.' + bld.id + '.desc') || bld.description

            return (
              <div 
                key={bld.id} 
                className={`building-catalog-card ${isRecommended ? 'is-recommended' : ''} ${isLevelLocked ? 'level-locked' : isLimitReached ? 'limit-reached' : affordable ? 'can-build' : 'cannot-afford'}`}
              >
                {isRecommended && (
                  <div className="recommended-quest-badge">
                    <Sparkles size={13} className="sparkle-spin" />
                    <span>{t('build.recommendedQuest')}</span>
                  </div>
                )}
                <div className="card-preview">
                  <img src={bld.poster || bld.image} alt={bldName} className="card-sprite" />
                  <span className="bld-tag">
                    {bld.category === 'gobierno' ? t('build.tabGovernment') :
                     bld.category === 'produccion' ? t('build.tabProduction') :
                     bld.category === 'militar' ? t('build.tabMilitary') :
                     t('build.tabArcane')}
                  </span>
                  {isLevelLocked && (
                    <div className="level-lock-overlay">
                      <Lock size={18} />
                      <span>{t('common.levelShort')} {bld.minKingdomLevel}</span>
                    </div>
                  )}
                  {isLimitReached && !isLevelLocked && (
                    <div className="limit-lock-overlay">
                      <Shield size={20} />
                      <span>{bld.isUnique ? t('build.uniqueStructure') : t('build.limitReached')}</span>
                      <small>{t('build.builtOf', { current: currentBuilt, max: maxAllowed })}</small>
                    </div>
                  )}
                </div>

                <div className="card-info">
                  <div className="bld-title-row">
                    <h4>{bldName}</h4>
                    <div className="bld-badges-wrap" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className={`bld-count-badge ${isLimitReached ? 'limit-reached' : 'available'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {bld.isUnique ? (
                          <>
                            <img src="/assets/hud_icons/btn_ranking.webp" alt={t('build.unique')} className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                            <span>{isLimitReached ? t('build.uniqueOneOfOne') : t('build.unique')}</span>
                          </>
                        ) : (
                          <>
                            <img src="/assets/hud_icons/btn_build.webp" alt={t('build.modalTitle')} className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                            <span>{currentBuilt}/{maxAllowed}</span>
                          </>
                        )}
                      </span>
                      {bld.minKingdomLevel > 1 && (
                        <span className={`bld-req-level ${isLevelLocked ? 'locked' : 'unlocked'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <img 
                            src={isLevelLocked ? "/assets/hud_icons/icon_lock.webp" : "/assets/hud_icons/icon_check.webp"} 
                            alt={isLevelLocked ? t('common.locked') : t('common.unlocked')} 
                            className="mini-res-icon" 
                            style={{ width: 14, height: 14, objectFit: 'contain' }}
                          />
                          <span>{t('common.levelShort')} {bld.minKingdomLevel}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="card-desc">{bldDesc}</p>

                  {/* Production & combat stats */}
                  <div className="card-yield">
                    {bld.production?.gold > 0 && (
                      <span className="yield-item gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <img src="/assets/hud_icons/icon_gold.webp" alt={t('resources.gold')} className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        <span>+{bld.production.gold} {t('resources.gold')} {t('common.perCycle')} ({bld.productionCycleSec || 120}s)</span>
                      </span>
                    )}
                    {bld.production?.food > 0 && (
                      <span className="yield-item food" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <img src="/assets/hud_icons/icon_food.webp" alt={t('resources.food')} className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        <span>+{bld.production.food} {t('resources.food')} {t('common.perCycle')} ({bld.productionCycleSec || 120}s)</span>
                      </span>
                    )}
                    {bld.production?.wood > 0 && (
                      <span className="yield-item wood" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <img src="/assets/hud_icons/icon_wood.webp" alt={t('resources.wood')} className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        <span>+{bld.production.wood} {t('resources.wood')} {t('common.perCycle')} ({bld.productionCycleSec || 120}s)</span>
                      </span>
                    )}
                    {bld.production?.stone > 0 && (
                      <span className="yield-item stone" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <img src="/assets/hud_icons/icon_stone.webp" alt={t('resources.stone')} className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        <span>+{bld.production.stone} {t('resources.stone')} {t('common.perCycle')} ({bld.productionCycleSec || 120}s)</span>
                      </span>
                    )}
                    {bld.production?.gems > 0 && (
                      <span className="yield-item gems" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <img src="/assets/hud_icons/icon_gem.webp" alt={t('resources.gems')} className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        <span>+{bld.production.gems} {t('resources.gems')} {t('common.perCycle')} ({bld.productionCycleSec || 120}s)</span>
                      </span>
                    )}
                    {bld.populationProvided > 0 && (
                      <span className="yield-item pop" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <img src="/assets/hud_icons/icon_population.webp" alt={t('resources.population')} className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        <span>{t('build.capacityPop', { val: bld.populationProvided })}</span>
                      </span>
                    )}
                    {bld.defense > 0 && (
                      <span className="yield-item defense" style={{ background: 'rgba(59, 130, 246, 0.18)', color: '#93c5fd', borderColor: 'rgba(59, 130, 246, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <img src="/assets/hud_icons/icon_shield.webp" alt={t('common.defense')} className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        <span>{t('build.defenseStat', { val: bld.defense })}</span>
                      </span>
                    )}
                    {bld.attack > 0 && (
                      <span className="yield-item attack" style={{ background: 'rgba(239, 68, 68, 0.18)', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <img src="/assets/hud_icons/btn_army.webp" alt={t('common.attack')} className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        <span>{t('build.attackStat', { val: bld.attack })}</span>
                      </span>
                    )}
                  </div>

                  {/* Cost Row */}
                  <div className="card-cost-row">
                    <span className="cost-label">{t('common.cost')}:</span>
                    <div className="cost-items">
                      {bld.cost.gold && (
                        <span className={`cost-pill ${resources.gold < bld.cost.gold ? 'insufficient' : ''}`}>
                          <Coins size={12} /> {bld.cost.gold}
                        </span>
                      )}
                      {bld.cost.wood && (
                        <span className={`cost-pill ${resources.wood < bld.cost.wood ? 'insufficient' : ''}`}>
                          <Trees size={12} /> {bld.cost.wood}
                        </span>
                      )}
                      {bld.cost.stone && (
                        <span className={`cost-pill ${resources.stone < bld.cost.stone ? 'insufficient' : ''}`}>
                          <Mountain size={12} /> {bld.cost.stone}
                        </span>
                      )}
                      {bld.cost.gems && (
                        <span className={`cost-pill ${resources.gems < bld.cost.gems ? 'insufficient' : ''}`}>
                          <Gem size={12} /> {bld.cost.gems}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Construction Action */}
                  <div className="card-actions">
                    <span className="time-badge">
                      <Clock size={13} /> {formatBuildDuration(bld.buildTimeSec)}
                    </span>

                    <button 
                      className={`btn-build-submit ${isLevelLocked ? 'locked' : isLimitReached ? 'limit-reached' : affordable ? 'primary' : 'disabled'}`}
                      disabled={isLevelLocked || isLimitReached || !affordable}
                      onClick={() => handleBuild(bld)}
                    >
                      {isLevelLocked ? (
                        <>
                          <Lock size={15} /> {t('build.unlocksAtLevel', { level: bld.minKingdomLevel })}
                        </>
                      ) : isLimitReached ? (
                        <>
                          <Shield size={15} /> {bld.isUnique ? t('build.uniqueBuilt') : t('build.maxLimitReached', { current: maxAllowed, max: maxAllowed })}
                        </>
                      ) : affordable ? (
                        <>
                          <Hammer size={15} /> {t('build.erectBuilding')}
                        </>
                      ) : (
                        <>
                          <AlertCircle size={15} /> {t('build.insufficientResources')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
