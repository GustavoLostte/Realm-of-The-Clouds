import React, { useState, useEffect, useRef } from 'react'
import { Shield, Loader2, AlertCircle, CheckCircle2, Trash2, X, Dices, Check, Sparkles, ArrowLeft, ArrowRight, Edit3, Crown, Mail } from 'lucide-react'
import { gameStorage, hasMeaningfulProgress } from '../utils/gameStorage'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { requestGameFullscreen } from '../utils/fullscreen'
import { RoyalConfirmModal } from './RoyalConfirmModal'
import { supabase, checkUsernameAvailable } from '../utils/supabaseClient'
import { generateRandomNobleName } from '../utils/nobleNameGenerator'

const AVATAR_LIST = [
  { id: 'king', name: 'Arcángel Soberano', img: '/assets/avatars/avatar_king.webp', title: 'Monarca Celestial' },
  { id: 'valkyrie', name: 'Valquiria Celestial', img: '/assets/avatars/avatar_valkyrie.webp', title: 'Seraphim de Batalla' },
  { id: 'paladin', name: 'Paladín Divino', img: '/assets/avatars/avatar_paladin.webp', title: 'Custodio de la Luz' },
  { id: 'mage', name: 'Archimago Astral', img: '/assets/avatars/avatar_mage.webp', title: 'Maestro de las Estrellas' },
]

// Custom Handcrafted Imperial Crown of the Cloud Realm
function CloudRealmCrown({ className = "w-11 h-11" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cloudCrownGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="30%" stopColor="#fde047" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="cloudCrownCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <filter id="crownAetherGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.5" />
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#d97706" floodOpacity="0.4" />
        </filter>
      </defs>
      {/* Crown base arc band */}
      <path 
        d="M11 48 C22 53, 42 53, 53 48 L50 43 C41 47, 23 47, 14 43 Z" 
        fill="url(#cloudCrownGold)" 
        stroke="#451a03" 
        strokeWidth="1.2" 
      />
      {/* Base jewel mounts */}
      <circle cx="21" cy="46" r="2.2" fill="url(#cloudCrownCyan)" stroke="#bae6fd" strokeWidth="0.6" />
      <circle cx="32" cy="47" r="2.6" fill="url(#cloudCrownCyan)" stroke="#bae6fd" strokeWidth="0.6" />
      <circle cx="43" cy="46" r="2.2" fill="url(#cloudCrownCyan)" stroke="#bae6fd" strokeWidth="0.6" />
      {/* Main majestic crown body with 5 swept imperial spires */}
      <path 
        d="M14 43 
           C12 35, 7 25, 11 20 
           C15 24, 18 30, 21 34 
           C23 27, 26 17, 32 8 
           C38 17, 41 27, 43 34 
           C46 30, 49 24, 53 20 
           C57 25, 52 35, 50 43 
           C41 47, 23 47, 14 43 Z" 
        fill="url(#cloudCrownGold)" 
        filter="url(#crownAetherGlow)"
        stroke="#451a03" 
        strokeWidth="1.5" 
        strokeLinejoin="round" 
      />
      {/* Central Celestial Shard Gem */}
      <polygon 
        points="32,15 38,24 32,33 26,24" 
        fill="url(#cloudCrownCyan)" 
        stroke="#e0f2fe" 
        strokeWidth="1" 
      />
      <circle cx="32" cy="24" r="1.5" fill="#ffffff" />
      {/* Left and Right Spires Spheres */}
      <circle cx="11" cy="19" r="3.2" fill="url(#cloudCrownGold)" stroke="#451a03" strokeWidth="1" />
      <circle cx="53" cy="19" r="3.2" fill="url(#cloudCrownGold)" stroke="#451a03" strokeWidth="1" />
      {/* Sub-spires gems */}
      <circle cx="21" cy="33" r="1.8" fill="url(#cloudCrownCyan)" />
      <circle cx="43" cy="33" r="1.8" fill="url(#cloudCrownCyan)" />
      {/* Center Top Star/Cross */}
      <circle cx="32" cy="7.5" r="3.4" fill="url(#cloudCrownCyan)" stroke="#fef08a" strokeWidth="1" />
    </svg>
  )
}

