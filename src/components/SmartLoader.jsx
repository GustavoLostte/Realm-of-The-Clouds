import React, { useState, useEffect } from 'react'
import { Swords, Shield, Sparkles, Lightbulb } from 'lucide-react'
import { useTranslation } from '../i18n/index.jsx'
import './SmartLoader.css'

export function SmartLoader({
  isOpen = true,
  variant = 'city', // 'city' | 'combat' | 'arena'
  progress = 0,
  title = '',
  subtitle = '',
  statusText = '',
  onFinished = null,
}) {
  const { t } = useTranslation()
  const [displayProgress, setDisplayProgress] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)

  // Rotating contextual medieval tips
  const tips = [
    t('loader.tip1') || 'Los aldeanos y patrullas transitan continuamente la gran avenida diagonal.',
    t('loader.tip2') || 'Construye almacenes para expandir las reservas máximas de tu imperio.',
    t('loader.tip3') || 'Entrena tropas en el Cuartel para superar los desafíos de mazmorras y asediar rivales.',
    t('loader.tip4') || 'Investiga nuevas tecnologías en la Academia para acelerar tu desarrollo.',
    t('loader.tip5') || 'Equipa reliquias sagradas a tu héroe para obtener ventajas decisivas en combate.',
  ]

  // Smooth progress interpolation to avoid jerky jumps
  useEffect(() => {
    const target = Math.min(100, Math.max(0, Math.round(progress)))
    const step = target > displayProgress ? 1 : -1
    if (displayProgress !== target) {
      const timer = setTimeout(() => {
        setDisplayProgress((prev) => {
          if (Math.abs(target - prev) <= 3) return target
          return prev + Math.ceil((target - prev) * 0.3)
        })
      }, 30)
      return () => clearTimeout(timer)
    }
  }, [progress, displayProgress])

  // Cycle tips every 3.5s
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length)
    }, 3500)
    return () => clearInterval(tipTimer)
  }, [tips.length])

  // Handle completion fade-out
  useEffect(() => {
    if (displayProgress >= 100) {
      const finishTimer = setTimeout(() => {
        setIsClosing(true)
        const unmountTimer = setTimeout(() => {
          onFinished?.()
        }, 400)
        return () => clearTimeout(unmountTimer)
      }, 250)
      return () => clearTimeout(finishTimer)
    }
  }, [displayProgress, onFinished])

  if (!isOpen) return null

  // Variant default titles & subtitles
  const getHeaderInfo = () => {
    if (variant === 'combat') {
      return {
        title: title || t('loader.preparingBattle') || '¡Desplegando Campo de Batalla!',
        subtitle: subtitle || t('loader.preparingDuel') || 'Preparando Enfrentamiento...',
        icon: <Swords size={32} />,
      }
    }
    if (variant === 'arena') {
      return {
        title: title || t('loader.preparingSiege') || '¡Iniciando Asedio Táctico!',
        subtitle: subtitle || t('loader.deployingTroops') || 'Desplegando Guarnición...',
        icon: <Shield size={32} />,
      }
    }
    return {
      title: title || 'THRONE OF CHAOS',
      subtitle: subtitle || t('loader.loadingCity') || 'Construyendo la Ciudadela...',
      icon: null,
    }
  }

  const { title: resolvedTitle, subtitle: resolvedSubtitle, icon: resolvedIcon } = getHeaderInfo()

  const currentStatusMsg = statusText || (
    displayProgress >= 100 
      ? (t('loader.ready') || '¡Listo para gobernar!') 
      : displayProgress > 50 
        ? (t('loader.deployingTroops') || 'Desplegando Guarnición...') 
        : (t('loader.preparingKingdom') || 'Preparando el Reino...')
  )

  return (
    <div 
      className={`smart-loader-overlay ${variant}-mode ${isClosing ? 'is-closing' : ''}`}
      role="progressbar"
      aria-valuenow={displayProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={resolvedTitle}
    >
      <div className="smart-loader-embers" />

      <div className="smart-loader-card">
        {/* Ornate Gold Filigree Corners */}
        <div className="smart-loader-corner tl" />
        <div className="smart-loader-corner tr" />
        <div className="smart-loader-corner bl" />
        <div className="smart-loader-corner br" />

        {/* Central Emblem / Sigil */}
        <div className="smart-loader-emblem-wrap">
          <div className="smart-loader-aura" />
          {variant === 'city' ? (
            <img 
              src="/assets/logo/logo.webp" 
              alt="Throne of Chaos" 
              className="smart-loader-logo"
              draggable="false"
            />
          ) : (
            <div className="smart-loader-icon-badge">
              {resolvedIcon}
            </div>
          )}
        </div>

        {/* Headings */}
        <h2 className="smart-loader-title">{resolvedTitle}</h2>
        <p className="smart-loader-subtitle">{resolvedSubtitle}</p>

        {/* Progress Bar Section */}
        <div className="smart-loader-bar-section">
          <div className="smart-loader-bar-track">
            <div 
              className="smart-loader-bar-fill" 
              style={{ width: `${displayProgress}%` }}
            >
              <div className="smart-loader-bar-shimmer" />
            </div>
          </div>

          <div className="smart-loader-percent-row">
            <span className="smart-loader-status-msg">{currentStatusMsg}</span>
            <span className="smart-loader-percent-text">{displayProgress}%</span>
          </div>
        </div>

        {/* Helpful Game Lore / Tip */}
        <div className="smart-loader-tip-box">
          <Lightbulb size={16} className="smart-loader-tip-icon" />
          <span>{tips[tipIndex]}</span>
        </div>
      </div>
    </div>
  )
}
