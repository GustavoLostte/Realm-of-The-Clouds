import React, { useState, useEffect } from 'react'
import { 
  Swords, 
  Shield, 
  Hammer, 
  AlertCircle,
  Clock,
  Zap,
  Sparkles,
  X,
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import './ArmyModal.css'

export function ArmyModal({ 
  isOpen, 
  onClose, 
  resources = {}, 
  onQueueTroops,
  troops = {},
  hasCuartel = true,
  cuartelLevel = 1,
  trainingQueue = [],
  onCancelTrainingJob,
  onSpeedupTraining,
  onInstantFinishTraining,
  speedups = {},
  onOpenBuild,
}) {
  const { t } = useTranslation()
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [nowTick, setNowTick] = useState(() => Date.now())

  // Smooth tick timer for active training progress bar countdown
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setNowTick(Date.now())
    }, 250)
    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  // Barracks level reduces training time by 5% per level above 1 (max 25%)
  const barracksSpeedDiscount = Math.min(0.25, Math.max(0, (cuartelLevel - 1) * 0.05))
  const getUnitTrainTime = (baseTime) => Math.max(3, Math.round(baseTime * (1 - barracksSpeedDiscount)))

  const unitCatalog = [
    {
      id: 'infantry',
      name: t('army.infantry.name') || 'Guardia del Trono (Infantería)',
      category: 'melee',
      avatar: '/assets/avatars/avatar_paladin.webp',
      role: t('army.infantry.role') || 'Vanguardia pesada con armadura bendita y escudo de león.',
      attack: 34,
      defense: 72,
      hp: 380,
      cost: { gold: 60, food: 35, gems: 0 },
      population: 1,
      trainTimeSec: getUnitTrainTime(12),
    },
    {
      id: 'archers',
      name: t('army.archers.name') || 'Arqueras de las Cumbres',
      category: 'ranged',
      avatar: '/assets/avatars/avatar_valkyrie.webp',
      role: t('army.archers.role') || 'Tiradoras letales con flechas de escarcha a larga distancia.',
      attack: 62,
      defense: 26,
      hp: 190,
      cost: { gold: 75, food: 45, gems: 0 },
      population: 1,
      trainTimeSec: getUnitTrainTime(20),
    },
    {
      id: 'mages',
      name: t('army.mages.name') || 'Canalizadores Arcanos',
      category: 'magic',
      avatar: '/assets/avatars/avatar_mage.webp',
      role: t('army.mages.role') || 'Maestros del rayo cósmico con daño de dispersión en área.',
      attack: 96,
      defense: 34,
      hp: 210,
      cost: { gold: 130, food: 60, gems: 2 },
      population: 2,
      trainTimeSec: getUnitTrainTime(35),
    },
    {
      id: 'commander',
      name: t('army.commander.name') || 'Paladín Comandante (Héroe)',
      category: 'hero',
      avatar: '/assets/avatars/avatar_king.webp',
      role: t('army.commander.role') || 'Líder supremo con aura de motivación (+20% ATK a tropas aliadas).',
      attack: 145,
      defense: 120,
      hp: 650,
      cost: { gold: 280, food: 110, gems: 5 },
      population: 3,
      trainTimeSec: getUnitTrainTime(60),
    },
  ]

  const totalTroopsCount = 
    (troops.infantry || 0) + 
    (troops.archers || 0) + 
    (troops.mages || 0) + 
    (troops.commander || 0)

  const totalMilitaryPower = 
    (troops.infantry || 0) * 34 + 
    (troops.archers || 0) * 62 + 
    (troops.mages || 0) * 96 + 
    (troops.commander || 0) * 145

  const calculateMaxAffordable = (unit) => {
    const byGold = Math.floor((resources.gold || 0) / unit.cost.gold)
    const byFood = Math.floor((resources.food || 0) / unit.cost.food)
    const byGems = unit.cost.gems > 0 ? Math.floor((resources.gems || 0) / unit.cost.gems) : 999
    const popAvailable = Math.max(0, (resources.populationMax || 0) - (resources.populationUsed || 0))
    const byPop = Math.floor(popAvailable / unit.population)
    return Math.max(0, Math.min(byGold, byFood, byGems, byPop))
  }

  const handleTrainQuantity = (unit, quantity) => {
    const maxQty = calculateMaxAffordable(unit)
    const toTrain = Math.min(quantity, maxQty)
    if (toTrain <= 0) return

    soundManager.playBuild?.()
    onQueueTroops?.(unit.id, toTrain, unit.cost, unit.population, unit.trainTimeSec)
  }

  const filteredUnits = unitCatalog.filter((u) => {
    if (selectedFilter === 'all') return true
    return u.category === selectedFilter
  })

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="game-modal army-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header candy-header">
          <div className="modal-title-wrap">
            <img 
              src="/assets/hud_icons/btn_army.webp" 
              alt={t('army.title')} 
              className="modal-candy-header-icon" 
              draggable="false" 
            />
            <div>
              <h3>{t('army.title')}</h3>
              <p className="modal-subtitle">{t('army.subtitle')}</p>
            </div>
          </div>
          <button 
            className="modal-close-candy-btn" 
            onClick={() => { soundManager.playClick(); onClose() }}
            aria-label={t('army.close')}
          >
            <img src="/assets/hud_icons/btn_close.webp" alt={t('army.close')} draggable="false" />
          </button>
        </div>

        {/* Unified Scrollable Container: header stays fixed at top, entire content scrolls smoothly */}
        <div className="modal-scroll-content army-modal-body">
          {/* Army Overview Banner */}
          <div className="army-hero-summary-strip">
            <div className="army-hero-stat">
              <span className="stat-highlight-num">{totalTroopsCount}</span>
              <span className="stat-highlight-label">{t('army.soldiersInArms')}</span>
            </div>

            <div className="army-hero-stat">
              <span className="stat-highlight-num text-amber-400" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <img src="/assets/hud_icons/btn_army.webp" alt={t('army.offensivePower')} className="mini-res-icon" style={{ width: '18px', height: '18px' }} />
                <span>{totalMilitaryPower}</span>
              </span>
              <span className="stat-highlight-label">{t('army.offensivePower')}</span>
            </div>

            <div className="army-hero-stat">
              <span className="stat-highlight-num text-blue-400">
                {resources.populationUsed || 0} / {resources.populationMax || 0}
              </span>
              <span className="stat-highlight-label">{t('army.populationCapacity')}</span>
            </div>
          </div>

          {/* Dynamic Training Queue Panel */}
          <div className="army-training-queue-section">
            <div className="queue-section-header">
              <div className="queue-title-wrap">
                <img src="/assets/hud_icons/btn_army.webp" alt="Cuartel" className="queue-title-icon" />
                <span>{t('army.trainingQueueTitle') || 'Campo de Instrucción Militar'}</span>
              </div>
              {hasCuartel && (
                <span className="cuartel-level-pill">
                  {t('buildings.level') || 'Nivel'} {cuartelLevel} ({Math.round(barracksSpeedDiscount * 100)}% {t('army.speedBonus') || 'más veloz'})
                </span>
              )}
            </div>

            {trainingQueue.length > 0 ? (() => {
              const activeJob = trainingQueue[0]
              const activeUnit = unitCatalog.find((u) => u.id === activeJob.unitId) || unitCatalog[0]
              const duration = activeJob.durationPerUnit || 15
              const startedAt = activeJob.unitStartedAt || nowTick
              const elapsed = Math.max(0, (nowTick - startedAt) / 1000)
              const remainingSec = Math.max(0, Math.ceil(duration - elapsed))
              const progressPct = Math.min(100, Math.max(0, (elapsed / duration) * 100))
              const min = Math.floor(remainingSec / 60)
              const sec = remainingSec % 60
              const countdownFormatted = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`

              return (
                <>
                  <div className="active-training-card">
                    <div className="training-unit-avatar-wrap">
                      <img src={activeUnit.avatar} alt={activeUnit.name} className="training-unit-avatar" />
                      <span className="training-pulse-dot" />
                    </div>

                    <div className="training-unit-info">
                      <div className="training-info-row">
                        <span className="training-unit-name">{activeUnit.name}</span>
                        <span className="training-batch-count">
                          {(activeJob.completedCount || 0) + 1} / {activeJob.count} {t('army.inProgress') || 'en curso'}
                        </span>
                      </div>

                      <div className="training-timer-row">
                        <span className="training-status-text">
                          <Clock size={13} /> {t('army.trainingUnit') || 'Instruyendo recluta...'}
                        </span>
                        <span className="training-countdown-num">{countdownFormatted}</span>
                      </div>

                      <div className="training-progress-track">
                        <div className="training-progress-bar" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>

                    <div className="training-card-actions">
                      {speedups?.speedup_1m > 0 && (
                        <button 
                          className="btn-speedup-training" 
                          onClick={() => onSpeedupTraining?.('speedup_1m')}
                          title={t('speedup.useSpeedupTooltip') || 'Acelerar 1 minuto con reloj de arena'}
                        >
                          <Zap size={13} /> {t('speedup.useSpeedup') || 'Acelerar'}
                        </button>
                      )}
                      <button 
                        className="btn-gem-finish-training" 
                        onClick={() => onInstantFinishTraining?.(activeJob.id, 5)}
                        title={t('army.finishInstantTooltip') || 'Finalizar soldado ahora con gemas'}
                      >
                        <Sparkles size={13} /> 5 {t('resources.gems') || 'Gemas'}
                      </button>
                      <button 
                        className="btn-cancel-training" 
                        onClick={() => onCancelTrainingJob?.(activeJob.id)}
                        title={t('army.cancelAndRefund') || 'Cancelar lote y reembolsar recursos'}
                      >
                        <X size={13} /> {t('common.cancel') || 'Cancelar'}
                      </button>
                    </div>
                  </div>

                  {trainingQueue.length > 1 && (
                    <div className="queue-upcoming-strip">
                      <span className="queue-upcoming-label">{t('army.upcomingInQueue') || 'En espera:'}</span>
                      <div className="queue-upcoming-chips">
                        {trainingQueue.slice(1).map((job, idx) => {
                          const u = unitCatalog.find((unit) => unit.id === job.unitId)
                          return (
                            <div key={job.id || idx} className="queue-chip">
                              {u && <img src={u.avatar} alt={u.name} className="queue-chip-icon" />}
                              <span>+{job.count} {u?.name?.split(' ')[0] || job.unitId}</span>
                              <button 
                                className="btn-cancel-chip" 
                                onClick={() => onCancelTrainingJob?.(job.id)}
                                title={t('army.cancelQueueItem') || 'Cancelar'}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 2px' }}
                              >
                                ✕
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )
            })() : (
              <div className="queue-empty-notice">
                <Clock size={16} className="queue-empty-icon" />
                <span>{t('army.emptyQueueMsg') || 'El campo de maniobras está disponible. Selecciona regimientos para iniciar el adiestramiento progresivo.'}</span>
              </div>
            )}
          </div>

          {/* Filter Chips - Sticky so players can filter units while scrolling */}
          <div className="candy-category-tabs army-filter-tabs">
            <button 
              className={`candy-tab-btn ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => { soundManager.playClick(); setSelectedFilter('all') }}
            >
              {t('army.filterAll')}
            </button>
            <button 
              className={`candy-tab-btn ${selectedFilter === 'melee' ? 'active' : ''}`}
              onClick={() => { soundManager.playClick(); setSelectedFilter('melee') }}
            >
              {t('army.filterMelee')}
            </button>
            <button 
              className={`candy-tab-btn ${selectedFilter === 'ranged' ? 'active' : ''}`}
              onClick={() => { soundManager.playClick(); setSelectedFilter('ranged') }}
            >
              {t('army.filterRanged')}
            </button>
            <button 
              className={`candy-tab-btn ${selectedFilter === 'magic' ? 'active' : ''}`}
              onClick={() => { soundManager.playClick(); setSelectedFilter('magic') }}
            >
              {t('army.filterMagic')}
            </button>
            <button 
              className={`candy-tab-btn ${selectedFilter === 'hero' ? 'active' : ''}`}
              onClick={() => { soundManager.playClick(); setSelectedFilter('hero') }}
            >
              {t('army.filterHero')}
            </button>
          </div>

          {/* Missing Barracks Warning Banner */}
          {!hasCuartel && (
            <div className="army-no-barracks-banner">
              <div className="banner-msg">
                <AlertCircle size={22} className="text-amber-400 shrink-0" />
                <div>
                  <h4>{t('army.barracksRequired')}</h4>
                  <p>{t('army.barracksRequiredDesc')}</p>
                </div>
              </div>
              {onOpenBuild && (
                <button 
                  className="btn-build-barracks-quick" 
                  onClick={() => {
                    soundManager.playClick()
                    onClose()
                    onOpenBuild('cuartel')
                  }}
                >
                  <Hammer size={16} />
                  <span>{t('army.buildBarracks')}</span>
                </button>
              )}
            </div>
          )}

          {/* Units Grid */}
          <div className="units-candy-grid">
            {filteredUnits.map((unit) => {
              const maxCanTrain = hasCuartel ? calculateMaxAffordable(unit) : 0
              const countInArmy = troops[unit.id] || 0
              const canAffordOne = hasCuartel && maxCanTrain >= 1

              return (
                <div key={unit.id} className="unit-candy-card">
                  {/* Portrait & Squad Count Badge */}
                  <div className="unit-portrait-box">
                    <img 
                      src={unit.avatar} 
                      alt={unit.name} 
                      className="unit-candy-avatar" 
                      draggable="false" 
                    />
                    <span className="unit-squad-badge" title={t('army.unitsInGarrison')}>
                      x{countInArmy}
                    </span>
                  </div>

                  {/* Unit Specs */}
                  <div className="unit-candy-details">
                    <div className="unit-title-row">
                      <h4>{unit.name}</h4>
                      <span className="unit-role-tag">{unit.role}</span>
                    </div>

                    {/* Stats Bars */}
                    <div className="unit-mini-stats-grid">
                      <div className="unit-mini-stat">
                        <span className="mini-stat-name">ATK</span>
                        <span className="mini-stat-val text-amber-400">{unit.attack}</span>
                      </div>
                      <div className="unit-mini-stat">
                        <span className="mini-stat-name">DEF</span>
                        <span className="mini-stat-val text-blue-400">{unit.defense}</span>
                      </div>
                      <div className="unit-mini-stat">
                        <span className="mini-stat-name">{t('army.hp')}</span>
                        <span className="mini-stat-val text-emerald-400">{unit.hp}</span>
                      </div>
                    </div>

                    {/* Cost Row */}
                    <div className="unit-candy-costs-row">
                      <span className="cost-label-text">{t('army.cost')}</span>
                      <div className={`candy-cost-pill ${(resources.gold || 0) < unit.cost.gold ? 'lacking' : ''}`}>
                        <img src="/assets/hud_icons/icon_gold.webp" alt="Gold" className="cost-icon-tiny" />
                        <span>{unit.cost.gold}</span>
                      </div>
                      <div className={`candy-cost-pill ${(resources.food || 0) < unit.cost.food ? 'lacking' : ''}`}>
                        <img src="/assets/hud_icons/icon_food.webp" alt="Food" className="cost-icon-tiny" />
                        <span>{unit.cost.food}</span>
                      </div>
                      {unit.cost.gems > 0 && (
                        <div className={`candy-cost-pill ${(resources.gems || 0) < unit.cost.gems ? 'lacking' : ''}`}>
                          <img src="/assets/hud_icons/icon_gem.webp" alt="Gems" className="cost-icon-tiny" />
                          <span>{unit.cost.gems}</span>
                        </div>
                      )}
                      <div className="candy-cost-pill pop">
                        <img src="/assets/hud_icons/icon_population.webp" alt="Pop" className="cost-icon-tiny" />
                        <span>{unit.population}</span>
                      </div>
                    </div>

                    {/* Training Duration Badge */}
                    <div className="unit-train-time-badge" title={t('army.trainingDuration') || 'Tiempo de instrucción'}>
                      <Clock size={12} />
                      <span>{unit.trainTimeSec}s / {t('army.soldierUnit') || 'soldado'}</span>
                    </div>
                  </div>

                  {/* Train Actions: +1, +5, Max */}
                  <div className="unit-actions-column">
                    <button 
                      className={`btn-recruit-candy primary ${canAffordOne ? '' : 'disabled'}`}
                      disabled={!canAffordOne}
                      onClick={() => handleTrainQuantity(unit, 1)}
                    >
                      <Swords size={14} /> {t('army.recruit1')}
                    </button>

                    <div className="multi-recruit-row">
                      <button 
                        className={`btn-recruit-candy secondary ${maxCanTrain >= 5 ? '' : 'disabled'}`}
                        disabled={maxCanTrain < 5}
                        onClick={() => handleTrainQuantity(unit, 5)}
                        title={t('army.recruitBatch', { count: 5 })}
                      >
                        +5
                      </button>
                      <button 
                        className={`btn-recruit-candy secondary ${maxCanTrain > 0 ? '' : 'disabled'}`}
                        disabled={maxCanTrain <= 0}
                        onClick={() => handleTrainQuantity(unit, maxCanTrain)}
                        title={t('army.recruitMaxPossible', { count: maxCanTrain })}
                      >
                        {t('army.recruitMax', { count: maxCanTrain })}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

