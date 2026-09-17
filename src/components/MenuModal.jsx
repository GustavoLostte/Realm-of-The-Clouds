import React, { useState, useEffect } from 'react'
import './MenuModal.css'
import { 
  Volume2, 
  VolumeX, 
  Minimize2, 
  Globe, 
  Save, 
  RotateCcw, 
  ChevronRight,
  Smartphone,
  Info,
  Crown,
  BookOpen,
  Wallet,
  Maximize2,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  LogOut,
  Download,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { subscribePWAState, promptPWAInstall } from '../pwa/registerServiceWorker'
import { toggleGameFullscreen, isMobileOrTouch } from '../utils/fullscreen'

export function MenuModal({ 
  isOpen, 
  onClose, 
  soundEnabled, 
  onToggleSound, 
  onResetGame,
  onManualSave,
  onLogout,
  showNotification,
  playerName = 'Comandante',
  onOpenChangeName,
  onRestartTutorial,
  fpsMode = '60fps',
  onSetFpsMode,
  particlesEnabled = true,
  onToggleParticles,
  graphicsPreset = 'quality',
  recommendedPreset = 'quality',
  onSetGraphicsPreset,
  characterShadows = true,
  onToggleCharacterShadows,
  hudEffects = true,
  onToggleHudEffects,
}) {
  const { t, currentLang, changeLanguage, languages } = useTranslation()
  const [activeTab, setActiveTab] = useState('settings') // 'settings' | 'web3' | 'info'
  const [bgmVolume, setBgmVolume] = useState(Math.round((soundManager.bgmVolume || 0.35) * 100))
  const [sfxVolume, setSfxVolume] = useState(Math.round((soundManager.sfxVolume || 0.85) * 100))
  const [ambientVolume, setAmbientVolume] = useState(Math.round((soundManager.ambientVolume || 0.55) * 100))
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('0x71C8...4F2A')
  const [confirmReset, setConfirmReset] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pwaState, setPwaState] = useState({ canInstall: false, isInstalled: false })

  useEffect(() => {
    const unsub = subscribePWAState((state) => {
      setPwaState(state)
    })
    return () => unsub?.()
  }, [])

  const handleInstallPWA = async () => {
    soundManager.playClick()
    const res = await promptPWAInstall()
    if (res?.outcome === 'accepted') {
      showNotification(t('menu.pwaInstalledTitle'), 'success')
    }
  }

  const handleRefreshCache = () => {
    soundManager.playClick()
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
    }
    showNotification(t('menu.pwaOfflineReady'), 'info')
  }

  if (!isOpen) return null

  const handleWalletToggle = () => {
    soundManager.playClick()
    if (!walletConnected) {
      setWalletConnected(true)
      showNotification(t('menu.walletLinkedNotice', { address: walletAddress }), 'success')
    } else {
      setWalletConnected(false)
      showNotification(t('menu.walletDisconnectedNotice'), 'info')
    }
  }

  const handleSaveGame = async () => {
    soundManager.playCollect()
    setIsSaving(true)
    if (onManualSave) {
      await onManualSave()
    } else {
      showNotification(t('notifications.empireSaved'), 'success')
    }
    setTimeout(() => setIsSaving(false), 600)
  }

  const handleReset = () => {
    soundManager.playClick()
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    onResetGame()
    setConfirmReset(false)
    onClose()
  }

  const toggleFullscreen = () => {
    soundManager.playClick()
    toggleGameFullscreen()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="game-modal menu-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with candy gear and close icon */}
        <div className="modal-header candy-header">
          <div className="modal-title-wrap">
            <img 
              src="/assets/hud_icons/btn_settings.webp" 
              alt={t('menu.modalTitle')} 
              className="modal-candy-header-icon" 
              draggable="false" 
            />
            <div>
              <h3>{t('menu.modalTitle')}</h3>
              <p className="modal-subtitle">{t('menu.modalSubtitle')}</p>
            </div>
          </div>
          <button 
            className="modal-close-candy-btn" 
            onClick={() => { soundManager.playClick(); onClose() }}
            aria-label={t('common.close')}
          >
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        </div>

        {/* Candy Navigation Tabs */}
        <div className="candy-category-tabs">
          <button 
            className={`candy-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { soundManager.playClick(); setActiveTab('settings') }}
          >
            <Sliders size={16} /> {t('menu.tabSettings')}
          </button>
          <button 
            className={`candy-tab-btn ${activeTab === 'web3' ? 'active' : ''}`}
            onClick={() => { soundManager.playClick(); setActiveTab('web3') }}
          >
            <Wallet size={16} /> {t('menu.tabWeb3')}
          </button>
          <button 
            className={`candy-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => { soundManager.playClick(); setActiveTab('info') }}
          >
            <Info size={16} /> {t('menu.tabInfo')}
          </button>
        </div>

        {/* Tab 1: Settings */}
        {activeTab === 'settings' && (
          <div className="modal-scroll-content">
            {/* Language Selection Section */}
            <div className="menu-group-card">
              <h4 className="group-title">
                <Globe size={18} className="text-amber-400" />
                {t('menu.tabLanguage')}
              </h4>
              <p className="text-xs text-slate-400 mb-3" style={{ lineHeight: '1.4' }}>
                {t('menu.selectLanguage')}
              </p>
              <div className="menu-language-grid">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className={`menu-lang-card ${currentLang === lang.code ? 'is-active' : ''}`}
                    onClick={() => {
                      soundManager.playClick()
                      changeLanguage(lang.code)
                    }}
                  >
                    <div className="menu-lang-info">
                      <span className="menu-lang-flag">{lang.flag}</span>
                      <div className="menu-lang-text">
                        <span className="menu-lang-name">{lang.name}</span>
                        <span className="menu-lang-region">{lang.region}</span>
                      </div>
                    </div>
                    {currentLang === lang.code && (
                      <CheckCircle2 size={16} className="text-amber-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Settings Group */}
            <div className="menu-group-card">
              <h4 className="group-title">
                <Volume2 size={18} className="text-amber-400" />
                {t('menu.soundLabel')}
              </h4>
              
              <div className="menu-setting-row">
                <div className="setting-label">
                  <span className="setting-name">{t('menu.musicLabel')}</span>
                  <span className="setting-desc">{t('menu.musicDesc')}</span>
                </div>
                <button 
                  className={`candy-switch-btn ${soundEnabled ? 'active' : ''}`}
                  onClick={() => {
                    onToggleSound()
                    soundManager.playClick()
                  }}
                >
                  <span className="switch-knob" />
                  <span className="switch-text">{soundEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {soundEnabled && (
                <>
                  <div className="menu-slider-row">
                    <span className="slider-label">{t('menu.bgmVolume', { volume: bgmVolume })}</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={bgmVolume} 
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setBgmVolume(val)
                        soundManager.setBGMVolume(val / 100)
                      }}
                      className="candy-slider"
                    />
                  </div>

                  <div className="menu-slider-row">
                    <span className="slider-label">{t('menu.sfxVolume', { volume: sfxVolume })}</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sfxVolume} 
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setSfxVolume(val)
                        soundManager.setSFXVolume(val / 100)
                      }}
                      className="candy-slider"
                    />
                  </div>

                  <div className="menu-slider-row">
                    <span className="slider-label">{t('menu.ambientVolume', { volume: ambientVolume }) || `Efectos del Mapa (${ambientVolume}%)`}</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={ambientVolume} 
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setAmbientVolume(val)
                        soundManager.setAmbientVolume(val / 100)
                      }}
                      className="candy-slider"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Performance & Display Group */}
            <div className="menu-group-card">
              <h4 className="group-title">
                <Smartphone size={18} className="text-blue-400" />
                {t('menu.displaySectionTitle')}
              </h4>

              {/* Graphics Profile Selector */}
              <div className="menu-setting-row" style={{ alignItems: 'flex-start' }}>
                <div className="setting-label">
                  <span className="setting-name">{t('menu.graphicsPresetTitle')}</span>
                  <span className="setting-desc">{t('menu.graphicsPresetDesc')}</span>
                </div>
                <div className="segmented-control" style={{ flexWrap: 'wrap' }}>
                  <button 
                    className={`seg-btn ${graphicsPreset === 'performance' ? 'active' : ''}`}
                    onClick={() => { 
                      soundManager.playClick()
                      onSetGraphicsPreset?.('performance')
                      showNotification?.(t('menu.presetPerformanceToast'), 'info')
                    }}
                  >
                    {t('menu.presetPerformance')}
                    {recommendedPreset === 'performance' && (
                      <span className="preset-badge-recommended">{t('menu.recommendedBadge')}</span>
                    )}
                  </button>
                  <button 
                    className={`seg-btn ${graphicsPreset === 'quality' ? 'active' : ''}`}
                    onClick={() => { 
                      soundManager.playClick()
                      onSetGraphicsPreset?.('quality')
                      showNotification?.(t('menu.presetQualityToast'), 'info')
                    }}
                  >
                    {t('menu.presetQuality')}
                    {recommendedPreset === 'quality' && (
                      <span className="preset-badge-recommended">{t('menu.recommendedBadge')}</span>
                    )}
                  </button>
                  <button 
                    className={`seg-btn ${graphicsPreset === 'custom' ? 'active' : ''}`}
                    onClick={() => { 
                      soundManager.playClick()
                      onSetGraphicsPreset?.('custom')
                      showNotification?.(t('menu.presetCustomToast'), 'info')
                    }}
                  >
                    {t('menu.presetCustom')}
                  </button>
                </div>
              </div>

              {/* Custom Granular Settings Panel */}
              {graphicsPreset === 'custom' && (
                <div className="menu-custom-panel">
                  {/* Character Shadows Toggle */}
                  <div className="menu-setting-row">
                    <div className="setting-label">
                      <span className="setting-name">{t('menu.characterShadowsTitle')}</span>
                      <span className="setting-desc">{t('menu.characterShadowsDesc')}</span>
                    </div>
                    <button 
                      className={`candy-switch-btn ${characterShadows ? 'active' : ''}`}
                      onClick={() => {
                        soundManager.playClick()
                        onToggleCharacterShadows?.(!characterShadows)
                      }}
                    >
                      <span className="switch-knob" />
                      <span className="switch-text">{characterShadows ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {/* HUD Visual Effects Toggle */}
                  <div className="menu-setting-row">
                    <div className="setting-label">
                      <span className="setting-name">{t('menu.hudEffectsTitle')}</span>
                      <span className="setting-desc">{t('menu.hudEffectsDesc')}</span>
                    </div>
                    <button 
                      className={`candy-switch-btn ${hudEffects ? 'active' : ''}`}
                      onClick={() => {
                        soundManager.playClick()
                        onToggleHudEffects?.(!hudEffects)
                      }}
                    >
                      <span className="switch-knob" />
                      <span className="switch-text">{hudEffects ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {/* Particles Toggle */}
                  <div className="menu-setting-row">
                    <div className="setting-label">
                      <span className="setting-name">{t('menu.particlesTitle')}</span>
                      <span className="setting-desc">{t('menu.particlesDesc')}</span>
                    </div>
                    <button 
                      className={`candy-switch-btn ${particlesEnabled ? 'active' : ''}`}
                      onClick={() => {
                        soundManager.playClick()
                        const nextVal = !particlesEnabled
                        onToggleParticles?.(nextVal)
                        showNotification?.(nextVal ? t('menu.particlesOnToast') : t('menu.particlesOffToast'), 'info')
                      }}
                    >
                      <span className="switch-knob" />
                      <span className="switch-text">{particlesEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {/* FPS Mode Selector */}
                  <div className="menu-setting-row">
                    <div className="setting-label">
                      <span className="setting-name">{t('menu.fpsTitle')}</span>
                      <span className="setting-desc">{t('menu.fpsDesc')}</span>
                    </div>
                    <div className="segmented-control">
                      <button 
                        className={`seg-btn ${fpsMode === '60fps' ? 'active' : ''}`}
                        onClick={() => { 
                          soundManager.playClick()
                          onSetFpsMode?.('60fps')
                          showNotification?.(t('menu.fps60Toast'), 'info')
                        }}
                      >
                        60 FPS
                      </button>
                      <button 
                        className={`seg-btn ${fpsMode === 'eco' ? 'active' : ''}`}
                        onClick={() => { 
                          soundManager.playClick()
                          onSetFpsMode?.('eco')
                          showNotification?.(t('menu.fpsEcoToast'), 'info')
                        }}
                      >
                        {t('menu.fpsEco')}
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {isMobileOrTouch() && (
                <div className="menu-setting-row">
                  <div className="setting-label">
                    <span className="setting-name">{t('menu.fullscreenTitle')}</span>
                    <span className="setting-desc">{t('menu.fullscreenDesc')}</span>
                  </div>
                  <button 
                    className="candy-action-btn secondary"
                    onClick={toggleFullscreen}
                  >
                    <Maximize2 size={16} /> {t('menu.toggle')}
                  </button>
                </div>
              )}
            </div>

            {/* PWA & Offline Experience Group */}
            <div className="menu-group-card">
              <h4 className="group-title">
                <Download size={18} className="text-emerald-400" />
                {t('menu.pwaSectionTitle')}
              </h4>

              <div className="menu-setting-row">
                <div className="setting-label">
                  <span className="setting-name">
                    {pwaState.isInstalled ? t('menu.pwaInstalledTitle') : t('menu.pwaInstallBtn')}
                  </span>
                  <span className="setting-desc">
                    {pwaState.isInstalled ? t('menu.pwaInstalledDesc') : t('menu.pwaInstallDesc')}
                  </span>
                </div>
                {pwaState.isInstalled ? (
                  <div className="pwa-status-badge installed">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>{t('menu.connected')}</span>
                  </div>
                ) : (
                  <button 
                    className={`candy-action-btn ${pwaState.canInstall ? 'primary' : 'secondary'}`}
                    onClick={handleInstallPWA}
                    disabled={!pwaState.canInstall}
                    title={pwaState.canInstall ? t('menu.pwaInstallBtn') : 'Disponible en Chrome / Edge / Safari'}
                  >
                    <Download size={16} /> {t('menu.pwaInstallBtn')}
                  </button>
                )}
              </div>

              <div className="menu-setting-row">
                <div className="setting-label">
                  <span className="setting-name">{t('menu.pwaOfflineReady')}</span>
                  <span className="setting-desc">{t('menu.pwaOfflineReadyDesc')}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div className="pwa-status-badge offline-active">
                    <ShieldCheck size={16} className="text-blue-400" />
                    <span>Activo</span>
                  </div>
                  <button
                    className="candy-action-btn secondary"
                    onClick={handleRefreshCache}
                    title={t('menu.pwaUpdateBtn')}
                    style={{ padding: '6px 10px' }}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sovereign Identity Group */}
            <div className="menu-group-card">
              <h4 className="group-title">
                <Crown size={18} className="text-amber-400" />
                {t('menu.identitySectionTitle')}
              </h4>
              <div className="menu-setting-row">
                <div className="setting-label">
                  <span className="setting-name">{(!playerName || playerName === 'Lord King' || playerName === 'Lord Soberano' || playerName === 'LORD SOBERANO' || playerName === 'Sovereign Lord' || playerName === 'Lorde Soberano') ? 'Comandante' : playerName}</span>
                  <span className="setting-desc">{t('menu.identityDesc')}</span>
                </div>
                <button 
                  className="candy-action-btn secondary"
                  onClick={() => {
                    soundManager.playClick()
                    onClose()
                    onOpenChangeName?.()
                  }}
                  title={t('menu.changeNameTitle')}
                >
                  <Crown size={15} /> {t('menu.changeName')}
                </button>
              </div>
            </div>

            {/* Tutorial & Onboarding Group */}
            <div className="menu-group-card">
              <h4 className="group-title">
                <BookOpen size={18} className="text-amber-400" />
                {t('menu.tutorialSectionTitle')}
              </h4>
              <div className="menu-setting-row">
                <div className="setting-label">
                  <span className="setting-name">{t('menu.tutorialTitle')}</span>
                  <span className="setting-desc">{t('menu.tutorialDesc')}</span>
                </div>
                <button 
                  className="candy-action-btn secondary"
                  onClick={() => {
                    soundManager.playClick()
                    onClose()
                    onRestartTutorial?.()
                  }}
                  title={t('menu.restartTutorial')}
                >
                  <BookOpen size={15} /> {t('menu.startTutorial')}
                </button>
              </div>
            </div>

            {/* Kingdom Management Group */}
            <div className="menu-group-card">
              <h4 className="group-title">
                <Save size={18} className="text-emerald-400" />
                {t('menu.storageSectionTitle')}
              </h4>
              <p className="text-xs text-slate-400 mb-3" style={{ lineHeight: '1.4' }}>
                {t('menu.storageDesc')}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.10)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <span style={{ fontSize: '0.78rem', color: '#a7f3d0', fontWeight: 600 }}>{t('menu.syncLabel')}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>{t('menu.connected')}</span>
              </div>

              <div className="menu-action-buttons-grid">
                <button className="candy-action-btn primary" onClick={handleSaveGame} disabled={isSaving}>
                  <Save size={16} /> {isSaving ? t('common.loading') : t('menu.manualSave')}
                </button>
                <button 
                  className={`candy-action-btn danger ${confirmReset ? 'confirming' : ''}`} 
                  onClick={handleReset}
                  title={t('menu.resetKingdomTooltip') || t('menu.restartTutorial')}
                >
                  <RotateCcw size={16} /> 
                  {confirmReset ? t('common.confirm') : (t('menu.resetKingdom') || t('menu.restartTutorial'))}
                </button>
                {onLogout && (
                  <button 
                    className="candy-action-btn secondary" 
                    onClick={() => {
                      soundManager.playClick()
                      onLogout()
                      onClose()
                    }}
                    title={t('profile.logoutBtn')}
                  >
                    <LogOut size={16} /> {t('profile.logoutBtn')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Web3 & Wallet */}
        {activeTab === 'web3' && (
          <div className="modal-scroll-content">
            <div className="web3-feature-hero">
              <div className="web3-logo-badge">
                <ShieldCheck size={36} className="text-amber-400" />
              </div>
              <div className="web3-hero-text">
                <h4>{t('menu.web3HeroTitle')}</h4>
                <p>{t('menu.web3HeroDesc')}</p>
              </div>
            </div>

            <div className="menu-group-card">
              <div className="web3-wallet-status-box">
                <div className="wallet-meta">
                  <span className="wallet-status-tag">
                    <span className={`status-dot ${walletConnected ? 'online' : 'offline'}`} />
                    {walletConnected ? t('menu.walletConnected') : t('menu.guestMode')}
                  </span>
                  <span className="wallet-address">
                    {walletConnected ? walletAddress : t('menu.noWalletLinked')}
                  </span>
                </div>
                <button 
                  className={`candy-action-btn ${walletConnected ? 'secondary' : 'primary'}`}
                  onClick={handleWalletToggle}
                >
                  <Wallet size={16} />
                  {walletConnected ? t('menu.disconnectWallet') : t('menu.connectWallet')}
                </button>
              </div>

              <div className="web3-stats-row">
                <div className="web3-stat-item">
                  <span className="stat-title">{t('menu.activeNetwork')}</span>
                  <span className="stat-value">Aetheria Cloud L2</span>
                </div>
                <div className="web3-stat-item">
                  <span className="stat-title">{t('menu.tokenChaos')}</span>
                  <span className="stat-value text-amber-400">1,450.00</span>
                </div>
                <div className="web3-stat-item">
                  <span className="stat-title">{t('menu.gasFee')}</span>
                  <span className="stat-value text-emerald-400">{t('menu.gasless')}</span>
                </div>
              </div>
            </div>

            <div className="menu-group-card">
              <h4 className="group-title">{t('menu.onChainSync')}</h4>
              <p className="setting-desc" style={{ marginBottom: '12px' }}>
                {t('menu.onChainDesc')}
              </p>
              <button 
                className="candy-action-btn secondary"
                disabled={!walletConnected}
                onClick={() => {
                  soundManager.playCollect()
                  showNotification(t('menu.syncingStateNotice'), 'info')
                }}
              >
                <CheckCircle2 size={16} /> {t('menu.syncRealmState')}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Info */}
        {activeTab === 'info' && (
          <div className="modal-scroll-content">
            <div className="menu-group-card text-center">
              <div className="info-logo-wrap">
                <img 
                  src="/assets/logo/logo.webp" 
                  alt="Reino de las Nubes" 
                  className="info-game-logo" 
                  draggable="false" 
                />
              </div>
              <p className="game-info-version">{t('menu.gameVersion')}</p>
              
              <div className="game-credits-box">
                <p className="game-tagline-text">{t('menu.gameTagline')}</p>
                
                <div className="owner-credits-card">
                  <span className="owner-label">Creador y Propietario</span>
                  <a 
                    href="https://wizzardev.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="owner-link-btn"
                    title="Visitar WizzarDev Studios"
                    onClick={() => soundManager?.playClick?.()}
                  >
                    <Globe size={18} className="owner-globe-icon" />
                    <div className="owner-info">
                      <span className="owner-name">WizzarDev Studios</span>
                      <span className="owner-url">wizzardev.com</span>
                    </div>
                    <ExternalLink size={16} className="owner-external-icon" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
