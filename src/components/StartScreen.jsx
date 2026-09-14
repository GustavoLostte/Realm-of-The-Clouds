import React, { useState, useEffect, useRef } from 'react'
import { Mail, Shield, ArrowRight, Loader2, AlertCircle, CheckCircle2, Crown, Zap, User, Trash2, Plus, ArrowLeft, Maximize2 } from 'lucide-react'
import { gameStorage } from '../utils/gameStorage'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { requestGameFullscreen, isFullscreenActive, isMobileOrTouch } from '../utils/fullscreen'
import { RoyalConfirmModal } from './RoyalConfirmModal'

export function StartScreen({ onEnterGame }) {
  const { t, currentLang, changeLanguage, languages } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [knownAccounts, setKnownAccounts] = useState([])
  const [showNewEmailForm, setShowNewEmailForm] = useState(false)
  const [accountToRemove, setAccountToRemove] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenActive)
  const emailInputRef = useRef(null)

  // Ensure game music does not play on the start/login screen
  useEffect(() => {
    soundManager.setGameStarted?.(false)
    soundManager.pauseBGM?.()

    const handleFsChange = () => {
      setIsFullscreen(isFullscreenActive())
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    document.addEventListener('webkitfullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      document.removeEventListener('webkitfullscreenchange', handleFsChange)
    }
  }, [])

  // Load known accounts list from storage on mount
  useEffect(() => {
    const accounts = gameStorage.getKnownAccounts()
    setKnownAccounts(accounts)
    if (accounts.length === 0) {
      setShowNewEmailForm(true)
    }
  }, [])

  // Auto-focus email input when form opens
  useEffect(() => {
    if (isModalOpen && showNewEmailForm) {
      setTimeout(() => {
        emailInputRef.current?.focus?.()
      }, 180)
    }
  }, [isModalOpen, showNewEmailForm])

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
      setIsModalOpen(true)
    }
  }

  // Handle submitting or selecting an email for cloud persistence
  const handleEmailSubmit = async (e, targetEmail = null) => {
    if (e) e.preventDefault()
    // Trigger fullscreen synchronously during direct user gesture
    requestGameFullscreen()
    setErrorMsg('')
    setStatusMsg('')

    const emailToUse = targetEmail || email
    if (!emailToUse || !emailToUse.trim()) {
      setErrorMsg(t('start.emailRequired'))
      return
    }

    const cleanEmail = emailToUse.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg(t('start.emailRequired'))
      return
    }

    setIsLoading(true)
    setStatusMsg(t('start.connecting'))
    soundManager.playButtonClick?.()

    try {
      const result = await gameStorage.loadByEmail(cleanEmail)
      setIsLoading(false)

      if (result.success) {
        setStatusMsg(t('common.ready'))
        setTimeout(() => {
          onEnterGame(cleanEmail, result, null)
        }, 300)
      } else {
        setErrorMsg(result.error || t('common.error'))
      }
    } catch (err) {
      setIsLoading(false)
      console.warn('Error en login:', err)
      onEnterGame(cleanEmail, { success: true, isNew: true, email: cleanEmail }, null)
    }
  }

  // Handle removing a remembered account from this device using custom RoyalConfirmModal
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
    if (updated.length === 0) {
      setShowNewEmailForm(true)
    }
    setAccountToRemove(null)
  }

  // Handle quick anonymous guest play (no email required)
  const handleGuestPlay = () => {
    soundManager.playButtonClick?.()
    triggerFullscreen()
    onEnterGame(null, null, null)
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

      {/* Floating Fullscreen Trigger on Mobile / Touch */}
      {isMobileOrTouch() && !isFullscreen && (
        <button
          type="button"
          className="start-fullscreen-floating-btn"
          onClick={(e) => {
            e.stopPropagation()
            soundManager.playClick?.()
            requestGameFullscreen()
          }}
          title={t('hud.fullscreen')}
        >
          <Maximize2 size={16} />
          <span>{t('hud.fullscreen')}</span>
        </button>
      )}

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

      {/* Login Modal */}
      {isModalOpen && (
        <div 
          className="guest-modal-backdrop"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="guest-modal-card">
            {/* Crown Header Icon */}
            <div className="guest-modal-header-icon">
              <Crown className="w-9 h-9 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
            </div>

            <h2 className="guest-modal-title">
              {knownAccounts.length > 0 && !showNewEmailForm 
                ? t('start.rememberedAccounts') 
                : t('start.enterKingdom')}
            </h2>

            <p className="guest-modal-desc">
              {knownAccounts.length > 0 && !showNewEmailForm
                ? t('start.rememberedSubtitle')
                : t('start.enterEmailPrompt')
              }
            </p>

            {/* Case A: Known Accounts Picker */}
            {knownAccounts.length > 0 && !showNewEmailForm ? (
              <div className="known-accounts-container">
                <div className="known-accounts-list">
                  {knownAccounts.map((acc) => (
                    <div 
                      key={acc.email} 
                      className="account-picker-card"
                      onClick={() => handleEmailSubmit(null, acc.email)}
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

                {/* Status or Error Notifications */}
                {errorMsg && (
                  <div className="guest-status-box guest-status-error">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {statusMsg && (
                  <div className="guest-status-box guest-status-success">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span>{statusMsg}</span>
                  </div>
                )}

                {/* New Account Button */}
                <button
                  type="button"
                  onClick={() => setShowNewEmailForm(true)}
                  disabled={isLoading}
                  className="guest-btn-secondary"
                  style={{ marginTop: 8 }}
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>{t('start.useOtherAccount')}</span>
                </button>

                <div className="guest-modal-divider">
                  <span>{t('common.or')}</span>
                </div>

                {/* Quick Guest Access Button */}
                <button
                  type="button"
                  onClick={handleGuestPlay}
                  disabled={isLoading}
                  className="guest-btn-secondary"
                >
                  <Shield className="w-4 h-4 text-slate-300" />
                  <span>{t('start.playAsGuest')}</span>
                </button>
              </div>
            ) : (
              /* Case B: Email Input Form */
              <form onSubmit={handleEmailSubmit} className="guest-modal-form">
                {knownAccounts.length > 0 && (
                  <button 
                    type="button"
                    className="guest-back-btn"
                    onClick={() => {
                      setShowNewEmailForm(false)
                      setErrorMsg('')
                    }}
                  >
                    <ArrowLeft size={15} />
                    <span>{t('common.back')}</span>
                  </button>
                )}

                <label className="guest-input-label">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>{t('start.enterEmailPrompt')}</span>
                </label>

                <div className="guest-input-box">
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setErrorMsg('')
                    }}
                    onFocus={(e) => {
                      setTimeout(() => {
                        e.target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
                      }, 200)
                    }}
                    placeholder={t('start.emailPlaceholder')}
                    className="guest-email-input"
                    disabled={isLoading}
                  />
                </div>

                {/* Status or Error Notifications */}
                {errorMsg && (
                  <div className="guest-status-box guest-status-error">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {statusMsg && (
                  <div className="guest-status-box guest-status-success">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span>{statusMsg}</span>
                  </div>
                )}

                {/* Enter Kingdom Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="guest-btn-primary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-amber-200" />
                      <span>{t('start.connecting')}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 text-amber-300" />
                      <span>{t('start.enterKingdom')}</span>
                      <ArrowRight className="w-5 h-5 text-amber-300" />
                    </>
                  )}
                </button>

                <div className="guest-modal-divider">
                  <span>{t('common.or')}</span>
                </div>

                {/* Quick Guest Access Button */}
                <button
                  type="button"
                  onClick={handleGuestPlay}
                  disabled={isLoading}
                  className="guest-btn-secondary"
                >
                  <Shield className="w-4 h-4 text-slate-300" />
                  <span>{t('start.playAsGuest')}</span>
                </button>
              </form>
            )}

            {/* Footer Trust Guarantee */}
            <div className="guest-modal-footer">
              <span>🛡️ {t('start.guestWarning')}</span>
            </div>
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