export function StartScreen({ onEnterGame }) {
  const { t, currentLang, changeLanguage, languages } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGuestNameModalOpen, setIsGuestNameModalOpen] = useState(false)
  const [guestStep, setGuestStep] = useState(1) // 1: Commander Name, 2: Avatar Selection
  const [guestName, setGuestName] = useState('')
  const [guestAvatar, setGuestAvatar] = useState('/assets/avatars/avatar_king.webp')
  const [guestNameError, setGuestNameError] = useState('')
  const [isCheckingGuestName, setIsCheckingGuestName] = useState(false)
  const guestInputRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [knownAccounts, setKnownAccounts] = useState([])
  const [accountToRemove, setAccountToRemove] = useState(null)

  // Returning Guest & Email Direct Login States
  const [existingGuest, setExistingGuest] = useState(null)
  const [isEmailLoginOpen, setIsEmailLoginOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const emailInputRef = useRef(null)

  // Ensure game music does not play on the start/login screen
  useEffect(() => {
    soundManager.setGameStarted?.(false)
    soundManager.pauseBGM?.()
  }, [])

  // Load known accounts and check for existing guest account on mount and whenever modal opens
  useEffect(() => {
    const accounts = gameStorage.getKnownAccounts()
    setKnownAccounts(accounts)

    try {
      const guestSave = gameStorage.load(null)
      const savedName = localStorage.getItem('toc_player_name')
      const savedAvatar = localStorage.getItem('toc_player_avatar') || '/assets/avatars/avatar_king.webp'
      const hasProgress = guestSave ? (hasMeaningfulProgress(guestSave) || (guestSave.slots || []).some(s => s && s.buildingId)) : false

      if (savedName || hasProgress) {
        setExistingGuest({
          name: savedName || 'Comandante',
          avatar: savedAvatar,
          level: guestSave?.kingdomLevel || 1,
          hasProgress,
        })
      } else {
        setExistingGuest(null)
      }
    } catch (e) {
      console.warn('Error loading guest info on StartScreen:', e)
      setExistingGuest(null)
    }
  }, [isModalOpen])

  // Handle continuing game as the remembered guest player
  const handleResumeGuest = () => {
    soundManager.playButtonClick?.()
    triggerFullscreen()
    const guest = existingGuest || (() => {
      const gSave = gameStorage.load(null)
      const sName = localStorage.getItem('toc_player_name')
      return (sName || gSave) ? {
        name: sName || 'Comandante',
        avatar: localStorage.getItem('toc_player_avatar') || '/assets/avatars/avatar_king.webp',
        level: gSave?.kingdomLevel || 1
      } : null
    })()

    if (!guest) {
      handleOpenGuestNameModal()
      return
    }
    setIsModalOpen(false)
    onEnterGame(null, null, {
      name: guest.name,
      avatar: guest.avatar,
    })
  }

  // Handle direct email login submission
  const handleEmailLoginSubmit = async (e) => {
    if (e) e.preventDefault()
    const clean = (emailInput || '').trim().toLowerCase()
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setErrorMsg(t('start.emailRequired') || 'Por favor ingresa un correo electrónico válido.')
      return
    }
    setErrorMsg('')
    setIsEmailLoginOpen(false)
    handleAccountSelect(clean)
  }

  // Auto-detect returning OAuth session from Google or Discord
  useEffect(() => {
    let isMounted = true
    const checkOAuthSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session?.user?.email || !isMounted) return

        const oauthEmail = session.user.email
        const oauthName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || oauthEmail.split('@')[0]
        const oauthAvatar = session.user.user_metadata?.avatar_url || null

        setIsLoading(true)
        setStatusMsg(t('start.connecting'))
        const result = await gameStorage.loadByEmail(oauthEmail)
        if (!isMounted) return
        setIsLoading(false)

        if (oauthName) {
          try { localStorage.setItem(`toc_player_name_${oauthEmail}`, oauthName) } catch {}
        }
        if (oauthAvatar) {
          try { localStorage.setItem(`toc_player_avatar_${oauthEmail}`, oauthAvatar) } catch {}
        }
        gameStorage.recordAccount({
          email: oauthEmail,
          name: oauthName || generateRandomNobleName(),
          avatar: oauthAvatar || '/assets/avatars/avatar_king.webp',
          level: result?.save?.kingdomLevel || 1,
        })
        onEnterGame(oauthEmail, result, null)
      } catch (err) {
        console.warn('OAuth session check:', err)
      }
    }
    checkOAuthSession()
    return () => { isMounted = false }
  }, [onEnterGame, t])

  // Universal fullscreen trigger on mobile & touch user interaction
  const triggerFullscreen = () => {
    requestGameFullscreen()
  }

  // Handle tap anywhere on screen to unlock audio and open modal
  const handleScreenClick = () => {
    soundManager.initCtx?.()
    soundManager.playClick?.()
    requestGameFullscreen()

    if (!isModalOpen) {
      setIsGuestNameModalOpen(false)
      setIsModalOpen(true)
    }
  }

  // Handle selecting an already remembered account
  const handleAccountSelect = async (accountEmail) => {
    triggerFullscreen()
    setErrorMsg('')
    setStatusMsg('')
    if (!accountEmail) return

    setIsLoading(true)
    setStatusMsg(t('start.connecting'))
    soundManager.playButtonClick?.()

    try {
      const result = await gameStorage.loadByEmail(accountEmail)
      setIsLoading(false)

      if (result.success) {
        setStatusMsg(t('common.ready'))
        setTimeout(() => {
          onEnterGame(accountEmail, result, null)
        }, 200)
      } else {
        setErrorMsg(result.error || t('common.error'))
      }
    } catch (err) {
      setIsLoading(false)
      console.warn('Error en login:', err)
      onEnterGame(accountEmail, { success: true, isNew: true, email: accountEmail }, null)
    }
  }

  // Handle OAuth authentication (Google or Discord)
  const handleOAuthLogin = async (provider) => {
    soundManager.playButtonClick?.()
    triggerFullscreen()
    setIsLoading(true)
    setErrorMsg('')
    setStatusMsg(t('start.connecting'))

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) {
        setIsLoading(false)
        console.warn(`OAuth ${provider} error:`, error)
        if (error.message?.includes('provider is not enabled') || error.status === 400) {
          setErrorMsg(
            provider === 'google'
              ? 'El acceso con Google requiere habilitar el proveedor en Supabase.'
              : 'El acceso con Discord requiere habilitar el proveedor en Supabase.'
          )
        } else {
          setErrorMsg(error.message)
        }
      }
    } catch (err) {
      setIsLoading(false)
      console.warn(`OAuth ${provider} exception:`, err)
      setErrorMsg(err.message || 'Error al conectar con el servicio')
    }
  }

  // Focus handling on mobile
  const handleGuestInputFocus = () => {
    setTimeout(() => {
      guestInputRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    }, 200)
  }

  // Auto-focus smoothly only on desktop when entering step 1
  useEffect(() => {
    if (isGuestNameModalOpen && guestStep === 1) {
      const isDesktop = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches
      if (isDesktop) {
        setTimeout(() => guestInputRef.current?.focus(), 150)
      }
    }
  }, [isGuestNameModalOpen, guestStep])

  // Handle opening the guest flow (Step 1: Commander Name) with an invented noble name in current language
  const handleOpenGuestNameModal = () => {
    soundManager.playButtonClick?.()
    triggerFullscreen()
    const autoName = generateRandomNobleName(currentLang)
    setGuestName(autoName)
    setGuestAvatar(localStorage.getItem('toc_player_avatar') || '/assets/avatars/avatar_king.webp')
    setGuestNameError('')
    setGuestStep(1)
    setIsGuestNameModalOpen(true)
  }

  // Handle re-rolling a procedural noble name in the current language
  const handleRerollGuestName = () => {
    soundManager.playClick?.()
    const nextName = generateRandomNobleName(currentLang, guestName)
    setGuestName(nextName)
    setGuestNameError('')
  }

  // Advance from Step 1 (Name) to Step 2 (Avatar Selection)
  const handleProceedGuestToAvatar = async (e) => {
    if (e) e.preventDefault()
    const trimmed = (guestName || '').trim()
    if (!trimmed) {
      setGuestNameError(t('usernameModal.errorEmpty') || 'Por favor ingresa un nombre para tu Comandante.')
      return
    }
    if (trimmed.length < 2) {
      setGuestNameError(t('usernameModal.errorMinLength') || 'El nombre debe tener al menos 2 caracteres.')
      return
    }
    if (trimmed.length > 24) {
      setGuestNameError(t('usernameModal.errorMaxLength') || 'El nombre no puede exceder los 24 caracteres.')
      return
    }

    try {
      setIsCheckingGuestName(true)
      const res = await checkUsernameAvailable(trimmed)
      if (!res.available && res.taken) {
        setGuestNameError(t('usernameModal.errorTaken') || 'Este nombre de comandante ya pertenece a otro reino. Elige uno diferente.')
        setIsCheckingGuestName(false)
        return
      }
    } catch (err) {
      // Non-blocking if network is unreachable
    } finally {
      setIsCheckingGuestName(false)
    }

    // Dismiss virtual keyboard cleanly on mobile so Step 2 is not obscured
    if (guestInputRef.current) {
      guestInputRef.current.blur()
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur()
    }

    soundManager.playClick?.()
    setGuestNameError('')
    setGuestStep(2)
  }

  // Step 2: Confirm Name & Avatar and enter the game
  const handleConfirmGuestName = (e) => {
    if (e) e.preventDefault()
    const trimmed = (guestName || '').trim()
    if (!trimmed) {
      setGuestStep(1)
      setGuestNameError(t('usernameModal.errorEmpty') || 'Por favor ingresa un nombre para tu Comandante.')
      return
    }

    soundManager.playQuestSuccess?.()
    try {
      localStorage.setItem('toc_player_name', trimmed)
      localStorage.setItem('toc_player_avatar', guestAvatar)
    } catch {}
    setIsGuestNameModalOpen(false)
    setIsModalOpen(false)
    onEnterGame(null, null, { name: trimmed, avatar: guestAvatar })
  }

  // Handle modal close button (X)
  const handleCloseModal = (e) => {
    e.stopPropagation()
    soundManager.playClick?.()
    if (guestInputRef.current) guestInputRef.current.blur()
    if (emailInputRef.current) emailInputRef.current.blur()
    if (isGuestNameModalOpen) {
      setIsGuestNameModalOpen(false)
      setGuestStep(1)
    } else if (isEmailLoginOpen) {
      setIsEmailLoginOpen(false)
    } else {
      setIsModalOpen(false)
    }
  }

  // Handle removing a remembered account from this device
  const handleRemoveAccount = (e, accEmail) => {
    e.stopPropagation()
    soundManager.playClick?.()
    setAccountToRemove(accEmail)
  }

  const handleConfirmRemoveAccount = () => {
    if (!accountToRemove) return
    gameStorage.removeKnownAccount(accountToRemove)
    const updated = gameStorage.getKnownAccounts()
    setKnownAccounts(updated)
    setAccountToRemove(null)
  }

  return (
    <div 
      className="start-screen-overlay"
      onClick={handleScreenClick}
    >
      {/* Top Floating Language Switcher */}
      <div 
        className="start-language-bar"
        onClick={(e) => e.stopPropagation()}
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            className={`start-lang-btn ${currentLang === lang.code ? 'is-active' : ''}`}
            onClick={() => {
              soundManager.playClick?.()
              changeLanguage(lang.code)
            }}
            title={lang.name}
          >
            <span className="start-lang-flag">{lang.flag}</span>
            <span className="start-lang-code">{lang.region}</span>
          </button>
        ))}
      </div>

      {/* Background Ambient Glow & Vignette */}
      <div className="start-screen-vignette" />

      {/* Center Cinematic Title & Branding */}
      <div className="start-screen-hero">
        <div className="start-screen-logo-container">
          <img 
            src="/assets/logo/logo.webp" 
            alt="Reino de las Nubes: Aetheria Empires" 
            className="start-screen-game-logo"
            draggable="false"
          />
        </div>
      </div>

      {/* Bottom Pulsing Prompt */}
      {!isModalOpen && (
        <div className="start-prompt-container">
          <span className="start-prompt-text">
            {t('start.touchToStart')}
          </span>
        </div>
      )}

      {/* Login & Auth Modal */}
      {isModalOpen && (
        <div 
          className="guest-modal-backdrop"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`guest-modal-card ${isGuestNameModalOpen ? `step-${guestStep}` : ''}`}>
            {/* Modal Close Button */}
            <button
              type="button"
              className="guest-modal-close-btn"
              onClick={handleCloseModal}
              title={t('common.close') || 'Cerrar'}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>

            {isGuestNameModalOpen ? (
              guestStep === 1 ? (
                /* --- Step 1: Guest Sovereign Name Input (Clear visibility, native keyboard safe) --- */
                <>
                  {/* Back button to return to login options */}
                  <button
                    type="button"
                    className="guest-back-btn"
                    onClick={() => {
                      soundManager.playClick?.()
                      setIsGuestNameModalOpen(false)
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>{t('common.back') || 'Volver'}</span>
                  </button>

                  {/* Imperial Cloud Realm Crown Header Icon */}
                  <div className="guest-modal-header-icon">
                    <CloudRealmCrown className="w-11 h-11" />
                  </div>

                  <div className="modal-step-pill">
                    <span>{t('usernameModal.step1Badge') || 'PASO 1 / 2 • IDENTIDAD'}</span>
                  </div>

                  <h2 className="guest-modal-title">
                    {t('usernameModal.step1Title') || t('usernameModal.title') || 'NOMBRE DEL COMANDANTE'}
                  </h2>

                  <p className="guest-modal-desc">
                    {t('usernameModal.step1Subtitle') || 'Elige la identidad militar con la que liderarás tu imperio y figurarás en el Ranking.'}
                  </p>

                  <form onSubmit={handleProceedGuestToAvatar} className="guest-modal-form" style={{ marginTop: 6 }}>
                    {/* 1. Name Input Section with Randomize 🎲 button */}
                    <div className="guest-name-input-section">
                      <div className="guest-name-label-row">
                        <label htmlFor="guest-sovereign-name-input" className="guest-name-label">
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>{t('usernameModal.sovereignNameLabel') || 'Nombre del Comandante:'}</span>
                        </label>
                        <button
                          type="button"
                          className="guest-name-dice-btn"
                          onClick={handleRerollGuestName}
                          title={t('usernameModal.randomBtn')}
                        >
                          <Dices className="w-3.5 h-3.5" />
                          <span>{t('usernameModal.randomBtn')}</span>
                        </button>
                      </div>

                      <div className="guest-name-input-wrap">
                        <input
                          id="guest-sovereign-name-input"
                          ref={guestInputRef}
                          type="text"
                          value={guestName}
                          onChange={(e) => {
                            setGuestName(e.target.value)
                            setGuestNameError('')
                          }}
                          onFocus={handleGuestInputFocus}
                          maxLength={24}
                          placeholder={t('usernameModal.placeholder') || 'ej: Lord Arturo'}
                          className="guest-name-text-input"
                          autoComplete="off"
                        />
                        <span className="guest-name-char-count">{guestName.length}/24</span>
                      </div>

                      {guestNameError && (
                        <div className="guest-name-error-pill">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{guestNameError}</span>
                        </div>
                      )}
                    </div>

                    {/* Step 1 Actions */}
                    <div className="guest-name-actions">
                      <button
                        type="button"
                        className="guest-name-btn-secondary"
                        onClick={() => {
                          soundManager.playClick?.()
                          setIsGuestNameModalOpen(false)
                        }}
                      >
                        {t('common.back') || 'Volver'}
                      </button>
                      <button
                        type="submit"
                        className="guest-name-btn-primary"
                        disabled={isCheckingGuestName}
                      >
                        {isCheckingGuestName ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
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
              ) : (
                /* --- Step 2: Guest Avatar Selection (Keyboard retracted, pure tap target) --- */
                <>
                  {/* Back button to return to Step 1 */}
                  <button
                    type="button"
                    className="guest-back-btn"
                    onClick={() => {
                      soundManager.playClick?.()
                      setGuestStep(1)
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>{t('common.back') || 'Atrás'}</span>
                  </button>

                  <div className="guest-modal-header-icon">
                    <Sparkles className="w-10 h-10 text-amber-400" />
                  </div>

                  <div className="modal-step-pill">
                    <span>{t('usernameModal.step2Badge') || 'PASO 2 / 2 • ROSTRO DE MANDO'}</span>
                  </div>

                  <h2 className="guest-modal-title">
                    {t('usernameModal.step2Title') || 'ELIGE TU ROSTRO'}
                  </h2>

                  <p className="guest-modal-desc">
                    {t('usernameModal.step2Subtitle') || 'Selecciona el avatar sagrado de tu Comandante.'}
                  </p>

                  <div className="guest-modal-form" style={{ marginTop: 4 }}>
                    {/* Selected Commander Name Review Card */}
                    <div className="modal-selected-commander-banner">
                      <div className="modal-selected-commander-info">
                        <Shield className="w-4 h-4 text-sky-400 flex-shrink-0" />
                        <span className="modal-selected-commander-label">
                          {t('usernameModal.selectedCommander') || 'Comandante:'}
                        </span>
                        <span className="modal-selected-commander-name">{guestName}</span>
                      </div>
                      <button
                        type="button"
                        className="modal-edit-name-btn"
                        onClick={() => {
                          soundManager.playClick?.()
                          setGuestStep(1)
                        }}
                        title={t('usernameModal.editName') || 'Modificar'}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{t('usernameModal.editName') || 'Modificar'}</span>
                      </button>
                    </div>

                    {/* Avatar Selection Grid */}
                    <div className="guest-avatar-section">
                      <span className="guest-avatar-section-label">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{t('usernameModal.chooseFace') || 'Elige tu Rostro:'}</span>
                      </span>
                      <div className="guest-avatars-row">
                        {AVATAR_LIST.map((av) => {
                          const isSelected = guestAvatar === av.img
                          const avName = t(`avatars.${av.id}.name`) || av.name
                          const avTitle = t(`avatars.${av.id}.title`) || av.title
                          return (
                            <button
                              key={av.id}
                              type="button"
                              className={`guest-avatar-card ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => {
                                soundManager.playClick?.()
                                setGuestAvatar(av.img)
                              }}
                              title={`${avName} - ${avTitle}`}
                            >
                              <img src={av.img} alt={avName} className="guest-avatar-img" draggable="false" />
                              <span className="guest-avatar-name">{avName}</span>
                              {isSelected && (
                                <div className="guest-avatar-check">
                                  <Check className="w-3 h-3 text-amber-300 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Step 2 Action Buttons */}
                    <div className="guest-name-actions">
                      <button
                        type="button"
                        className="guest-name-btn-secondary"
                        onClick={() => {
                          soundManager.playClick?.()
                          setGuestStep(1)
                        }}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t('usernameModal.backBtn') || 'Atrás'}</span>
                      </button>
                      <button
                        type="button"
                        className="guest-name-btn-primary"
                        onClick={handleConfirmGuestName}
                      >
                        <Crown className="w-4 h-4 text-amber-300" />
                        <span>{t('usernameModal.startGameBtn') || '¡Entrar a la Batalla!'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )
            ) : isEmailLoginOpen ? (
              /* --- Email Login View --- */
              <>
                <button
                  type="button"
                  className="guest-back-btn"
                  onClick={() => {
                    soundManager.playClick?.()
                    setIsEmailLoginOpen(false)
                    setErrorMsg('')
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>{t('common.back') || 'Volver'}</span>
                </button>

                <div className="guest-modal-header-icon">
                  <Mail className="w-10 h-10 text-sky-400" />
                </div>

                <h2 className="guest-modal-title">
                  {t('start.loginWithEmail') || 'ACCESO CON CORREO'}
                </h2>

                <p className="guest-modal-desc">
                  {t('start.enterEmailPrompt') || 'Ingresa tu correo para recuperar o respaldar tu imperio en la nube:'}
                </p>

                <form onSubmit={handleEmailLoginSubmit} className="guest-modal-form" style={{ marginTop: 4 }}>
                  <div className="guest-name-input-section">
                    <div className="guest-name-label-row">
                      <label htmlFor="start-email-input" className="guest-name-label">
                        <Mail className="w-4 h-4 text-sky-400" />
                        <span>{t('start.emailPlaceholder') || 'Correo Electrónico:'}</span>
                      </label>
                    </div>

                    <div className="guest-name-input-wrap">
                      <input
                        id="start-email-input"
                        ref={emailInputRef}
                        type="email"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value)
                          setErrorMsg('')
                        }}
                        placeholder="tu_correo@ejemplo.com"
                        className="guest-name-text-input"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="guest-name-actions" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="guest-name-btn-secondary"
                      onClick={() => {
                        soundManager.playClick?.()
                        setIsEmailLoginOpen(false)
                        setErrorMsg('')
                      }}
                    >
                      {t('common.cancel') || 'Cancelar'}
                    </button>
                    <button
                      type="submit"
                      className="guest-name-btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                          <span>{t('start.connecting') || 'Conectando...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{t('start.enterKingdom') || 'Entrar al Reino'}</span>
                          <ArrowRight className="w-4 h-4 text-amber-300" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Status or Error Notifications */}
                {errorMsg && (
                  <div className="guest-status-box guest-status-error" style={{ marginTop: 12, width: '100%' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </>
            ) : (
              /* --- Step 1: Login Providers (Google, Discord, Correo, Quest) --- */
              <>
                {/* Custom Imperial Cloud Realm Crown Header Icon */}
                <div className="guest-modal-header-icon">
                  <CloudRealmCrown className="w-12 h-12" />
                </div>

                <h2 className="guest-modal-title">
                  {t('start.enterKingdom')}
                </h2>

                <p className="guest-modal-desc">
                  {existingGuest 
                    ? 'Reanuda tu imperio guardado o accede con otra cuenta:'
                    : knownAccounts.length > 0 
                      ? t('start.rememberedSubtitle') 
                      : t('start.authSubtitle')
                  }
                </p>

                {/* 1. Returning Guest Hero Card if present on this device */}
                {existingGuest && (
                  <div className="returning-guest-card">
                    <div className="returning-guest-badge">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('start.guestBadge') || 'PARTIDA EN ESTE DISPOSITIVO'}</span>
                    </div>

                    <div className="returning-guest-profile">
                      <div className="returning-guest-avatar-wrap">
                        <img 
                          src={existingGuest.avatar || '/assets/avatars/avatar_king.webp'} 
                          alt={existingGuest.name} 
                          className="returning-guest-avatar" 
                          draggable="false" 
                        />
                        <span className="returning-guest-lvl">{t('common.levelShort') || 'Nv.'}{existingGuest.level || 1}</span>
                      </div>
                      <div className="returning-guest-info">
                        <div className="returning-guest-title-row">
                          <span className="returning-guest-name">{existingGuest.name}</span>
                          <span className="returning-guest-tag">Modo Quest</span>
                        </div>
                        <p className="returning-guest-desc">Tu imperio local está listo para continuar</p>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="returning-guest-continue-btn"
                      onClick={handleResumeGuest}
                    >
                      <Crown className="w-4 h-4 text-amber-300" />
                      <span>Continuar como {existingGuest.name}</span>
                    </button>

                    <button
                      type="button"
                      className="returning-guest-reset-link"
                      onClick={() => {
                        soundManager.playClick?.()
                        handleOpenGuestNameModal()
                      }}
                    >
                      ¿Crear otro comandante invitado?
                    </button>
                  </div>
                )}

                {/* Remembered Accounts Picker if available on this device */}
                {knownAccounts.length > 0 && (
                  <div className="known-accounts-container" style={{ marginBottom: 12 }}>
                    <div className="known-accounts-list">
                      {knownAccounts.map((acc) => (
                        <div 
                          key={acc.email} 
                          className="account-picker-card"
                          onClick={() => handleAccountSelect(acc.email)}
                        >
                          <div className="account-card-avatar-wrap">
                            <img 
                              src={acc.avatar || '/assets/avatars/avatar_king.webp'} 
                              alt={acc.name} 
                              className="account-card-avatar" 
                              draggable="false" 
                            />
                          </div>
                          <div className="account-card-info">
                            <div className="account-card-header">
                              <span className="account-card-name">{acc.name || t('common.sovereign')}</span>
                              <span className="account-card-level">{t('common.levelShort')} {acc.level || 1}</span>
                            </div>
                            <span className="account-card-email">{acc.email}</span>
                          </div>
                          <button 
                            type="button" 
                            className="account-card-remove-btn"
                            title={t('common.close')}
                            onClick={(e) => handleRemoveAccount(e, acc.email)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider between remembered account / guest and other login methods */}
                {(existingGuest || knownAccounts.length > 0) && (
                  <div className="guest-modal-divider" style={{ margin: '8px 0 12px 0' }}>
                    <span>{existingGuest ? 'O accede con una cuenta en la nube:' : t('common.or')}</span>
                  </div>
                )}

                {/* Core Login Options Grid: Google, Discord, Correo, and Quest (if no existing guest) */}
                <div className={`start-auth-tiles-grid ${!existingGuest ? 'has-4-tiles' : ''}`}>
                  {/* 1. Gmail / Google Tile */}
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={isLoading}
                    className="login-tile-btn login-tile-google"
                    title="Google"
                  >
                    <div className="login-tile-icon-wrap">
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                      ) : (
                        <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      )}
                    </div>
                    <span className="login-tile-label">Google</span>
                  </button>

                  {/* 2. Discord Tile */}
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('discord')}
                    disabled={isLoading}
                    className="login-tile-btn login-tile-discord"
                    title="Discord"
                  >
                    <div className="login-tile-icon-wrap">
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-200" />
                      ) : (
                        <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 127.14 96.36" fill="#5865F2">
                          <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z"/>
                        </svg>
                      )}
                    </div>
                    <span className="login-tile-label">Discord</span>
                  </button>

                  {/* 3. Direct Email Tile */}
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick?.()
                      setIsEmailLoginOpen(true)
                    }}
                    disabled={isLoading}
                    className="login-tile-btn login-tile-email"
                    title={t('start.loginWithEmail') || 'Correo Electrónico'}
                  >
                    <div className="login-tile-icon-wrap">
                      <Mail className="w-7 h-7 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                    </div>
                    <span className="login-tile-label">Correo</span>
                  </button>

                  {/* 4. Modo Quest (Guest) Tile -> Shown only if no returning guest is detected */}
                  {!existingGuest && (
                    <button
                      type="button"
                      onClick={handleOpenGuestNameModal}
                      disabled={isLoading}
                      className="login-tile-btn login-tile-quest"
                      title={t('start.questMode')}
                    >
                      <div className="login-tile-icon-wrap">
                        <Shield className="w-7 h-7 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      </div>
                      <span className="login-tile-label">Quest</span>
                    </button>
                  )}
                </div>

                {/* Status or Error Notifications */}
                {errorMsg && (
                  <div className="guest-status-box guest-status-error" style={{ marginTop: 12, width: '100%' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {statusMsg && (
                  <div className="guest-status-box guest-status-success" style={{ marginTop: 12, width: '100%' }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span>{statusMsg}</span>
                  </div>
                )}

                {/* Footer Trust Guarantee */}
                <div className="guest-modal-footer">
                  <span>🛡️ {t('start.guestWarning')}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom Royal Confirmation Modal for Unlinking Accounts */}
      <RoyalConfirmModal
        isOpen={Boolean(accountToRemove)}
        title={t('start.removeAccountTitle') || 'Desvincular Cuenta'}
        message={accountToRemove ? t('start.removeAccountConfirm', { email: accountToRemove }) : ''}
        confirmText={t('common.confirm') || 'Aceptar'}
        cancelText={t('common.cancel') || 'Cancelar'}
        danger={true}
        onConfirm={handleConfirmRemoveAccount}
        onCancel={() => setAccountToRemove(null)}
      />
    </div>
  )
}
