import React, { useState, useEffect } from 'react'
import './ProfileModal.css'
import { 
  Edit3, 
  Check, 
  Crown, 
  Swords, 
  Castle, 
  Coins, 
  Users, 
  Trophy, 
  Star, 
  Sparkles,
  User,
  Award,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { RoyalConfirmModal } from './RoyalConfirmModal'

export function ProfileModal({ 
  isOpen, 
  onClose, 
  resources, 
  slots, 
  troops, 
  kingdomLevel = 1,
  kingdomXp = 0,
  xpProgress = { current: 0, max: 400, percent: 0, nextTitle: 'Feudo Fortificado' },
  showNotification,
  playerName: propPlayerName,
  playerAvatar: propPlayerAvatar,
  playerEmail: propPlayerEmail,
  onOpenChangeName,
  onSaveName,
  onLinkEmail,
  onLogout,
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'achievements'
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [playerName, setPlayerName] = useState(() => {
    const stored = propPlayerName || localStorage.getItem('toc_player_name') || ''
    if (!stored || stored === 'Lord King' || stored === 'Lord Soberano' || stored === 'LORD SOBERANO' || stored === 'Sovereign Lord' || stored === 'Lorde Soberano') {
      return 'Comandante'
    }
    return stored
  })
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(playerName)

  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return propPlayerAvatar || localStorage.getItem('toc_player_avatar') || '/assets/avatars/avatar_king.webp'
  })

  // Email linking states
  const [currentEmail, setCurrentEmail] = useState(() => propPlayerEmail || '')
  const [linkEmail, setLinkEmail] = useState('')
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')
  const [isLinking, setIsLinking] = useState(false)

  useEffect(() => {
    if (propPlayerEmail !== undefined) {
      setCurrentEmail(propPlayerEmail || '')
    }
  }, [propPlayerEmail])

  useEffect(() => {
    if (propPlayerName) {
      setPlayerName(propPlayerName)
      setTempName(propPlayerName)
    }
  }, [propPlayerName])

  useEffect(() => {
    if (propPlayerAvatar) {
      setSelectedAvatar(propPlayerAvatar)
    }
  }, [propPlayerAvatar])

  if (!isOpen) return null

  const availableAvatars = [
    { id: 'king', name: 'Arcángel Soberano', img: '/assets/avatars/avatar_king.webp', title: 'Monarca Celestial' },
    { id: 'valkyrie', name: 'Valquiria Celestial', img: '/assets/avatars/avatar_valkyrie.webp', title: 'Seraphim de Batalla' },
    { id: 'paladin', name: 'Paladín Divino', img: '/assets/avatars/avatar_paladin.webp', title: 'Custodio de la Luz' },
    { id: 'mage', name: 'Archimago Astral', img: '/assets/avatars/avatar_mage.webp', title: 'Maestro de las Estrellas' },
  ]

  const handleSelectAvatar = (av) => {
    soundManager.playClick()
    setSelectedAvatar(av.img)
    localStorage.setItem('toc_player_avatar', av.img)
    onSaveName?.(playerName, av.img)
    showNotification(`Avatar actualizado: ${av.name}`, 'info')
  }

  const handleSaveName = () => {
    if (!tempName.trim()) return
    soundManager.playCollect()
    setPlayerName(tempName.trim())
    localStorage.setItem('toc_player_name', tempName.trim())
    onSaveName?.(tempName.trim(), selectedAvatar)
    setIsEditingName(false)
    showNotification(`Nombre de comandante guardado: ${tempName.trim()}`, 'success')
  }

  const handleLinkEmailSubmit = async (e) => {
    if (e) e.preventDefault()
    setLinkError('')
    setLinkSuccess('')
    const clean = (linkEmail || '').trim().toLowerCase()
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setLinkError('Por favor ingresa un correo electrónico válido.')
      return
    }

    setIsLinking(true)
    soundManager.playClick?.()
    try {
      if (onLinkEmail) {
        const result = await onLinkEmail(clean)
        if (result && result.success) {
          setCurrentEmail(clean)
          setLinkEmail('')
          setLinkSuccess(`¡Reino vinculado exitosamente a ${clean}! Tu progreso está resguardado en la nube.`)
          soundManager.playQuestSuccess?.()
        } else {
          setLinkError(result?.error || 'No se pudo vincular la cuenta. Intenta nuevamente.')
        }
      }
    } catch (err) {
      setLinkError(err.message || 'Error al vincular el correo.')
    } finally {
      setIsLinking(false)
    }
  }

  // Calculate realm statistics
  const builtBuildingsCount = slots.filter((s) => s.buildingId).length
  const totalTroopsCount = (troops.infantry || 0) + (troops.archers || 0) + (troops.mages || 0) + (troops.commander || 0)
  const militaryPower = (troops.infantry || 0) * 34 + (troops.archers || 0) * 62 + (troops.mages || 0) * 96 + (troops.commander || 0) * 145 + builtBuildingsCount * 50

  const achievements = [
    {
      id: 'ach-1',
      title: 'Primer Asentamiento',
      desc: 'Consolida y gestiona las estructuras sagradas de la meseta celestial',
      progress: Math.min(builtBuildingsCount, 3),
      max: 3,
      completed: builtBuildingsCount >= 3,
      stars: 3,
      reward: `150 ${t('resources.gold') || 'Oro'}`
    },
    {
      id: 'ach-2',
      title: 'Señor de la Guerra',
      desc: 'Recluta un ejército de más de 8 unidades de combate',
      progress: Math.min(totalTroopsCount, 8),
      max: 8,
      completed: totalTroopsCount >= 8,
      stars: 2,
      reward: `5 ${t('resources.gems') || 'Cristales'}`
    },
    {
      id: 'ach-3',
      title: 'Tesoro Imperial',
      desc: 'Alcanza una reserva de más de 1,000 monedas de oro',
      progress: Math.min(Math.floor(resources.gold), 1000),
      max: 1000,
      completed: resources.gold >= 1000,
      stars: 3,
      reward: `300 ${t('resources.gold') || 'Oro'}`
    },
    {
      id: 'ach-4',
      title: 'Maestro de la Magia',
      desc: 'Recluta al menos 2 Canalizadores Arcanos en tu guarnición',
      progress: Math.min(troops.mages || 0, 2),
      max: 2,
      completed: (troops.mages || 0) >= 2,
      stars: 1,
      reward: `10 ${t('resources.gems') || 'Cristales'}`
    },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="game-modal profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with candy crown and close icon */}
        <div className="modal-header candy-header">
          <div className="modal-title-wrap">
            <img 
              src="/assets/hud_icons/btn_ranking.webp" 
              alt={t('profile.title') || 'Perfil'} 
              className="modal-candy-header-icon" 
              draggable="false" 
            />
            <div>
              <h3>{t('profile.title') || 'Perfil del Comandante'}</h3>
              <p className="modal-subtitle">{t('profile.subtitle') || 'Identidad militar, estadísticas bélicas y títulos de conquista'}</p>
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
            className={`candy-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { soundManager.playClick(); setActiveTab('overview') }}
          >
            <Crown size={16} /> {t('profile.tabOverview') || 'Resumen General'}
          </button>
          <button 
            className={`candy-tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => { soundManager.playClick(); setActiveTab('achievements') }}
          >
            <Trophy size={16} /> {t('profile.tabAchievements') || 'Logros del Reino'}
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="modal-scroll-content">
            {/* Player Hero Card */}
            <div className="profile-hero-card">
              <div className="profile-avatar-wrapper">
                <div className="avatar-ring-glow">
                  <img 
                    src={selectedAvatar} 
                    alt="Avatar Jugador" 
                    className="profile-big-avatar" 
                    draggable="false" 
                  />
                </div>
                <span className="profile-level-badge">{t('common.levelShort')} {kingdomLevel}</span>
              </div>

              <div className="profile-identity-details">
                <div className="name-edit-row">
                  {isEditingName ? (
                    <div className="name-input-group">
                      <input 
                        type="text" 
                        value={tempName} 
                        onChange={(e) => setTempName(e.target.value)}
                        maxLength={20}
                        autoFocus
                        className="candy-name-input"
                      />
                      <button className="btn-save-name" onClick={handleSaveName}>
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="name-display" onClick={() => { 
                      soundManager.playClick()
                      if (onOpenChangeName) {
                        onClose()
                        onOpenChangeName()
                      } else {
                        setIsEditingName(true)
                      }
                    }}>
                      <h3 className="player-display-name">{playerName}</h3>
                      <button className="btn-edit-pencil" title={t('profile.changeNameTitle') || 'Cambiar Nombre del Comandante'}>
                        <Edit3 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="player-realm-title">{t('profile.realmTitle') || 'Gran Comandante del Reino de las Nubes'}</p>

                {/* Level XP Bar */}
                <div className="profile-xp-box">
                  <div className="xp-label-row">
                    <span>{t('profile.progressToLevel', { level: kingdomLevel + 1, title: t(`kingdomLevels.${kingdomLevel + 1}.title`) || xpProgress?.nextTitle || 'Feudo Fortificado' }) || `Progreso al Nivel ${kingdomLevel + 1} (${t(`kingdomLevels.${kingdomLevel + 1}.title`) || xpProgress?.nextTitle || 'Feudo Fortificado'})`}</span>
                    <span className="xp-fraction">{xpProgress?.current || 0} / {xpProgress?.max || 400} XP</span>
                  </div>
                  <div className="candy-progress-track">
                    <div className="candy-progress-fill" style={{ width: `${xpProgress?.percent || 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Selector Strip */}
            <div className="avatar-selector-section">
              <h5 className="section-mini-title">{t('profile.chooseHeroEmblem') || 'Elige tu Emblema de Héroe:'}</h5>
              <div className="avatar-picker-grid">
                {availableAvatars.map((av) => {
                  const avName = t(`avatars.${av.id}.name`) || av.name
                  return (
                    <button 
                      key={av.id}
                      className={`avatar-thumb-btn ${selectedAvatar === av.img ? 'selected' : ''}`}
                      onClick={() => handleSelectAvatar(av)}
                      title={avName}
                    >
                      <img src={av.img} alt={avName} className="thumb-avatar-img" draggable="false" />
                      <span className="thumb-name">{avName}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Kingdom Stats Cards Grid */}
            <div className="profile-stats-grid">
              <div className="candy-stat-card">
                <div className="stat-card-icon military">
                  <Swords size={20} />
                </div>
                <div className="stat-card-content">
                  <span className="stat-card-num">{militaryPower}</span>
                  <span className="stat-card-lbl">{t('profile.statMilitaryPower') || 'Poder Militar'}</span>
                </div>
              </div>

              <div className="candy-stat-card">
                <div className="stat-card-icon castle">
                  <Castle size={20} />
                </div>
                <div className="stat-card-content">
                  <span className="stat-card-num">{builtBuildingsCount} / {slots.length}</span>
                  <span className="stat-card-lbl">{t('profile.statStructures') || 'Estructuras'}</span>
                </div>
              </div>

              <div className="candy-stat-card">
                <div className="stat-card-icon pop">
                  <Users size={20} />
                </div>
                <div className="stat-card-content">
                  <span className="stat-card-num">{resources.populationUsed} / {resources.populationMax}</span>
                  <span className="stat-card-lbl">{t('profile.statActivePop') || 'Población Activa'}</span>
                </div>
              </div>

              <div className="candy-stat-card">
                <div className="stat-card-icon gold">
                  <Coins size={20} />
                </div>
                <div className="stat-card-content">
                  <span className="stat-card-num">{Math.floor(resources.gold)}</span>
                  <span className="stat-card-lbl">{t('profile.statRoyalTreasury') || 'Tesoro Real'}</span>
                </div>
              </div>
            </div>

            {/* Web3 Sovereign Identity Card */}
            <div className="web3-identity-badge-card">
              <div className="nft-badge-preview">
                <Crown size={28} className="text-amber-400" />
              </div>
              <div className="nft-badge-info">
                <div className="nft-badge-header">
                  <span className="nft-rank-tag">{t('profile.nftBadge') || 'NFT DE PRESTIGIO'}</span>
                  <span className="nft-mint-num">#042 / 1000</span>
                </div>
                <h4 className="nft-name">{t('profile.nftName') || 'Pase de Comandante Fundador OG'}</h4>
                <p className="nft-perk">{t('profile.nftPerk') || '+10% Velocidad de Producción de Oro & Acceso a Torneos Web3'}</p>
              </div>
            </div>

            {/* Cloud Account & Guest Safeguard Section */}
            {!currentEmail ? (
              <div className="profile-cloud-link-banner">
                <div className="cloud-link-header-row">
                  <div className="cloud-link-shield-icon">
                    <Shield className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="cloud-link-title-col">
                    <div className="cloud-link-pill">
                      <Sparkles size={11} className="text-amber-300" />
                      <span>MODO QUEST • PROGRESO LOCAL</span>
                    </div>
                    <h4 className="cloud-link-title">Resguardar Reino en la Nube</h4>
                  </div>
                </div>

                <p className="cloud-link-description">
                  Actualmente juegas como <strong>Invitado</strong>. Tu progreso ({builtBuildingsCount} estructuras, {totalTroopsCount} tropas, Nivel {kingdomLevel}) solo existe en este dispositivo. Vincula tu correo electrónico para protegerlo contra pérdidas y sincronizarlo con Supabase.
                </p>

                <form onSubmit={handleLinkEmailSubmit} className="cloud-link-form">
                  <div className="cloud-link-input-group">
                    <div className="cloud-link-input-wrap">
                      <Mail size={16} className="cloud-link-mail-icon" />
                      <input
                        type="email"
                        value={linkEmail}
                        onChange={(e) => {
                          setLinkEmail(e.target.value)
                          setLinkError('')
                          setLinkSuccess('')
                        }}
                        placeholder="tu-correo@ejemplo.com"
                        className="cloud-link-email-input"
                        disabled={isLinking}
                      />
                    </div>
                    <button
                      type="submit"
                      className="cloud-link-btn"
                      disabled={isLinking}
                    >
                      {isLinking ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-white" />
                          <span>Vinculando...</span>
                        </>
                      ) : (
                        <>
                          <Shield size={16} className="text-amber-300" />
                          <span>Vincular y Guardar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {linkError && (
                    <div className="cloud-link-status-msg is-error">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{linkError}</span>
                    </div>
                  )}

                  {linkSuccess && (
                    <div className="cloud-link-status-msg is-success">
                      <CheckCircle2 size={14} className="flex-shrink-0" />
                      <span>{linkSuccess}</span>
                    </div>
                  )}
                </form>
              </div>
            ) : (
              <div className="profile-cloud-verified-banner">
                <div className="cloud-verified-icon">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                </div>
                <div className="cloud-verified-info">
                  <div className="cloud-verified-pill">
                    <span>REINO RESGUARDADO EN LA NUBE</span>
                  </div>
                  <span className="cloud-verified-email">{currentEmail}</span>
                  <p className="cloud-verified-sub">
                    Tu reino, héroes y estadísticas se respaldan automáticamente en la nube de Supabase.
                  </p>
                </div>
              </div>
            )}

            {/* Account Management Section */}
            <div className="profile-account-section" style={{ marginTop: '24px', textAlign: 'center' }}>
              <button 
                className="candy-btn-danger" 
                style={{ 
                  background: 'linear-gradient(to bottom, #ef4444, #dc2626)', 
                  border: '1px solid #7f1d1d',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 0 #991b1b',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
                onClick={() => {
                  soundManager.playClick?.()
                  setShowLogoutConfirm(true)
                }}
              >
                {t('profile.logoutBtn')}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Achievements */}
        {activeTab === 'achievements' && (
          <div className="modal-scroll-content">
            <div className="achievements-list">
              {achievements.map((ach) => {
                const percent = Math.min(100, Math.round((ach.progress / ach.max) * 100))
                const achTitle = t(`profile.achievements.${ach.id}.title`) || ach.title
                const achDesc = t(`profile.achievements.${ach.id}.desc`) || ach.desc

                return (
                  <div key={ach.id} className={`achievement-card ${ach.completed ? 'completed' : ''}`}>
                    <div className="achievement-badge-col">
                      <div className={`ach-trophy-box ${ach.completed ? 'unlocked' : 'locked'}`}>
                        <Trophy size={24} />
                      </div>
                      <div className="ach-stars-row">
                        {[...Array(ach.stars)].map((_, i) => (
                          <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <div className="achievement-info-col">
                      <div className="ach-header">
                        <h4>{achTitle}</h4>
                        <span className="ach-reward-tag">{ach.reward}</span>
                      </div>
                      <p>{achDesc}</p>
                      
                      <div className="ach-progress-wrap">
                        <div className="ach-progress-track">
                          <div className="ach-progress-fill" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="ach-progress-text">{ach.progress} / {ach.max}</span>
                      </div>
                    </div>

                    <div className="achievement-action-col">
                      {ach.completed ? (
                        <span className="ach-completed-tag">
                          <Award size={15} /> {t('profile.completedBadge') || '¡Completado!'}
                        </span>
                      ) : (
                        <span className="ach-pending-tag">{t('profile.inProgressBadge') || 'En camino...'}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Custom Royal Confirmation Modal for Logging Out */}
      <RoyalConfirmModal
        isOpen={showLogoutConfirm}
        title={t('profile.logoutBtn') || 'Cerrar Sesión'}
        message={t('profile.logoutConfirm') || '¿Estás seguro de cerrar sesión y desvincular este dispositivo?'}
        confirmText={t('common.confirm') || 'Aceptar'}
        cancelText={t('common.cancel') || 'Cancelar'}
        danger={true}
        onConfirm={() => {
          soundManager.playClick?.()
          setShowLogoutConfirm(false)
          onClose?.()
          if (onLogout) {
            onLogout()
          } else {
            window.location.reload()
          }
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  )
}
