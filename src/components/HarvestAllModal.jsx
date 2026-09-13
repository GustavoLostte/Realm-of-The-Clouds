import React, { useMemo } from 'react'
import { 
  Sparkles, 
  Crown, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Zap,
  ShoppingBag
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import { BUILDING_TYPES, getMaxProductionBatches } from '../data/buildingsData'
import './HarvestAllModal.css'

export function HarvestAllModal({
  isOpen,
  onClose,
  onConfirmHarvest,
  onOpenShop,
  hasOneClickHarvest = false,
  hasEngineering = false,
  gems = 0,
  slots = [],
  unlockedTechIds = [],
  equippedRelics = {},
}) {
  const { t } = useTranslation()

  // Calculate real-time estimated harvestable resources
  const { harvestableCount, readyResources, totalXp, totalProductionSlots } = useMemo(() => {
    const readySlots = (slots || []).filter((s) => s.buildingId && !s.isConstructing)
    const now = Date.now()
    const vipHarvestBonus = hasOneClickHarvest ? 0.25 : 0
    const totals = { gold: 0, wood: 0, stone: 0, food: 0, gems: 0 }
    let xp = 0
    let count = 0
    let prodSlots = 0

    readySlots.forEach((slot) => {
      const bDef = BUILDING_TYPES[slot.buildingId?.toUpperCase()]
      if (!bDef || !bDef.production) return
      prodSlots++

      const cycleSec = (bDef.productionCycleSec || 120) * (hasEngineering ? 0.75 : 1)
      const lastHarvest = slot.lastHarvestAt || (now - 60000)
      const elapsedSec = Math.max(0, (now - lastHarvest) / 1000)
      const cycleProgress = elapsedSec / cycleSec

      // Minimum 25% accumulated cycle needed to harvest
      if (cycleProgress < 0.25) return

      count++
      const maxBatches = getMaxProductionBatches(hasOneClickHarvest || hasEngineering)
      const batchRatio = Math.min(maxBatches, cycleProgress)
      const lvl = slot.level || 1
      const prod = bDef.production

      const goldMult = (1 + (unlockedTechIds.includes('tech-mines') ? 0.25 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + (equippedRelics?.head === 'relic_corona_caos' ? 0.15 : 0) + (equippedRelics?.accessory === 'relic_emblema_leon' ? 0.20 : 0) + vipHarvestBonus) * batchRatio
      const woodMult = (1 + (unlockedTechIds.includes('tech-axes') ? 0.20 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + vipHarvestBonus) * batchRatio
      const stoneMult = (1 + (unlockedTechIds.includes('tech-quarry') ? 0.25 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + vipHarvestBonus) * batchRatio
      const foodMult = (1 + (unlockedTechIds.includes('tech-crops') ? 0.20 : 0) + (unlockedTechIds.includes('tech-logistics') ? 0.15 : 0) + (equippedRelics?.accessory === 'relic_amuleto_selva' ? 0.15 : 0) + vipHarvestBonus) * batchRatio

      if (prod.gold) totals.gold += Math.max(1, Math.round(prod.gold * lvl * goldMult))
      if (prod.wood) totals.wood += Math.max(1, Math.round(prod.wood * lvl * woodMult))
      if (prod.stone) totals.stone += Math.max(1, Math.round(prod.stone * lvl * stoneMult))
      if (prod.food) totals.food += Math.max(1, Math.round(prod.food * lvl * foodMult))
      if (prod.gems) totals.gems += Math.max(1, Math.round(prod.gems * lvl * Math.max(1, Math.floor(batchRatio))))

      xp += Math.max(5, Math.round(8 * lvl * Math.max(1, batchRatio)))
    })

    return {
      harvestableCount: count,
      readyResources: totals,
      totalXp: xp,
      totalProductionSlots: prodSlots,
    }
  }, [slots, hasOneClickHarvest, hasEngineering, unlockedTechIds, equippedRelics])

  if (!isOpen) return null

  const HARVEST_GEMS_COST = 5
  const canAfford = hasOneClickHarvest || gems >= HARVEST_GEMS_COST
  const hasResources = harvestableCount > 0

  const handleConfirm = () => {
    soundManager.playCollect('gold')
    onConfirmHarvest?.()
  }

  const handleOpenShopGems = () => {
    soundManager.playClick()
    onClose?.()
    onOpenShop?.('gems')
  }

  const handleOpenShopVip = () => {
    soundManager.playClick()
    onClose?.()
    onOpenShop?.('vip')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="harvest-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="harvest-modal-header">
          <div className="harvest-header-left">
            <div className="harvest-crest-box">
              <img 
                src="/assets/hud_icons/btn_harvest_all.webp" 
                alt="Cobrar Todo" 
                className="harvest-header-crest-img" 
                draggable="false" 
              />
            </div>
            <div>
              <span className="harvest-tag">{t('harvestModal.tag') || 'DECRETO IMPERIAL'}</span>
              <h2 className="harvest-title">{t('harvestModal.title') || 'Recaudación del Feudo'}</h2>
            </div>
          </div>

          <button 
            type="button"
            className="modal-close-candy-btn" 
            onClick={(e) => {
              e.stopPropagation()
              soundManager.playClick()
              onClose?.()
            }} 
            title={t('common.close')}
            aria-label={t('common.close')}
          >
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="harvest-modal-body">
          {/* Hero Banner with Cornucopia */}
          <div className="harvest-hero-card">
            <div className="harvest-hero-art">
              <img 
                src="/assets/hud_icons/btn_harvest_all.webp" 
                alt="Cuerno de la Abundancia" 
                className="harvest-hero-img" 
                draggable="false" 
              />
            </div>
            <div className="harvest-hero-text">
              <div className="harvest-hero-badge">
                <Sparkles size={13} />
                <span>{t('harvestModal.hornTitle') || 'Cuerno de la Abundancia'}</span>
              </div>
              <p className="harvest-hero-desc">
                {t('harvestModal.heroDesc') || 'Haz sonar el cuerno real para recolectar al instante todos los recursos acumulados en los edificios de tu reino sin tener que tocarlos uno a uno.'}
              </p>
            </div>
          </div>

          {/* Buildings Ready Status Bar */}
          <div className={`harvest-status-bar ${hasResources ? 'ready' : 'empty'}`}>
            {hasResources ? (
              <>
                <CheckCircle2 size={16} className="status-svg success" />
                <span>
                  {t('harvestModal.readyBuildings', { count: harvestableCount }) || `${harvestableCount} de ${totalProductionSlots} edificios listos para cosechar`}
                </span>
              </>
            ) : (
              <>
                <Clock size={16} className="status-svg warning" />
                <span>
                  {t('harvestModal.noBuildingsReady') || 'Tus edificios aún están en ciclo de producción (espera al 25% de acumulación).'}
                </span>
              </>
            )}
          </div>

          {/* Resource Haul Preview */}
          <div className="harvest-haul-section">
            <h4 className="harvest-section-title">
              <Coins size={14} />
              <span>{t('harvestModal.projectedLoot') || 'Botín Total Estimado'}</span>
              {hasOneClickHarvest && <span className="vip-bonus-pill">+25% VIP</span>}
            </h4>

            <div className="harvest-res-grid">
              <div className="haul-res-card gold">
                <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" className="haul-icon" draggable="false" />
                <div className="haul-meta">
                  <span className="haul-name">{t('resources.gold')}</span>
                  <span className="haul-val">+{readyResources.gold.toLocaleString()}</span>
                </div>
              </div>

              <div className="haul-res-card wood">
                <img src="/assets/hud_icons/icon_wood.webp" alt="Madera" className="haul-icon" draggable="false" />
                <div className="haul-meta">
                  <span className="haul-name">{t('resources.wood')}</span>
                  <span className="haul-val">+{readyResources.wood.toLocaleString()}</span>
                </div>
              </div>

              <div className="haul-res-card stone">
                <img src="/assets/hud_icons/icon_stone.webp" alt="Piedra" className="haul-icon" draggable="false" />
                <div className="haul-meta">
                  <span className="haul-name">{t('resources.stone')}</span>
                  <span className="haul-val">+{readyResources.stone.toLocaleString()}</span>
                </div>
              </div>

              <div className="haul-res-card food">
                <img src="/assets/hud_icons/icon_food.webp" alt="Comida" className="haul-icon" draggable="false" />
                <div className="haul-meta">
                  <span className="haul-name">{t('resources.food')}</span>
                  <span className="haul-val">+{readyResources.food.toLocaleString()}</span>
                </div>
              </div>

              {readyResources.gems > 0 && (
                <div className="haul-res-card gems">
                  <img src="/assets/hud_icons/icon_gem.webp" alt="Cristales" className="haul-icon" draggable="false" />
                  <div className="haul-meta">
                    <span className="haul-name">{t('resources.gems')}</span>
                    <span className="haul-val">+{readyResources.gems}</span>
                  </div>
                </div>
              )}

              <div className="haul-res-card xp">
                <img src="/assets/hud_icons/icon_crown.webp" alt="XP" className="haul-icon" draggable="false" />
                <div className="haul-meta">
                  <span className="haul-name">XP de Reino</span>
                  <span className="haul-val">+{totalXp} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost & VIP Information Card */}
          <div className={`harvest-cost-card ${hasOneClickHarvest ? 'is-vip' : 'requires-cost'}`}>
            {hasOneClickHarvest ? (
              <div className="cost-vip-box">
                <div className="vip-crest-wrap">
                  <Crown size={22} className="vip-crown-svg" />
                </div>
                <div className="vip-cost-details">
                  <div className="vip-cost-header">
                    <strong>{t('harvestModal.vipActiveTitle') || '¡Pase del Heraldo VIP Activo!'}</strong>
                    <span className="free-badge">{t('harvestModal.freeVip') || 'GRATIS'}</span>
                  </div>
                  <p className="vip-cost-sub">
                    {t('harvestModal.vipActiveDesc') || 'Dispones del Cuerno del Heraldo: todas tus recaudaciones son instantáneas, gratuitas e ilimitadas.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="cost-standard-box">
                <div className="cost-row-main">
                  <div className="cost-title-col">
                    <span className="cost-lead">{t('harvestModal.costSectionTitle') || 'Costo de Recaudación Instantánea:'}</span>
                    <div className="cost-gem-tag">
                      <img src="/assets/hud_icons/icon_gem.webp" alt="Cristales" className="cost-gem-img" draggable="false" />
                      <strong className="cost-number">5 {t('resources.gems') || 'Cristales'}</strong>
                    </div>
                  </div>

                  <div className="player-gems-col">
                    <span className="player-gems-lead">{t('harvestModal.yourGems') || 'Tus Cristales:'}</span>
                    <div className={`player-gems-tag ${gems < HARVEST_GEMS_COST ? 'insufficient' : 'sufficient'}`}>
                      <img src="/assets/hud_icons/icon_gem.webp" alt="Cristales" className="cost-gem-img" draggable="false" />
                      <span>{gems}</span>
                    </div>
                  </div>
                </div>

                {!canAfford && (
                  <div className="cost-insufficient-warn">
                    <AlertCircle size={14} />
                    <span>Necesitas al menos 5 Cristales para emitir este decreto real.</span>
                  </div>
                )}

                <div className="cost-perk-tip">
                  <Zap size={13} className="tip-zap" />
                  <span>
                    {t('harvestModal.vipPerkTip') || 'Consejo: Puedes desbloquear el Cuerno Real permanente en la Tienda VIP para cobrar gratis siempre.'}
                  </span>
                  <button 
                    type="button" 
                    className="btn-link-shop-vip" 
                    onClick={handleOpenShopVip}
                  >
                    Ver VIP
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="harvest-modal-footer">
          <button 
            type="button" 
            className="btn-harvest-cancel" 
            onClick={() => {
              soundManager.playClick()
              onClose?.()
            }}
          >
            {t('common.close') || 'Cerrar'}
          </button>

          {!canAfford ? (
            <button 
              type="button" 
              className="btn-harvest-primary get-gems" 
              onClick={handleOpenShopGems}
            >
              <ShoppingBag size={16} />
              <span>{t('harvestModal.btnGetGems') || 'Conseguir Cristales en Tienda'}</span>
            </button>
          ) : !hasResources ? (
            <button 
              type="button" 
              className="btn-harvest-primary disabled" 
              disabled
            >
              <Clock size={16} />
              <span>{t('harvestModal.btnNoResources') || 'Sin recursos listos'}</span>
            </button>
          ) : (
            <button 
              type="button" 
              className="btn-harvest-primary confirm" 
              onClick={handleConfirm}
            >
              <img src="/assets/hud_icons/btn_harvest_all.webp" alt="Cobrar" className="btn-horn-icon" draggable="false" />
              <span>
                {hasOneClickHarvest 
                  ? (t('harvestModal.btnHarvestFree') || '¡Recaudar Todo Gratis!') 
                  : (t('harvestModal.btnHarvestCost', { cost: HARVEST_GEMS_COST }) || `¡Cobrar Todo (5 Cristales)!`)}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
