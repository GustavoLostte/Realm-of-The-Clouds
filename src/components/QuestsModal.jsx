import React, { useState } from 'react'
import { 
  ScrollText, 
  CheckCircle2, 
  Circle, 
  Gift, 
  Sparkles, 
  Compass,
  Trophy,
  Clock,
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'

export function QuestsModal({ 
  isOpen, 
  onClose, 
  quests = [], 
  dailyQuests = [],
  epicFeats = [],
  onClaimQuest,
  chapterData,
  currentChapter = 1 
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('story') // 'story' | 'daily' | 'epic'

  if (!isOpen) return null

  const storyQuests = quests.filter((q) => !q.category || q.category === 'story')
  const currentList = 
    activeTab === 'story' ? storyQuests :
    activeTab === 'daily' ? dailyQuests : epicFeats

  const completedCount = currentList.filter((q) => q.completed).length

  const chapterBadge = t(`quests.chapters.c${currentChapter}Badge`) || chapterData?.badge || `Chapter ${currentChapter}`
  const chapterTitle = t(`quests.chapters.c${currentChapter}Title`) || chapterData?.title || 'Imperial Campaign'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="game-modal quests-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with candy scroll and close icon */}
        <div className="modal-header candy-header">
          <div className="modal-title-wrap">
            <img 
              src="/assets/hud_icons/btn_quests.webp" 
              alt={t('quests.modalTitle')} 
              className="modal-candy-header-icon" 
              draggable="false" 
            />
            <div>
              <h3>{t('quests.modalTitle')}</h3>
              <p className="modal-subtitle">{t('quests.modalSubtitle')}</p>
            </div>
          </div>
          <button 
            className="modal-close-candy-btn" 
            onClick={() => { soundManager.playClick(); onClose() }}
            aria-label={t('common.close')}
          >
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        </div>

        {/* Chapter Progress Hero Banner */}
        <div className="quests-chapter-banner">
          <div className="chapter-meta">
            <span className="chapter-badge">{chapterBadge}</span>
            <h4>{chapterTitle}</h4>
            <span className="chapter-status-text">
              {t('quests.decreesCompletedInSection', { completed: completedCount, total: currentList.length })}
            </span>
          </div>

          <div className="chapter-chest-box">
            <img 
              src="/assets/hud_icons/btn_inventory.webp" 
              alt={t('quests.chestTooltip')} 
              className="chapter-chest-icon" 
              draggable="false" 
            />
            <span className="chest-tooltip">{t('quests.chestTooltip')}</span>
          </div>
        </div>

        {/* Candy Category Tabs */}
        <div className="candy-category-tabs quests-category-tabs">
          <button 
            className={`candy-tab-btn quest-tab-btn ${activeTab === 'story' ? 'active' : ''}`}
            onClick={() => { soundManager.playClick(); setActiveTab('story') }}
            type="button"
          >
            <ScrollText size={18} className="tab-icon" />
            <span className="tab-title">{t('quests.tabCampaign')}</span>
            <span className="tab-counter-badge">
              {storyQuests.filter(q => q.completed).length}/{storyQuests.length}
            </span>
          </button>
          <button 
            className={`candy-tab-btn quest-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => { soundManager.playClick(); setActiveTab('daily') }}
            type="button"
          >
            <Clock size={18} className="tab-icon" />
            <span className="tab-title">{t('quests.tabDailyQuests')}</span>
            <span className="tab-counter-badge">
              {dailyQuests.filter(q => q.completed).length}/{dailyQuests.length}
            </span>
          </button>
          <button 
            className={`candy-tab-btn quest-tab-btn ${activeTab === 'epic' ? 'active' : ''}`}
            onClick={() => { soundManager.playClick(); setActiveTab('epic') }}
            type="button"
          >
            <Trophy size={18} className="tab-icon" />
            <span className="tab-title">{t('quests.tabEpicFeats')}</span>
            <span className="tab-counter-badge">
              {epicFeats.filter(q => q.completed).length}/{epicFeats.length}
            </span>
          </button>
        </div>

        {/* Quests Scroll Content */}
        <div className="modal-scroll-content">
          <div className="quests-candy-list">
            {currentList.map((q) => {
              const hasProgress = q.progress !== undefined && q.max !== undefined
              const percent = hasProgress ? Math.min(100, Math.round((q.progress / q.max) * 100)) : (q.completed ? 100 : 0)
              const cat = q.category || activeTab || 'story'
              const resolvedTitle = t(`quests.${cat}.${q.id}.title`)
              const title = (resolvedTitle && resolvedTitle !== `quests.${cat}.${q.id}.title`)
                ? resolvedTitle
                : (t(`quests.story.${q.id}.title`) || q.title)
              const resolvedDesc = t(`quests.${cat}.${q.id}.desc`)
              const desc = (resolvedDesc && resolvedDesc !== `quests.${cat}.${q.id}.desc`)
                ? resolvedDesc
                : (t(`quests.story.${q.id}.desc`) || q.desc)

              return (
                <div key={q.id} className={`quest-candy-card ${q.completed ? 'completed' : ''} ${q.isClaimed ? 'claimed' : ''}`}>
                  <div className="quest-status-col">
                    <div className={`status-bubble ${q.isClaimed ? 'claimed' : q.completed ? 'ready' : 'pending'}`}>
                      {q.isClaimed ? (
                        <CheckCircle2 size={24} className="text-slate-400" />
                      ) : q.completed ? (
                        <CheckCircle2 size={24} className="text-emerald-400" />
                      ) : (
                        <Circle size={22} className="text-amber-500/60" />
                      )}
                    </div>
                  </div>

                  <div className="quest-candy-info">
                    <div className="quest-heading-row">
                      <h4>{title}</h4>
                      {q.timeRemaining && (
                        <span className="quest-timer-chip">
                          <Clock size={11} /> {q.timeRemaining}
                        </span>
                      )}
                    </div>
                    <p>{desc}</p>

                    {/* Progress Track */}
                    <div className="quest-progress-strip">
                      <div className="candy-progress-track">
                        <div 
                          className={`candy-progress-fill ${q.completed ? 'completed' : ''}`} 
                          style={{ width: `${percent}%` }} 
                        />
                      </div>
                      <span className="quest-progress-num">
                        {hasProgress ? `${q.progress} / ${q.max}` : (q.completed ? '1 / 1' : '0 / 1')}
                      </span>
                    </div>

                    {/* Rewards with Candy Icons */}
                    <div className="quest-rewards-strip">
                      <span className="rewards-lead">{t('quests.reward')}</span>
                      {q.reward?.xp && (
                        <div className="candy-reward-pill xp">
                          <Sparkles size={12} className="text-amber-300" />
                          <span>+{q.reward.xp} {t('common.xp')}</span>
                        </div>
                      )}
                      {q.reward?.gold && (
                        <div className="candy-reward-pill gold">
                          <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" className="reward-icon-tiny" />
                          <span>+{q.reward.gold}</span>
                        </div>
                      )}
                      {q.reward?.wood && (
                        <div className="candy-reward-pill wood">
                          <img src="/assets/hud_icons/icon_wood.webp" alt="Madera" className="reward-icon-tiny" />
                          <span>+{q.reward.wood}</span>
                        </div>
                      )}
                      {q.reward?.food && (
                        <div className="candy-reward-pill food">
                          <img src="/assets/hud_icons/icon_food.webp" alt="Víveres" className="reward-icon-tiny" />
                          <span>+{q.reward.food}</span>
                        </div>
                      )}
                      {q.reward?.stone && (
                        <div className="candy-reward-pill stone">
                          <img src="/assets/hud_icons/icon_stone.webp" alt="Piedra" className="reward-icon-tiny" />
                          <span>+{q.reward.stone}</span>
                        </div>
                      )}
                      {q.reward?.gems && (
                        <div className="candy-reward-pill gems">
                          <img src="/assets/hud_icons/icon_gem.webp" alt="Cristales" className="reward-icon-tiny" />
                          <span>+{q.reward.gems}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="quest-candy-action">
                    {q.isClaimed ? (
                      <div className="quest-claimed-box">
                        <CheckCircle2 size={14} />
                        <span>{t('quests.statusClaimed')}</span>
                      </div>
                    ) : q.completed ? (
                      <button 
                        className="btn-claim-candy pulse-anim"
                        onClick={() => {
                          soundManager.playCollect()
                          onClaimQuest(q.id)
                        }}
                      >
                        <Gift size={16} /> {t('quests.btnClaim')}
                      </button>
                    ) : (
                      <div className="quest-waiting-box">
                        <span className="waiting-tag">{t('quests.statusInProgress')}</span>
                        <span className="waiting-percent">{percent}%</span>
                      </div>
                    )}
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
