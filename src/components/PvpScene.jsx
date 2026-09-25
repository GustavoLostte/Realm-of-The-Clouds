import React, { useState, useEffect } from 'react'
import './PvpScene.css'
import { 
  ArrowLeft, 
  Swords, 
  Trophy, 
  Flame, 
  Sparkles, 
  Zap, 
  RefreshCw,
  Users,
  ChevronRight,
  Gem,
  Lock,
  Percent,
  CheckCircle2,
  XCircle,
  Award
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { getLeagueForTrophies, generateRivalsForPlayer } from '../data/arenaData'
import { getChampionById } from '../data/championsData'
import { PvpVsModal } from './PvpVsModal'
import { ChampionSelectScene } from './ChampionSelectScene'
import { BattleDuelScene } from './BattleDuelScene'

export function PvpScene({
  onBack,
  initialMode = 'pvp',
  resources = {},
  arenaData = {},
  playerName = 'Comandante',
  playerAvatar = '/assets/avatars/avatar_king.webp',
  kingdomLevel = 1,
  troops = {},
  onStartBattle,
  onRefreshRivals,
  showNotification,
}) {
  const { t } = useTranslation()
  const trophies = arenaData?.trophies ?? 250
  const tickets = arenaData?.tickets ?? 3
  const currentLeague = getLeagueForTrophies(trophies)
  
  const [isTraining, setIsTraining] = useState(() => initialMode === 'training')

  // View mode: 'rooms' (rooms list) | 'champion-select' (Mortal Kombat style selection) | 'battle-duel' (map duel)
  const [currentView, setCurrentView] = useState(() => {
    if (initialMode === 'training') return 'battle-duel'
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('view') === 'battle') return 'battle-duel'
      if (params.get('view') === 'select') return 'champion-select'
    } catch {}
    return 'rooms'
  })
  const [vsModalOpen, setVsModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('view') === 'battle' || params.get('view') === 'select') {
        return {
          id: 'room_101',
          name: 'Comandante Valerius',
          championId: 'valiria_rival',
          avatar: '/assets/avatars/avatar_king.webp',
          kingdom: 'Bastión del Fénix',
          trophies: 280,
          level: 3,
        }
      }
    } catch {}
    return null
  })
  const [selectedPlayerChamp, setSelectedPlayerChamp] = useState(() => {
    if (initialMode === 'training') return getChampionById('valiria')
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('view') === 'battle') {
        return getChampionById('valiria')
      }
    } catch {}
    return null
  })
  const [selectedRivalChamp, setSelectedRivalChamp] = useState(() => {
    if (initialMode === 'training') return getChampionById('valiria_rival')
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('view') === 'battle') {
        return getChampionById('valiria_rival')
      }
    } catch {}
    return null
  })

  // Battle mode: '1v1' active, 3v3 coming soon
  const [battleMode, setBattleMode] = useState('1v1')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Track player battle records
  const wins = arenaData?.wins ?? 14
  const losses = arenaData?.losses ?? 4
  const totalMatches = wins + losses
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 100

  // Trigger Pre-Battle Music on mount and resume kingdom ambient on unmount
  useEffect(() => {
    soundManager?.playPreBattleMusic?.()
    return () => {
      soundManager?.stopBattleMusic?.(true)
    }
  }, [])

  // Rooms list from arenaData or generated fallback
  const roomsList = (arenaData?.rivals && arenaData.rivals.length > 0)
    ? arenaData.rivals
    : generateRivalsForPlayer(trophies, kingdomLevel)

  const handleBackToKingdom = () => {
    soundManager?.playClick?.()
    onBack?.()
  }

  const handleSelectMode = (mode) => {
    soundManager?.playClick?.()
    if (mode === '3v3') {
      if (showNotification) {
        showNotification('🔒 ¡Próximamente! El modo Escuadrón 3 vs 3 estará disponible en la próxima actualización.', 'info')
      }
      return
    }
    setBattleMode(mode)
  }

  const handleRefreshClick = () => {
    soundManager?.playClick?.()
    setIsRefreshing(true)
    if (onRefreshRivals) {
      onRefreshRivals()
    }
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const handleEnterRoom = (room) => {
    soundManager?.playButtonClick?.()
    setSelectedRoom(room)
    setVsModalOpen(true)
  }

  const handleStartFightFromVs = (room) => {
    setVsModalOpen(false)
    setSelectedRoom(room)
    setCurrentView('champion-select')
  }

  const handleQuickPracticeValiria = () => {
    soundManager?.playButtonClick?.()
    setIsTraining(true)
    setSelectedPlayerChamp(getChampionById('valiria'))
    setSelectedRivalChamp(getChampionById('valiria_rival'))
    setCurrentView('battle-duel')
  }

  const handleConfirmChampion = (playerChamp, rivalChamp) => {
    setSelectedPlayerChamp(playerChamp)
    setSelectedRivalChamp(rivalChamp)
    setCurrentView('battle-duel')
    if (showNotification) {
      showNotification(`¡Entrando a la batalla: ${playerChamp.name} vs ${rivalChamp.name}!`, 'success')
    }
  }

  // If in battle-duel view, render the 2 champions facing each other on the battlefield map
  if (currentView === 'battle-duel') {
    return (
      <BattleDuelScene 
        playerChampion={selectedPlayerChamp || getChampionById('valiria')}
        rivalChampion={selectedRivalChamp || getChampionById('valiria_rival')}
        isTraining={isTraining}
        onExitBattle={() => {
          if (initialMode === 'training') {
            onBack?.()
          } else {
            setIsTraining(false)
            setCurrentView('rooms')
          }
        }}
        onVictory={(rivalChamp) => {
          if (isTraining) return
          if (showNotification) {
            showNotification(`¡Victoria legendaria! ${selectedPlayerChamp?.name || 'Tu campeón'} triunfó sobre ${rivalChamp?.name || 'su rival'}.`, 'success')
          }
          setCurrentView('rooms')
        }}
        onDefeat={(rivalChamp) => {
          if (isTraining) return
          if (showNotification) {
            showNotification(`Has caído en batalla ante ${rivalChamp?.name || 'el rival'}. ¡Entrena y regresa más fuerte!`, 'warning')
          }
          setCurrentView('rooms')
        }}
      />
    )
  }

  // If in champion-select view, render the Mortal Kombat style Champion Select Scene
  if (currentView === 'champion-select' && selectedRoom) {
    return (
      <ChampionSelectScene 
        onBack={() => setCurrentView('rooms')}
        onConfirmChampion={handleConfirmChampion}
        rival={selectedRoom}
        playerName={playerName}
        playerAvatar={playerAvatar}
      />
    )
  }

  return (
    <div className="pvp-scene-container" style={{ backgroundImage: "url('/assets/arena_battle_bg.webp')" }}>
      {/* Background Atmosphere & Vignette */}
      <div className="pvp-scene-vignette" />
      <div className="pvp-scene-ambient-glow" />

      {/* TOP HEADER BAR */}
      <header className="pvp-scene-header">
        {/* Left: Prominent Return to Kingdom Button */}
        <div className="pvp-header-left">
          <button 
            id="pvp-btn-back-kingdom"
            className="pvp-back-btn" 
            onClick={handleBackToKingdom}
            title="Volver a la isla celestial del reino"
          >
            <div className="pvp-back-icon-wrap">
              <ArrowLeft size={20} className="pvp-back-arrow" />
            </div>
            <div className="pvp-back-txt-group">
              <span className="pvp-back-title">Volver al Reino</span>
              <span className="pvp-back-sub">Isla Celestial</span>
            </div>
          </button>
        </div>

        {/* Center: Title & League */}
        <div className="pvp-header-center">
          <div className="pvp-scene-title-badge">
            <div className="pvp-badge-swords">
              <Swords size={20} className="pvp-title-swords-icon" />
            </div>
            <div className="pvp-title-text-wrap">
              <h1 className="pvp-scene-title">VÓRTICE ASTRAL DEL ÉTER</h1>
              <div className="pvp-league-subtitle">
                <span className="pvp-league-dot" />
                <span className="pvp-league-name-highlight">{currentLeague?.name || 'Liga de Batalla'}</span>
                <span className="pvp-league-sep">•</span>
                <span className="pvp-league-status">Salas PvP Activas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Resources & Trophies */}
        <div className="pvp-header-right">
          <div className="pvp-hud-resource-pill">
            <div className="pvp-res-item trophy-res" title="Tus Puntos de Liga / Coronas">
              <Trophy size={16} className="pvp-res-icon gold" />
              <div className="pvp-res-val-group">
                <span className="pvp-res-val">{trophies}</span>
                <span className="pvp-res-label">Puntos Liga</span>
              </div>
            </div>

            <div className="pvp-res-item tickets-res" title="Entradas de combate disponibles">
              <Flame size={16} className="pvp-res-icon red" />
              <div className="pvp-res-val-group">
                <span className="pvp-res-val">{tickets}</span>
                <span className="pvp-res-label">Entradas</span>
              </div>
            </div>

            <div className="pvp-res-item gold-res" title="Oro del Reino">
              <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" className="pvp-res-img" />
              <span className="pvp-res-val">{(resources.gold || 0).toLocaleString()}</span>
            </div>

            <div className="pvp-res-item gems-res" title="Gemas Celestes">
              <Gem size={15} className="pvp-res-icon purple" />
              <span className="pvp-res-val">{(resources.gems || 0).toLocaleString()}</span>
            </div>

            <div className="pvp-res-item shard-res" title="Fragmentos Divinos">
              <Sparkles size={16} className="pvp-res-icon cyan" />
              <span className="pvp-res-val">{(resources.celestialShards || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* COMPACT MODE SELECTOR BAR */}
      <div className="pvp-mode-selector-banner">
        <div className="selector-inner">
          <div className="mode-toggle-group">
            {/* BUTTON MODE 1 VS 1 - ACTIVE */}
            <button 
              className={`mode-toggle-card ${battleMode === '1v1' ? 'active' : ''}`}
              onClick={() => handleSelectMode('1v1')}
            >
              <div className="mode-toggle-icon">
                <Swords size={20} />
              </div>
              <div className="mode-toggle-text">
                <div className="mode-title-row">
                  <span className="mode-name">DUELO 1 VS 1</span>
                  <span className="mode-active-pill"><CheckCircle2 size={11} /> ACTIVO</span>
                </div>
                <span className="mode-desc">Salas de combate por turnos individual</span>
              </div>
            </button>

            {/* BUTTON ARCADE VALIRIA - REAL TIME WASD + KLIO */}
            <button 
              className="mode-toggle-card arcade-luke-card"
              onClick={handleQuickPracticeValiria}
              title="Entrar directo al combate arcade de Valiria (Ángel Valquiria) con controles WASD, Espacio y Combate"
            >
              <div className="mode-toggle-icon angel-mode-icon">
                <Sparkles size={20} />
              </div>
              <div className="mode-toggle-text">
                <div className="mode-title-row">
                  <span className="mode-name arcade-luke-title">ARCADE VALIRIA</span>
                  <span className="mode-active-pill arcade-badge-luke">WASD + ACCIÓN</span>
                </div>
                <span className="mode-desc">Combate en tiempo real con Valiria</span>
              </div>
            </button>

            {/* BUTTON MODE 3 VS 3 - COMING SOON */}
            <button 
              className="mode-toggle-card locked-card"
              onClick={() => handleSelectMode('3v3')}
              title="En desarrollo activo para la próxima actualización"
            >
              <div className="mode-toggle-icon squad-locked">
                <Users size={20} />
              </div>
              <div className="mode-toggle-text">
                <div className="mode-title-row">
                  <span className="mode-name text-muted">ESCUADRÓN 3 VS 3</span>
                  <span className="mode-coming-soon-pill"><Lock size={10} /> PRÓXIMAMENTE</span>
                </div>
                <span className="mode-desc">Guerras de trío de héroes con sinergias</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN SCENE BODY (COMPACT NO-SCROLL LAYOUT) */}
      <main className="pvp-scene-body">
        
        {/* Left Column: Player Profile, League & Combat Record Card */}
        <aside className="pvp-player-league-card">
          <div className="league-profile-card">
            
            {/* 1. Header: Avatar next to Name */}
            <div className="league-profile-header">
              <div className="profile-avatar-wrap">
                <img 
                  src={playerAvatar} 
                  alt={playerName} 
                  className="profile-avatar-img"
                  onError={(e) => { e.currentTarget.src = '/assets/avatars/avatar_king.webp' }}
                />
                <span className="profile-lvl-badge">Nv.{kingdomLevel}</span>
              </div>

              <div className="profile-info-block">
                <h3 className="profile-player-name">{playerName}</h3>
                <div className="profile-badge-tag">
                  <Award size={13} className="award-icon" />
                  <span>{t('start.commander') || 'Commander'} • Realm of Kingdom</span>
                </div>
              </div>
            </div>

            {/* 2. Prominent League Display */}
            <div className="league-prominent-banner">
              <div className="league-banner-icon-wrap">
                <Trophy size={26} className="league-trophy-gold" />
              </div>
              <div className="league-banner-details">
                <span className="league-pre-label">LIGA ACTUAL DEL JUGADOR:</span>
                <h2 className="league-title-main">{currentLeague?.name || 'LIGA BRONCE'}</h2>
                <span className="league-points-badge">
                  🏆 {trophies} Puntos de Liga ({currentLeague?.minTrophies || 0} - {currentLeague?.maxTrophies || 400})
                </span>
              </div>
            </div>

            {/* 3. Combat Stats Record (Winrate %, Wins, Losses, Points) */}
            <div className="pvp-record-section">
              <span className="record-section-title">HISTORIAL DE COMBATE PVP</span>
              
              <div className="pvp-record-grid">
                {/* Stat 1: Win Rate % */}
                <div className="record-stat-box winrate-box">
                  <div className="stat-icon-label">
                    <Percent size={14} className="stat-sub-icon cyan" />
                    <span className="stat-hdr">Ratio Victoria</span>
                  </div>
                  <span className="stat-main-number cyan">{winRate}%</span>
                  <div className="winrate-bar-track">
                    <div className="winrate-bar-fill" style={{ width: `${winRate}%` }} />
                  </div>
                </div>

                {/* Stat 2: Puntos de Liga */}
                <div className="record-stat-box trophies-box">
                  <div className="stat-icon-label">
                    <Trophy size={14} className="stat-sub-icon gold" />
                    <span className="stat-hdr">Puntos Liga</span>
                  </div>
                  <span className="stat-main-number gold">{trophies}</span>
                  <span className="stat-sub-tag">Coronas</span>
                </div>

                {/* Stat 3: Victorias Ganadas */}
                <div className="record-stat-box wins-box">
                  <div className="stat-icon-label">
                    <CheckCircle2 size={14} className="stat-sub-icon green" />
                    <span className="stat-hdr">Ganadas</span>
                  </div>
                  <span className="stat-main-number green">{wins}</span>
                  <span className="stat-sub-tag">Victorias</span>
                </div>

                {/* Stat 4: Derrotas */}
                <div className="record-stat-box losses-box">
                  <div className="stat-icon-label">
                    <XCircle size={14} className="stat-sub-icon red" />
                    <span className="stat-hdr">Derrotas</span>
                  </div>
                  <span className="stat-main-number red">{losses}</span>
                  <span className="stat-sub-tag">Perdidas</span>
                </div>
              </div>
            </div>

            {/* Footer League Perk */}
            <div className="league-perk-footer">
              <Zap size={14} className="perk-zap-icon" />
              <span>Multiplicador de Botín: <strong>x{currentLeague?.rewardMultiplier || '1.0'}</strong> de Oro y Honor</span>
            </div>

          </div>
        </aside>

        {/* Right Column: Battle Rooms Stage (Salas de Batalla 1 vs 1) */}
        <section className="pvp-arena-stage">
          <div className="rivals-panel-header">
            <div>
              <h2 className="rivals-headline">Salas de Batalla Disponibles (1 vs 1)</h2>
              <p className="rivals-sub">Ingresa a una sala abierta para iniciar el combate por turnos y arrebatar Coronas al oponente.</p>
            </div>

            <button 
              className={`pvp-refresh-rivals-btn ${isRefreshing ? 'spinning' : ''}`}
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              title="Buscar nuevas salas de combate"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Actualizar Salas</span>
            </button>
          </div>

          {/* Rooms Grid */}
          <div className="rivals-cards-grid">
            {roomsList.map((room, index) => {
              const isHard = room.difficulty?.id === 'hard'
              const isEasy = room.difficulty?.id === 'easy'
              const diffColor = isHard ? '#ef4444' : isEasy ? '#22c55e' : '#f59e0b'
              const diffTag = isHard ? 'Sala Desafío' : isEasy ? 'Sala Rápida' : 'Sala Equilibrada'

              return (
                <div key={room.id || index} className="pvp-rival-card room-card">
                  {/* Room Tag Bar */}
                  <div className="room-top-bar">
                    <span className="room-number-tag">SALA #{101 + index}</span>
                    <span className="room-diff-badge" style={{ borderColor: diffColor, color: diffColor }}>
                      {diffTag}
                    </span>
                  </div>

                  {/* Room Host / Contender Info */}
                  <div className="rival-card-top">
                    <div className="rival-avatar-wrap">
                      <img 
                        src={room.avatar || '/assets/avatars/avatar_king.webp'} 
                        alt={room.name} 
                        className="rival-avatar-img"
                        onError={(e) => { e.currentTarget.src = '/assets/hud_icons/btn_arena.webp' }}
                      />
                      <span className="rival-lvl-badge">Nv.{room.level || 1}</span>
                    </div>

                    <div className="rival-main-info">
                      <h4 className="rival-name">{room.name}</h4>
                      <span className="rival-kingdom">{room.kingdom || 'Reino Fronterizo'}</span>
                      <div className="rival-trophies-row">
                        <Trophy size={13} className="trophy-mini-icon" />
                        <span>{room.trophies || 200} Puntos</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Rewards */}
                  <div className="rival-rewards-row">
                    <div className="reward-item">
                      <span className="rew-label">Victoria</span>
                      <span className="rew-val trophies">+{room.rewards?.trophies || 25} 🏆</span>
                    </div>
                    <div className="reward-item">
                      <span className="rew-label">Botín</span>
                      <span className="rew-val gold">+{((room.rewards?.gold) || 1200).toLocaleString()} 🪙</span>
                    </div>
                    <div className="reward-item">
                      <span className="rew-label">Honor</span>
                      <span className="rew-val honor">+{room.rewards?.honor || 30} 🎖️</span>
                    </div>
                  </div>

                  {/* Enter Room Action Button */}
                  <button 
                    className="rival-duel-action-btn enter-room-btn"
                    onClick={() => handleEnterRoom(room)}
                  >
                    <Swords size={17} />
                    <span>Entrar a la Sala</span>
                    <ChevronRight size={17} className="duel-btn-arrow" />
                  </button>
                </div>
              )
            })}
          </div>
        </section>

      </main>

      {/* Pre-Combat Statistics Comparison Modal (Player vs Rival) */}
      <PvpVsModal 
        isOpen={vsModalOpen}
        onClose={() => setVsModalOpen(false)}
        onFight={handleStartFightFromVs}
        playerStats={{
          name: playerName,
          avatar: playerAvatar,
          level: kingdomLevel,
          trophies: trophies,
          wins: wins,
          losses: losses,
          winRate: winRate,
          troopsTotal: Object.values(troops || {}).reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0),
        }}
        rival={selectedRoom}
      />
    </div>
  )
}
