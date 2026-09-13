import React, { useState, useEffect } from 'react'
import { RotateCw, Maximize2, Crown } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { requestGameFullscreen } from '../utils/fullscreen'
import './OrientationNotice.css'

export default function OrientationNotice() {
  const { t } = useTranslation()
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkOrientation = () => {
      const isHeightGreater = window.innerHeight > window.innerWidth
      const isMediaPortrait = window.matchMedia && window.matchMedia('(orientation: portrait)').matches
      const currentlyPortrait = isHeightGreater || isMediaPortrait
      setIsPortrait(currentlyPortrait)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    let mql = null
    if (window.matchMedia) {
      mql = window.matchMedia('(orientation: portrait)')
      try {
        mql.addEventListener('change', checkOrientation)
      } catch (e) {
        mql.addListener(checkOrientation)
      }
    }

    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', checkOrientation)
    }

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
      if (mql) {
        try {
          mql.removeEventListener('change', checkOrientation)
        } catch (e) {
          mql.removeListener(checkOrientation)
        }
      }
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', checkOrientation)
      }
    }
  }, [])

  const handleRequestFullscreenAndRotate = async () => {
    soundManager.playClick?.()
    await requestGameFullscreen()
  }

  return (
    <div 
      className={`orientation-notice-overlay ${isPortrait ? 'is-active' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={t('orientation.title')}
    >
      {/* Ambient background glow effects */}
      <div className="orientation-backdrop-glow" />
      <div className="orientation-backdrop-glow glow-secondary" />

      {/* Medieval Imperial Card */}
      <div className="orientation-card">
        {/* Official Game Logo */}
        <div className="orientation-logo-wrap">
          <img 
            src="/assets/logo/logo.webp" 
            alt="Throne of Chaos" 
            className="orientation-logo-img" 
            draggable="false" 
          />
        </div>

        {/* Top Imperial Badge */}
        <div className="orientation-badge">
          <RotateCw className="orientation-badge-icon" />
          <span>{t('orientation.rotateHint')}</span>
        </div>

        {/* Animated 3D Smartphone Illustration */}
        <div className="orientation-visual-stage">
          <div className="orientation-orbit-ring" />
          <div className="orientation-orbit-arrow" />
          
          <div className="orientation-phone-chassis">
            <div className="orientation-phone-speaker" />
            <div className="orientation-phone-screen">
              <Crown className="orientation-screen-icon" />
            </div>
            <div className="orientation-phone-homebar" />
          </div>
        </div>

        {/* Typography */}
        <h1 className="orientation-title">{t('orientation.title')}</h1>
        
        <p className="orientation-desc">
          {t('orientation.message')}
        </p>

        {/* Game feature chips */}
        <div className="orientation-highlights">
          <div className="orientation-chip">
            <span className="chip-emoji">🏰</span>
            <span>{t('hud.kingdomLevel', { level: 1 })}</span>
          </div>
          <div className="orientation-chip">
            <span className="chip-emoji">⚔️</span>
            <span>{t('hud.colosseumTitle')}</span>
          </div>
          <div className="orientation-chip">
            <span className="chip-emoji">👑</span>
            <span>{t('common.sovereign')}</span>
          </div>
        </div>

        {/* Interactive Actions */}
        <div className="orientation-actions">
          <button 
            type="button"
            className="orientation-btn-primary"
            onClick={handleRequestFullscreenAndRotate}
          >
            <Maximize2 size={18} />
            <span>{t('orientation.rotateHint')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
