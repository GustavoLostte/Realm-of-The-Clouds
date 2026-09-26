import React, { useState } from 'react'
import './TechTreeModal.css'
import { Check, Lock, Sparkles } from 'lucide-react'
import { TECH_BRANCHES, TECHNOLOGIES } from '../data/techTreeData'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'

const RES_ICONS = {
  gold: '/assets/hud_icons/icon_gold.webp',
  wood: '/assets/hud_icons/icon_wood.webp',
  stone: '/assets/hud_icons/icon_stone.webp',
  food: '/assets/hud_icons/icon_food.webp',
  gems: '/assets/hud_icons/icon_gem.webp',
}

export function TechTreeModal({ 
  isOpen, 
  onClose, 
  resources, 
  kingdomLevel, 
  unlockedTechIds = [], 
  onResearchTech 
}) {
  const { t } = useTranslation()
  const [activeBranchId, setActiveBranchId] = useState('economy')

  if (!isOpen) return null

  const activeBranch = TECH_BRANCHES.find((b) => b.id === activeBranchId) || TECH_BRANCHES[0]
  const branchTechs = TECHNOLOGIES.filter((t) => t.branchId === activeBranchId)

  // Status of a tech: 'unlocked', 'available', 'locked_level', 'locked_deps'
  const getTechStatus = (tech) => {
    if (unlockedTechIds.includes(tech.id)) return 'unlocked'
    if (kingdomLevel < tech.minKingdomLevel) return 'locked_level'
    if (tech.dependsOn && tech.dependsOn.length > 0) {
      const allDepsMet = tech.dependsOn.every((depId) => unlockedTechIds.includes(depId))
      if (!allDepsMet) return 'locked_deps'
    }
    return 'available'
  }

  const checkCanAfford = (tech) => {
    if (!tech.cost) return true
    for (const [res, amt] of Object.entries(tech.cost)) {
      if ((resources[res] || 0) < amt) return false
    }
    return true
  }

  const handleResearch = (tech) => {
    const status = getTechStatus(tech)
    if (status !== 'available') return
    if (!checkCanAfford(tech)) {
      soundManager.playHit()
      return
    }
    soundManager.playLevelUp()
    onResearchTech(tech)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="tech-tree-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="tech-tree-header">
          <div className="tech-header-left">
            <div className="tech-header-crest">
              <img src="/assets/hud_icons/btn_ranking.webp" alt="Academia" className="tech-crest-img" draggable="false" />
            </div>
            <div>
              <span className="tech-tree-tag">{t('techTree.tag')}</span>
              <h2 className="tech-tree-title">{t('techTree.title')}</h2>
            </div>
          </div>

          {/* Quick Treasury Mini-Bar */}
          {resources && (
            <div className="tech-header-treasury">
              <span className="mini-treasury-pill" title={t('resources.gold')}>
                <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" />
                <span>{(resources.gold || 0).toLocaleString()}</span>
              </span>
              <span className="mini-treasury-pill" title={t('resources.wood')}>
                <img src="/assets/hud_icons/icon_wood.webp" alt="Madera" />
                <span>{(resources.wood || 0).toLocaleString()}</span>
              </span>
              <span className="mini-treasury-pill" title={t('resources.stone')}>
                <img src="/assets/hud_icons/icon_stone.webp" alt="Piedra" />
                <span>{(resources.stone || 0).toLocaleString()}</span>
              </span>
            </div>
          )}

          <button className="modal-close-candy-btn" onClick={onClose} title={t('common.close')}>
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        </div>

        {/* Branch Tabs */}
        <div className="tech-branches-nav">
          {TECH_BRANCHES.map((b) => {
            const countUnlocked = TECHNOLOGIES.filter(
              (t) => t.branchId === b.id && unlockedTechIds.includes(t.id)
            ).length
            const countTotal = TECHNOLOGIES.filter((t) => t.branchId === b.id).length
            const isActive = b.id === activeBranchId
            const branchName = t(`techData.categories.${b.id}`) || b.name
            const branchMobile = b.id === 'economy' ? (t('build.tabProduction') || 'Economy') : b.id === 'military' ? (t('build.tabMilitary') || 'Military') : (t('build.tabArcane') || 'Arcane')
            const masteredLabel = t('techTree.mastered') || 'Mastered'

            return (
              <button
                key={b.id}
                className={`branch-tab-btn ${isActive ? 'active' : ''}`}
                style={{ '--branch-accent': b.accentColor }}
                onClick={() => {
                  soundManager.playClick()
                  setActiveBranchId(b.id)
                }}
              >
                <div className="branch-tab-icon-wrap">
                  <img src={b.image} alt={branchName} className="branch-tab-img" draggable="false" />
                </div>
                <div className="branch-tab-text-col">
                  <span className="branch-tab-name-desktop">{branchName}</span>
                  <span className="branch-tab-name-mobile">{branchMobile}</span>
                  <span className="branch-count-badge">
                    <span className="badge-text-full">{countUnlocked}/{countTotal} {masteredLabel}</span>
                    <span className="badge-text-mobile">{countUnlocked}/{countTotal}</span>
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Branch Hero Info */}
        <div className="tech-branch-hero" style={{ borderLeftColor: activeBranch.accentColor }}>
          <div className="branch-hero-left">
            <div className="branch-hero-icon-pedestal">
              <img src={activeBranch.image} alt={t(`techData.categories.${activeBranch.id}`) || activeBranch.name} className="branch-hero-img" draggable="false" />
            </div>
            <div>
              <h4 className="branch-hero-title">{t(`techData.categories.${activeBranch.id}`) || activeBranch.name}</h4>
              <p className="branch-hero-desc">{t(`techTree.branches.${activeBranch.id}.desc`) || activeBranch.description}</p>
            </div>
          </div>
        </div>

        {/* Tech Cards Grid */}
        <div className="tech-cards-grid">
          {branchTechs.map((tech) => {
            const status = getTechStatus(tech)
            const canAfford = checkCanAfford(tech)
            const isUnlocked = status === 'unlocked'
            const isAvailable = status === 'available'
            const techName = t(`techData.techs.${tech.id}.name`) || tech.name
            const techSubtitle = t(`techData.techs.${tech.id}.subtitle`) || tech.subtitle
            const techEffect = t(`techData.techs.${tech.id}.effect`) || tech.effectDescription

            return (
              <div 
                key={tech.id} 
                className={`tech-card ${status} ${canAfford ? 'affordable' : ''}`}
              >
                <div className="tech-card-header">
                  <div className="tech-icon-disc">
                    <img 
                      src={tech.image} 
                      alt={techName} 
                      className="tech-node-img" 
                      draggable="false" 
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = '/assets/hud_icons/btn_upgrade.webp'
                      }}
                    />
                    {isUnlocked && (
                      <div className="tech-unlocked-badge">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                  <div className="tech-title-block">
                    <div className="tech-card-title-row">
                      <span className="tech-name">{techName}</span>
                      <span className="tech-lvl-tag">{t('common.levelShort')} {tech.minKingdomLevel}</span>
                    </div>
                    <span className="tech-subtitle">{techSubtitle}</span>
                  </div>
                </div>

                <div className="tech-effect-box">
                  <p className="tech-effect-desc">{techEffect}</p>
                </div>

                {/* Dependencies info */}
                {tech.dependsOn && tech.dependsOn.length > 0 && (
                  <div className="tech-deps-row">
                    <span className="deps-label">{t('techTree.prerequisite') || 'Prerequisite:'}</span>
                    {tech.dependsOn.map((depId) => {
                      const depTech = TECHNOLOGIES.find((t) => t.id === depId)
                      const depMet = unlockedTechIds.includes(depId)
                      const depName = t(`techData.techs.${depId}.name`) || depTech?.name || depId
                      return (
                        <span key={depId} className={`dep-pill ${depMet ? 'met' : 'missing'}`}>
                          {depMet ? <Check size={10} /> : <Lock size={10} />}
                          {depName}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Cost Row & Action Button */}
                <div className="tech-card-footer">
                  {!isUnlocked ? (
                    <div className="tech-cost-pills">
                      {tech.cost && Object.entries(tech.cost).map(([res, amt]) => {
                        const hasEnough = (resources[res] || 0) >= amt
                        return (
                          <span 
                            key={res} 
                            className={`cost-pill ${hasEnough ? 'ok' : 'missing'}`}
                          >
                            <img src={RES_ICONS[res]} alt={res} className="mini-res-icon" />
                            {amt}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="tech-completed-label">
                      <Sparkles size={14} />
                      <span className="completed-text-full">{t('tech.researchedBadge')}</span>
                      <span className="completed-text-mobile">{t('tech.researchedBadge')}</span>
                    </span>
                  )}

                  {!isUnlocked && (
                    <button
                      className={`btn-research-action ${isAvailable && canAfford ? 'active' : 'disabled'}`}
                      disabled={!isAvailable || !canAfford}
                      onClick={() => handleResearch(tech)}
                    >
                      {status === 'locked_level' && `🔒 ${t('tech.requiresKingdomLevel', { level: tech.minKingdomLevel })}`}
                      {status === 'locked_deps' && `🔒 ${t('tech.prerequisiteNeeded')}`}
                      {status === 'available' && (canAfford ? `⚡ ${t('tech.researchBtn')} (+${tech.xpReward} ${t('common.xp')})` : `⚠️ ${t('tech.insufficientRes')}`)}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
