import React, { useState } from 'react'
import './DungeonBackpackModal.css'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import { getDungeonText } from '../i18n/dungeonDemoTranslations'

/**
 * DungeonBackpackModal - MMORPG Adventurer's Backpack
 * Displays live looted currencies, potions, and monster drops gathered in the dungeon session.
 * Allows inspecting items, consuming potions, and reviewing recent loot history.
 * Dynamically localized according to active user language.
 */
export function DungeonBackpackModal({
  isOpen = false,
  onClose,
  gold = 1250,
  hpPotions = 8,
  mpPotions = 5,
  materials = [],
  recentLoot = [],
  onUseHpPotion,
  onUseMpPotion,
  playerHp = 1250,
  playerMaxHp = 1250,
  playerFury = 100,
}) {
  const { currentLang } = useTranslation()
  const lang = currentLang || 'us'
  const [selectedItemId, setSelectedItemId] = useState('potion_health')

  if (!isOpen) return null

  // Built-in fixed consumables with localized names and descriptions
  const consumableSlots = [
    {
      id: 'potion_health',
      name: getDungeonText(lang, 'items', 'potionHp'),
      category: 'consumable',
      icon: '/assets/items/potion_hp_v4.webp',
      amount: hpPotions,
      desc: getDungeonText(lang, 'items', 'potionHpDesc'),
      effectText: getDungeonText(lang, 'items', 'potionHpEffect'),
      canUse: hpPotions > 0 && playerHp < playerMaxHp,
      disabledReason: hpPotions <= 0 
        ? getDungeonText(lang, 'backpack', 'noPotions') 
        : getDungeonText(lang, 'backpack', 'fullHp'),
      useAction: () => {
        soundManager?.playClick?.()
        onUseHpPotion?.()
      },
    },
    {
      id: 'potion_mana',
      name: getDungeonText(lang, 'items', 'potionMp'),
      category: 'consumable',
      icon: '/assets/items/potion_mp_v4.webp',
      amount: mpPotions,
      desc: getDungeonText(lang, 'items', 'potionMpDesc'),
      effectText: getDungeonText(lang, 'items', 'potionMpEffect'),
      canUse: mpPotions > 0 && playerFury < 100,
      disabledReason: mpPotions <= 0 
        ? getDungeonText(lang, 'backpack', 'noPotions') 
        : getDungeonText(lang, 'backpack', 'fullFury'),
      useAction: () => {
        soundManager?.playClick?.()
        onUseMpPotion?.()
      },
    },
  ]

  // Combine consumables and collected materials into a full item list with localized texts
  const allItems = [
    ...consumableSlots,
    ...materials.map((m, mIdx) => {
      let localizedName = m.name
      let localizedDesc = m.desc || getDungeonText(lang, 'backpack', 'materialEffect')
      const matId = m.id || m.matId || `material_${mIdx}`
      if (matId === 'mat_slime_jelly' || matId === 'slime_jelly') {
        localizedName = getDungeonText(lang, 'items', 'slimeJelly')
        localizedDesc = getDungeonText(lang, 'items', 'slimeJellyDesc')
      } else if (matId === 'mat_bone' || matId === 'bone' || matId === 'ancestral_bone') {
        localizedName = getDungeonText(lang, 'items', 'ancestralBone')
        localizedDesc = getDungeonText(lang, 'items', 'ancestralBoneDesc')
      } else if (matId === 'mat_bat_wing' || matId === 'bat_wing') {
        localizedName = getDungeonText(lang, 'items', 'batWing')
        localizedDesc = getDungeonText(lang, 'items', 'batWingDesc')
      }
      return {
        id: matId,
        name: localizedName,
        category: 'material',
        icon: m.icon || '/assets/hud_icons/icon_gem.webp',
        amount: m.amount || 1,
        desc: localizedDesc,
        effectText: getDungeonText(lang, 'backpack', 'materialEffect'),
        canUse: false,
      }
    }),
  ]

  // Find currently selected item
  const selectedItem = allItems.find((i) => i.id === selectedItemId) || allItems[0]

  // Standard 16-slot grid (4 columns x 4 rows)
  const TOTAL_SLOTS = 16
  const filledCount = allItems.filter((i) => i.amount > 0).length

  return (
    <div 
      className="dungeon-backpack-backdrop"
      onClick={() => {
        soundManager?.playClick?.()
        onClose?.()
      }}
    >
      <div 
        className="dungeon-backpack-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dungeon-backpack-header">
          <div className="dungeon-backpack-title-wrap">
            <span className="dungeon-backpack-title-icon">🎒</span>
            <div className="dungeon-backpack-title-text">
              <span className="dungeon-backpack-title">{getDungeonText(lang, 'backpack', 'adventurerBackpack')}</span>
              <span className="dungeon-backpack-capacity">
                {getDungeonText(lang, 'backpack', 'slotsOccupied', { filled: filledCount, total: TOTAL_SLOTS })}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="dungeon-backpack-close-btn"
            onClick={() => {
              soundManager?.playClick?.()
              onClose?.()
            }}
            aria-label={getDungeonText(lang, 'backpack', 'closeAria')}
          >
            ✕
          </button>
        </div>

        {/* Currency Vault Bar */}
        <div className="dungeon-backpack-vault-bar">
          <div className="dungeon-backpack-vault-item gold" title={getDungeonText(lang, 'backpack', 'collectedGold')}>
            <img 
              src="/assets/items/gold_coin_v4.webp" 
              alt="Gold" 
              className="dungeon-backpack-vault-icon"
              draggable={false}
            />
            <span className="dungeon-backpack-vault-label">{getDungeonText(lang, 'backpack', 'collectedGold')}</span>
            <span className="dungeon-backpack-vault-val gold">{gold.toLocaleString()}</span>
          </div>

          <div className="dungeon-backpack-vault-item gems" title={getDungeonText(lang, 'backpack', 'gems')}>
            <img 
              src="/assets/hud_icons/icon_gem.webp" 
              alt="Gems" 
              className="dungeon-backpack-vault-icon"
              draggable={false}
            />
            <span className="dungeon-backpack-vault-label">{getDungeonText(lang, 'backpack', 'gems')}</span>
            <span className="dungeon-backpack-vault-val gems">320</span>
          </div>
        </div>

        {/* Main Body: Grid + Inspector Panel */}
        <div className="dungeon-backpack-body">
          {/* Left: 4x4 Grid of Slots */}
          <div className="dungeon-backpack-grid-wrap">
            <div className="dungeon-backpack-slots-grid">
              {Array.from({ length: TOTAL_SLOTS }).map((_, idx) => {
                const item = allItems[idx]
                const isSelected = item && item.id === selectedItem?.id

                if (item && item.amount > 0) {
                  return (
                    <button
                      key={item.id ? `${item.id}_slot_${idx}` : `slot_filled_${idx}`}
                      type="button"
                      className={`dungeon-backpack-slot filled ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        soundManager?.playClick?.()
                        setSelectedItemId(item.id)
                      }}
                      title={`${item.name} (x${item.amount})`}
                    >
                      <img 
                        src={item.icon} 
                        alt={item.name} 
                        className="dungeon-backpack-slot-img"
                        draggable={false}
                      />
                      <span className="dungeon-backpack-slot-badge">
                        x{item.amount}
                      </span>
                    </button>
                  )
                }

                return (
                  <div 
                    key={`empty_${idx}`} 
                    className="dungeon-backpack-slot empty"
                    title={getDungeonText(lang, 'backpack', 'emptySlot')}
                  >
                    <span className="dungeon-backpack-slot-empty-num">{idx + 1}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Item Detail Card */}
          <div className="dungeon-backpack-detail-panel">
            {selectedItem ? (
              <div className="dungeon-backpack-detail-card">
                <div className="dungeon-backpack-detail-header">
                  <div className="dungeon-backpack-detail-icon-wrap">
                    <img 
                      src={selectedItem.icon} 
                      alt={selectedItem.name} 
                      className="dungeon-backpack-detail-icon"
                      draggable={false}
                    />
                  </div>
                  <div className="dungeon-backpack-detail-meta">
                    <h3 className="dungeon-backpack-detail-name">{selectedItem.name}</h3>
                    <span className={`dungeon-backpack-detail-category ${selectedItem.category}`}>
                      {selectedItem.category === 'consumable' 
                        ? getDungeonText(lang, 'backpack', 'quickConsumable') 
                        : getDungeonText(lang, 'backpack', 'creatureLoot')}
                    </span>
                    <span className="dungeon-backpack-detail-qty">
                      {getDungeonText(lang, 'backpack', 'inPossession', { amount: selectedItem.amount })}
                    </span>
                  </div>
                </div>

                <div className="dungeon-backpack-detail-effect">
                  <span className="detail-effect-bullet">✦</span>
                  <span>{selectedItem.effectText}</span>
                </div>

                <p className="dungeon-backpack-detail-desc">
                  {selectedItem.desc}
                </p>

                {/* Hero Status Bar Context */}
                {selectedItem.category === 'consumable' && (
                  <div className="dungeon-backpack-hero-stats">
                    {selectedItem.id === 'potion_health' ? (
                      <div className="backpack-stat-row">
                        <span>{getDungeonText(lang, 'backpack', 'heroHp')}</span>
                        <span className="stat-val hp">{playerHp} / {playerMaxHp} HP</span>
                      </div>
                    ) : (
                      <div className="backpack-stat-row">
                        <span>{getDungeonText(lang, 'backpack', 'furyMana')}</span>
                        <span className="stat-val mana">{playerFury} / 100</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action button */}
                <div className="dungeon-backpack-detail-actions">
                  {selectedItem.category === 'consumable' ? (
                    <button
                      type="button"
                      className={`dungeon-backpack-use-btn ${selectedItem.canUse ? 'active' : 'disabled'}`}
                      disabled={!selectedItem.canUse}
                      onClick={selectedItem.useAction}
                    >
                      {selectedItem.canUse 
                        ? getDungeonText(lang, 'backpack', 'useItem', { name: selectedItem.name }) 
                        : selectedItem.disabledReason}
                    </button>
                  ) : (
                    <div className="dungeon-backpack-material-badge">
                      {getDungeonText(lang, 'backpack', 'storedInBag')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="dungeon-backpack-detail-empty">
                <span className="empty-icon">🎒</span>
                <p>{getDungeonText(lang, 'backpack', 'selectItemHint')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Live Loot Log Feed */}
        <div className="dungeon-backpack-footer-feed">
          <div className="backpack-feed-title">
            <span>{getDungeonText(lang, 'backpack', 'lastLoot')}</span>
          </div>
          <div className="backpack-feed-items">
            {recentLoot && recentLoot.length > 0 ? (
              recentLoot.slice(0, 5).map((l, lIdx) => (
                <div key={l.id ? `${l.id}_recent_${lIdx}` : `recent_${lIdx}`} className="backpack-feed-chip">
                  <img src={l.icon} alt="" className="backpack-feed-chip-icon" />
                  <span className="backpack-feed-chip-text">{l.text}</span>
                </div>
              ))
            ) : (
              <span className="backpack-feed-empty-hint">
                {getDungeonText(lang, 'backpack', 'lootHint')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

