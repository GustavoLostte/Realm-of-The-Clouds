import React, { useState, useEffect, useRef } from 'react'
import './ShopModal.css'
import { 
  Sparkles, 
  Crown, 
  Check, 
  RotateCw, 
} from 'lucide-react'
import { GEM_PACKS, STARTER_PACKS, VIP_PERKS, WHEEL_SLOTS } from '../data/shopData'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'

export function ShopModal({
  isOpen,
  onClose,
  initialTab = 'offers',
  resources,
  vipStatus = { hasSecondBuilder: false, hasOneClickHarvest: false, starterPackClaimed: false, allianceBundleClaimed: false },
  lastWheelFreeSpinTime = 0,
  lastFreeSpinTime = 0,
  onBuyGems,
  onBuyStarterPack,
  onActivateVipPerk,
  onSpinWheelReward,
  showNotification,
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasSpunInModal, setHasSpunInModal] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [wonPrize, setWonPrize] = useState(null)
  const [purchaseSuccessItem, setPurchaseSuccessItem] = useState(null)
  const tickIntervalRef = useRef(null)
  const spinTimeoutRef = useRef(null)
  const pendingSpinPrizeRef = useRef(null)

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
      setWonPrize(null)
      setPurchaseSuccessItem(null)
      setHasSpunInModal(false)
    }
  }, [isOpen, initialTab])

  // Support closing with Escape key & cleanup any pending timers
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        soundManager.playClick()
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current)
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current)
      if (pendingSpinPrizeRef.current) {
        onSpinWheelReward?.(pendingSpinPrizeRef.current.prize, pendingSpinPrizeRef.current.isFree)
        pendingSpinPrizeRef.current = null
      }
    }
  }, [isOpen, onClose, onSpinWheelReward])

  if (!isOpen) return null

  // Check if daily free spin is ready (every 20 hours or on fresh start)
  const now = Date.now()
  const effectiveLastSpin = lastWheelFreeSpinTime || lastFreeSpinTime || 0
  const hoursSinceFreeSpin = (now - effectiveLastSpin) / (1000 * 3600)
  const isFreeSpinReady = hoursSinceFreeSpin >= 20 && !hasSpunInModal

  const handleTabChange = (tabKey) => {
    soundManager.playClick()
    setActiveTab(tabKey)
  }

  const getPrizeLabel = (prize) => {
    if (!prize) return ''
    if (prize.type === 'gems') return `${prize.amount} ${t('resources.gems')}`
    if (prize.type === 'gold') return `${prize.amount.toLocaleString()} ${t('resources.gold')}`
    if (prize.type === 'wood') return `${prize.amount.toLocaleString()} ${t('resources.wood')}`
    if (prize.type === 'potion_heal') return t('shopItems.wheelPrizes.potions') || `x${prize.amount} Potions`
    if (prize.type === 'bomb_dwarf') return t('shopItems.wheelPrizes.bombs') || `x${prize.amount} Bombs`
    if (prize.type === 'infantry') return t('shopItems.wheelPrizes.infantry') || `x${prize.amount} Infantry`
    return prize.label
  }

  // Buy Gem Pack
  const handleGemPurchase = (pack) => {
    soundManager.playPurchaseFanfare()
    onBuyGems?.(pack)
    const packKeyMap = {
      pack_handful: 'small',
      pack_pouch: 'medium',
      pack_chest: 'large',
      pack_vault: 'vault',
    }
    const packName = t(`shop.gemPacks.${pack.id}.name`) || t(`shopItems.gem_packs.${packKeyMap[pack.id] || pack.id}`) || pack.name
    setPurchaseSuccessItem({
      title: t('shop.packAcquiredTitle', { name: packName }),
      subtitle: t('shop.packAcquiredDesc', { gems: pack.gems + pack.bonusGems }),
      image: pack.image,
    })
  }

  // Buy Starter Pack / Bundle
  const handleStarterPackPurchase = (pack) => {
    soundManager.playPurchaseFanfare()
    onBuyStarterPack?.(pack)
    const packTitle = pack.id === 'starter_conqueror' ? t('starterPack.title') : t('starterPack.allianceTitle')
    setPurchaseSuccessItem({
      title: t('shop.starterUnlockedTitle', { title: packTitle }),
      subtitle: t('shop.starterUnlockedDesc'),
      image: pack.image,
    })
  }

  // Activate VIP Perk
  const handleVipPerkActivation = (perk) => {
    if ((resources.gems || 0) < perk.costGems) {
      soundManager.playHit()
      showNotification(t('shop.crystalsInsufficient'), 'warning')
      setActiveTab('gems')
      return
    }
    soundManager.playPurchaseFanfare()
    onActivateVipPerk?.(perk)
    const perkName = perk.id === 'perk_second_builder' ? t('shop.secondBuilder') :
      perk.id === 'perk_harvest_horn' ? t('shop.oneClickHarvest') :
      perk.id === 'perk_engineering' ? t('shop.engineering') : perk.name
    const perkBenefit = t(`shop.perkBenefits.${perk.id}`) || perk.benefit
    setPurchaseSuccessItem({
      title: t('shop.perkActivatedTitle', { name: perkName }),
      subtitle: perkBenefit,
      image: perk.image,
    })
  }

  // Spin Fortune Wheel
  const handleSpinWheel = (isFree) => {
    if (isSpinning) return
    if (!isFree && (resources.gems || 0) < 15) {
      soundManager.playHit()
      showNotification(t('shop.gemsNeededForSpin'), 'warning')
      setActiveTab('gems')
      return
    }

    setIsSpinning(true)
    setWonPrize(null)
    if (isFree) {
      setHasSpunInModal(true)
    }

    // Select winning index with fair randomness
    const winningIdx = Math.floor(Math.random() * WHEEL_SLOTS.length)
    const prize = WHEEL_SLOTS[winningIdx]
    pendingSpinPrizeRef.current = { prize, isFree }

    // Calculate degrees: 5 full turns (1800 deg) + exact sector offset centered under pointer
    const sectorDeg = 360 / WHEEL_SLOTS.length
    const targetAngleInCircle = 360 - (winningIdx * sectorDeg) - (sectorDeg / 2)
    const currentMod = wheelRotation % 360
    let extraDeg = targetAngleInCircle - currentMod
    if (extraDeg <= 0) extraDeg += 360
    const finalRotation = wheelRotation + 1800 + extraDeg

    setWheelRotation(finalRotation)

    // Audio ticking simulation
    let tickCount = 0
    tickIntervalRef.current = setInterval(() => {
      soundManager.playWheelTick()
      tickCount++
      if (tickCount > 28) {
        clearInterval(tickIntervalRef.current)
      }
    }, 140)

    // Stop after animation (4.2 seconds)
    spinTimeoutRef.current = setTimeout(() => {
      clearInterval(tickIntervalRef.current)
      setIsSpinning(false)
      setWonPrize(prize)
      pendingSpinPrizeRef.current = null
      soundManager.playVictory()
      onSpinWheelReward?.(prize, isFree)

      // Show celebratory reward card confirming the prize won
      const wonLabel = getPrizeLabel(prize)
      setPurchaseSuccessItem({
        title: t('shop.youWon') || '¡Has ganado!',
        subtitle: wonLabel,
        image: prize.image,
      })
    }, 4300)
  }

  return (
    <div className="modal-backdrop" onClick={isSpinning ? undefined : onClose}>
      <div className="shop-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shop-modal-header">
          <div className="shop-header-left">
            <div className="shop-crest-icon">
              <img src="/assets/hud_icons/btn_ranking.webp" alt="Crown" draggable="false" />
            </div>
            <div>
              <span className="shop-tag">{t('shop.chamberTag')}</span>
              <h2 className="shop-title">{t('shop.title')}</h2>
            </div>
          </div>

          <div className="shop-header-right">
            {activeTab === 'wheel' ? (
              <div className="shop-resources-bar">
                <div className="shop-res-chip" title={t('resources.gold')}>
                  <img src="/assets/hud_icons/icon_gold.webp" alt={t('resources.gold')} className="balance-gem-icon" draggable="false" />
                  <span className="balance-gem-num">{Math.floor(resources.gold || 0).toLocaleString()}</span>
                </div>
                <div className="shop-res-chip" title={t('resources.wood')}>
                  <img src="/assets/hud_icons/icon_wood.webp" alt={t('resources.wood')} className="balance-gem-icon" draggable="false" />
                  <span className="balance-gem-num">{Math.floor(resources.wood || 0).toLocaleString()}</span>
                </div>
                <div className="shop-res-chip" title={t('resources.gems')}>
                  <img src="/assets/hud_icons/icon_gem.webp" alt={t('resources.gems')} className="balance-gem-icon" draggable="false" />
                  <span className="balance-gem-num">{Math.floor(resources.gems || 0).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="shop-gems-balance" title={t('shop.tabVault')}>
                <img src="/assets/hud_icons/icon_gem.webp" alt={t('resources.gems')} className="balance-gem-icon" draggable="false" />
                <span className="balance-gem-num">{Math.floor(resources.gems || 0)} {t('resources.gems')}</span>
              </div>
            )}
            <button 
              type="button"
              className="modal-close-candy-btn" 
              disabled={isSpinning}
              onClick={(e) => {
                if (isSpinning) return
                e.stopPropagation()
                soundManager.playClick()
                onClose?.()
              }} 
              title={`${t('common.close')} (Esc)`}
              aria-label={t('common.close')}
            >
              <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="shop-tabs-bar">
          <button 
            type="button"
            className={`shop-tab-btn ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => handleTabChange('offers')}
          >
            <div className="shop-tab-icon-box">
              <img src="/assets/hud_icons/btn_inventory.webp" alt="Offers" className="shop-tab-asset-icon" draggable="false" />
            </div>
            <span className="shop-tab-text">
              <span className="tab-title-desktop">{t('shop.tabPasses')}</span>
              <span className="tab-title-mobile">{t('shop.tabPasses')}</span>
            </span>
            {!vipStatus.starterPackClaimed && <span className="tab-pill-badge">-85%</span>}
          </button>
          <button 
            type="button"
            className={`shop-tab-btn ${activeTab === 'vip' ? 'active' : ''}`}
            onClick={() => handleTabChange('vip')}
          >
            <div className="shop-tab-icon-box">
              <img src="/assets/hud_icons/btn_ranking.webp" alt="VIP" className="shop-tab-asset-icon" draggable="false" />
            </div>
            <span className="shop-tab-text">
              <span className="tab-title-desktop">{t('shop.activePerk')}</span>
              <span className="tab-title-mobile">VIP</span>
            </span>
          </button>
          <button 
            type="button"
            className={`shop-tab-btn ${activeTab === 'gems' ? 'active' : ''}`}
            onClick={() => handleTabChange('gems')}
          >
            <div className="shop-tab-icon-box">
              <img src="/assets/hud_icons/icon_gem.webp" alt="Gems" className="shop-tab-asset-icon" draggable="false" />
            </div>
            <span className="shop-tab-text">
              <span className="tab-title-desktop">{t('shop.tabVault')}</span>
              <span className="tab-title-mobile">{t('shop.tabVault')}</span>
            </span>
          </button>
          <button 
            type="button"
            className={`shop-tab-btn ${activeTab === 'wheel' ? 'active' : ''}`}
            onClick={() => handleTabChange('wheel')}
          >
            <div className="shop-tab-icon-box">
              <img src="/assets/hud_icons/icon_roulette.webp" alt="Wheel" className="shop-tab-asset-icon" draggable="false" />
            </div>
            <span className="shop-tab-text">
              <span className="tab-title-desktop">{t('wheel.title')}</span>
              <span className="tab-title-mobile">{t('hud.rouletteTitle')}</span>
            </span>
            {isFreeSpinReady && <span className="tab-pill-badge free">{t('common.free')}</span>}
          </button>
        </div>

        {/* Content View */}
        <div className={`shop-modal-content tab-${activeTab}`}>
          {/* TAB 1: SPECIAL OFFERS & STARTER PACKS */}
          {activeTab === 'offers' && (
            <div className="shop-offers-view">
              <div className="offers-grid">
                {STARTER_PACKS.map((pack) => {
                  const isClaimed = pack.id === 'starter_conqueror' 
                    ? vipStatus.starterPackClaimed 
                    : vipStatus.allianceBundleClaimed
                  const packTitle = pack.id === 'starter_conqueror' ? t('starterPack.title') : t('starterPack.allianceTitle')
                  const packSub = pack.id === 'starter_conqueror' ? t('starterPack.conquerorSubtitle') : t('starterPack.allianceSubtitle')
                  const packDesc = pack.id === 'starter_conqueror' ? t('starterPack.conquerorDesc') : t('starterPack.allianceDesc')
                  const discountBadge = pack.id === 'starter_conqueror' ? t('starterPack.exclusiveValue') : (t('starterPack.allianceDiscount') || pack.discountBadge)

                  return (
                    <div key={pack.id} className={`starter-pack-card ${isClaimed ? 'claimed' : 'available'}`}>
                      <div className="pack-card-header">
                        <div className="pack-badge-discount">{discountBadge}</div>
                        <div className="pack-header-main">
                          <div className="pack-hero-pedestal">
                            <img src={pack.image} alt={packTitle} className="pack-hero-img" draggable="false" />
                          </div>
                          <div className="pack-title-col">
                            <h3 className="pack-title">{packTitle}</h3>
                            <span className="pack-subtitle">{packSub}</span>
                          </div>
                        </div>
                      </div>

                      <p className="pack-desc">{packDesc}</p>

                      {/* Items grid */}
                      <div className="pack-items-list">
                        <span className="items-list-label">{t('shop.exclusiveContentLabel')}</span>
                        <div className="pack-items-grid">
                          {pack.items.map((it, idx) => {
                            let displayName = it.name
                            if (it.type === 'gems') displayName = `${it.amount.toLocaleString()} ${t('resources.gems')}`
                            else if (it.type === 'commander') displayName = `1 ${t('army.commander.name') || 'Commander'}`
                            else if (it.type === 'infantry') displayName = `${it.amount} ${t('army.infantry.name') || 'Infantry'}`
                            else if (it.type === 'archers') displayName = `${it.amount} ${t('army.archers.name') || 'Archers'}`
                            else if (it.type === 'mages') displayName = `${it.amount} ${t('army.mages.name') || 'Mages'}`
                            else if (it.relicId) displayName = t(`inventoryItems.relics.${it.relicId}.name`) || it.name
                            else if (it.type === 'potion_heal') displayName = `${it.amount} ${t('inventoryItems.consumables.potion_heal.name') || 'Potions'}`
                            else if (it.type === 'bomb_dwarf') displayName = `${it.amount} ${t('inventoryItems.consumables.bomb_dwarf.name') || 'Bombs'}`
                            else if (it.type === 'title') displayName = t('shopItems.bundleItems.titleConqueror') || it.name

                            return (
                              <div key={idx} className="pack-item-pill">
                                <img src={it.image} alt={displayName} className="item-pill-img" draggable="false" />
                                <span className="item-name">{displayName}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Pricing row & CTA */}
                      <div className="pack-footer-row">
                        <div className="pack-price-block">
                          <span className="price-old">{pack.originalPrice}</span>
                          <span className="price-now">{pack.priceLabel}</span>
                        </div>

                        {isClaimed ? (
                          <div className="pack-claimed-badge">
                            <Check size={16} />
                            <span>{t('shop.acquired')}</span>
                          </div>
                        ) : (
                          <button 
                            className="btn-buy-starter"
                            onClick={() => handleStarterPackPurchase(pack)}
                          >
                            <Sparkles size={16} />
                            <span>{t('shop.unlockNow')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: VIP & QUALITY OF LIFE PERKS */}
          {activeTab === 'vip' && (
            <div className="shop-vip-view">
              <div className="vip-intro-card">
                <div className="vip-intro-crest">
                  <img src="/assets/hud_icons/btn_ranking.webp" alt="Crown" className="vip-intro-img" draggable="false" />
                </div>
                <div>
                  <h3 className="vip-intro-title">{t('shop.vipPrivilegesTitle')}</h3>
                  <p className="vip-intro-text">
                    {t('shop.vipPrivilegesDesc')}
                  </p>
                </div>
              </div>

              <div className="vip-perks-grid">
                {VIP_PERKS.map((perk) => {
                  let isOwned = false
                  if (perk.id === 'perk_harvest_horn') isOwned = vipStatus.hasOneClickHarvest
                  if (perk.id === 'perk_second_builder') isOwned = vipStatus.hasSecondBuilder
                  if (perk.id === 'perk_daily_blessing') isOwned = vipStatus.hasDailyBlessing
                  if (perk.id === 'perk_engineering') isOwned = vipStatus.hasEngineering

                  const perkName = perk.id === 'perk_second_builder' ? t('shop.secondBuilder') :
                    perk.id === 'perk_harvest_horn' ? t('shop.oneClickHarvest') :
                    perk.id === 'perk_engineering' ? t('shop.engineering') :
                    perk.id === 'perk_daily_blessing' ? (t('shopItems.perks.dailyBlessing') || perk.name) : perk.name
                  const perkDesc = perk.id === 'perk_second_builder' ? t('shop.secondBuilderDesc') :
                    perk.id === 'perk_harvest_horn' ? t('shop.oneClickHarvestDesc') :
                    perk.id === 'perk_engineering' ? t('shop.engineeringDesc') :
                    perk.id === 'perk_daily_blessing' ? (t('shop.dailyBlessingDesc') || perk.description) : perk.description
                  const perkBadge = t(`shop.perkBadges.${perk.id}`) || perk.badge

                  const canAfford = (resources.gems || 0) >= perk.costGems

                  return (
                    <div key={perk.id} className={`vip-perk-card ${isOwned ? 'owned' : ''}`}>
                      <div className="vip-card-top">
                        <div className="vip-perk-icon-wrap">
                          <img src={perk.image} alt={perkName} className="vip-perk-img" draggable="false" />
                        </div>
                        <div className="vip-perk-title-col">
                          <div className="vip-badge-tag">{perkBadge}</div>
                          <h4 className="vip-perk-name">{perkName}</h4>
                        </div>
                      </div>

                      <p className="vip-perk-desc">{perkDesc}</p>

                      <div className="vip-perk-action-row">
                        {isOwned ? (
                          <div className="vip-active-indicator">
                            <Check size={16} />
                            <span>{t('shop.permanentActivePerk')}</span>
                          </div>
                        ) : (
                          <button 
                            className={`btn-activate-perk ${canAfford ? 'can-buy' : 'need-gems'}`}
                            onClick={() => handleVipPerkActivation(perk)}
                          >
                            <span>{t('shop.unlockFor')}</span>
                            <span className="cost-gems-tag">
                              {perk.costGems} <img src="/assets/hud_icons/icon_gem.webp" alt="Gems" className="mini-gem-img" />
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 3: GEM PACKS */}
          {activeTab === 'gems' && (
            <div className="shop-gems-view">
              <div className="gems-grid">
                {GEM_PACKS.map((pack) => {
                  const packKeyMap = {
                    pack_handful: 'small',
                    pack_pouch: 'medium',
                    pack_chest: 'large',
                    pack_vault: 'vault',
                  }
                  const packTitle = t(`shop.gemPacks.${pack.id}.name`) || t(`shopItems.gem_packs.${packKeyMap[pack.id] || pack.id}`) || pack.name
                  const packDesc = t(`shop.gemPacks.${pack.id}.desc`) || pack.description
                  const packBadge = t(`shop.gemPacks.${pack.id}.badge`) || (pack.badge && pack.badge !== 'MEJOR VALOR' && pack.badge !== 'TITÁNICO' ? pack.badge : null)

                  return (
                    <div key={pack.id} className={`gem-pack-card ${packBadge ? 'featured' : ''}`}>
                      {packBadge && <div className="gem-pack-badge">{packBadge}</div>}

                      <div className="gem-pack-visual">
                        <div className="gem-pack-icon-pedestal">
                          <img src={pack.image} alt={packTitle} className="pack-gem-img" draggable="false" />
                        </div>
                        <div className="gem-amount-callout">
                          <span className="gem-num">+{pack.gems}</span>
                          {pack.bonusGems > 0 && (
                            <span className="bonus-pill">+{pack.bonusGems} {t('shop.bonusExtra')}</span>
                          )}
                        </div>
                      </div>

                      <h4 className="gem-pack-title">{packTitle}</h4>
                      <p className="gem-pack-desc">{packDesc}</p>

                      <button 
                        className="btn-buy-gems-pack"
                        onClick={() => handleGemPurchase(pack)}
                      >
                        <span>{t('shop.getForPrice', { price: pack.priceLabel })}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 4: FORTUNE WHEEL */}
          {activeTab === 'wheel' && (
            <div className="shop-wheel-view">
              <div className="wheel-stage-layout">
                {/* Wheel Assembly */}
                <div className="wheel-assembly-container">
                  <div className="wheel-pointer-arrow">▼</div>

                  <div 
                    className="fortune-wheel-disc"
                    style={{ 
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: isSpinning ? 'transform 4.2s cubic-bezier(0.12, 0.95, 0.22, 1)' : 'none'
                    }}
                  >
                    {WHEEL_SLOTS.map((slot, idx) => {
                      const angle = idx * (360 / WHEEL_SLOTS.length)
                      const slotLabel = getPrizeLabel(slot)
                      return (
                        <div 
                          key={slot.id} 
                          className="wheel-segment"
                          style={{
                            '--segment-angle': `${angle}deg`,
                            '--segment-color': slot.color,
                          }}
                        >
                          <div className="segment-label-box">
                            <img src={slot.image} alt={slotLabel} className="segment-img" draggable="false" />
                            <span className="segment-text">{slotLabel}</span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="wheel-center-hub">
                      <Crown size={22} className="hub-crown" />
                    </div>
                  </div>
                </div>

                {/* Controls & Win Callout */}
                <div className="wheel-controls-panel">
                  <h3 className="wheel-panel-title">{t('shop.fortuneWheelTitle')}</h3>
                  <p className="wheel-panel-desc">
                    {t('shop.fortuneWheelDesc')}
                  </p>

                  {wonPrize && (() => {
                    const wonLabel = getPrizeLabel(wonPrize)
                    return (
                      <div className="wheel-prize-announcement">
                        <Sparkles className="prize-sparkles" size={24} />
                        <div className="prize-info-box">
                          <span className="prize-sub">{t('shop.youWon')}</span>
                          <div className="prize-title-row">
                            <img src={wonPrize.image} alt={wonLabel} className="prize-result-img" draggable="false" />
                            <h4 className="prize-name">{wonLabel}</h4>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  <div className="wheel-action-buttons">
                    <button 
                      className={`btn-spin-wheel free ${isFreeSpinReady && !isSpinning ? 'pulse-ready' : 'disabled'}`}
                      disabled={!isFreeSpinReady || isSpinning}
                      onClick={() => handleSpinWheel(true)}
                    >
                      <RotateCw className={isSpinning ? 'spin-anim' : ''} size={18} />
                      <span className="spin-btn-text-full">{isFreeSpinReady ? t('wheel.spinFreeBtn') : t('wheel.freeSpinReady')}</span>
                      <span className="spin-btn-text-mobile">{isFreeSpinReady ? t('common.free') : t('common.loading')}</span>
                    </button>

                    <button 
                      className={`btn-spin-wheel gems ${!isSpinning && (resources.gems || 0) >= 15 ? 'ready' : 'disabled'}`}
                      disabled={isSpinning || (resources.gems || 0) < 15}
                      onClick={() => handleSpinWheel(false)}
                    >
                      <RotateCw className={isSpinning ? 'spin-anim' : ''} size={18} />
                      <span className="spin-btn-text-full">{t('wheel.spinGemsBtn')} <img src="/assets/hud_icons/icon_gem.webp" alt="Gems" className="mini-gem-img" /></span>
                      <span className="spin-btn-text-mobile">{t('wheel.spinGemsBtn')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Success Modal Overlay */}
        {purchaseSuccessItem && (
          <div className="shop-purchase-success-curtain" onClick={() => setPurchaseSuccessItem(null)}>
            <div className="purchase-success-card" onClick={(e) => e.stopPropagation()}>
              <div className="success-icon-burst">
                <img src={purchaseSuccessItem.image} alt="Reward" className="success-reward-img" draggable="false" />
              </div>
              <h3 className="success-title">{purchaseSuccessItem.title}</h3>
              <p className="success-subtitle">{purchaseSuccessItem.subtitle}</p>
              <button 
                className="btn-claim-success" 
                onClick={() => {
                  soundManager.playCollect()
                  setPurchaseSuccessItem(null)
                }}
              >
                <span>{t('shop.claimWithGlory')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Bar with safe close button */}
        <div className="shop-modal-footer">
          <span className="shop-footer-note">{t('shop.pressEscToClose')}</span>
          <button 
            type="button" 
            className="btn-shop-footer-close"
            onClick={(e) => {
              e.stopPropagation()
              soundManager.playClick()
              onClose?.()
            }}
          >
            <span>{t('shop.returnToKingdom')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
