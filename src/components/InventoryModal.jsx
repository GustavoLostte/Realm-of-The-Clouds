import React, { useState } from 'react'
import './InventoryModal.css'
import { Shield, Sparkles, Check, Plus, Package } from 'lucide-react'
import { RELIC_SLOTS, RELICS, CONSUMABLES } from '../data/inventoryData'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'

export function InventoryModal({ 
  isOpen, 
  onClose, 
  ownedRelicIds = [], 
  equippedRelics = { head: null, weapon: null, accessory: null }, 
  consumables = { potion_heal: 1, potion_focus: 1, bomb_dwarf: 0 },
  resources,
  onEquipRelic, 
  onUnequipRelic,
  onCraftConsumable 
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('relics')

  if (!isOpen) return null

  // Calculate equipped bonuses
  const equippedBonusSummary = []
  Object.values(equippedRelics).forEach((relicId) => {
    if (!relicId) return
    const r = RELICS.find((item) => item.id === relicId)
    if (r) equippedBonusSummary.push(r.effect)
  })

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="inventory-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="inventory-header">
          <div className="inventory-header-left">
            <span className="inventory-tag">{t('inventory.tag')}</span>
            <h2 className="inventory-title">{t('inventory.title')}</h2>
          </div>
          <button className="modal-close-candy-btn" onClick={onClose} title={t('common.close') || 'Cerrar'}>
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close') || 'Cerrar'} draggable="false" />
          </button>
        </div>

        {/* Tabs */}
        <div className="inventory-tabs">
          <button 
            className={`inv-tab-btn ${activeTab === 'relics' ? 'active' : ''}`}
            onClick={() => {
              soundManager.playClick()
              setActiveTab('relics')
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <img src="/assets/hud_icons/btn_ranking.webp" alt="Reliquias" className="mini-res-icon" />
              <span>{t('inventory.legendaryRelics', { current: ownedRelicIds.length, total: RELICS.length }) || `Relics (${ownedRelicIds.length}/${RELICS.length})`}</span>
            </span>
          </button>
          <button 
            className={`inv-tab-btn ${activeTab === 'consumables' ? 'active' : ''}`}
            onClick={() => {
              soundManager.playClick()
              setActiveTab('consumables')
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <img src="/assets/hud_icons/icon_potion.webp" alt="Pociones" className="mini-res-icon" />
              <span>{t('inventory.battleBag')}</span>
            </span>
          </button>
        </div>

        {/* TAB 1: RELICS */}
        {activeTab === 'relics' && (
          <div className="inventory-relics-view">
            {/* Equipped Slots Banner */}
            <div className="equipped-slots-container">
              <h3 className="section-subtitle">
                <Shield size={15} />
                <span>{t('inventory.activeGear')}</span>
              </h3>

              <div className="equipped-slots-grid">
                {RELIC_SLOTS.map((slotDef) => {
                  const equippedId = equippedRelics[slotDef.id]
                  const equippedRelic = RELICS.find((r) => r.id === equippedId)
                  const slotName = t(`inventoryItems.slots.${slotDef.id}`) || slotDef.name
                  const relicName = equippedRelic ? (t(`inventoryItems.relics.${equippedRelic.id}.name`) || equippedRelic.name) : ''
                  const relicEffect = equippedRelic ? (t(`inventoryItems.relics.${equippedRelic.id}.desc`) || equippedRelic.effect) : ''

                  return (
                    <div key={slotDef.id} className="equipped-slot-card">
                      <div className="slot-type-header">
                        <span className="slot-icon">
                          <img src={slotDef.image} alt={slotName} className="mini-res-icon" />
                        </span>
                        <span className="slot-name">{slotName}</span>
                      </div>

                      {equippedRelic ? (
                        <div className="slot-item-filled">
                          <span className="relic-icon">
                            <img src={equippedRelic.avatar} alt={relicName} className="mini-res-icon" style={{ width: '22px', height: '22px' }} />
                          </span>
                          <div className="relic-item-info">
                            <span className="relic-name">{relicName}</span>
                            <span className="relic-effect-mini">{relicEffect}</span>
                          </div>
                          <button 
                            className="btn-unequip"
                            onClick={() => {
                              soundManager.playClick()
                              onUnequipRelic(slotDef.id)
                            }}
                            title={t('inventory.unequip') || 'Unequip'}
                          >
                            {t('inventory.unequip') || 'Unequip'}
                          </button>
                        </div>
                      ) : (
                        <div className="slot-item-empty">
                          <span>{t('inventory.emptySlot')}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Bonus summary strip */}
              {equippedBonusSummary.length > 0 && (
                <div className="active-bonuses-strip">
                  <span className="bonuses-label">{t('inventory.activeBonuses') || 'Active Bonuses:'}</span>
                  <div className="bonuses-tags">
                    {Object.values(equippedRelics).filter(Boolean).map((relicId) => {
                      const r = RELICS.find(it => it.id === relicId)
                      const desc = r ? (t(`inventoryItems.relics.${r.id}.desc`) || r.effect) : ''
                      return (
                        <span key={relicId} className="bonus-pill">
                          <Sparkles size={11} />
                          {desc}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Owned Relics Collection */}
            <div className="relics-collection-section">
              <h3 className="section-subtitle">
                <Package size={15} />
                <span>{t('inventory.relicCollection')}</span>
              </h3>

              <div className="relics-collection-grid">
                {RELICS.map((relic) => {
                  const isOwned = ownedRelicIds.includes(relic.id)
                  const isEquipped = Object.values(equippedRelics).includes(relic.id)
                  const relicName = t(`inventoryItems.relics.${relic.id}.name`) || relic.name
                  const relicDesc = t(`inventoryItems.relics.${relic.id}.desc`) || relic.description
                  const relicEffect = t(`inventoryItems.relics.${relic.id}.desc`) || relic.effect

                  return (
                    <div 
                      key={relic.id} 
                      className={`relic-catalog-card ${isOwned ? 'owned' : 'unowned'} ${isEquipped ? 'equipped' : ''}`}
                    >
                      <div className="relic-card-top">
                        <span className="relic-card-icon">
                          <img src={relic.avatar} alt={relicName} className="mini-res-icon" style={{ width: '24px', height: '24px' }} />
                        </span>
                        <div className="relic-card-meta">
                          <span className="relic-card-name">{relicName}</span>
                          <span className={`relic-rarity-tag ${relic.rarity}`}>{relic.rarity.toUpperCase()}</span>
                        </div>
                      </div>

                      <p className="relic-card-desc">{relicDesc}</p>
                      
                      <div className="relic-card-effect-box">
                        <span>{relicEffect}</span>
                      </div>

                      <div className="relic-card-source">
                        <span>{t('inventory.dropSourcePrefix') || 'Source:'} {t(`inventoryItems.relics.${relic.id}.dropSource`) || relic.dropSource}</span>
                      </div>

                      <div className="relic-card-action">
                        {isOwned ? (
                          isEquipped ? (
                            <span className="relic-equipped-tag">
                              <Check size={13} />
                              {t('inventory.equipped') || 'Equipped'}
                            </span>
                          ) : (
                            <button 
                              className="btn-equip-relic"
                              onClick={() => {
                                soundManager.playQuestSuccess()
                                onEquipRelic(relic)
                              }}
                            >
                              {t('inventory.equipRelic') || 'Equip Relic'}
                            </button>
                          )
                        ) : (
                          <span className="relic-locked-notice">
                            {t('inventory.defeatBossToObtain') || 'Defeat dungeon boss to obtain'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONSUMABLES */}
        {activeTab === 'consumables' && (
          <div className="inventory-consumables-view">
            <div className="consumables-intro-box">
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/assets/hud_icons/btn_army.webp" alt="Batalla" className="mini-res-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                <span>{t('inventory.consumablesIntro') || 'Consumables in your bag are available with quick-access during dungeon battles. Use them to save your hero or crush the boss!'}</span>
              </p>
            </div>

            <div className="consumables-grid">
              {CONSUMABLES.map((item) => {
                const count = consumables[item.id] || 0
                const canAfford = Object.entries(item.cost).every(([res, amt]) => (resources[res] || 0) >= amt)
                const itemName = t(`inventoryItems.consumables.${item.id}.name`) || item.name
                const itemDesc = t(`inventoryItems.consumables.${item.id}.desc`) || item.description

                return (
                  <div key={item.id} className="consumable-card">
                    <div className="consumable-card-header">
                      <span className="consumable-icon">
                        <img src={item.image} alt={itemName} className="mini-res-icon" style={{ width: '26px', height: '26px' }} />
                      </span>
                      <div className="consumable-info">
                        <span className="consumable-name">{itemName}</span>
                        <span className="consumable-count">{t('inventory.inBag', { count }) || `In bag: x${count}`}</span>
                      </div>
                    </div>

                    <p className="consumable-desc">{itemDesc}</p>

                    <div className="consumable-cost-row">
                      <span className="cost-label">{t('inventory.craftCost') || 'Crafting cost:'}</span>
                      {Object.entries(item.cost).map(([res, amt]) => {
                        const iconSrc = res === 'gold' 
                          ? '/assets/hud_icons/icon_gold.webp' 
                          : res === 'food' 
                          ? '/assets/hud_icons/icon_food.webp' 
                          : res === 'stone' 
                          ? '/assets/hud_icons/icon_stone.webp' 
                          : '/assets/hud_icons/icon_gem.webp'
                        return (
                          <span key={res} className={`cost-pill ${(resources[res] || 0) >= amt ? 'ok' : 'missing'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <img src={iconSrc} alt={res} className="mini-res-icon" />
                            <span>{amt}</span>
                          </span>
                        )
                      })}
                    </div>

                    <button 
                      className={`btn-craft-consumable ${canAfford ? 'active' : 'disabled'}`}
                      disabled={!canAfford}
                      onClick={() => {
                        soundManager.playCollect()
                        onCraftConsumable(item)
                      }}
                    >
                      <Plus size={14} />
                      {canAfford ? (t('inventory.craftOne') || 'Craft +1 Unit') : (t('inventory.insufficientRes') || 'Insufficient Resources')}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
