import React, { useState, useEffect, useRef } from 'react'
import './UsernameModal.css'
import { Crown, Sparkles, Dices, Check, Shield, AlertCircle, Loader2, ArrowLeft, ArrowRight, Edit3 } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import { generateRandomNobleName } from '../utils/nobleNameGenerator'
import { checkUsernameAvailable } from '../utils/supabaseClient'

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
  const { t, currentLang } = useTranslation()
  const [step, setStep] = useState(1) // Step 1: Name, Step 2: Avatar
  const [name, setName] = useState(currentName || '')
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '/assets/avatars/avatar_king.webp')
  const [errorMsg, setErrorMsg] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      const storedName = currentName || localStorage.getItem('toc_player_name')
      setName(storedName || generateRandomNobleName(currentLang || 'es'))
      setSelectedAvatar(currentAvatar || localStorage.getItem('toc_player_avatar') || '/assets/avatars/avatar_king.webp')
      setErrorMsg('')

      // Auto-focus smoothly only on desktop to prevent abrupt virtual keyboard popup on mobile
      setTimeout(() => {
        const isDesktop = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches
        if (isDesktop) {
          inputRef.current?.focus()
        }
      }, 150)
    }
  }, [isOpen, currentName, currentAvatar, currentLang])

  if (!isOpen) return null

  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    }, 200)
  }

  const handleRandomName = () => {
    soundManager.playClick?.()
    const picked = generateRandomNobleName(currentLang || 'es', name)
    setName(picked)
    setErrorMsg('')
  }

  // Advance from Step 1 (Name) to Step 2 (Avatar)
  const handleProceedToAvatar = async (e) => {
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

    // Check Supabase uniqueness only if name has changed or wasn't verified
    try {
      setIsChecking(true)
      const res = await checkUsernameAvailable(trimmed, currentName)
      if (!res.available && res.taken) {
        setErrorMsg(t('usernameModal.errorTaken') || 'Este nombre de comandante ya pertenece a otro reino. Elige uno diferente.')
        setIsChecking(false)
        return
      }
    } catch (err) {
      // Non-blocking network fallback
    } finally {
      setIsChecking(false)
    }

    // Dismiss soft keyboard immediately on mobile so step 2 has full screen real estate
    if (inputRef.current) {
      inputRef.current.blur()
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur()
    }

    soundManager.playClick?.()
    setErrorMsg('')
    setStep(2)
  }

  // Step 2: Final Save and Confirm
  const handleFinalSave = (e) => {
    if (e) e.preventDefault()
    const trimmed = (name || '').trim()
    if (!trimmed) {
      setStep(1)
      setErrorMsg(t('usernameModal.errorEmpty'))
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

  const handleClose = () => {
    soundManager.playClick?.()
    if (inputRef.current) inputRef.current.blur()
    onClose?.()
  }

  return (
    <div 
      className="modal-backdrop username-modal-backdrop" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <div 
        className={`game-modal username-modal step-${step}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        {onClose && (
          <button 
            type="button" 
            className="modal-close-candy-btn username-modal-close"
            onClick={handleClose}
            title={t('common.close') || 'Cerrar'}
            aria-label="Cerrar modal"
          >
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: COMMANDER NAME INPUT (Clean, High visibility on Mobile) */}
        {/* ------------------------------------------------------------- */}
        {step === 1 && (
          <>
            <div className="username-modal-header">
              <div className="username-crown-badge">
                <Crown className="w-8 h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
              </div>
              <div className="modal-step-pill">
                <span>{t('usernameModal.step1Badge') || 'PASO 1 / 2 • IDENTIDAD'}</span>
              </div>
              <h2 className="username-modal-title">
                {t('usernameModal.step1Title') || t('usernameModal.title')}
              </h2>
              <p className="username-modal-subtitle">
                {t('usernameModal.step1Subtitle') || t('usernameModal.subtitle')}
              </p>
            </div>

            <form onSubmit={handleProceedToAvatar} className="username-modal-body">
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
                    autoComplete="off"
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

              {/* Step 1 Actions */}
              <div className="username-modal-actions">
                {onClose && (
                  <button
                    type="button"
                    className="username-btn-secondary"
                    onClick={handleClose}
                  >
                    {t('usernameModal.cancelBtn')}
                  </button>
                )}
                <button
                  type="submit"
                  className="username-btn-primary"
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
                      <span>{t('common.checking') || 'Verificando...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('usernameModal.nextBtn') || 'Siguiente'}</span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: AVATAR SELECTION (Keyboard is Closed, Pure Tap Selection) */}
        {/* ------------------------------------------------------------- */}
        {step === 2 && (
          <>
            <div className="username-modal-header">
              <div className="username-crown-badge">
                <Sparkles className="w-8 h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
              </div>
              <div className="modal-step-pill">
                <span>{t('usernameModal.step2Badge') || 'PASO 2 / 2 • ROSTRO DE MANDO'}</span>
              </div>
              <h2 className="username-modal-title">
                {t('usernameModal.step2Title') || 'ELIGE TU ROSTRO'}
              </h2>
              <p className="username-modal-subtitle">
                {t('usernameModal.step2Subtitle') || 'Selecciona el avatar sagrado de tu Comandante.'}
              </p>
            </div>

            <div className="username-modal-body">
              {/* Selected Commander Name Review Card */}
              <div className="modal-selected-commander-banner">
                <div className="modal-selected-commander-info">
                  <Shield className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span className="modal-selected-commander-label">
                    {t('usernameModal.selectedCommander') || 'Comandante:'}
                  </span>
                  <span className="modal-selected-commander-name">{name}</span>
                </div>
                <button
                  type="button"
                  className="modal-edit-name-btn"
                  onClick={() => {
                    soundManager.playClick?.()
                    setStep(1)
                  }}
                  title={t('usernameModal.editName') || 'Modificar'}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{t('usernameModal.editName') || 'Modificar'}</span>
                </button>
              </div>

              {/* Avatar Selector Grid */}
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

              {/* Step 2 Actions */}
              <div className="username-modal-actions">
                <button
                  type="button"
                  className="username-btn-secondary"
                  onClick={() => {
                    soundManager.playClick?.()
                    setStep(1)
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('usernameModal.backBtn') || 'Atrás'}</span>
                </button>
                <button
                  type="button"
                  className="username-btn-primary"
                  onClick={handleFinalSave}
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>{t('usernameModal.confirmBtn') || 'Confirmar'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

