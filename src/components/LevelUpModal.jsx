import React, { useEffect } from 'react'
import './LevelUpModal.css'
import { Crown, Sparkles, Check, Gift, LockOpen } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'

export function LevelUpModal({
  isOpen,
  onClose,
  newLevel,
  levelData,
  onClaimRewards,
}) {
  const { t } = useTranslation()

  useEffect(() => {
    if (isOpen) {
      soundManager.playLevelUp()
    }
  }, [isOpen])

  if (!isOpen || !levelData) return null

  const handleClaim = () => {
    soundManager.playCollect()
    if (onClaimRewards && levelData.reward) {
      onClaimRewards(levelData.reward)
    }
    onClose()
  }

  return (
    <div className="modal-backdrop levelup-backdrop" onClick={handleClaim}>
      <div className="game-modal levelup-modal" onClick={(e) => e.stopPropagation()}>
        {/* Glow halo background */}
        <div className="levelup-halo" />

        {/* Big Crown Icon Header */}
        <div className="levelup-crest-wrap">
          <div className="levelup-crown-pulse">
            <Crown size={38} className="levelup-crown-icon" />
          </div>
          <span className="levelup-badge-num">{t('common.level')} {newLevel}</span>
        </div>

        <div className="levelup-content">
          <h2 className="levelup-main-title">{t('levelup.title')}</h2>
          <p className="levelup-rank-title">{t(`kingdomLevels.${newLevel}.title`) || levelData.title}</p>
          <p className="levelup-congrats-text">
            {t('levelup.subtitle')}
          </p>

          {/* Unlocked Features / Buildings */}
          {(() => {
            const rawUnlocks = t(`kingdomLevels.${newLevel}.unlocks`)
            const unlocksList = Array.isArray(rawUnlocks) ? rawUnlocks : (levelData.unlocks || [])
            if (unlocksList.length === 0) return null
            return (
              <div className="levelup-unlocks-box">
                <div className="unlocks-header">
                  <LockOpen size={15} className="text-amber-400" />
                  <h4>{t('levelup.newUnlocks')}</h4>
                </div>
                <div className="unlocks-tags-grid">
                  {unlocksList.map((item, idx) => (
                    <div key={idx} className="unlock-tag-card">
                      <Check size={13} className="text-emerald-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Level Rewards Tribute */}
          {levelData.reward && (
            <div className="levelup-rewards-section">
              <div className="levelup-rewards-header">
                <Gift size={15} className="text-amber-400" />
                <span>{t('levelup.tributeReward')}</span>
              </div>
              <div className="levelup-rewards-grid">
                {levelData.reward.gold > 0 && (
                  <div className="levelup-reward-card gold">
                    <img src="/assets/hud_icons/icon_gold.webp" alt="Gold" className="levelup-reward-icon" />
                    <div className="levelup-reward-info">
                      <span className="levelup-reward-val">+{levelData.reward.gold.toLocaleString()}</span>
                      <span className="levelup-reward-lbl">{t('resources.gold')}</span>
                    </div>
                  </div>
                )}
                {levelData.reward.gems > 0 && (
                  <div className="levelup-reward-card gems">
                    <img src="/assets/hud_icons/icon_gem.webp" alt="Gems" className="levelup-reward-icon" />
                    <div className="levelup-reward-info">
                      <span className="levelup-reward-val">+{levelData.reward.gems.toLocaleString()}</span>
                      <span className="levelup-reward-lbl">{t('resources.gems')}</span>
                    </div>
                  </div>
                )}
                {levelData.reward.wood > 0 && (
                  <div className="levelup-reward-card wood">
                    <img src="/assets/hud_icons/icon_wood.webp" alt="Wood" className="levelup-reward-icon" />
                    <div className="levelup-reward-info">
                      <span className="levelup-reward-val">+{levelData.reward.wood.toLocaleString()}</span>
                      <span className="levelup-reward-lbl">{t('resources.wood')}</span>
                    </div>
                  </div>
                )}
                {levelData.reward.stone > 0 && (
                  <div className="levelup-reward-card stone">
                    <img src="/assets/hud_icons/icon_stone.webp" alt="Stone" className="levelup-reward-icon" />
                    <div className="levelup-reward-info">
                      <span className="levelup-reward-val">+{levelData.reward.stone.toLocaleString()}</span>
                      <span className="levelup-reward-lbl">{t('resources.stone')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button className="levelup-claim-btn" onClick={handleClaim}>
            <Sparkles size={18} /> {t('levelup.claimBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
