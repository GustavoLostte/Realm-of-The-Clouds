import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Shield, Loader2, AlertCircle, CheckCircle2, Trash2, X, Dices, Check, Sparkles, ArrowLeft, ArrowRight, Edit3, Crown, Mail, Globe, ChevronDown, Lock, Eye, EyeOff, ShieldCheck, LogIn, UserPlus, LogOut, Swords } from 'lucide-react'
import { gameStorage, hasMeaningfulProgress } from '../utils/gameStorage'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { requestGameFullscreen } from '../utils/fullscreen'
import { RoyalConfirmModal } from './RoyalConfirmModal'
import { supabase, checkUsernameAvailable } from '../utils/supabaseClient'
import { generateRandomNobleName } from '../utils/nobleNameGenerator'
import { ChampionSelectScreen } from './ChampionSelectScreen'
import { openExternalUrl } from '../utils/openExternalUrl'
import { UnderDevelopmentModal } from './UnderDevelopmentModal'
import { DungeonDemoScene } from './DungeonDemoScene'

const AVATAR_LIST = [
  { id: 'king', name: 'Arcángel Soberano', img: '/assets/avatars/avatar_king.webp', title: 'Monarca Celestial' },
  { id: 'valkyrie', name: 'Valquiria Celestial', img: '/assets/avatars/avatar_valkyrie.webp', title: 'Seraphim de Batalla' },
  { id: 'paladin', name: 'Paladín Divino', img: '/assets/avatars/avatar_paladin.webp', title: 'Custodio de la Luz' },
  { id: 'mage', name: 'Archimago Astral', img: '/assets/avatars/avatar_mage.webp', title: 'Maestro de las Estrellas' },
]

