import React, { useState, useEffect, useRef } from 'react'
import { Crown, Sparkles, Dices, Check, Shield, AlertCircle } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'

const NOBLE_NAME_SUGGESTIONS = [
  'Lord Arturo',
  'Rey Valerius',
  'Reina Valerie',
  'Conquistador Roland',
  'Soberana Diana',
  'Emperador Marcus',
  'Duque Leonel',
  'Gran Señor Guillermo',
  'Señora Katherine',
  'Lord Wizzard',
  'Archiduque Dante',
  'Barón Siegfried',
  'Príncipe Aldor',
  'Señor Feudal Ronald',
  'Custodio de Avalon'
]

const AVATAR_LIST = [
  { id: 'king', name: 'Arcángel Soberano', img: '/assets/avatars/avatar_king.webp', title: 'Monarca Celestial' },
  { id: 'valkyrie', name: 'Valquiria Celestial', img: '/assets/avatars/avatar_valkyrie.webp', title: 'Seraphim de Batalla' },
  { id: 'paladin', name: 'Paladín Divino', img: '/assets/avatars/avatar_paladin.webp', title: 'Custodio de la Luz' },
  { id: 'mage', name: 'Archimago Astral', img: '/assets/avatars/avatar_mage.webp', title: 'Maestro de las Estrellas' },
]

export function UsernameModal({ 
  isOpen, 
  onClose, 
  currentName = '', 
  currentAvatar = '/assets/avatars/avatar_king.webp',
  onSave 
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(currentName || '')
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '/assets/avatars/avatar_king.webp')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setName(currentName || localStorage.getItem('toc_player_name') || '')
      setSelectedAvatar(currentAvatar || localStorage.getItem('toc_player_avatar') || '/assets/avatars/avatar_king.webp')
      setErrorMsg('')
      // Only auto-focus on desktop devices to avoid opening soft keyboard awkwardly on mobile
      setTimeout(() => {
        const isDesktop = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches
        if (isDesktop) {
          inputRef.current?.focus()
        }
      }, 150)
    }
  }, [isOpen, currentName, currentAvatar])

  if (!isOpen) return null

  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    }, 200)
  }

  const handleRandomName = () => {
    soundManager.playClick?.()
    const available = NOBLE_NAME_SUGGESTIONS.filter(n => n !== name)
    const picked = available[Math.floor(Math.random() * available.length)] || 'Lord King'
    setName(picked)
    setErrorMsg('')
  }

  const handleSave = (e) => {
    if (e) e.preventDefault()
    const trimmed = (name || '').trim()
    if (!trimmed) {
      setErrorMsg(t('usernameModal.errorEmpty'))
      return
    }
    if (trimmed.length < 2) {
      setErrorMsg(t('usernameModal.errorMinLength'))
      return
    }
    if (trimmed.length > 24) {
      setErrorMsg(t('usernameModal.errorMaxLength'))
      return
    }

    soundManager.playQuestSuccess?.()
    localStorage.setItem('toc_player_name', trimmed)
    localStorage.setItem('toc_player_avatar', selectedAvatar)
    onSave?.(trimmed, selectedAvatar)
    onClose?.()
  }

  const handleSelectAvatar = (av) => {
    soundManager.playClick?.()
    setSelectedAvatar(av.img)
  }

  return (
    <div className="modal-backdrop username-modal-backdrop" onClick={onClose}>
      <div 
        className="game-modal username-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Decoration */}
        <div className="username-modal-header">
          <div className="username-crown-badge">
            <Crown className="w-8 h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
          </div>
          <h2 className="username-modal-title">{t('usernameModal.title')}</h2>
          <p className="username-modal-subtitle">
            {t('usernameModal.subtitle')}
          </p>
          {onClose && (
            <button 
              type="button" 
              className="modal-close-candy-btn username-modal-close"
              onClick={() => { soundManager.playClick?.(); onClose(); }}
              title={t('common.close')}
            >
              <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
            </button>
          )}
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="username-modal-body">
          {/* 1. Name Input Section (Positioned FIRST so it's always clearly visible above mobile keyboards) */}
          <div className="username-input-section">
            <div className="username-input-label-row">
              <label htmlFor="sovereign-name-input" className="username-section-label">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>{t('usernameModal.sovereignNameLabel')}</span>
              </label>
              <button
                type="button"
                className="username-dice-btn"
                onClick={handleRandomName}
                title={t('usernameModal.randomBtn')}
              >
                <Dices className="w-3.5 h-3.5" />
                <span>{t('usernameModal.randomBtn')}</span>
              </button>
            </div>

            <div className="username-input-wrapper">
              <input
                id="sovereign-name-input"
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrorMsg('')
                }}
                onFocus={handleInputFocus}
                maxLength={24}
                placeholder={t('usernameModal.placeholder')}
                className="username-text-input"
              />
              <span className="username-char-count">{name.length}/24</span>
            </div>

            {errorMsg && (
              <div className="username-error-pill">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* 2. Avatar Selector */}
          <div className="username-avatar-section">
            <span className="username-section-label">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t('usernameModal.chooseFace')}</span>
            </span>
            <div className="username-avatars-row">
              {AVATAR_LIST.map((av) => {
                const isSelected = selectedAvatar === av.img
                const avName = t(`avatars.${av.id}.name`) || av.name
                const avTitle = t(`avatars.${av.id}.title`) || av.title
                return (
                  <button
                    key={av.id}
                    type="button"
                    className={`username-avatar-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectAvatar(av)}
                    title={`${avName} - ${avTitle}`}
                  >
                    <img src={av.img} alt={avName} className="username-avatar-img" draggable="false" />
                    <span className="username-avatar-name">{avName}</span>
                    {isSelected && (
                      <div className="username-avatar-check">
                        <Check className="w-3 h-3 text-amber-300 stroke-[3]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="username-modal-actions">
            {onClose && (
              <button
                type="button"
                className="username-btn-secondary"
                onClick={() => {
                  soundManager.playClick?.()
                  onClose()
                }}
              >
                {t('usernameModal.cancelBtn')}
              </button>
            )}
            <button
              type="submit"
              className="username-btn-primary"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>{t('usernameModal.confirmBtn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
