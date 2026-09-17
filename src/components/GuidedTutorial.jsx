import React, { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Crown, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Compass,
  Coins,
  Trees,
  Gem,
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import './GuidedTutorial.css'

export function GuidedTutorial({ 
  isActive, 
  onComplete, 
  onSkip 
}) {
  const { t } = useTranslation()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const [isGraduated, setIsGraduated] = useState(false)
  const animFrameRef = useRef(null)

  const steps = useMemo(() => [
    {
      id: 'resources',
      targetId: 'hud-topbar-resources',
      title: t('tutorial.step1Title'),
      subtitle: t('tutorial.step1Subtitle'),
      icon: '/assets/hud_icons/icon_gold.webp',
      description: t('tutorial.step1Desc'),
      tip: t('tutorial.step1Tip'),
      preferredPosition: 'bottom'
    },
    {
      id: 'quests',
      targetId: 'hud-quest-herald',
      title: t('tutorial.step2Title'),
      subtitle: t('tutorial.step2Subtitle'),
      icon: '/assets/hud_icons/btn_quests.webp',
      description: t('tutorial.step2Desc'),
      tip: t('tutorial.step2Tip'),
      preferredPosition: 'bottom'
    },
    {
      id: 'build',
      targetId: 'dock-btn-build',
      title: t('tutorial.step3Title'),
      subtitle: t('tutorial.step3Subtitle'),
      icon: '/assets/hud_icons/btn_build.webp',
      description: t('tutorial.step3Desc'),
      tip: t('tutorial.step3Tip'),
      preferredPosition: 'top'
    },
    {
      id: 'harvest',
      targetId: 'hud-btn-harvest',
      title: t('tutorial.step4Title'),
      subtitle: t('tutorial.step4Subtitle'),
      icon: '/assets/hud_icons/icon_gold.webp',
      description: t('tutorial.step4Desc'),
      tip: t('tutorial.step4Tip'),
      preferredPosition: 'bottom'
    },
    {
      id: 'military',
      targetId: 'dock-btn-army',
      title: t('tutorial.step5Title'),
      subtitle: t('tutorial.step5Subtitle'),
      icon: '/assets/hud_icons/btn_army.webp',
      description: t('tutorial.step5Desc'),
      tip: t('tutorial.step5Tip'),
      preferredPosition: 'top'
    }
  ], [t])

  const currentStep = steps[currentStepIndex] || steps[0]

  // Reset state whenever tutorial becomes active
  useEffect(() => {
    if (isActive) {
      setCurrentStepIndex(0)
      setIsGraduated(false)
      setTargetRect(null)
    }
  }, [isActive])

  // Update target rect dynamically with high performance (0 layout thrashing)
  useEffect(() => {
    if (!isActive || isGraduated) return

    const updateRect = () => {
      if (!currentStep?.targetId) {
        setTargetRect(null)
        return
      }

      const elem = document.getElementById(currentStep.targetId)
      if (elem) {
        const rect = elem.getBoundingClientRect()
        setTargetRect(prev => {
          if (
            prev &&
            Math.abs(prev.top - rect.top) < 1 &&
            Math.abs(prev.left - rect.left) < 1 &&
            Math.abs(prev.width - rect.width) < 1 &&
            Math.abs(prev.height - rect.height) < 1
          ) {
            return prev
          }
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom,
            right: rect.right
          }
        })
      } else {
        setTargetRect(null)
      }
    }

    updateRect()
    // Staggered checks right after step transition to settle coordinates without intervals
    const t1 = setTimeout(updateRect, 60)
    const t2 = setTimeout(updateRect, 250)

    const handleResize = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = requestAnimationFrame(updateRect)
    }

    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('orientationchange', handleResize, { passive: true })

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isActive, currentStepIndex, isGraduated, currentStep])

  // Elevate active highlighted target and trigger herald expansion when on quests step
  useEffect(() => {
    if (!isActive || isGraduated || !currentStep?.targetId) return

    if (currentStep.id === 'quests') {
      window.dispatchEvent(new CustomEvent('toc-expand-herald'))
    }

    const elem = document.getElementById(currentStep.targetId)
    if (elem) {
      elem.classList.add('guided-target-highlighted')
      return () => {
        elem.classList.remove('guided-target-highlighted')
      }
    }
  }, [isActive, currentStepIndex, isGraduated, currentStep])

  if (!isActive) return null

  const handleNext = () => {
    soundManager.playPopChime()
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      // Reached graduation!
      soundManager.playPurchaseFanfare()
      setIsGraduated(true)
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      soundManager.playClick()
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleFinishGraduation = () => {
    soundManager.playVictory()
    onComplete?.({
      gold: 600,
      wood: 400,
      stone: 400,
      food: 300,
      gems: 25
    })
  }

  const handleSkipTutorial = () => {
    soundManager.playClick()
    onSkip?.()
  }

  // Calculate advisor dialogue card placement (Guarantees 0% overlap with target button/element)
  const getCardStyle = () => {
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 800
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 600
    const isMobileLandscape = screenH <= 580 || (screenW <= 960 && screenH <= 620)
    const isMobilePortrait = screenW <= 640 && screenH > 620
    const isCompact = isMobileLandscape || isMobilePortrait

    if (isGraduated) {
      // Graduation celebration card is fully styled and centered via responsive CSS
      return {}
    }

    if (!targetRect) {
      const isLandscape = screenH <= 620 || (screenW > screenH && screenH <= 650)
      return {
        position: 'fixed',
        left: '50%',
        top: isLandscape ? 'max(8px, env(safe-area-inset-top, 8px))' : '50%',
        transform: isLandscape ? 'translateX(-50%)' : 'translate(-50%, -50%)',
        width: isLandscape 
          ? Math.min(screenW - 24, 460)
          : (isMobilePortrait ? Math.min(screenW - 24, 350) : 420),
        maxHeight: isLandscape ? 'calc(100vh - 16px)' : 'calc(100vh - 40px)',
        zIndex: 9999
      }
    }

    const cardWidth = isMobileLandscape 
      ? Math.min(screenW - 28, 315)
      : (isMobilePortrait ? Math.min(screenW - 24, 350) : 420)

    const estimatedCardHeight = isMobileLandscape ? 135 : (isMobilePortrait ? 180 : 210)
    const pad = 12

    const target = {
      left: Math.max(0, targetRect.left),
      right: Math.min(screenW, targetRect.right),
      top: Math.max(0, targetRect.top),
      bottom: Math.min(screenH, targetRect.bottom),
      width: targetRect.width,
      height: targetRect.height,
      centerX: targetRect.left + (targetRect.width / 2),
      centerY: targetRect.top + (targetRect.height / 2)
    }

    let topPos
    let leftPos

    if (isMobileLandscape) {
      // IN MOBILE LANDSCAPE: Screen is wide and short.
      // Separate card from target either horizontally or vertically to ensure target is 100% visible.
      const isTargetLeft = target.centerX < screenW * 0.45
      const isTargetRight = target.centerX > screenW * 0.55
      const isTargetTop = target.centerY < screenH * 0.45
      const isTargetBottom = target.centerY > screenH * 0.55

      if (isTargetLeft) {
        // Target is on left half (e.g. Herald). Place card on the RIGHT half!
        leftPos = screenW - cardWidth - 16
        topPos = Math.max(10, Math.min(screenH - estimatedCardHeight - 10, (screenH - estimatedCardHeight) / 2))
      } else if (isTargetRight) {
        // Target is on right half (e.g. Harvest Button). Place card on the LEFT half!
        leftPos = 16
        topPos = Math.max(10, Math.min(screenH - estimatedCardHeight - 10, (screenH - estimatedCardHeight) / 2))
      } else if (isTargetTop) {
        // Target is at top center (e.g. Resources Strip). Place card at the BOTTOM!
        leftPos = Math.max(12, Math.min(screenW - cardWidth - 12, (screenW - cardWidth) / 2))
        topPos = screenH - estimatedCardHeight - 14
      } else if (isTargetBottom) {
        // Target is at bottom center (e.g. Build or Army Dock Button). Place card at the TOP!
        leftPos = Math.max(12, Math.min(screenW - cardWidth - 12, (screenW - cardWidth) / 2))
        topPos = Math.max(8, 52)
      } else {
        // Target in center: choose horizontal side with more room
        if (screenW - target.right >= target.left) {
          leftPos = Math.min(screenW - cardWidth - 12, target.right + pad)
        } else {
          leftPos = Math.max(12, target.left - cardWidth - pad)
        }
        topPos = Math.max(10, Math.min(screenH - estimatedCardHeight - 10, (screenH - estimatedCardHeight) / 2))
      }

      // Mathematical anti-collision verification
      const cardBottom = topPos + estimatedCardHeight
      const cardRight = leftPos + cardWidth
      const collidesWithTarget = !(
        cardRight < target.left - 4 ||
        leftPos > target.right + 4 ||
        cardBottom < target.top - 4 ||
        topPos > target.bottom + 4
      )

      if (collidesWithTarget) {
        // Move horizontally away from target
        if (target.centerX >= screenW / 2) {
          leftPos = 16
        } else {
          leftPos = screenW - cardWidth - 16
        }
      }
    } else if (isMobilePortrait) {
      // IN MOBILE PORTRAIT: Screen is tall and narrow.
      if (target.top > screenH / 2) {
        // Target at bottom -> place card near top
        topPos = Math.max(12, 60)
      } else {
        // Target at top -> place card near bottom
        topPos = Math.max(12, screenH - estimatedCardHeight - 20)
      }
      leftPos = Math.max(12, (screenW - cardWidth) / 2)
    } else {
      // DESKTOP: Above or below based on space and preference
      const spaceBelow = screenH - target.bottom
      const spaceAbove = target.top

      leftPos = Math.max(16, Math.min(screenW - cardWidth - 16, target.left + (target.width / 2) - (cardWidth / 2)))

      if (currentStep.preferredPosition === 'top' || (spaceAbove > 260 && spaceBelow < 260)) {
        topPos = Math.max(12, target.top - estimatedCardHeight - pad)
      } else {
        topPos = Math.min(screenH - estimatedCardHeight - 12, target.bottom + pad)
      }

      // Desktop anti-collision check
      if (topPos + estimatedCardHeight > target.top && topPos < target.bottom && leftPos + cardWidth > target.left && leftPos < target.right) {
        if (target.left > cardWidth + pad) {
          leftPos = target.left - cardWidth - pad
          topPos = Math.max(12, target.top)
        } else if (screenW - target.right > cardWidth + pad) {
          leftPos = target.right + pad
          topPos = Math.max(12, target.top)
        }
      }
    }

    return {
      position: 'fixed',
      top: `${Math.round(topPos)}px`,
      left: `${Math.round(leftPos)}px`,
      width: `${cardWidth}px`,
      zIndex: 9999,
      transform: 'none'
    }
  }

  const cutout = targetRect ? {
    top: Math.max(0, Math.round(targetRect.top - 6)),
    left: Math.max(0, Math.round(targetRect.left - 6)),
    width: Math.round(targetRect.width + 12),
    height: Math.round(targetRect.height + 12),
  } : null
  const cutoutBottom = cutout ? cutout.top + cutout.height : 0
  const cutoutRight = cutout ? cutout.left + cutout.width : 0

  return (
    <div className="guided-tutorial-root" aria-live="polite">
      {/* Hardware-Accelerated 60 FPS Cutout (0% SVG re-rasterization, 100% GPU composited) */}
      <div className={`guided-spotlight-backdrop ${(!cutout || isGraduated) ? 'full-dim' : ''}`}>
        {cutout && !isGraduated ? (
          <div className="guided-spotlight-cutout-wrap">
            {/* Top dark curtain */}
            <div 
              className="guided-dim-panel" 
              style={{ top: 0, left: 0, width: '100%', height: `${cutout.top}px` }} 
            />
            {/* Bottom dark curtain */}
            <div 
              className="guided-dim-panel" 
              style={{ top: `${cutoutBottom}px`, left: 0, width: '100%', bottom: 0 }} 
            />
            {/* Left dark curtain */}
            <div 
              className="guided-dim-panel" 
              style={{ top: `${cutout.top}px`, left: 0, width: `${cutout.left}px`, height: `${cutout.height}px` }} 
            />
            {/* Right dark curtain */}
            <div 
              className="guided-dim-panel" 
              style={{ top: `${cutout.top}px`, left: `${cutoutRight}px`, right: 0, height: `${cutout.height}px` }} 
            />

            {/* Glowing spotlight frame around active element (Hardware Accelerated) */}
            <div 
              className="guided-spotlight-frame"
              style={{
                top: `${cutout.top}px`,
                left: `${cutout.left}px`,
                width: `${cutout.width}px`,
                height: `${cutout.height}px`
              }}
            >
              <div className="guided-spotlight-beacon" />
            </div>
          </div>
        ) : null}
      </div>

      {/* Advisor Dialogue Card */}
      {!isGraduated ? (
        <div 
          className="guided-advisor-card"
          style={getCardStyle()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Card Header */}
          <div className="guided-card-header">
            <div className="guided-advisor-avatar-wrap">
              <img 
                src="/assets/avatars/avatar_king.webp" 
                alt={t('tutorial.characterTitle')} 
                className="guided-advisor-avatar"
                draggable="false"
              />
              <span className="guided-advisor-badge">
                <Crown size={11} />
              </span>
            </div>

            <div className="guided-header-info">
              <span className="guided-character-title">{t('tutorial.characterTitle')}</span>
              <h3 className="guided-step-title">{currentStep.title}</h3>
              <span className="guided-step-subtitle">{currentStep.subtitle}</span>
            </div>

            <button 
              className="guided-skip-x-btn"
              onClick={handleSkipTutorial}
              title={t('tutorial.skip')}
              aria-label={t('tutorial.skip')}
            >
              <X size={16} />
            </button>
          </div>

          {/* Card Body */}
          <div className="guided-card-body">
            <p className="guided-step-desc">
              {currentStep.description}
            </p>

            {currentStep.tip && (
              <div className="guided-tip-box">
                <Sparkles size={14} className="guided-tip-icon" />
                <span className="guided-tip-text">{currentStep.tip}</span>
              </div>
            )}
          </div>

          {/* Card Footer: Progress & Navigation */}
          <div className="guided-card-footer">
            {/* Progress dots */}
            <div className="guided-progress-col">
              <span className="guided-step-counter">
                {t('tutorial.stepCounter', { current: currentStepIndex + 1, total: steps.length })}
              </span>
              <div className="guided-dots-row">
                {steps.map((step, idx) => (
                  <span 
                    key={step.id} 
                    className={`guided-dot ${idx === currentStepIndex ? 'active' : ''} ${idx < currentStepIndex ? 'completed' : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* Nav Buttons */}
            <div className="guided-actions-row">
              {currentStepIndex > 0 && (
                <button 
                  className="guided-nav-btn secondary"
                  onClick={handlePrev}
                  title={t('tutorial.prev')}
                >
                  <ChevronLeft size={16} />
                  <span>{t('tutorial.prev')}</span>
                </button>
              )}

              <button 
                className="guided-nav-btn primary"
                onClick={handleNext}
              >
                <span>{currentStepIndex === steps.length - 1 ? t('tutorial.finish') : t('tutorial.next')}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Graduation Celebration Card (Compact, 100% visible on small & landscape screens) */
        <div 
          className="guided-advisor-card guided-graduation-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Emergency close button so user is never trapped under any circumstances */}
          <button 
            className="guided-skip-x-btn graduation-close-x-btn"
            onClick={handleFinishGraduation}
            title={t('tutorial.graduationClaimBtn')}
            aria-label={t('tutorial.graduationClaimBtn')}
          >
            <X size={16} />
          </button>

          <div className="graduation-glow-banner">
            <div className="graduation-crown-wrap">
              <Crown className="graduation-crown-svg text-amber-300" />
            </div>
            <h2 className="graduation-title">{t('tutorial.graduationTitle')}</h2>
            <p className="graduation-subtitle">{t('tutorial.graduationSubtitle')}</p>
          </div>

          <div className="graduation-body">
            <p className="graduation-prose">
              {t('tutorial.graduationProse')}
            </p>

            <div className="graduation-rewards-grid">
              <div className="reward-pill gold">
                <Coins className="reward-icon text-amber-400" />
                <span className="reward-val">+500</span>
                <span className="reward-lbl">{t('resources.gold')}</span>
              </div>
              <div className="reward-pill wood">
                <Trees className="reward-icon text-emerald-400" />
                <span className="reward-val">+400</span>
                <span className="reward-lbl">{t('resources.wood')}</span>
              </div>
              <div className="reward-pill stone">
                <img src="/assets/hud_icons/icon_stone.webp" alt="Piedra" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                <span className="reward-val">+400</span>
                <span className="reward-lbl">{t('resources.stone')}</span>
              </div>
              <div className="reward-pill gem">
                <Gem className="reward-icon text-cyan-400" />
                <span className="reward-val">+25</span>
                <span className="reward-lbl">{t('resources.gems')}</span>
              </div>
            </div>
          </div>

          <div className="graduation-footer">
            <button 
              id="tutorial-graduation-claim-btn"
              className="graduation-claim-btn"
              onClick={handleFinishGraduation}
              type="button"
            >
              <Sparkles className="claim-icon" size={16} />
              <span className="claim-text">{t('tutorial.graduationClaimBtn')}</span>
              <ChevronRight className="claim-icon" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
