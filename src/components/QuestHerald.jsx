import React, { useState, useEffect } from 'react'
import { 
  ScrollText, 
  Gift, 
  ChevronLeft, 
  ChevronRight, 
  Swords, 
  Hammer, 
  Compass,
  ArrowRight,
  Lightbulb,
  Sparkles
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'

export function QuestHerald({
  activeQuest,
  chapterData,
  questProgress,
  onClaimQuest,
  onOpenBuild,
  onOpenArmy,
  onOpenCampaign,
  onOpenQuestsModal,
  onOpenProfile,
  forceExpanded = false,
  isTutorialActive = false,
}) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    if (forceExpanded) return false
    return window.innerHeight < 550 || window.innerWidth < 768
  })

  // Expand when forceExpanded is true
  useEffect(() => {
    if (forceExpanded) {
      setCollapsed(false)
    }
  }, [forceExpanded])

  // Expand on global event
  useEffect(() => {
    const handleExpand = () => setCollapsed(false)
    window.addEventListener('toc-expand-herald', handleExpand)
    return () => window.removeEventListener('toc-expand-herald', handleExpand)
  }, [])

  const isActuallyCollapsed = forceExpanded ? false : collapsed

  if (!activeQuest) {
    return (
      <div id="hud-quest-herald" className="quest-herald-widget minimized">
        <button 
          className="herald-toggle-btn"
          onClick={() => { soundManager.playClick(); onOpenQuestsModal?.() }}
          title={t('quests.allCompletedTooltip')}
        >
          <img src="/assets/hud_icons/btn_quests.webp" alt={t('quests.heraldName')} className="herald-candy-icon" />
          <span className="herald-completed-tag">{t('quests.chapterFulfilled')}</span>
        </button>
      </div>
    )
  }

  const isCompleted = questProgress?.completed || false
  const current = questProgress?.current || 0
  const max = questProgress?.max || 1
  const percent = Math.min(100, Math.round((current / max) * 100))

  const chapterBadge = t(`quests.chapters.c${activeQuest.chapter}Badge`) || chapterData?.badge || `Chapter ${activeQuest.chapter}`
  const questTitle = t(`quests.story.${activeQuest.id}.title`) || activeQuest.title
  const questDesc = t(`quests.story.${activeQuest.id}.desc`) || activeQuest.desc
  const questHint = t(`quests.story.${activeQuest.id}.hint`) || activeQuest.hint
  const questActionLabel = t(`quests.story.${activeQuest.id}.action`) || activeQuest.actionLabel || t('common.ready')

  const handleAction = (e) => {
    if (e) e.stopPropagation()
    if (isTutorialActive) return
    soundManager.playClick()
    if (isCompleted) {
      onClaimQuest(activeQuest.id)
      return
    }

    switch (activeQuest.actionType) {
      case 'build':
        onOpenBuild?.(activeQuest.targetBuilding)
        break
      case 'army':
        onOpenArmy?.()
        break
      case 'campaign':
        onOpenCampaign?.()
        break
      case 'level':
        onOpenProfile?.()
        break
      case 'upgrade':
        onOpenBuild?.()
        break
      default:
        onOpenQuestsModal?.()
        break
    }
  }

  return (
    <aside 
      id="hud-quest-herald"
      className={`quest-herald-widget ${isActuallyCollapsed ? 'is-collapsed' : ''} ${isCompleted ? 'is-ready' : ''}`}
      aria-label="Misión Activa del Reino"
    >
      {/* Collapse/Expand Toggle Tab */}
      <button 
        id="herald-collapse-toggle-btn"
        className={`herald-collapse-tab ${isActuallyCollapsed ? 'is-collapsed-btn' : ''} ${isCompleted ? 'has-ready-quest' : ''}`}
        onClick={() => { soundManager.playClick(); setCollapsed(!isActuallyCollapsed) }}
        title={isActuallyCollapsed ? (isCompleted ? t('quests.heraldReadyTooltip') : t('quests.heraldExpandTooltip')) : t('quests.heraldCollapseTooltip')}
        aria-expanded={!isActuallyCollapsed}
        aria-label={isActuallyCollapsed ? t('quests.heraldExpandTooltip') : t('quests.heraldCollapseTooltip')}
      >
        {isActuallyCollapsed ? (
          <span className="herald-tab-collapsed-content">
            <ScrollText size={18} className="herald-tab-scroll-icon" />
            <ChevronRight size={16} className="herald-chevron-svg" />
          </span>
        ) : (
          <ChevronLeft size={20} className="herald-chevron-svg" />
        )}
        {isActuallyCollapsed && (
          <span 
            className={`herald-tab-badge ${isCompleted ? 'ready' : ''}`}
            aria-label={isCompleted ? t('quests.heraldReadyTooltip') : '1'}
          >
            {isCompleted ? '!' : '1'}
          </span>
        )}
      </button>

      {/* Main Herald Card Body */}
      <div className="herald-card-content">
        {/* Herald Top Bar */}
        <div className="herald-header" onClick={isTutorialActive ? undefined : onOpenQuestsModal}>
          <div className="herald-avatar-box">
            <img 
              src="/assets/avatars/avatar_king.webp" 
              alt={t('quests.heraldName')} 
              className="herald-advisor-img" 
              draggable="false" 
            />
            {isCompleted && <span className="herald-ready-beacon" />}
          </div>

          <div className="herald-title-col">
            <span className="herald-chapter-pill">
              {chapterBadge}
            </span>
            <h4 className="herald-quest-title">{questTitle}</h4>
          </div>
        </div>

        {/* Quest Objective & Hint */}
        <div className="herald-body" onClick={isTutorialActive ? undefined : onOpenQuestsModal}>
          <p className="herald-quest-desc">{questDesc}</p>
          {questHint && (
            <p className="herald-quest-hint" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Lightbulb size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span>{questHint}</span>
            </p>
          )}

          {/* Progress Bar */}
          <div className="herald-progress-row">
            <div className="herald-progress-track">
              <div 
                className={`herald-progress-fill ${isCompleted ? 'ready' : ''}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="herald-progress-label">
              {current} / {max}
            </span>
          </div>

          {/* Reward Badges */}
          <div className="herald-rewards-row">
            <span className="herald-reward-lead">{t('quests.reward')}</span>
            {activeQuest.reward?.xp && (
              <span className="herald-reward-pill xp">
                <Sparkles size={11} /> +{activeQuest.reward.xp} {t('common.xp')}
              </span>
            )}
            {activeQuest.reward?.gold && (
              <span className="herald-reward-pill gold">
                <img src="/assets/hud_icons/icon_gold.webp" alt="Gold" />
                +{activeQuest.reward.gold}
              </span>
            )}
            {activeQuest.reward?.gems && (
              <span className="herald-reward-pill gems">
                <img src="/assets/hud_icons/icon_gem.webp" alt="Gems" />
                +{activeQuest.reward.gems}
              </span>
            )}
            {activeQuest.reward?.wood && (
              <span className="herald-reward-pill wood">
                <img src="/assets/hud_icons/icon_wood.webp" alt="Wood" />
                +{activeQuest.reward.wood}
              </span>
            )}
            {activeQuest.reward?.stone && (
              <span className="herald-reward-pill stone">
                <img src="/assets/hud_icons/icon_stone.webp" alt="Stone" />
                +{activeQuest.reward.stone}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="herald-footer">
          {isCompleted ? (
            <button 
              className={`herald-action-btn ${isTutorialActive ? 'is-tutorial-blocked' : 'claim-pulse'}`}
              onClick={handleAction}
              disabled={isTutorialActive}
              title={isTutorialActive ? (t('tutorial.blockedInTutorial') || 'Completa o finaliza el tutorial con el Senescal primero') : t('quests.claimBtn')}
            >
              <Gift size={16} /> {isTutorialActive ? (t('tutorial.blockedInTutorialShort') || 'En Tutorial...') : t('quests.claimBtn')}
            </button>
          ) : (
            <button 
              className={`herald-action-btn go-btn ${isTutorialActive ? 'is-tutorial-blocked' : ''}`}
              onClick={handleAction}
              disabled={isTutorialActive}
              title={isTutorialActive ? (t('tutorial.blockedInTutorial') || 'Completa o finaliza el tutorial con el Senescal primero') : undefined}
            >
              {activeQuest.actionType === 'build' && <Hammer size={15} />}
              {activeQuest.actionType === 'army' && <Swords size={15} />}
              {activeQuest.actionType === 'campaign' && <Compass size={15} />}
              <span>{isTutorialActive ? (t('tutorial.blockedInTutorialShort') || 'En Tutorial...') : questActionLabel}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
