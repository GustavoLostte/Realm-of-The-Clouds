import React, { useState, useEffect } from 'react'
import { 
  ArrowUpCircle, 
  Trash2, 
  Coins, 
  Trees, 
  Mountain, 
  Sparkles, 
  Shield, 
  Clock, 
  Zap,
  Wheat,
  Gem,
  Hammer
} from 'lucide-react'
import { BUILDING_TYPES, SPEEDUP_TYPES, getMaxProductionBatches, getBuildingDef } from '../data/buildingsData'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import { RoyalConfirmModal } from './RoyalConfirmModal'

export function BuildingDetailsModal({ 
  isOpen, 
  onClose, 
  slot, 
  resources = {}, 
  speedups = {},
  vipStatus = {},
  onUpgradeBuilding, 
  onDemolishBuilding,
  onCollect,
  onSpeedupBuilding,
  onUseSpeedup,
  onOpenArmy,
  onOpenExpeditions,
  onOpenInventory,
  onOpenTechTree,
  storageCapacity,
}) {
  const { t } = useTranslation()
  // Local tick for smooth countdown display
  const [, setTick] = useState(0)
  const [selectedSpeedup, setSelectedSpeedup] = useState(null)
  const [showDemolishConfirm, setShowDemolishConfirm] = useState(false)
  useEffect(() => {
    if (!isOpen) {
      soundManager.stopBuildingSound()
      return
    }
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => {
      clearInterval(timer)
      soundManager.stopBuildingSound()
    }
  }, [isOpen])

  if (!isOpen || !slot || !slot.buildingId) return null

  const bld = getBuildingDef(slot.buildingId) || BUILDING_TYPES[slot.buildingId.toUpperCase()]
  if (!bld) return null

  const currentLevel = slot.level || 1
  const bldName = t(`buildings.slots.${bld.id}.name`) || bld.name
  const bldDesc = t(`buildings.slots.${bld.id}.desc`) || bld.description

  const upgradeCost = {
    gold: Math.round((bld.cost?.gold || 100) * 1.5 * currentLevel),
    wood: Math.round((bld.cost?.wood || 50) * 1.4 * currentLevel),
    stone: Math.round((bld.cost?.stone || 50) * 1.4 * currentLevel),
  }

  const canAffordUpgrade = 
    (resources?.gold || 0) >= upgradeCost.gold &&
    (resources?.wood || 0) >= upgradeCost.wood &&
    (resources?.stone || 0) >= upgradeCost.stone

  const handleUpgrade = () => {
    if (!canAffordUpgrade || slot.isConstructing) return
    soundManager.playBuildingSound(slot.buildingId, true)
    onUpgradeBuilding(slot, upgradeCost)
  }

  const isIndestructible = bld.id === 'ayuntamiento' || bld.id === 'castillo' || bld.category === 'gobierno'

  const handleClose = () => {
    soundManager.stopBuildingSound()
    soundManager.playClick()
    onClose()
  }

  const handleDemolish = () => {
    if (isIndestructible) return
    soundManager.playClick()
    setShowDemolishConfirm(true)
  }

  const handleConfirmDemolish = () => {
    soundManager.stopBuildingSound()
    soundManager.playButtonClick?.()
    setShowDemolishConfirm(false)
    onDemolishBuilding(slot)
    onClose()
  }

  // Calculate construction countdown if constructing
  const now = Date.now()
  const startedAt = slot.constructionStartedAt || now
  const durationSec = slot.constructionDurationSec || 60
  const elapsedSec = Math.max(0, (now - startedAt) / 1000)
  const remainingSec = Math.max(0, Math.ceil(durationSec - elapsedSec))
  const remainingMin = Math.floor(remainingSec / 60)
  const remainingSecRem = remainingSec % 60
  const countdownFormatted = `${remainingMin.toString().padStart(2, '0')}:${remainingSecRem.toString().padStart(2, '0')}`

  const freeThresholdSec = vipStatus?.hasEngineering ? 300 : 180
  const isFreeSpeedup = remainingSec <= freeThresholdSec
  const costGems = isFreeSpeedup ? 0 : Math.max(2, Math.ceil(remainingSec / 50))

  // Calculate production cycle accumulation if completed
  const hasProduction = bld.production && Object.keys(bld.production).length > 0
  const lastHarvest = slot.lastHarvestAt || (now - 60000)
  const harvestElapsedSec = Math.max(0, (now - lastHarvest) / 1000)
  const cycleSec = (bld.productionCycleSec || 120) * (vipStatus?.hasEngineering ? 0.75 : 1)
  const maxBatches = getMaxProductionBatches(vipStatus?.hasOneClickHarvest || vipStatus?.hasEngineering)
  const batchRatio = Math.min(maxBatches, harvestElapsedSec / cycleSec)
  const percentFull = Math.min(100, Math.round((batchRatio / maxBatches) * 100))
  const isFullCapacity = batchRatio >= maxBatches
  const canHarvest = batchRatio >= 0.25

  const nextBatchRemainingSec = Math.max(0, Math.ceil(cycleSec - (harvestElapsedSec % cycleSec)))
  const nextBatchMin = Math.floor(nextBatchRemainingSec / 60)
  const nextBatchSec = nextBatchRemainingSec % 60
  const nextBatchFormatted = `${nextBatchMin.toString().padStart(2, '0')}:${nextBatchSec.toString().padStart(2, '0')}`

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="game-modal details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <img src={bld.image} alt={bldName} className="details-header-sprite" draggable="false" />
            <div>
              <h3>{bldName}</h3>
              <span className="details-level-badge">{t('buildings.levelLabel', { level: currentLevel })}</span>
            </div>
          </div>
          <button className="modal-close-candy-btn" onClick={handleClose} title={t('common.close')}>
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        </div>

        {/* Content */}
        <div className="details-body">
          <p className="details-desc">{bldDesc}</p>

          {/* Construction & Speedup Section */}
          {slot.isConstructing && (
            <div className="speedup-details-card">
              <div className="speedup-header">
                <div className="speedup-header-title">
                  <Hammer className="clock-anim" size={18} />
                  <span>{t('buildings.underConstruction')} {slot.targetLevel ? `(${t('buildings.towardsLevel', { level: slot.targetLevel })})` : ''}</span>
                </div>
                <div className="countdown-pill">
                  <Clock size={14} />
                  <span>{countdownFormatted} {t('common.remaining')}</span>
                </div>
              </div>

              {/* Progress track */}
              <div className="details-progress-track">
                <div 
                  className="details-progress-fill" 
                  style={{ width: `${slot.progress || 10}%` }} 
                />
              </div>

              {/* Speedup items row */}
              <div className="speedup-tokens-container">
                <span className="speedup-tokens-title">{t('buildings.speedupTokensTitle')}</span>
                <div className="speedup-tokens-grid">
                  {Object.entries(SPEEDUP_TYPES).map(([id, item]) => {
                    const count = speedups[id] || 0
                    return (
                      <button
                        key={id}
                        className={`speedup-token-btn ${count > 0 ? 'has-tokens' : 'empty'}`}
                        disabled={count <= 0}
                        onClick={() => onUseSpeedup?.(slot.id, id)}
                        title={`${item.name} (-${item.label})`}
                      >
                        <span className="speedup-token-icon">
                          <img src={item.icon} alt="" className="mini-res-icon" style={{ width: 18, height: 18 }} />
                        </span>
                        <span className="speedup-token-label">-{item.label}</span>
                        <span className="speedup-token-count">x{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Instant Gem or Free Finish Button */}
              <button 
                className={`btn-finish-instant ${isFreeSpeedup ? 'is-free' : ''}`}
                onClick={() => {
                  onSpeedupBuilding?.(slot)
                  onClose()
                }}
              >
                <Zap size={16} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {isFreeSpeedup ? (
                    <>
                      <img src="/assets/hud_icons/icon_speedup.webp" alt="Acelerar" className="mini-res-icon" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                      <span>{t('buildings.freeSpeedupBtn')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('buildings.instantFinishGems', { cost: costGems })}</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          )}

          {/* Production & Storage Section */}
          {!slot.isConstructing && hasProduction && (
            <div className="production-cycle-box">
              <div className="production-header-row">
                <div className="prod-title-group">
                  <Sparkles size={16} className="sparkle-gold" />
                  <h5>{t('buildings.productionStorage')}</h5>
                </div>
                <span className={`prod-status-tag ${isFullCapacity ? 'full' : canHarvest ? 'ready' : 'producing'}`}>
                  {isFullCapacity ? t('buildings.storageFull') : canHarvest ? t('buildings.readyHarvest') : t('buildings.producing')}
                </span>
              </div>

              {/* Fill Track */}
              <div className="prod-storage-track">
                <div 
                  className={`prod-storage-fill ${isFullCapacity ? 'full-pulsing' : ''}`} 
                  style={{ width: `${percentFull}%` }} 
                />
              </div>

              <div className="prod-meta-row">
                <span className="prod-percent-text">{t('buildings.storedRatio', { percent: percentFull, count: Math.floor(batchRatio), max: maxBatches })}</span>
                {!isFullCapacity && (
                  <span className="prod-next-text">{t('buildings.nextBatchIn', { time: nextBatchFormatted })}</span>
                )}
              </div>
            </div>
          )}

          <div className="details-stats-panel">
            <h4>{t('buildings.cycleOutput', { level: currentLevel })}</h4>
            <div className="stats-pills-row">
              {bld.production?.gold && (
                <div className="stat-pill gold">
                  <Coins size={16} />
                  <span>+{bld.production.gold * currentLevel} {t('resources.gold')} / {t('common.cycle')}</span>
                </div>
              )}
              {bld.production?.wood && (
                <div className="stat-pill wood">
                  <Trees size={16} />
                  <span>+{bld.production.wood * currentLevel} {t('resources.wood')} / {t('common.cycle')}</span>
                </div>
              )}
              {bld.production?.stone && (
                <div className="stat-pill stone">
                  <Mountain size={16} />
                  <span>+{bld.production.stone * currentLevel} {t('resources.stone')} / {t('common.cycle')}</span>
                </div>
              )}
              {bld.production?.food && (
                <div className="stat-pill food">
                  <Wheat size={16} />
                  <span>+{bld.production.food * currentLevel} {t('resources.food')} / {t('common.cycle')}</span>
                </div>
              )}
              {bld.production?.gems && (
                <div className="stat-pill gem">
                  <Gem size={16} />
                  <span>+{bld.production.gems * currentLevel} {t('resources.gems')} / {t('common.cycle')}</span>
                </div>
              )}
              {bld.populationProvided && (
                <div className="stat-pill pop">
                  <Shield size={16} />
                  <span>{t('buildings.populationCapacity', { amount: bld.populationProvided * currentLevel })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade Section */}
          {!slot.isConstructing && (
            <div className="upgrade-box">
              <div className="upgrade-header">
                <ArrowUpCircle className="upgrade-icon" size={20} />
                <div>
                  <h5>{t('buildings.upgradeToLevel', { level: currentLevel + 1 })}</h5>
                  <p>{t('buildings.upgradeDesc')}</p>
                </div>
              </div>

              <div className="upgrade-costs">
                <span className={`cost-pill ${resources.gold < upgradeCost.gold ? 'insufficient' : ''}`}>
                  <Coins size={12} /> {upgradeCost.gold}
                </span>
                <span className={`cost-pill ${resources.wood < upgradeCost.wood ? 'insufficient' : ''}`}>
                  <Trees size={12} /> {upgradeCost.wood}
                </span>
                <span className={`cost-pill ${resources.stone < upgradeCost.stone ? 'insufficient' : ''}`}>
                  <Mountain size={12} /> {upgradeCost.stone}
                </span>
              </div>

              <button 
                className={`btn-upgrade ${canAffordUpgrade ? 'primary' : 'disabled'}`}
                disabled={!canAffordUpgrade}
                onClick={handleUpgrade}
              >
                <ArrowUpCircle size={16} />
                {canAffordUpgrade ? t('buildings.upgradeBtnWithLevel') : t('buildings.insufficientResources')}
              </button>
            </div>
          )}

          {/* Cuartel Direct Military Recruitment Action */}
          {slot.buildingId === 'cuartel' && !slot.isConstructing && onOpenArmy && (
            <button 
              className="btn-recruit-troops-direct"
              onClick={() => {
                soundManager.stopBuildingSound()
                soundManager.playClick()
                onClose()
                onOpenArmy()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                color: '#fff',
                border: '1px solid #ef4444',
                borderRadius: '10px',
                padding: '10px 16px',
                fontWeight: 'bold',
                fontSize: '0.92rem',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 12px rgba(185, 28, 28, 0.4)',
                marginBottom: '10px',
                transition: 'all 0.15s ease',
              }}
            >
              <img src="/assets/hud_icons/btn_army.webp" alt="Tropas" style={{ width: 18, height: 18, objectFit: 'contain' }} />
              <span>{t('army.recruitTroopsDirectBtn') || 'Reclutar Tropas Militares'}</span>
            </button>
          )}

          {/* Portal Arcano: Cosmic Expeditions Action */}
          {slot.buildingId === 'portal' && !slot.isConstructing && onOpenExpeditions && (
            <button 
              className="btn-expeditions-direct"
              onClick={() => {
                soundManager.stopBuildingSound()
                soundManager.playClick()
                onClose()
                onOpenExpeditions()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
                color: '#fff',
                border: '1px solid #a78bfa',
                borderRadius: '10px',
                padding: '10px 16px',
                fontWeight: 'bold',
                fontSize: '0.92rem',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.45)',
                marginBottom: '10px',
                transition: 'all 0.15s ease',
              }}
            >
              <img src="/assets/hud_icons/btn_expedition.webp" alt="Expedición" style={{ width: 18, height: 18, objectFit: 'contain' }} />
              <span>{t('buildings.openExpeditionsBtn') || 'Abrir Grieta Cósmica & Expediciones'}</span>
            </button>
          )}



          {/* Gran Almacén: Storage Capacity Panel & Inventory Vault Action */}
          {slot.buildingId === 'almacen' && !slot.isConstructing && (
            <div className="almacen-capacity-card" style={{ marginBottom: '10px' }}>
              {storageCapacity && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 'bold' }}>
                      {t('buildings.storageCapacityTitle') || 'Capacidad de Almacenamiento'}
                    </span>
                    <span style={{ fontSize: '0.88rem', color: '#fbbf24', fontWeight: '800' }}>
                      {storageCapacity.toLocaleString()} {t('common.units') || 'unidades'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', fontSize: '0.72rem' }}>
                    <span style={{ color: resources.gold >= storageCapacity ? '#f87171' : '#e2e8f0' }}>💰 {Math.floor(resources.gold || 0)}</span>
                    <span style={{ color: resources.wood >= storageCapacity ? '#f87171' : '#e2e8f0' }}>🪵 {Math.floor(resources.wood || 0)}</span>
                    <span style={{ color: resources.stone >= storageCapacity ? '#f87171' : '#e2e8f0' }}>🪨 {Math.floor(resources.stone || 0)}</span>
                    <span style={{ color: resources.food >= storageCapacity ? '#f87171' : '#e2e8f0' }}>🌾 {Math.floor(resources.food || 0)}</span>
                  </div>
                </div>
              )}
              {onOpenInventory && (
                <button 
                  className="btn-inventory-direct"
                  onClick={() => {
                    soundManager.stopBuildingSound()
                    soundManager.playClick()
                    onClose()
                    onOpenInventory()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: '#fff',
                    border: '1px solid #fbbf24',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontWeight: 'bold',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    width: '100%',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.45)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <img src="/assets/hud_icons/btn_inventory.webp" alt="Inventario" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                  <span>{t('buildings.openInventoryBtn') || 'Abrir Bóveda e Inventario Real'}</span>
                </button>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="details-footer-actions">
            {!slot.isConstructing && hasProduction && (
              <button 
                className={`btn-collect-now ${canHarvest ? 'ready-collect' : 'disabled-collect'}`} 
                disabled={!canHarvest}
                onClick={() => {
                  onCollect(slot)
                }}
              >
                <Sparkles size={16} /> 
                {canHarvest ? t('buildings.collectTribute') : `${t('buildings.producing')} (${nextBatchFormatted})`}
              </button>
            )}

            {isIndestructible ? (
              <div className="indestructible-throne-tag" title={t('buildings.indestructibleSeatTooltip')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <img src="/assets/hud_icons/btn_ranking.webp" alt="Corona" className="mini-res-icon" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                <span>{t('buildings.indestructibleSeat')}</span>
              </div>
            ) : (
              <button className="btn-demolish" onClick={handleDemolish} title={t('buildings.demolish')}>
                <Trash2 size={16} /> {t('buildings.demolish')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Royal Confirmation Modal for Demolishing Building */}
      <RoyalConfirmModal
        isOpen={showDemolishConfirm}
        title={t('buildings.demolish') || 'Demoler Edificación'}
        message={t('buildings.demolishConfirm', { name: bldName }) || `¿Estás seguro de demoler ${bldName}? Recuperarás parte de los materiales.`}
        confirmText={t('buildings.demolish') || 'Demoler'}
        cancelText={t('common.cancel') || 'Cancelar'}
        danger={true}
        onConfirm={handleConfirmDemolish}
        onCancel={() => setShowDemolishConfirm(false)}
      />
    </div>
  )
}
