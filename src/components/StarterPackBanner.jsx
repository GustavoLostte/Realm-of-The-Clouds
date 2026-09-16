import React, { useState, useEffect } from 'react'
import { Clock, ChevronRight, X } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'

export function StarterPackBanner({ 
  claimed = false, 
  onOpenOffer 
}) {
  const { t } = useTranslation()
  // 24-hour countdown simulation
  const [timeLeft, setTimeLeft] = useState(() => {
    return 23 * 3600 + 48 * 60 + 15
  })
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (claimed) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [claimed])

  if (claimed) return null

  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60
  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const handleClick = () => {
    soundManager.playClick()
    onOpenOffer?.()
  }

  // Minimized state when user dismisses the banner
  if (isDismissed) {
    return (
      <div className="starter-pack-floating-banner minimized-mode">
        <div className="lateral-event-bubble-wrapper">
          <button
            type="button"
            className="lateral-event-bubble"
            onClick={(e) => {
              e.stopPropagation()
              soundManager.playClick()
              setIsDismissed(false)
            }}
            title={t('starterPack.minimizedTooltip')}
            aria-label={t('starterPack.minimizedTooltip')}
          >
            <img 
              src="/assets/hud_icons/btn_inventory.webp" 
              alt="Oferta" 
              className="lateral-event-bubble-img" 
              draggable="false" 
            />
            <div className="lateral-event-bubble-badge" style={{ background: '#f59e0b', fontSize: '0.5rem' }}>%</div>
          </button>
          <div className="lateral-event-timer-pill">
            {timeString}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="starter-pack-floating-banner" 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title={t('starterPack.bannerTitleTooltip')}
    >
      <div className="banner-glow-halo" />

      {/* Dismiss button */}
      <button 
        type="button"
        className="banner-close-btn"
        onClick={(e) => {
          e.stopPropagation()
          soundManager.playClick()
          setIsDismissed(true)
        }}
        title={t('starterPack.hideBanner')}
        aria-label={t('starterPack.hideBanner')}
      >
        <X size={12} />
      </button>

      <div className="banner-icon-side">
        <div className="banner-chest-disc">
          <img 
            src="/assets/hud_icons/btn_inventory.webp" 
            alt={t('starterPack.title')} 
            className="banner-chest-img" 
            draggable="false" 
          />
          <span className="banner-badge-discount">-85%</span>
        </div>
      </div>

      <div className="banner-info-side">
        <div className="banner-top-row">
          <span className="banner-tag">{t('starterPack.bannerTag')}</span>
          <div className="banner-timer">
            <Clock size={10} />
            <span>{timeString}</span>
          </div>
        </div>
        <h4 className="banner-title">{t('starterPack.title')}</h4>
        <div className="banner-bottom-row">
          <div className="banner-prices">
            <span className="banner-strike-price">$6.99</span>
            <span className="banner-hot-price">$0.99</span>
          </div>
          <div className="banner-cta">
            <span>{t('starterPack.viewBtn')}</span>
            <ChevronRight size={11} />
          </div>
        </div>
      </div>
    </div>
  )
}

