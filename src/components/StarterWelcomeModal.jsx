import React from 'react'
import { Crown, Sparkles, ChevronRight } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'

export function StarterWelcomeModal({ isOpen, onClose, onStartTutorial }) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const handleStart = () => {
    soundManager.playQuestSuccess()
    onStartTutorial?.()
    onClose()
  }

  return (
    <div className="modal-backdrop starter-welcome-backdrop">
      <div 
        className="game-modal starter-welcome-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
      >
        {/* Header Decor */}
        <div className="welcome-hero-banner">
          <div className="welcome-avatar-wrap">
            <img 
              src="/assets/avatars/avatar_king.webp" 
              alt={t('common.sovereign')} 
              className="welcome-king-avatar"
              draggable="false" 
            />
            <div className="welcome-crown-beacon-wrap">
              <img 
                src="/assets/hud_icons/btn_ranking.webp" 
                alt="Crown" 
                className="welcome-crown-beacon-img" 
                draggable="false"
              />
            </div>
          </div>
          <div className="welcome-hero-text">
            <span className="welcome-subtitle-tag">{t('starterWelcome.tag')}</span>
            <h2 id="welcome-modal-title">{t('starterWelcome.title')}</h2>
            <p>{t('starterWelcome.subtitle')}</p>
          </div>
        </div>

        {/* Narrative Letter */}
        <div className="welcome-body-content">
          <p className="welcome-prose">
            {t('starterWelcome.prose')}
          </p>

          <div className="welcome-steps-roadmap">
            <h4 className="roadmap-title">
              <Sparkles size={16} className="text-amber-400 roadmap-title-icon" />
              <span>{t('starterWelcome.roadmapTitle')}</span>
            </h4>

            <div className="roadmap-grid">
              <div className="roadmap-card">
                <div className="roadmap-badge">{t('common.step', { num: 1 })}</div>
                <div className="roadmap-card-icon">
                  <img src="/assets/hud_icons/btn_quests.webp" alt="Decree" className="roadmap-hud-icon" draggable="false" />
                </div>
                <div className="roadmap-card-body">
                  <h5>{t('starterWelcome.step1Title')}</h5>
                  <p>{t('starterWelcome.step1Desc')}</p>
                </div>
              </div>

              <div className="roadmap-card">
                <div className="roadmap-badge">{t('common.step', { num: 2 })}</div>
                <div className="roadmap-card-icon">
                  <img src="/assets/hud_icons/icon_gold.webp" alt="Mine" className="roadmap-hud-icon" draggable="false" />
                </div>
                <div className="roadmap-card-body">
                  <h5>{t('starterWelcome.step2Title')}</h5>
                  <p>{t('starterWelcome.step2Desc')}</p>
                </div>
              </div>

              <div className="roadmap-card">
                <div className="roadmap-badge">{t('common.step', { num: 3 })}</div>
                <div className="roadmap-card-icon">
                  <img src="/assets/hud_icons/btn_army.webp" alt="Barracks" className="roadmap-hud-icon" draggable="false" />
                </div>
                <div className="roadmap-card-body">
                  <h5>{t('starterWelcome.step3Title')}</h5>
                  <p>{t('starterWelcome.step3Desc')}</p>
                </div>
              </div>

              <div className="roadmap-card">
                <div className="roadmap-badge">{t('common.step', { num: 4 })}</div>
                <div className="roadmap-card-icon">
                  <img src="/assets/hud_icons/btn_expedition.webp" alt="Campaign" className="roadmap-hud-icon" draggable="false" />
                </div>
                <div className="roadmap-card-body">
                  <h5>{t('starterWelcome.step4Title')}</h5>
                  <p>{t('starterWelcome.step4Desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="welcome-footer-cta">
          <button 
            className="welcome-begin-btn"
            onClick={handleStart}
            type="button"
          >
            <Crown size={20} className="welcome-btn-icon" />
            <span className="welcome-btn-label">{t('starterWelcome.beginBtn')}</span>
            <ChevronRight size={18} className="welcome-btn-arrow" />
          </button>
        </div>
      </div>
    </div>
  )
}