// Imperial Realm Server List Definition
const REALMS_DATA = [
  {
    id: 'global',
    nameKey: 'serverSelect.globalName',
    fallbackName: 'Servidor Global',
    category: 'pvp',
    typeLabel: 'OPEN PVP',
    typeClass: 'pvp',
    ruleKey: 'serverSelect.globalTag',
    fallbackRule: 'Guerra, Asedios & Conquista',
    ping: '24 ms',
    popLevel: 'HIGH',
    popBadgeClass: 'high',
    popPercent: 86,
    popHintKey: 'serverSelect.globalPopHint',
    fallbackPopHint: 'Alta concurrencia • Máxima actividad',
    theme: 'global',
    crestClass: 'global-crest',
    icon: Swords,
  },
  {
    id: 'harmonia',
    nameKey: 'serverSelect.harmoniaName',
    fallbackName: 'Harmonia',
    category: 'nopvp',
    typeLabel: 'OPCIONAL PVP',
    typeClass: 'pve',
    ruleKey: 'serverSelect.harmoniaTag',
    fallbackRule: 'Santuario de Paz & Prosperidad',
    ping: '18 ms',
    popLevel: 'LOW',
    popBadgeClass: 'low',
    popPercent: 32,
    popHintKey: 'serverSelect.harmoniaPopHint',
    fallbackPopHint: 'Activo • Sin saturación de jugadores',
    theme: 'harmonia',
    crestClass: 'harmonia-crest',
    icon: Shield,
  },
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
  const [rememberedAccount, setRememberedAccount] = useState(null)

  // Returning Guest & Email Direct Login States
  const [existingGuest, setExistingGuest] = useState(null)
  const [isEmailLoginOpen, setIsEmailLoginOpen] = useState(false)
  const [authMethod, setAuthMethod] = useState('guest') // 'guest' | 'google' | 'discord' | 'email'
  const [emailStep, setEmailStep] = useState(1) // 1: Email, 2: Password
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  // Terms & Conditions Modal States
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const [pendingEnterGameData, setPendingEnterGameData] = useState(null)
  const [termsAgreed, setTermsAgreed] = useState(true)

  // Server Selection Modal States (Global Open PvP vs Harmonia No-PvP)
  const [isServerModalOpen, setIsServerModalOpen] = useState(false)
  const [chosenServer, setChosenServer] = useState(() => {
    try {
      return localStorage.getItem('toc_selected_server') || 'global'
    } catch {
      return 'global'
    }
  })
  const [serverFilterTab, setServerFilterTab] = useState('pvp') // 'pvp' | 'nopvp'
  const [startView, setStartView] = useState('landing') // 'landing' | 'connecting' | 'champion_select'
  const [connectingStep, setConnectingStep] = useState(1)
  const [isDungeonDemoOpen, setIsDungeonDemoOpen] = useState(() => {
    try {
      return typeof window !== 'undefined' && (
        window.location.search.includes('dungeon-demo') ||
        window.location.search.includes('slime-demo') ||
        window.location.search.includes('map-demo')
      )
    } catch {
      return false
    }
  })

  // Language Dropdown Popover States
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const langDropdownRef = useRef(null)

  // Early Access / Under Development Modal States
  const [isDevNoticeOpen, setIsDevNoticeOpen] = useState(false)
  const [logoClickCount, setLogoClickCount] = useState(0)
  const [lastLogoClickTime, setLastLogoClickTime] = useState(0)
  const [isGuestSession, setIsGuestSession] = useState(false)
  const [isDevBypassActive, setIsDevBypassActive] = useState(() => {
    try {
      sessionStorage.setItem('roc_dev_bypass', 'true')
    } catch {}
    return true
  })

  // Developer shortcut to toggle bypass (Ctrl+Shift+D or Alt+D)
  useEffect(() => {
    const handleDevKey = (e) => {
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) || (e.altKey && (e.key === 'D' || e.key === 'd'))) {
        e.preventDefault()
        setIsDevBypassActive((prev) => {
          const next = !prev
          try {
            sessionStorage.setItem('roc_dev_bypass', String(next))
          } catch {}
          if (next) {
            soundManager.playLevelUp?.()
            setStatusMsg('👑 MODO DESARROLLADOR: Acceso libre habilitado')
          } else {
            setStatusMsg('🔒 MODO DESARROLLADOR: Desactivado')
          }
          setTimeout(() => setStatusMsg(''), 4000)
          return next
        })
      }
    }
    window.addEventListener('keydown', handleDevKey)
    return () => window.removeEventListener('keydown', handleDevKey)
  }, [])

  // 5-tap on logo to toggle dev bypass
  const handleLogoTap = (e) => {
    e.stopPropagation()
    soundManager.playClick?.()
    const now = Date.now()
    if (now - lastLogoClickTime > 2500) {
      setLogoClickCount(1)
      setLastLogoClickTime(now)
      return
    }
    setLastLogoClickTime(now)
    const nextCount = logoClickCount + 1
    if (nextCount >= 5) {
      setLogoClickCount(0)
      setIsDevBypassActive((prev) => {
        const next = !prev
        try {
          sessionStorage.setItem('roc_dev_bypass', String(next))
        } catch {}
        if (next) {
          soundManager.playLevelUp?.()
          setStatusMsg('👑 MODO DESARROLLADOR: Acceso libre habilitado')
        } else {
          setStatusMsg('🔒 MODO DESARROLLADOR: Desactivado')
        }
        setTimeout(() => setStatusMsg(''), 4000)
        return next
      })
    } else {
      setLogoClickCount(nextCount)
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setIsLangMenuOpen(false)
      }
    }
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isLangMenuOpen])

  const activeLangObj = languages.find((l) => l.code === currentLang) || languages[0]

  // Ensure game music does not play on the start/login screen
  useEffect(() => {
    soundManager.setGameStarted?.(false)
    soundManager.pauseBGM?.()
  }, [])

  // Load known accounts and check for remembered / active account on mount and whenever modal opens
  useEffect(() => {
    const accounts = gameStorage.getKnownAccounts()
    setKnownAccounts(accounts)

    const remembered = gameStorage.getRememberedAccount()
    setRememberedAccount(remembered)
    if (remembered?.email) {
      try {
        const savedServer = localStorage.getItem(`toc_server_${remembered.email}`) || localStorage.getItem('toc_selected_server')
        if (savedServer) setChosenServer(savedServer)
      } catch {}
    }

    try {
      const guestSave = gameStorage.load(null)
      const savedName = localStorage.getItem('toc_player_name')
      const savedAvatar = localStorage.getItem('toc_player_avatar') || '/assets/avatars/avatar_king.webp'
      const hasProgress = guestSave ? (hasMeaningfulProgress(guestSave) || (guestSave.slots || []).some(s => s && s.buildingId)) : false

      if (savedName || hasProgress) {
        setExistingGuest({
          name: savedName || t('start.commander'),
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
  }, [isModalOpen, t])

  // Handle continuing game as the remembered guest player
  const handleResumeGuest = () => {
    soundManager.playButtonClick?.()
    triggerFullscreen()
    const guest = existingGuest || (() => {
      const gSave = gameStorage.load(null)
      const sName = localStorage.getItem('toc_player_name')
      return (sName || gSave) ? {
        name: sName || t('start.commander'),
        avatar: localStorage.getItem('toc_player_avatar') || '/CHAMPIONS/KINA_MALE/avatar.webp',
        level: gSave?.kingdomLevel || 1
      } : null
    })()

    if (!guest) {
      handleConfirmServerSelection(chosenServer)
      return
    }
    setIsModalOpen(false)
    onEnterGame(null, null, {
      name: guest.name,
      avatar: guest.avatar,
    })
  }

  // Advance from Email Step 1 to Step 2 (Password)
  const handleProceedEmailToPassword = (e) => {
    if (e) e.preventDefault()
    if (!isDevBypassActive) {
      soundManager.playButtonClick?.()
      setIsDevNoticeOpen(true)
      return
    }
    const clean = (emailInput || '').trim().toLowerCase()
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setErrorMsg(t('start.emailRequired'))
      return
    }
    setErrorMsg('')
    setEmailStep(2)
    setTimeout(() => passwordInputRef.current?.focus(), 150)
  }

  // Handle direct Email + Password Login
  const handleDirectEmailLogin = async (e) => {
    if (e) e.preventDefault()
    if (!isDevBypassActive) {
      soundManager.playButtonClick?.()
      setIsDevNoticeOpen(true)
      return
    }
    const clean = (emailInput || '').trim().toLowerCase()
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setErrorMsg(t('start.emailRequired'))
      return
    }
    if (!passwordInput) {
      setErrorMsg(t('start.passwordRequired'))
      return
    }

    triggerFullscreen()
    setErrorMsg('')
    setIsLoading(true)
    setStatusMsg(t('start.verifyingCredentials'))
    soundManager.playButtonClick?.()

    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: clean,
        password: passwordInput,
      })

      if (signInErr) {
        console.warn('Sign in error:', signInErr)
        if (signInErr.message?.includes('Invalid login credentials')) {
          setErrorMsg(t('start.invalidCredentials'))
        } else if (signInErr.message?.includes('Email not confirmed')) {
          setErrorMsg(t('start.confirmEmailPrompt'))
        } else {
          setErrorMsg(signInErr.message || t('start.loginError'))
        }
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      const result = await gameStorage.loadByEmail(clean)
      gameStorage.recordAccount({
        email: clean,
        name: clean.split('@')[0],
        avatar: '/assets/avatars/avatar_king.webp',
        level: result?.save?.kingdomLevel || 1,
      })

      const termsAccepted = localStorage.getItem(`toc_terms_accepted_${clean}`) === 'true'
      if (!termsAccepted) {
        triggerTermsModal(clean, result, null)
      } else {
        onEnterGame(clean, result, null)
      }
    } catch (err) {
      setIsLoading(false)
      console.warn('Login exception:', err)
      const termsAccepted = localStorage.getItem(`toc_terms_accepted_${clean}`) === 'true'
      if (!termsAccepted) {
        triggerTermsModal(clean, { success: true, isNew: false, email: clean }, null)
      } else {
        onEnterGame(clean, { success: true, isNew: false, email: clean }, null)
      }
    }
  }

  // Handle Create Account with Password confirmation
  const handleCreateEmailAccount = async (e) => {
    if (e) e.preventDefault()
    if (!isDevBypassActive) {
      soundManager.playButtonClick?.()
      setIsDevNoticeOpen(true)
      return
    }
    const clean = (emailInput || '').trim().toLowerCase()
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setErrorMsg(t('start.emailRequired'))
      setEmailStep(1)
      return
    }
    if (!passwordInput || passwordInput.length < 6) {
      setErrorMsg(t('start.passwordMinLength'))
      return
    }
    if (passwordInput !== confirmPasswordInput) {
      setErrorMsg(t('start.passwordsDoNotMatch'))
      return
    }

    triggerFullscreen()
    setErrorMsg('')
    setIsLoading(true)
    setStatusMsg(t('start.creatingHeroAccount'))
    soundManager.playButtonClick?.()

    try {
      const { error: signUpErr } = await supabase.auth.signUp({
        email: clean,
        password: passwordInput,
      })
      if (signUpErr) {
        console.warn('Sign up error:', signUpErr)
        if (signUpErr.message?.includes('already registered')) {
          setErrorMsg(t('start.emailAlreadyRegistered'))
          setIsLoading(false)
          setIsLoginMode(true)
          return
        }
      }

      setIsLoading(false)
      gameStorage.recordAccount({
        email: clean,
        name: clean.split('@')[0],
        avatar: '/assets/avatars/avatar_king.webp',
        level: 1,
      })
      // Always trigger Terms & Conditions modal for newly created accounts
      triggerTermsModal(clean, { success: true, isNew: true, email: clean }, null)
    } catch (err) {
      setIsLoading(false)
      console.warn('Auth exception:', err)
      triggerTermsModal(clean, { success: true, isNew: true, email: clean }, null)
    }
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

        // Check if terms have already been accepted on this device for this account
        const termsAccepted = localStorage.getItem(`toc_terms_accepted_${oauthEmail}`) === 'true'
        if (!termsAccepted) {
          triggerTermsModal(oauthEmail, result, null)
        } else {
          onEnterGame(oauthEmail, result, null)
        }
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

  // Disconnect the active / remembered account so user can login with a different one
  const handleDisconnectAccount = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    soundManager.playButtonClick?.()
    setIsLoading(true)
    setStatusMsg('Desconectando cuenta...')
    try {
      await gameStorage.disconnectAccount()
      setRememberedAccount(null)
      setIsLoading(false)
      setStatusMsg('')
      setErrorMsg('')
      setIsModalOpen(true)
    } catch (err) {
      console.warn('Disconnect error:', err)
      setRememberedAccount(null)
      setIsLoading(false)
      setIsModalOpen(true)
    }
  }

  // Handle tap anywhere on screen to unlock audio and immediately enter the game (Instant 0ms response)
  const hasTriggeredEntryRef = useRef(false)
  const lastScreenTapTimeRef = useRef(0)

  // Reset entry lock whenever returning to start screen view
  useEffect(() => {
    if (!isDungeonDemoOpen) {
      hasTriggeredEntryRef.current = false
    }
  }, [isDungeonDemoOpen])

  const handleBackFromDungeon = useCallback(() => {
    setIsDungeonDemoOpen(false)
    hasTriggeredEntryRef.current = false
    lastScreenTapTimeRef.current = 0
    try {
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        if (
          window.location.search.includes('dungeon-demo') ||
          window.location.search.includes('slime-demo') ||
          window.location.search.includes('map-demo')
        ) {
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    } catch {}
  }, [])

  const handleScreenClick = (e) => {
    // If clicking language menu or interactive buttons like website/discord, don't trigger game start
    if (e && e.target && e.target.closest && (
      e.target.closest('.start-top-left-actions') ||
      e.target.closest('.start-lang-dropdown-wrap') ||
      e.target.closest('.remembered-account-card') ||
      e.target.closest('.guest-modal-card') ||
      e.target.closest('.server-connecting-card') ||
      e.target.closest('button') ||
      e.target.closest('a')
    )) {
      return
    }

    if (isLangMenuOpen) {
      setIsLangMenuOpen(false)
      return
    }

    // Debounce rapid double events (e.g. pointerdown followed immediately by click)
    const now = Date.now()
    if (now - lastScreenTapTimeRef.current < 400) return
    lastScreenTapTimeRef.current = now

    if (hasTriggeredEntryRef.current) return
    hasTriggeredEntryRef.current = true

    soundManager.initCtx?.()
    soundManager.playClick?.()
    requestGameFullscreen()

    try {
      if (typeof window !== 'undefined') {
        if (window.__dungeonBgm) {
          try {
            window.__dungeonBgm.pause()
            window.__dungeonBgm.currentTime = 0
          } catch {}
        }
        // Pre-warm audio element on active user gesture to guarantee 100% autoplay clearance
        const bgm = new Audio('/DEMO/MUSIC/The_Mushroom_Waltz.ogg')
        bgm.loop = true
        bgm.volume = 0.65
        bgm.play().catch(() => {})
        window.__dungeonBgm = bgm
      }
    } catch {}

    setIsDungeonDemoOpen(true)
  }

  // Handle selecting an already remembered account
  const handleAccountSelect = async (accountEmail) => {
    if (!isDevBypassActive) {
      soundManager.playButtonClick?.()
      setIsDevNoticeOpen(true)
      return
    }
    triggerFullscreen()
    setErrorMsg('')
    setStatusMsg('')
    if (!accountEmail) return

    try {
      localStorage.removeItem('toc_session_disconnected')
    } catch {}

    setIsLoading(true)
    setStatusMsg(t('start.connecting'))
    soundManager.playButtonClick?.()

    try {
      const result = await gameStorage.loadByEmail(accountEmail)
      setIsLoading(false)

      if (result.success) {
        setStatusMsg(t('common.ready'))
        const termsAccepted = localStorage.getItem(`toc_terms_accepted_${accountEmail}`) === 'true'
        if (!termsAccepted) {
          triggerTermsModal(accountEmail, result, null)
        } else {
          setTimeout(() => {
            onEnterGame(accountEmail, result, null)
          }, 200)
        }
      } else {
        setErrorMsg(result.error || t('common.error'))
      }
    } catch (err) {
      setIsLoading(false)
      console.warn('Error en login:', err)
      const termsAccepted = localStorage.getItem(`toc_terms_accepted_${accountEmail}`) === 'true'
      if (!termsAccepted) {
        triggerTermsModal(accountEmail, { success: true, isNew: true, email: accountEmail }, null)
      } else {
        onEnterGame(accountEmail, { success: true, isNew: true, email: accountEmail }, null)
      }
    }
  }

  // Trigger the Terms and Conditions MMORPG Modal
  const triggerTermsModal = (email, result, extra) => {
    setPendingEnterGameData({ email, result, extra })
    setTermsAgreed(true)
    setIsTermsModalOpen(true)
  }

  // Handle accepting terms (via button click or Enter key)
  const handleAcceptTerms = () => {
    if (!termsAgreed) return
    soundManager.playButtonClick?.()
    if (!pendingEnterGameData) {
      setIsTermsModalOpen(false)
      return
    }
    const { email } = pendingEnterGameData
    if (email) {
      try {
        localStorage.setItem(`toc_terms_accepted_${email}`, 'true')
        localStorage.setItem('toc_terms_accepted', 'true')
      } catch {}
    }
    setIsTermsModalOpen(false)
    setIsModalOpen(false)
    // Prompt the player to select their realm / server!
    setIsServerModalOpen(true)
  }

  // Handle closing terms modal
  const handleCloseTerms = () => {
    soundManager.playClick?.()
    setIsTermsModalOpen(false)
    setPendingEnterGameData(null)
  }

  // Server Selection Confirm & Transition to Champion Select
  const handleConfirmServerSelection = (targetServer = chosenServer) => {
    soundManager.playButtonClick?.()
    const serverId = targetServer || chosenServer || 'global'
    setChosenServer(serverId)
    try {
      localStorage.setItem('toc_selected_server', serverId)
      if (pendingEnterGameData?.email) {
        localStorage.setItem(`toc_server_${pendingEnterGameData.email}`, serverId)
      } else if (rememberedAccount?.email) {
        localStorage.setItem(`toc_server_${rememberedAccount.email}`, serverId)
      }
    } catch {}

    // 1. Close modals
    setIsServerModalOpen(false)
    setIsModalOpen(false)

    // 2. Trigger connecting animation, then transition to champion selection & creation view
    setStartView('connecting')
    setConnectingStep(1)

    setTimeout(() => {
      setConnectingStep(2)
    }, 450)

    setTimeout(() => {
      setConnectingStep(3)
    }, 900)

    setTimeout(() => {
      setStartView('champion_select')
    }, 1350)
  }

  // Handle closing server selection modal
  const handleCloseServerModal = () => {
    soundManager.playClick?.()
    setIsServerModalOpen(false)
  }

  // Handle switching category tab in server selection modal (Open PvP vs Opcional PvP)
  const handleSelectCategory = (category) => {
    soundManager.playClick?.()
    setServerFilterTab(category)
    const matching = REALMS_DATA.filter((r) => r.category === category)
    if (matching.length > 0 && !matching.some((r) => r.id === chosenServer)) {
      setChosenServer(matching[0].id)
    }
  }

  // Keyboard listener for Server Selection Modal (1 for Global, 2 for Harmonia, Arrow keys to navigate, Enter to confirm, Escape to cancel)
  useEffect(() => {
    if (!isServerModalOpen) return
    const handleKeyDown = (e) => {
      if (e.key === '1') {
        soundManager.playClick?.()
        setServerFilterTab('pvp')
        setChosenServer('global')
      } else if (e.key === '2') {
        soundManager.playClick?.()
        setServerFilterTab('nopvp')
        setChosenServer('harmonia')
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        soundManager.playClick?.()
        const newTab = serverFilterTab === 'pvp' ? 'nopvp' : 'pvp'
        setServerFilterTab(newTab)
        const match = REALMS_DATA.find((r) => r.category === newTab)
        if (match) setChosenServer(match.id)
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        soundManager.playClick?.()
        const filtered = REALMS_DATA.filter((r) => {
          if (serverFilterTab === 'pvp') return r.category === 'pvp'
          if (serverFilterTab === 'nopvp') return r.category === 'nopvp'
          return true
        })
        if (filtered.length === 0) return
        const currentIdx = filtered.findIndex((r) => r.id === chosenServer)
        if (currentIdx === -1) {
          setChosenServer(filtered[0].id)
        } else if (e.key === 'ArrowDown') {
          setChosenServer(filtered[(currentIdx + 1) % filtered.length].id)
        } else {
          setChosenServer(filtered[(currentIdx - 1 + filtered.length) % filtered.length].id)
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        handleConfirmServerSelection(chosenServer)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleCloseServerModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isServerModalOpen, chosenServer, serverFilterTab, pendingEnterGameData, rememberedAccount])

  // Instant Dev / Testing Toggle: Press 'S' for Server Modal, 'C' for Champion Select Screen
  useEffect(() => {
    const handleGlobalKey = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return
      if (e.key === 's' || e.key === 'S') {
        if (!isTermsModalOpen && !isGuestNameModalOpen) {
          soundManager.playClick?.()
          setIsServerModalOpen((prev) => !prev)
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [isTermsModalOpen, isGuestNameModalOpen, isServerModalOpen])

  // Direct URL parameter / hash support: ?server or #server opens modal; ?champion or #champion opens champion select
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.search.includes('server') || window.location.hash.includes('server')) {
        setIsServerModalOpen(true)
      }
      if (window.location.search.includes('champion') || window.location.hash.includes('champion') || window.location.search.includes('champ') || window.location.search.includes('create')) {
        setStartView('champion_select')
      }
    }
  }, [])

  // Keyboard Enter listener for Terms Modal ("luego aceptar o enter")
  useEffect(() => {
    if (!isTermsModalOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        handleAcceptTerms()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleCloseTerms()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTermsModalOpen, pendingEnterGameData, termsAgreed])

  // Handle OAuth authentication (Google or Discord)
  const handleOAuthLogin = async (provider) => {
    if (!isDevBypassActive) {
      soundManager.playButtonClick?.()
      setIsDevNoticeOpen(true)
      return
    }
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
    if (e) e.stopPropagation()
    soundManager.playClick?.()
    if (guestInputRef.current) guestInputRef.current.blur()
    if (emailInputRef.current) emailInputRef.current.blur()
    if (passwordInputRef.current) passwordInputRef.current.blur()
    setErrorMsg('')
    setStatusMsg('')
    setEmailStep(1)
    setPasswordInput('')
    setConfirmPasswordInput('')
    setIsModalOpen(false)
  }

  // Handle removing a remembered account from this device
  const handleRemoveAccount = (e, accEmail) => {
    e.stopPropagation()
    soundManager.playClick?.()
    setAccountToRemove(accEmail)
  }

  const handleConfirmRemoveAccount = () => {
    if (!accountToRemove) return
    const wasRemembered = rememberedAccount?.email?.toLowerCase() === accountToRemove.toLowerCase()
    gameStorage.removeKnownAccount(accountToRemove)
    const updated = gameStorage.getKnownAccounts()
    setKnownAccounts(updated)
    if (wasRemembered) {
      gameStorage.purgeSession()
      setRememberedAccount(null)
    }
    setAccountToRemove(null)
  }

  // Realm Filtering and counts for Server Selection Modal
  const pvpRealmsCount = REALMS_DATA.filter((r) => r.category === 'pvp').length
  const noPvpRealmsCount = REALMS_DATA.filter((r) => r.category === 'nopvp').length
  const totalRealmsCount = REALMS_DATA.length

  const displayedRealms = REALMS_DATA.filter((r) => {
    if (serverFilterTab === 'nopvp') return r.category === 'nopvp'
    return r.category === 'pvp'
  })

  const selectedRealmObj = REALMS_DATA.find((r) => r.id === chosenServer) || REALMS_DATA[0]
  const selectedServerName = selectedRealmObj ? (t(selectedRealmObj.nameKey) || selectedRealmObj.fallbackName) : 'Servidor Global'
  const selectedServerTheme = selectedRealmObj?.theme || 'global'

  // Dedicated Champion Selection & Creation Screen View
  if (startView === 'champion_select') {
    return (
      <ChampionSelectScreen
        server={selectedRealmObj}
        accountEmail={isGuestSession ? null : (pendingEnterGameData?.email || rememberedAccount?.email || null)}
        pendingEnterGameData={isGuestSession ? null : pendingEnterGameData}
        onEnterGame={onEnterGame}
        onChangeServer={() => {
          setStartView('landing')
          setIsServerModalOpen(true)
        }}
        onBackToStart={() => {
          setStartView('landing')
          setIsModalOpen(false)
        }}
      />
    )
  }

  // Dedicated Fullscreen Animated Dungeon Scene (Kina Male vs Idle Slimes)
  if (isDungeonDemoOpen) {
    return (
      <DungeonDemoScene
        onBack={handleBackFromDungeon}
      />
    )
  }

  return (
    <div 
      className="start-screen-overlay"
      onPointerDown={handleScreenClick}
      onClick={handleScreenClick}
    >
      {/* Connecting to Server Loading Overlay */}
      {startView === 'connecting' && (
        <div className="server-connecting-backdrop" onClick={(e) => e.stopPropagation()}>
          <div className={`server-connecting-card ${selectedServerTheme === 'harmonia' ? 'harmonia-theme' : ''}`}>
            <div className="server-connecting-crest-wrap">
              <div className="server-connecting-spinner-ring" />
              <div className="server-connecting-crest">
                {selectedServerTheme === 'harmonia' ? (
                  <Shield size={26} color="#34d399" />
                ) : (
                  <Swords size={26} color="#fbbf24" />
                )}
              </div>
            </div>

            <h3 className="server-connecting-title">
              {t('championSelect.connectingToServer') || 'Conectando al Reino...'}
            </h3>

            <p className="server-connecting-step-text">
              {connectingStep === 1 && (t('championSelect.stepConnecting') || 'Validando enlace con el servidor de juego...')}
              {connectingStep === 2 && (t('championSelect.stepSyncing') || 'Sincronizando estado y parámetros del reino...')}
              {connectingStep === 3 && (t('championSelect.stepLoadingSanctuary') || 'Cargando santuario de campeones...')}
            </p>

            <div className="server-connecting-meta-row">
              <span className="server-connecting-ping">
                ● {selectedRealmObj?.ping || '24 ms'}
              </span>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>
                {selectedServerName} • {selectedRealmObj?.typeLabel || 'OPEN PVP'}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Top Floating Left Actions: Web Site & Discord Community */}
      <div className="start-top-left-actions">
        {/* Official Web Site Button */}
        <a
          href="https://rok-web-site.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="start-top-website-btn"
          onClick={(e) => {
            soundManager.playClick?.()
            openExternalUrl('https://rok-web-site.vercel.app/', e)
          }}
          title="Web Site Oficial"
        >
          <div className="start-top-website-icon-wrap">
            <Globe className="start-top-website-icon" />
          </div>
          <span className="start-top-link-label">Web Site</span>
        </a>

        {/* Discord Community Button */}
        <a
          href="https://discord.gg/ThNaG4pzy"
          target="_blank"
          rel="noopener noreferrer"
          className="start-top-discord-btn"
          onClick={(e) => {
            soundManager.playClick?.()
            openExternalUrl('https://discord.gg/ThNaG4pzy', e)
          }}
          title={t('start.discordCommunity') || 'Official Discord Community'}
        >
          <div className="start-top-discord-icon-wrap">
            <svg className="start-top-discord-svg" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
          </div>
          <div className="start-top-discord-info">
            <span className="start-top-discord-label">Discord</span>
            <span className="start-top-discord-pill">
              <span className="start-top-discord-pulse" />
              LIVE
            </span>
          </div>
        </a>
      </div>

      {/* Top Floating Realm / Server Selector (Hidden for Android / Release packaging) */}
      {false && (
        <div className="start-server-quick-wrap" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="start-server-quick-trigger"
            onClick={() => {
              soundManager.playButtonClick?.()
              setIsServerModalOpen((prev) => !prev)
            }}
            title="Seleccionar Servidor (Tecla: S)"
          >
            <span className="start-server-pulse-dot" />
            <Globe className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
            <span className="start-server-quick-name">
              {chosenServer === 'harmonia' ? 'Harmonia' : (t('serverSelect.globalName') || 'Servidor Global')}
            </span>
            <span className={`start-server-quick-pill ${chosenServer === 'harmonia' ? 'low' : 'high'}`}>
              {chosenServer === 'harmonia' ? 'LOW' : 'HIGH'}
            </span>
          </button>
        </div>
      )}

      {/* Top Floating Language Dropdown Selector */}
      <div 
        ref={langDropdownRef}
        className="start-lang-dropdown-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={`start-lang-trigger ${isLangMenuOpen ? 'is-open' : ''}`}
          onClick={() => {
            soundManager.playClick?.()
            setIsLangMenuOpen((prev) => !prev)
          }}
          title={t('menu.tabLanguage') || 'Language'}
          aria-expanded={isLangMenuOpen}
        >
          <span className="start-lang-trigger-flag">{activeLangObj?.flag}</span>
          <span className="start-lang-trigger-code">{activeLangObj?.region}</span>
          <ChevronDown className={`start-lang-chevron ${isLangMenuOpen ? 'is-rotated' : ''}`} />
        </button>

        {isLangMenuOpen && (
          <div className="start-lang-popover">
            <div className="start-lang-popover-header">
              <Globe className="start-lang-popover-icon" />
              <span>{t('menu.tabLanguage') || 'Language'}</span>
            </div>
            <div className="start-lang-popover-list">
              {languages.map((lang) => {
                const isSelected = currentLang === lang.code
                return (
                  <button
                    key={lang.code}
                    type="button"
                    className={`start-lang-item ${isSelected ? 'is-active' : ''}`}
                    onClick={() => {
                      soundManager.playClick?.()
                      changeLanguage(lang.code)
                      setIsLangMenuOpen(false)
                    }}
                  >
                    <span className="start-lang-item-flag">{lang.flag}</span>
                    <div className="start-lang-item-text">
                      <span className="start-lang-item-name">{lang.name}</span>
                      <span className="start-lang-item-region">{lang.region}</span>
                    </div>
                    {isSelected && (
                      <Check className="start-lang-item-check" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Background Ambient Glow & Vignette */}
      <div className="start-screen-vignette" />

      {/* Center Cinematic Title & Branding */}
      <div className="start-screen-hero" style={{ pointerEvents: 'none' }}>
        <div 
          className="start-screen-logo-container"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <img 
            src="/assets/logo/logo.webp" 
            alt="Realm of Kingdom" 
            className="start-screen-game-logo"
            draggable="false"
          />
        </div>
      </div>

      {/* Bottom Pulsing Prompt */}
      {!isModalOpen && !rememberedAccount && (
        <div className="start-prompt-container">
          <span className="start-prompt-text">
            {t('start.touchToStart')}
          </span>
        </div>
      )}

      {!isModalOpen && rememberedAccount && (
        <div 
          className="start-remembered-account-container"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="remembered-account-card">
            {/* Live Server & Active Session Badge */}
            <div className="remembered-card-status">
              <div className="remembered-status-left">
                <span className="realm-status-dot" />
                <span>{t('start.rememberedSession')}</span>
              </div>
              <button
                type="button"
                className="remembered-server-switch-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  soundManager.playButtonClick?.()
                  setIsServerModalOpen(true)
                }}
                title={t('serverSelect.switchNotice')}
              >
                <Globe className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                <span className="remembered-server-name">
                  {chosenServer === 'harmonia' ? t('serverSelect.harmoniaName') : t('serverSelect.globalName')}
                </span>
                <span className={`remembered-server-pill ${chosenServer === 'harmonia' ? 'low' : 'high'}`}>
                  {chosenServer === 'harmonia' ? t('serverSelect.harmoniaPop') : t('serverSelect.globalPop')}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
              </button>
            </div>

            {/* Character Profile Info */}
            <div className="remembered-card-profile">
              <div className="remembered-card-avatar-wrap">
                <img 
                  src={rememberedAccount.avatar || '/assets/avatars/avatar_king.webp'} 
                  alt={rememberedAccount.name} 
                  className="remembered-card-avatar"
                  draggable="false"
                />
                <span className="remembered-card-lvl">
                  {t('common.levelShort') || 'Nv.'}{rememberedAccount.level || 1}
                </span>
              </div>
              <div className="remembered-card-details">
                <span className="remembered-card-name">
                  {rememberedAccount.name || t('start.commander')}
                </span>
                <span className="remembered-card-email">
                  {rememberedAccount.email}
                </span>
              </div>
            </div>

            {/* Actions: Entrar al Juego + Desconectar Cuenta */}
            <div className="remembered-card-actions">
              <button
                type="button"
                className="remembered-enter-btn"
                onClick={() => {
                  soundManager.playButtonClick?.()
                  handleAccountSelect(rememberedAccount.email)
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>{t('start.connectingAccount')}</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 text-amber-300 flex-shrink-0" />
                    <span>{t('start.continueAdventure')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="remembered-disconnect-btn"
                onClick={handleDisconnectAccount}
                disabled={isLoading}
                title={t('start.disconnectTooltip')}
              >
                <LogOut className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{isLoading ? t('start.disconnecting') : t('start.disconnectAccount')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login & Auth Modal */}
      {isModalOpen && (
        <div 
          className="guest-modal-backdrop"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="guest-modal-card">
            {/* Modal Close Button */}
            <button
              type="button"
              className="guest-modal-close-btn"
              onClick={handleCloseModal}
              title={t('common.close')}
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>

            {/* Horizontal 2-Column MMORPG Layout */}
            <div className="guest-modal-horizontal-layout">
              {/* Left Column (Wider, ~57%): Active Provider Action Panel & Centered Branding */}
              <div className="guest-modal-col-identity">
                {/* Live Server Status Badge - Clickable to change realm */}
                <button
                  type="button"
                  className="realm-status-badge realm-status-badge-clickable"
                  onClick={(e) => {
                    e.stopPropagation()
                    soundManager.playClick?.()
                    setIsServerModalOpen(true)
                  }}
                  title="Cambiar Servidor / Change Realm (Tecla: S)"
                >
                  <span className="realm-status-dot" />
                  <span className="realm-status-text">
                    {chosenServer === 'harmonia' ? 'Harmonia • LOW' : `${t('start.globalServer') || 'Servidor Global'} • HIGH`}
                  </span>
                  <span className="realm-status-switch-pill">CAMBIAR</span>
                </button>

                {/* Game Logo - Centered in Left Section */}
                <div className="guest-modal-logo-wrap">
                  <img 
                    src="/assets/logo/logo.webp" 
                    alt={t('start.title')} 
                    className="guest-modal-game-logo" 
                    draggable="false"
                  />
                </div>

                {/* Early Access / In Development Notice Banner */}
                <button
                  type="button"
                  className="dev-notice-trigger-banner"
                  onClick={(e) => {
                    e.stopPropagation()
                    soundManager.playClick?.()
                    setIsDevNoticeOpen(true)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(180, 83, 9, 0.28) 100%)',
                    border: '1.5px solid rgba(245, 158, 11, 0.45)',
                    color: '#fef08a',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    marginBottom: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
                  }}
                >
                  <Crown className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <span>{t('start.devNoticeBadge') || 'ACCESO ANTICIPADO • EN DESARROLLO'}</span>
                  <span style={{ fontSize: '0.68rem', color: '#38bdf8', marginLeft: 'auto' }}>✦ {t('common.info') || 'Ver Aviso'} ✦</span>
                </button>

                {/* Dynamic Panel based on authMethod */}
                {authMethod === 'guest' && (
                  <div className="mmorpg-auth-panel mmorpg-guest-panel">
                    <div className="mmorpg-auth-header">
                      <div className="mmorpg-provider-badge guest" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(2,132,199,0.3) 100%)', border: '1px solid rgba(56,189,248,0.5)', color: '#38bdf8' }}>
                        <Swords className="w-5 h-5 flex-shrink-0 text-sky-400" />
                        <span>{t('auth.guestMode') || 'Modo Invitado (Prueba Libre)'}</span>
                      </div>
                      <p className="mmorpg-auth-desc">
                        {existingGuest 
                          ? `Tienes un reino guardado como ${existingGuest.name} (Nivel ${existingGuest.level}). Puedes continuar tu partida o entrar a seleccionar y probar cualquiera de tus campeones.`
                          : 'Entra sin registrarte para probar tus 8 campeones (animaciones, saltos, dashes y audios), construir tu reino y combatir en la arena.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="mmorpg-primary-action-btn"
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #f59e0b 100%)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          boxShadow: '0 0 20px rgba(56,189,248,0.4)',
                        }}
                        onClick={() => {
                          soundManager.playButtonClick?.()
                          setIsGuestSession(true)
                          handleConfirmServerSelection(chosenServer)
                        }}
                      >
                        <Crown className="w-5 h-5 flex-shrink-0 text-amber-300" />
                        <span>SELECCIONAR Y PROBAR CAMPEÓN</span>
                      </button>

                      {existingGuest && (
                        <button
                          type="button"
                          className="remembered-enter-btn"
                          style={{ width: '100%', padding: '10px 16px', fontSize: '0.84rem' }}
                          onClick={handleResumeGuest}
                        >
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span>Continuar como {existingGuest.name} (Nv. {existingGuest.level})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {authMethod === 'google' && (
                  <div className="mmorpg-auth-panel">
                    <div className="mmorpg-auth-header">
                      <div className="mmorpg-provider-badge google">
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>{t('start.googleAccount')}</span>
                      </div>
                      <p className="mmorpg-auth-desc">
                        {t('start.googleDesc')}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="mmorpg-primary-action-btn btn-google"
                      onClick={() => handleOAuthLogin('google')}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>{t('start.connectingAccount')}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                          <span>{t('start.connectAccount')}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {authMethod === 'discord' && (
                  <div className="mmorpg-auth-panel">
                    <div className="mmorpg-auth-header">
                      <div className="mmorpg-provider-badge discord">
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 127.14 96.36" fill="#5865F2">
                          <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z"/>
                        </svg>
                        <span>{t('start.discordAccount')}</span>
                      </div>
                      <p className="mmorpg-auth-desc">
                        {t('start.discordDesc')}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="mmorpg-primary-action-btn btn-discord"
                      onClick={() => handleOAuthLogin('discord')}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>{t('start.connectingAccount')}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 127.14 96.36" fill="currentColor">
                            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z"/>
                          </svg>
                          <span>{t('start.connectAccount')}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Mode A: Email Direct Login */}
                {authMethod === 'email' && isLoginMode && (
                  <form onSubmit={handleDirectEmailLogin} className="mmorpg-auth-panel mmorpg-email-form">
                    {/* Navigation Tabs: Iniciar Sesión / Crear Cuenta */}
                    <div className="mmorpg-auth-tabs">
                      <button
                        type="button"
                        className="mmorpg-auth-tab is-active"
                        onClick={() => {
                          soundManager.playClick?.()
                          setIsLoginMode(true)
                          setErrorMsg('')
                        }}
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{t('start.loginTab')}</span>
                      </button>
                      <button
                        type="button"
                        className="mmorpg-auth-tab"
                        onClick={() => {
                          soundManager.playClick?.()
                          setIsLoginMode(false)
                          setEmailStep(1)
                          setErrorMsg('')
                        }}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{t('start.registerTab')}</span>
                      </button>
                    </div>

                    <div className="mmorpg-auth-header">
                      <div className="mmorpg-provider-badge email">
                        <Mail className="w-4 h-4 text-sky-400" />
                        <span>{t('start.emailAccess')}</span>
                      </div>
                      <p className="mmorpg-auth-desc">
                        {t('start.emailLoginDesc')}
                      </p>
                    </div>

                    {/* Email Input */}
                    <div className="mmorpg-input-group">
                      <label htmlFor="mmorpg-login-email-input" className="mmorpg-input-label">
                        <span>{t('start.emailLabel')}</span>
                      </label>
                      <div className="mmorpg-input-wrap">
                        <Mail className="w-4 h-4 text-sky-400/80 mmorpg-input-icon" />
                        <input
                          id="mmorpg-login-email-input"
                          ref={emailInputRef}
                          type="email"
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value)
                            setErrorMsg('')
                          }}
                          placeholder={t('start.emailInputPlaceholder')}
                          className="mmorpg-text-input"
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="mmorpg-input-group">
                      <label htmlFor="mmorpg-login-pw-input" className="mmorpg-input-label">
                        <span>{t('start.passwordLabel')}</span>
                      </label>
                      <div className="mmorpg-input-wrap">
                        <Lock className="w-4 h-4 text-sky-400/80 mmorpg-input-icon" />
                        <input
                          id="mmorpg-login-pw-input"
                          ref={passwordInputRef}
                          type={showPassword ? 'text' : 'password'}
                          value={passwordInput}
                          onChange={(e) => {
                            setPasswordInput(e.target.value)
                            setErrorMsg('')
                          }}
                          placeholder={t('start.passwordPlaceholder')}
                          className="mmorpg-text-input"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="mmorpg-pw-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          aria-label="Alternar visibilidad de contraseña"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mmorpg-primary-action-btn btn-email"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>{t('start.loggingIn')}</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>{t('start.loginTab')}</span>
                        </>
                      )}
                    </button>

                    <div className="mmorpg-mode-toggle-wrap">
                      <button
                        type="button"
                        className="mmorpg-mode-toggle-btn"
                        onClick={() => {
                          soundManager.playClick?.()
                          setIsLoginMode(false)
                          setEmailStep(1)
                          setErrorMsg('')
                        }}
                      >
                        {t('start.noAccountPrompt')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Mode B: Email Registration - Step 1 (Enter Email) */}
                {authMethod === 'email' && !isLoginMode && emailStep === 1 && (
                  <form onSubmit={handleProceedEmailToPassword} className="mmorpg-auth-panel mmorpg-email-form">
                    {/* Navigation Tabs: Iniciar Sesión / Crear Cuenta */}
                    <div className="mmorpg-auth-tabs">
                      <button
                        type="button"
                        className="mmorpg-auth-tab"
                        onClick={() => {
                          soundManager.playClick?.()
                          setIsLoginMode(true)
                          setErrorMsg('')
                        }}
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{t('start.loginTab')}</span>
                      </button>
                      <button
                        type="button"
                        className="mmorpg-auth-tab is-active"
                        onClick={() => {
                          soundManager.playClick?.()
                          setIsLoginMode(false)
                          setEmailStep(1)
                          setErrorMsg('')
                        }}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{t('start.registerTab')}</span>
                      </button>
                    </div>

                    <div className="mmorpg-auth-header">
                      <div className="mmorpg-provider-badge email">
                        <UserPlus className="w-4 h-4 text-sky-400" />
                        <span>{t('start.step1Badge')}</span>
                      </div>
                      <p className="mmorpg-auth-desc">
                        {t('start.emailRegisterDesc')}
                      </p>
                    </div>

                    <div className="mmorpg-input-group">
                      <label htmlFor="mmorpg-email-input" className="mmorpg-input-label">
                        <span>{t('start.emailLabel')}</span>
                      </label>
                      <div className="mmorpg-input-wrap">
                        <Mail className="w-4 h-4 text-sky-400/80 mmorpg-input-icon" />
                        <input
                          id="mmorpg-email-input"
                          ref={emailInputRef}
                          type="email"
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value)
                            setErrorMsg('')
                          }}
                          placeholder={t('start.emailInputPlaceholder')}
                          className="mmorpg-text-input"
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mmorpg-primary-action-btn btn-email"
                      disabled={isLoading}
                    >
                      <span>{t('start.nextStep')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="mmorpg-mode-toggle-wrap">
                      <button
                        type="button"
                        className="mmorpg-mode-toggle-btn"
                        onClick={() => {
                          soundManager.playClick?.()
                          setIsLoginMode(true)
                          setErrorMsg('')
                        }}
                      >
                        {t('start.hasAccountPrompt')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Mode C: Email Registration - Step 2 (Password & Confirm Password) */}
                {authMethod === 'email' && !isLoginMode && emailStep === 2 && (
                  <form onSubmit={handleCreateEmailAccount} className="mmorpg-auth-panel mmorpg-email-form">
                    {/* Navigation Tabs: Iniciar Sesión / Crear Cuenta */}
                    <div className="mmorpg-auth-tabs">
                      <button
                        type="button"
                        className="mmorpg-auth-tab"
                        onClick={() => {
                          soundManager.playClick?.()
                          setIsLoginMode(true)
                          setErrorMsg('')
                        }}
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{t('start.loginTab')}</span>
                      </button>
                      <button
                        type="button"
                        className="mmorpg-auth-tab is-active"
                        onClick={() => {
                          soundManager.playClick?.()
                          setIsLoginMode(false)
                          setErrorMsg('')
                        }}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{t('start.registerTab')}</span>
                      </button>
                    </div>

                    <div className="mmorpg-auth-header-step2">
                      <button
                        type="button"
                        className="mmorpg-step-back-btn"
                        onClick={() => {
                          soundManager.playClick?.()
                          setEmailStep(1)
                          setErrorMsg('')
                        }}
                        title={t('start.changeEmail')}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span className="mmorpg-step-back-email">{emailInput}</span>
                      </button>
                      <span className="mmorpg-step-badge">
                        {t('start.step2Badge')}
                      </span>
                    </div>

                    {/* Input Contraseña */}
                    <div className="mmorpg-input-group">
                      <label htmlFor="mmorpg-password-input" className="mmorpg-input-label">
                        <span>{t('start.passwordLabel')}</span>
                      </label>
                      <div className="mmorpg-input-wrap">
                        <Lock className="w-4 h-4 text-sky-400/80 mmorpg-input-icon" />
                        <input
                          id="mmorpg-password-input"
                          ref={passwordInputRef}
                          type={showPassword ? 'text' : 'password'}
                          value={passwordInput}
                          onChange={(e) => {
                            setPasswordInput(e.target.value)
                            setErrorMsg('')
                          }}
                          placeholder={t('start.passwordMinPlaceholder')}
                          className="mmorpg-text-input"
                          autoComplete="new-password"
                          autoFocus
                        />
                        <button
                          type="button"
                          className="mmorpg-pw-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          aria-label="Alternar visibilidad de contraseña"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Input Confirmar Contraseña */}
                    <div className="mmorpg-input-group">
                      <label htmlFor="mmorpg-confirm-password-input" className="mmorpg-input-label">
                        <span>{t('start.confirmPasswordLabel')}</span>
                      </label>
                      <div className="mmorpg-input-wrap">
                        <Lock className="w-4 h-4 text-sky-400/80 mmorpg-input-icon" />
                        <input
                          id="mmorpg-confirm-password-input"
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPasswordInput}
                          onChange={(e) => {
                            setConfirmPasswordInput(e.target.value)
                            setErrorMsg('')
                          }}
                          placeholder={t('start.confirmPasswordPlaceholder')}
                          className="mmorpg-text-input"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mmorpg-primary-action-btn btn-email"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>{t('start.creatingAccount')}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>{t('start.createAccountBtn')}</span>
                        </>
                      )}
                    </button>

                    <div className="mmorpg-mode-toggle-wrap">
                      <button
                        type="button"
                        className="mmorpg-mode-toggle-btn"
                        onClick={() => {
                          soundManager.playClick?.()
                          setIsLoginMode(true)
                          setErrorMsg('')
                        }}
                      >
                        {t('start.hasAccountPrompt')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Status / Error Box */}
                {errorMsg && (
                  <div className="guest-status-box guest-status-error" style={{ marginTop: 10, width: '100%' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {statusMsg && (
                  <div className="guest-status-box guest-status-success" style={{ marginTop: 10, width: '100%' }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span>{statusMsg}</span>
                  </div>
                )}

                {/* Footer Security Guarantee */}
                <div className="guest-modal-footer">
                  <Shield className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <span>{t('start.secureConnection')}</span>
                </div>
              </div>

              {/* Right Column: Platform Selectors & Saved Accounts (Compact, ~43%) */}
              <div className="guest-modal-col-actions">
                <div className="guest-actions-header">
                  <span className="guest-actions-title">
                    {t('start.accessMethods')}
                  </span>
                  <span className="guest-actions-sub">
                    {t('start.choosePlatform')}
                  </span>
                </div>

                {/* Method Buttons: Guest, Google, Discord, Email */}
                <div className="start-auth-tiles-grid">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick?.()
                      setAuthMethod('guest')
                      setErrorMsg('')
                    }}
                    disabled={isLoading}
                    className={`login-tile-btn login-tile-guest ${authMethod === 'guest' ? 'is-selected' : ''}`}
                    title="Modo Invitado"
                  >
                    <div className="login-tile-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                      <Swords className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                    </div>
                    <div className="login-tile-text">
                      <span className="login-tile-label">Modo Invitado</span>
                      <span className="login-tile-sub">Probar Campeones • Sin registro</span>
                    </div>
                    <ArrowRight className="w-4 h-4 login-tile-arrow" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick?.()
                      setAuthMethod('google')
                      setErrorMsg('')
                    }}
                    disabled={isLoading}
                    className={`login-tile-btn login-tile-google ${authMethod === 'google' ? 'is-selected' : ''}`}
                    title="Google"
                  >
                    <div className="login-tile-icon-wrap">
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    </div>
                    <div className="login-tile-text">
                      <span className="login-tile-label">Google</span>
                      <span className="login-tile-sub">{t('start.googleAccount')}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 login-tile-arrow" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick?.()
                      setAuthMethod('discord')
                      setErrorMsg('')
                    }}
                    disabled={isLoading}
                    className={`login-tile-btn login-tile-discord ${authMethod === 'discord' ? 'is-selected' : ''}`}
                    title="Discord"
                  >
                    <div className="login-tile-icon-wrap">
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 127.14 96.36" fill="#5865F2">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z"/>
                      </svg>
                    </div>
                    <div className="login-tile-text">
                      <span className="login-tile-label">Discord</span>
                      <span className="login-tile-sub">{t('start.discordAccount')}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 login-tile-arrow" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick?.()
                      setAuthMethod('email')
                      setErrorMsg('')
                    }}
                    disabled={isLoading}
                    className={`login-tile-btn login-tile-email ${authMethod === 'email' ? 'is-selected' : ''}`}
                    title={t('start.emailAccess')}
                  >
                    <div className="login-tile-icon-wrap">
                      <Mail className="w-5 h-5 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                    </div>
                    <div className="login-tile-text">
                      <span className="login-tile-label">{t('start.emailAccess')}</span>
                      <span className="login-tile-sub">{t('start.accessAndRegister')}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 login-tile-arrow" />
                  </button>
                </div>

                {/* Saved Accounts on this Device */}
                {knownAccounts.length > 0 && (
                  <div className="known-accounts-container" style={{ marginTop: 16 }}>
                    <div className="known-accounts-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="known-accounts-title" style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                        {t('start.accountsOnDevice')}
                      </span>
                    </div>
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
                              <span className="account-card-name">{acc.name || t('start.adventurer')}</span>
                            </div>
                            <span className="account-card-email">{acc.email}</span>
                          </div>
                          <button 
                            type="button" 
                            className="account-card-remove-btn"
                            title={t('start.unlinkAccount')}
                            onClick={(e) => handleRemoveAccount(e, acc.email)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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

      {/* Terms and Conditions MMORPG Modal */}
      {isTermsModalOpen && (
        <div 
          className="guest-modal-backdrop terms-modal-backdrop"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="guest-modal-card terms-modal-card">
            {/* Modal Close Button */}
            <button
              type="button"
              className="guest-modal-close-btn"
              onClick={handleCloseTerms}
              title={t('common.close')}
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>

            {/* Terms Header */}
            <div className="terms-modal-header">
              <div className="terms-modal-badge">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>{t('start.termsServiceAgreement')}</span>
              </div>
              <h2 className="terms-modal-title">
                {t('start.termsTitle')}
              </h2>
              <p className="terms-modal-subtitle">
                {t('start.termsSubtitle')}
              </p>
            </div>

            {/* Scrollable Terms Content */}
            <div className="terms-content-box">
              <div className="terms-article">
                <div className="terms-article-title">
                  <span className="terms-article-num">01</span>
                  <span>{t('start.termsArticle1Title')}</span>
                </div>
                <p className="terms-article-text">
                  {t('start.termsArticle1Text')}
                </p>
              </div>

              <div className="terms-article">
                <div className="terms-article-title">
                  <span className="terms-article-num">02</span>
                  <span>{t('start.termsArticle2Title')}</span>
                </div>
                <p className="terms-article-text">
                  {t('start.termsArticle2Text')}
                </p>
              </div>

              <div className="terms-article">
                <div className="terms-article-title">
                  <span className="terms-article-num">03</span>
                  <span>{t('start.termsArticle3Title')}</span>
                </div>
                <p className="terms-article-text">
                  {t('start.termsArticle3Text')}
                </p>
              </div>

              <div className="terms-article">
                <div className="terms-article-title">
                  <span className="terms-article-num">04</span>
                  <span>{t('start.termsArticle4Title')}</span>
                </div>
                <p className="terms-article-text">
                  {t('start.termsArticle4Text')}
                </p>
              </div>

              <div className="terms-article">
                <div className="terms-article-title">
                  <span className="terms-article-num">05</span>
                  <span>{t('start.termsArticle5Title')}</span>
                </div>
                <p className="terms-article-text">
                  {t('start.termsArticle5Text')}
                </p>
              </div>
            </div>

            {/* Checkbox agreement */}
            <div 
              className="terms-agreement-row"
              onClick={() => {
                soundManager.playClick?.()
                setTermsAgreed((prev) => !prev)
              }}
            >
              <div className={`terms-checkbox ${termsAgreed ? 'is-checked' : ''}`}>
                {termsAgreed && <Check className="w-3.5 h-3.5 text-sky-300 stroke-[3]" />}
              </div>
              <span className="terms-agreement-label">
                {t('start.termsAgreementCheck')}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="terms-modal-actions">
              <button
                type="button"
                className="terms-btn-cancel"
                onClick={handleCloseTerms}
              >
                {t('common.cancel')}
              </button>

              <button
                type="button"
                className="terms-btn-accept"
                disabled={!termsAgreed}
                onClick={handleAcceptTerms}
              >
                <span>{t('start.acceptAndEnter')}</span>
                <span className="terms-enter-badge">{t('start.enterKeyBadge')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Imperial Server Selection MMORPG Modal - Classic Realm List */}
      {isServerModalOpen && (
        <div 
          className="guest-modal-backdrop server-modal-backdrop"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="guest-modal-card realm-list-card">
            {/* Modal Close Button */}
            <button
              type="button"
              className="guest-modal-close-btn"
              onClick={handleCloseServerModal}
              title={t('common.close')}
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>

            {/* Realm List Header */}
            <div className="realm-list-header">
              <div className="realm-list-header-left">
                <div className="realm-list-badge">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t('serverSelect.badge')}</span>
                </div>
                <h2 className="realm-list-title">
                  {t('serverSelect.title')}
                </h2>
              </div>
              <div className="realm-list-header-right">
                <span className="realm-count-pill">
                  <span className="realm-count-dot" />
                  {totalRealmsCount} {t('serverSelect.realmsAvailable') || 'Reinos Disponibles'}
                </span>
              </div>
            </div>

            {/* Category Filter Tabs (Open PvP | Opcional PvP) */}
            <div className="realm-filter-bar">
              <div className="realm-filter-tabs">
                <button
                  type="button"
                  className={`realm-filter-tab-btn pvp-tab ${serverFilterTab === 'pvp' ? 'is-active' : ''}`}
                  onClick={() => handleSelectCategory('pvp')}
                >
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('serverSelect.tabPvp') || 'Open PvP'}</span>
                  <span className="realm-filter-count pvp">{pvpRealmsCount}</span>
                </button>

                <button
                  type="button"
                  className={`realm-filter-tab-btn nopvp-tab ${serverFilterTab === 'nopvp' ? 'is-active' : ''}`}
                  onClick={() => handleSelectCategory('nopvp')}
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('serverSelect.tabNoPvp') || 'Opcional PvP'}</span>
                  <span className="realm-filter-count nopvp">{noPvpRealmsCount}</span>
                </button>
              </div>
            </div>

            {/* Realm Table Header (Classic MMORPG Table Columns) */}
            <div className="realm-table-head">
              <span className="col-head col-realm">{t('serverSelect.colRealm') || 'Reino'}</span>
              <span className="col-head col-type">{t('serverSelect.colType') || 'Tipo'}</span>
              <span className="col-head col-status">{t('serverSelect.colStatus') || 'Estado'}</span>
              <span className="col-head col-pop">{t('serverSelect.colPopulation') || 'Población'}</span>
              <span className="col-head col-select"></span>
            </div>

            {/* Realm Rows Container (Scrollable) */}
            <div className="realm-rows-container">
              {displayedRealms.length === 0 ? (
                <div className="realm-empty-state">
                  <AlertCircle className="w-6 h-6 text-amber-400/70" />
                  <p>{t('serverSelect.noServersFound') || 'No hay servidores disponibles en esta categoría.'}</p>
                </div>
              ) : (
                displayedRealms.map((realm) => {
                  const isSelected = chosenServer === realm.id
                  const IconComponent = realm.icon || Swords
                  const realmName = t(realm.nameKey) || realm.fallbackName
                  const realmRule = t(realm.ruleKey) || realm.fallbackRule
                  const popHint = t(realm.popHintKey) || realm.fallbackPopHint

                  return (
                    <div
                      key={realm.id}
                      className={`realm-row-item ${realm.theme}-row ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        soundManager.playClick?.()
                        setChosenServer(realm.id)
                      }}
                      onDoubleClick={() => handleConfirmServerSelection(realm.id)}
                      title={`${realmName} - ${realmRule}`}
                    >
                      {/* Col 1: Crest + Server Name (nowrap) + Rule Subtitle */}
                      <div className="realm-col-info">
                        <div className={`realm-row-crest ${realm.crestClass}`}>
                          <IconComponent className={`w-5 h-5 ${realm.theme === 'harmonia' ? 'text-emerald-400' : 'text-amber-400'}`} />
                        </div>
                        <div className="realm-row-titles">
                          <div className="realm-row-name-wrap">
                            <span className="realm-row-name">{realmName}</span>
                          </div>
                          <span className="realm-row-rule">{realmRule}</span>
                        </div>
                      </div>

                      {/* Col 2: Type Badge (Centered) */}
                      <div className="realm-col-type">
                        <span className={`realm-tag-pill ${realm.typeClass}`}>
                          <IconComponent className="w-3 h-3 flex-shrink-0" />
                          <span>{realm.typeLabel}</span>
                        </span>
                      </div>

                      {/* Col 3: Status & Ping (Centered) */}
                      <div className="realm-col-status">
                        <div className="realm-ping-wrap">
                          <span className="realm-status-dot online" />
                          <span className="realm-ping-val">{realm.ping}</span>
                        </div>
                      </div>

                      {/* Col 4: Population Meter & Level */}
                      <div className="realm-col-pop">
                        <div className="realm-pop-block">
                          <div className="realm-pop-bar-wrap">
                            <div 
                              className={`realm-pop-bar-fill ${realm.popBadgeClass}`} 
                              style={{ width: `${realm.popPercent}%` }} 
                            />
                          </div>
                          <div className="realm-pop-meta">
                            <span className={`realm-pop-badge ${realm.popBadgeClass}`}>{realm.popLevel}</span>
                            <span className="realm-pop-hint-text">{popHint}</span>
                          </div>
                        </div>
                      </div>

                      {/* Col 5: Radio Selection Circle Indicator */}
                      <div className="realm-col-select">
                        <div className={`realm-radio-circle ${isSelected ? 'is-selected' : ''}`}>
                          {isSelected && <div className="realm-radio-dot" />}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Bottom Footer Action Bar */}
            <div className="realm-list-footer">
              <div className="realm-footer-info">
                <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <span>{t('serverSelect.switchNotice')}</span>
              </div>

              <div className="realm-footer-buttons">
                <button
                  type="button"
                  className="realm-btn-cancel"
                  onClick={handleCloseServerModal}
                >
                  {t('common.cancel')}
                </button>

                <button
                  type="button"
                  className={`realm-btn-enter ${selectedServerTheme === 'harmonia' ? 'harmonia-theme' : 'global-theme'}`}
                  onClick={() => handleConfirmServerSelection(chosenServer)}
                >
                  <span>
                    {t('serverSelect.enterBtn', { server: selectedServerName })}
                  </span>
                  <span className="realm-enter-key">ENTER ↵</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Royal Under Development Early Access Notice Modal */}
      <UnderDevelopmentModal
        isOpen={isDevNoticeOpen}
        onClose={() => setIsDevNoticeOpen(false)}
        onEnterGuest={() => {
          setIsDevNoticeOpen(false)
          setIsGuestSession(true)
          handleConfirmServerSelection(chosenServer)
        }}
      />
    </div>
  )
}
