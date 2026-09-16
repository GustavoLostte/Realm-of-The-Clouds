import React, { useState, useEffect, useRef } from 'react'
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
  Sparkles,
  X
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
  const [collapsed, setCollapsed] = useState(() => !forceExpanded)

  // Expand when forceExpanded is true
  useEffect(() => {
    if (forceExpanded) {
      setCollapsed(false)
    }
  }, [forceExpanded])

  // Expand on global event
  useEffect(() => {
    const handleExpand = () => {
      setCollapsed(false)
      window.dispatchEvent(new CustomEvent('close-dropdowns', { detail: 'QuestHerald' }))
    }
    window.addEventListener('toc-expand-herald', handleExpand)
    return () => window.removeEventListener('toc-expand-herald', handleExpand)
  }, [])

  // Listen for global dropdown close events
  useEffect(() => {
    const handleCloseDropdowns = (e) => {
      if (e.detail !== 'QuestHerald') {
        setCollapsed(true)
      }
    }
    window.addEventListener('close-dropdowns', handleCloseDropdowns)
    return () => window.removeEventListener('close-dropdowns', handleCloseDropdowns)
  }, [])

  // Click outside listener for the dropdown
  const heraldRef = useRef(null)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (heraldRef.current && !heraldRef.current.contains(e.target) && !e.target.closest('#herald-collapse-toggle-btn')) {
        setCollapsed(true)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  const isActuallyCollapsed = forceExpanded ? false : collapsed

  if (!activeQuest) {
    return (
      <div id="hud-quest-herald" className="quest-herald-widget minimized">
        <button 
          className="herald-round-toggle-btn"
          onClick={() => { soundManager.playClick(); onOpenQuestsModal?.() }}
          title={t('quests.allCompletedTooltip') || 'Capítulo Cumplido'}
        >
          <img src="/assets/hud_icons/btn_quests.webp" alt={t('quests.heraldName')} className="herald-round-btn-icon" draggable="false" />
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
      ref={heraldRef}
      className={`notification-bell-wrapper quest-herald-container ${isCompleted ? 'is-ready' : ''}`}
      aria-label="Misión Activa del Reino"
    >
      {/* Dropdown Toggle Button */}
      <button 
        id="herald-collapse-toggle-btn"
        className={`notification-bell-btn herald-round-trigger ${isCompleted ? 'has-ready-quest' : ''} ${!isActuallyCollapsed ? 'active' : ''}`}
        onClick={() => { 
          soundManager.playClick(); 
          setCollapsed((prev) => {
            if (prev) window.dispatchEvent(new CustomEvent('close-dropdowns', { detail: 'QuestHerald' }))
            return !prev
          })
        }}
        title={isActuallyCollapsed ? (isCompleted ? t('quests.heraldReadyTooltip') : t('quests.heraldExpandTooltip')) : t('quests.heraldCollapseTooltip')}
        aria-expanded={!isActuallyCollapsed}
        aria-label={isActuallyCollapsed ? t('quests.heraldExpandTooltip') : t('quests.heraldCollapseTooltip')}
      >
        <span className="herald-tab-collapsed-content">
          <img 
            src="/assets/hud_icons/btn_quests.webp" 
            alt="Misión" 
            className="herald-round-btn-icon" 
            draggable="false" 
          />
        </span>
        {isCompleted && (
          <span 
            className="herald-tab-badge ready"
            aria-label={t('quests.heraldReadyTooltip')}
          >
            !
          </span>
        )}
        {!isCompleted && isActuallyCollapsed && (
          <span className="herald-tab-badge">1</span>
        )}
      </button>

      {/* Main Herald Card Body (Dropdown) */}
      {!isActuallyCollapsed && (
        <div 
          className="herald-card-content dropdown-mode"
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
        {/* Herald Top Bar */}
        <div className="herald-header dropdown-header">
          <div 
            className="herald-avatar-box"
            onClick={isTutorialActive ? undefined : onOpenQuestsModal}
            title={t('quests.allQuestsTooltip') || 'Ver todas las misiones'}
            style={{ cursor: 'pointer' }}
          >
            <img 
              src="/assets/avatars/avatar_king.webp" 
              alt={t('quests.heraldName')} 
              className="herald-advisor-img" 
              draggable="false" 
            />
            {isCompleted && <span className="herald-ready-beacon" />}
          </div>

          <div 
            className="herald-title-col"
            onClick={isTutorialActive ? undefined : onOpenQuestsModal}
            title={t('quests.allQuestsTooltip') || 'Ver todas las misiones'}
            style={{ cursor: 'pointer', flex: 1 }}
          >
            <span className="herald-chapter-pill">
              {chapterBadge}
            </span>
            <h4 className="herald-quest-title">{questTitle}</h4>
          </div>

          <button
            type="button"
            className="herald-card-close-btn"
            onClick={(e) => {
              e.stopPropagation()
              soundManager?.playClick?.()
              setCollapsed(true)
            }}
            title={t('common.close') || 'Cerrar'}
            aria-label={t('common.close') || 'Cerrar'}
          >
            <X size={15} />
          </button>
        </div>

        {/* Quest Objective & Hint */}
        <div className="herald-body">
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

          <button
            type="button"
            className="herald-open-all-link"
            onClick={(e) => {
              e.stopPropagation()
              soundManager?.playClick?.()
              onOpenQuestsModal?.()
            }}
          >
            <ScrollText size={13} />
            <span>{t('quests.viewAllQuests') || 'Ver todas las misiones'}</span>
          </button>
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
    )}
  </aside>
  )
}
