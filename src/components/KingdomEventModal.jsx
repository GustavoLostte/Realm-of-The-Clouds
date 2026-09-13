import React, { useEffect } from 'react'
import { Shield, ArrowRight } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'

const RES_ICONS = {
  gold: '/assets/hud_icons/icon_gold.webp',
  wood: '/assets/hud_icons/icon_wood.webp',
  stone: '/assets/hud_icons/icon_stone.webp',
  food: '/assets/hud_icons/icon_food.webp',
  gems: '/assets/hud_icons/icon_gem.webp',
}

export function KingdomEventModal({ 
  isOpen, 
  onClose, 
  event, 
  resources, 
  troops = {}, 
  onResolveChoice 
}) {
  const { t } = useTranslation()

  // Support Escape key to close cleanly
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        soundManager?.playClick?.()
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !event) return null

  const getResName = (res) => {
    return t(`resources.${res}`) || res
  }

  const totalTroops = 
    (troops.infantry || 0) + 
    (troops.archers || 0) + 
    (troops.mages || 0) + 
    (troops.commander || 0)

  // Check if player can afford an option
  const checkCanAfford = (choice) => {
    // Check resource costs
    if (choice.cost) {
      for (const [res, amount] of Object.entries(choice.cost)) {
        if ((resources[res] || 0) < amount) return false
      }
    }
    // Check troop requirements
    if (choice.requiredTroops) {
      if (choice.requiredTroops.total && totalTroops < choice.requiredTroops.total) return false
      if (choice.requiredTroops.infantry && (troops.infantry || 0) < choice.requiredTroops.infantry) return false
      if (choice.requiredTroops.archers && (troops.archers || 0) < choice.requiredTroops.archers) return false
      if (choice.requiredTroops.mages && (troops.mages || 0) < choice.requiredTroops.mages) return false
    }
    return true
  }

  const handleSelectChoice = (choice) => {
    if (!checkCanAfford(choice)) {
      soundManager.playClick()
      return
    }
    soundManager.playQuestSuccess()
    onResolveChoice(event, choice)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="kingdom-event-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon (Sticky and pinned at top) */}
        <div className="event-modal-header">
          <div className="event-header-left">
            <span className="event-category-badge">{t(`kingdomEvents.${event.id}.subtitle`) || event.subtitle}</span>
            <h2 className="event-modal-title">{t(`kingdomEvents.${event.id}.title`) || event.title}</h2>
          </div>
          <button 
            type="button"
            className="modal-close-candy-btn event-modal-close-btn" 
            onClick={() => {
              soundManager?.playClick?.()
              onClose?.()
            }}
            title={t('events.postponeAudience')}
            aria-label={t('common.close')}
          >
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        </div>

        {/* Scrollable Event Content Body */}
        <div className="event-modal-body">
          {/* Emissary & Narrative Box */}
          <div className="event-narrative-container">
          <div className="event-emissary-frame">
            <img 
              src={event.avatar} 
              alt={event.emissaryName} 
              className="event-emissary-portrait"
              draggable="false" 
            />
            <div className="event-emissary-meta">
              <span className="emissary-name">{t(`kingdomEvents.${event.id}.emissaryName`) || event.emissaryName}</span>
              <span className="emissary-role">{t(`kingdomEvents.${event.id}.emissaryRole`) || event.emissaryRole}</span>
            </div>
          </div>

          <div className="event-parchment-text">
            <p>{t(`kingdomEvents.${event.id}.description`) || event.description}</p>
          </div>
        </div>

        {/* Choices Section */}
        <div className="event-choices-section">
          <h3 className="event-choices-heading">
            <span>{t('events.availableDecrees')}</span>
          </h3>

          <div className="event-choices-list">
            {event.choices.map((choice, idx) => {
              const canAfford = checkCanAfford(choice)
              const hasCost = choice.cost && Object.keys(choice.cost).length > 0
              const hasReqTroops = !!choice.requiredTroops
              const hasRewards = choice.reward && Object.keys(choice.reward).some(k => k !== 'xp')

              return (
                <div 
                  key={choice.id || idx}
                  className={`event-choice-card ${canAfford ? 'affordable' : 'unaffordable'}`}
                  onClick={() => canAfford && handleSelectChoice(choice)}
                >
                  {/* Decree Header: Title & XP Reward */}
                  <div className="choice-header-row">
                    <div className="choice-label-wrap">
                      <span className="choice-seal-icon">
                        <img src="/assets/hud_icons/btn_quests.webp" alt="Sello" className="mini-res-icon" style={{ width: '20px', height: '20px' }} />
                      </span>
                      <span className="choice-label">{t(`kingdomEvents.${event.id}.choices.${choice.id}.label`) || choice.label}</span>
                    </div>
                    {choice.reward?.xp && (
                      <span className="choice-xp-pill">+{choice.reward.xp} {t('common.xp')}</span>
                    )}
                  </div>

                  {/* Decree Narrative / Description */}
                  <p className="choice-description">{t(`kingdomEvents.${event.id}.choices.${choice.id}.description`) || choice.description}</p>

                  {/* Decree Footer: Costs, Rewards & Action Button */}
                  <div className="choice-footer-strip">
                    <div className="choice-details-col">
                      {/* Requirements / Costs */}
                      {(hasCost || hasReqTroops) ? (
                        <div className="choice-cost-row">
                          <span className="cost-label">{t('events.costLabel')}</span>
                          <div className="pills-group">
                            {hasCost && Object.entries(choice.cost).map(([res, amt]) => {
                              const hasEnough = (resources[res] || 0) >= amt
                              const resName = getResName(res)
                              return (
                                <span 
                                  key={res} 
                                  className={`cost-pill ${hasEnough ? 'ok' : 'missing'}`}
                                  title={`${amt} ${resName}`}
                                >
                                  <img src={RES_ICONS[res]} alt={res} className="mini-res-icon" />
                                  <span>{amt} {resName}</span>
                                  {!hasEnough && (
                                    <span className="pill-status-alert" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                      <img src="/assets/hud_icons/icon_warning.webp" alt="Falta" className="mini-res-icon" style={{ width: '12px', height: '12px' }} />
                                      <span>{t('events.missingAlert')}</span>
                                    </span>
                                  )}
                                </span>
                              )
                            })}
                            {hasReqTroops && (
                              <span className={`cost-pill ${totalTroops >= (choice.requiredTroops.total || 0) ? 'ok' : 'missing'}`}>
                                <Shield size={12} />
                                <span>{t('events.troopsCount', { count: choice.requiredTroops.total })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="choice-cost-row">
                          <span className="cost-label free">{t('events.freeCost')}</span>
                        </div>
                      )}

                      {/* Rewards */}
                      {(hasRewards || choice.rewardTroop) && (
                        <div className="choice-reward-row">
                          <span className="reward-label">{t('events.rewardLabel')}</span>
                          <div className="pills-group">
                            {hasRewards && Object.entries(choice.reward).map(([res, amt]) => {
                              if (res === 'xp') return null
                              const resName = getResName(res)
                              return (
                                <span key={res} className="reward-pill" title={`+${amt} ${resName}`}>
                                  <img src={RES_ICONS[res]} alt={res} className="mini-res-icon" />
                                  <span>+{amt} {resName}</span>
                                </span>
                              )
                            })}
                            {choice.rewardTroop && (
                              <span className="reward-pill troop" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <img src="/assets/hud_icons/btn_army.webp" alt="Tropas" className="mini-res-icon" />
                                <span>+{choice.rewardTroop.count} {choice.rewardTroop.unitId === 'infantry' ? t('events.footmenTroop') : t('events.archersTroop')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="choice-action-col">
                      <button 
                        className={`btn-choose-decree ${canAfford ? 'active' : 'disabled'}`}
                        disabled={!canAfford}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (canAfford) handleSelectChoice(choice)
                        }}
                      >
                        {canAfford ? (
                          <>
                            <span>{t('events.decreeBtn')}</span>
                            <ArrowRight size={14} />
                          </>
                        ) : (
                          <span>{t('events.insufficientResBtn')}</span>
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
    </div>
  </div>
)
}
