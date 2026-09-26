import React, { useState, useEffect } from 'react'
import './BuildingDetailsModal.css'
import { 
  ArrowUpCircle, 
  Coins, 
  Trees, 
  Mountain, 
  Sparkles, 
  Shield, 
  Wheat,
  Gem,
  Store
} from 'lucide-react'
import { BUILDING_TYPES, getMaxProductionBatches, getBuildingDef } from '../data/buildingsData'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'

export function BuildingDetailsModal({ 
  isOpen, 
  onClose, 
  slot, 
  resources = {}, 
  vipStatus = {},
  onUpgradeBuilding, 
  onCollect,
  onOpenArmy,
  onOpenExpeditions,
  onOpenInventory,
  onOpenTechTree,
  onOpenMarketInterior,
  storageCapacity,
}) {
  const { t } = useTranslation()
  // Local tick for smooth production countdown display
  const [, setTick] = useState(0)
  const [showMarketAdmin, setShowMarketAdmin] = useState(false)

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

  const isMarketBuilding = Boolean(slot.buildingId === 'ayuntamiento' || slot.buildingId === 'castillo' || slot.buildingId === 'mercado')
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
    if (!canAffordUpgrade) return
    soundManager.playBuildingSound(slot.buildingId, true)
    onUpgradeBuilding(slot, upgradeCost)
  }

  const handleClose = () => {
    soundManager.stopBuildingSound()
    soundManager.playClick()
    onClose()
  }

  // Calculate production cycle accumulation
  const now = Date.now()
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
        <div className="details-header">
          <div className="details-title-row">
            <div 
              className="building-icon-wrap"
              style={{
                width: '52px',
                height: '52px',
                minWidth: '52px',
                maxWidth: '52px',
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
              }}
            >
              <img 
                src={bld.poster || bld.image} 
                alt={bldName} 
                className="details-building-img"
                style={{
                  width: '42px',
                  height: '42px',
                  maxWidth: '42px',
                  maxHeight: '42px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
            <div>
              <h3 className="details-title">{bldName}</h3>
              <span className="details-level-tag">{t('buildings.levelTag', { level: currentLevel })}</span>
            </div>
          </div>
          <button className="modal-close-candy-btn" onClick={handleClose} title={t('common.close')}>
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        </div>

        {/* Content */}
        <div className="details-body">
          {/* Gran Mercado Celestial (4 Pasillos Interiores): Informative Card & Enter Button */}
          {isMarketBuilding && (
            <div className="market-entry-showcase-box" style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.92) 0%, rgba(15, 23, 42, 0.98) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.55)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '6px',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={20} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('market.bazaarTitle') || 'Gran Bazar de las Nubes'}
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.25)', color: '#fde047', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                  4 Pasillos
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.45', margin: '0 0 10px' }}>
                {t('market.bazaarDesc') || 'Adéntrate en los corredores dorados del mercado celestial. Recorre las galerías de Alquimia, Armería Sagrada, Gemas Preciosas y Provisiones de Cosecha.'}
              </p>

              {/* 4 Aisle Preview Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '6px', fontSize: '0.72rem', color: '#e9d5ff', fontWeight: '700' }}>
                  <span>🧪</span>
                  <span>1. Alquimia & Pociones</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '6px', fontSize: '0.72rem', color: '#bae6fd', fontWeight: '700' }}>
                  <span>⚔️</span>
                  <span>2. Armería Sagrada</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '6px', fontSize: '0.72rem', color: '#fef08a', fontWeight: '700' }}>
                  <span>💎</span>
                  <span>3. Gemas & Reliquias</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '6px', fontSize: '0.72rem', color: '#a7f3d0', fontWeight: '700' }}>
                  <span>🌾</span>
                  <span>4. Cosecha & Provisiones</span>
                </div>
              </div>

              {/* Enter Button */}
              <button 
                type="button"
                className="btn-enter-market-direct"
                onClick={() => {
                  soundManager.stopBuildingSound?.()
                  soundManager.playClick?.()
                  onClose()
                  onOpenMarketInterior?.()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                  color: '#ffffff',
                  border: '1px solid #fde047',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  fontWeight: '900',
                  fontSize: '0.96rem',
                  cursor: 'pointer',
                  width: '100%',
                  boxShadow: '0 4px 18px rgba(245, 158, 11, 0.45)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  transition: 'all 0.18s ease',
                }}
              >
                <Store size={20} style={{ color: '#ffffff' }} />
                <span>{t('market.enterBtn') || 'Entrar al Mercado (Enter)'}</span>
              </button>
            </div>
          )}

          {/* Market Admin / Tribute Toggle */}
          {isMarketBuilding && (
            <button
              type="button"
              className="btn-toggle-market-admin"
              onClick={() => setShowMarketAdmin((prev) => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} style={{ color: '#fbbf24' }} />
                <span>{showMarketAdmin ? 'Ocultar Mejoras y Producción del Edificio' : `Ver Mejoras y Producción (Nivel ${currentLevel})`}</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{showMarketAdmin ? '▲' : '▼'}</span>
            </button>
          )}

          {(!isMarketBuilding || showMarketAdmin) && (
            <>
              <p className="details-desc">{bldDesc}</p>

          {/* Production & Storage Section */}
          {hasProduction && (
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


          {/* Cuartel Direct Military Recruitment Action */}
          {slot.buildingId === 'cuartel' && onOpenArmy && (
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
          {slot.buildingId === 'portal' && onOpenExpeditions && (
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

          {/* Gran Almacén / Bóveda: Storage Capacity Panel & Inventory Vault Action */}
          {slot.buildingId === 'almacen' && (
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
          {hasProduction && (
            <div className="details-footer-actions">
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
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
