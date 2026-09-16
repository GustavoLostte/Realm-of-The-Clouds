import React, { useState, useEffect } from 'react'
import './ChampionSelectScene.css'
import { 
  ArrowLeft, 
  Swords, 
  Shield, 
  Zap, 
  Flame, 
  Sparkles, 
  Trophy, 
  Heart, 
  Activity, 
  Info,
  CheckCircle2
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { CHAMPIONS_LIST, getChampionById, getOpponentChampion } from '../data/championsData'

export function ChampionSelectScene({
  onBack,
  onConfirmChampion,
  rival = null,
  playerName = 'Lord King',
  playerAvatar = '/assets/avatars/avatar_king.webp',
}) {
  // Player 1 selected champion (defaults to Rey Kael)
  const [selectedChampionId, setSelectedChampionId] = useState('kael')
  
  // Rival champion: automatically the opposite champion
  const [rivalChampionId, setRivalChampionId] = useState('malakor')

  useEffect(() => {
    // Play combat arena ambient horn/clash on scene open
    soundManager?.playHorn?.()
  }, [])

  const playerChampion = getChampionById(selectedChampionId)
  const rivalChampion = getChampionById(rivalChampionId)

  const handleSelectChampion = (champion) => {
    soundManager?.playClick?.()
    soundManager?.playSwordSwing?.()
    setSelectedChampionId(champion.id)
    // The opposite champion is automatically the rival!
    const opponent = getOpponentChampion(champion.id)
    setRivalChampionId(opponent.id)
  }

  const handleConfirm = () => {
    soundManager?.playButtonClick?.()
    soundManager?.playPurchaseFanfare?.()
    onConfirmChampion?.(playerChampion, rivalChampion)
  }

  const handleBack = () => {
    soundManager?.playClick?.()
    onBack?.()
  }

  // Calculate percentages for stat bars (max base 100 for atk/def/speed, 1600 for hp)
  const hpPercent = Math.min(100, Math.round((playerChampion.hp / 1600) * 100))
  const atkPercent = Math.min(100, playerChampion.atk)
  const defPercent = Math.min(100, playerChampion.def)
  const speedPercent = Math.min(100, playerChampion.speed)

  const rivalHpPercent = Math.min(100, Math.round((rivalChampion.hp / 1600) * 100))
  const rivalAtkPercent = Math.min(100, rivalChampion.atk)
  const rivalDefPercent = Math.min(100, rivalChampion.def)
  const rivalSpeedPercent = Math.min(100, rivalChampion.speed)

  return (
    <div className="mk-select-container">
      {/* Background Atmosphere & Vignette */}
      <div className="mk-select-vignette" />
      <div className="mk-select-particles" />

      {/* TOP HEADER */}
      <header className="mk-select-header">
        <button 
          id="mk-btn-back"
          className="mk-back-button"
          onClick={handleBack}
          title="Volver a la selección de salas"
        >
          <ArrowLeft size={18} />
          <span>Salas de Combate</span>
        </button>

        <div className="mk-header-title-box">
          <div className="mk-header-badge">
            <Swords size={14} className="mk-header-badge-icon" />
            <span>DUELO DE SOBERANOS</span>
          </div>
          <h1 className="mk-header-title">SELECCIÓN DE CAMPEÓN</h1>
        </div>

        <div className="mk-header-status">
          <span className="mk-status-pill">ELIGE A TU LUCHADOR</span>
        </div>
      </header>

      {/* MAIN 3-COLUMN ARENA: [PLAYER 1] - [CENTER GRID] - [RIVAL PLAYER 2] */}
      <main className="mk-select-stage">
        {/* ==================================================================== */}
        {/* LEFT COLUMN: PLAYER 1 FIGHTER DISPLAY */}
        {/* ==================================================================== */}
        <section className="mk-fighter-pane mk-player-pane">
          <div className="mk-fighter-header">
            <span className="mk-fighter-tag p1-tag">JUGADOR 1 (TÚ)</span>
            <h2 className="mk-fighter-name" style={{ color: playerChampion.color }}>
              {playerChampion.name}
            </h2>
            <span className="mk-fighter-subtitle">{playerChampion.title}</span>
            <div className="mk-fighter-role-pill" style={{ borderColor: playerChampion.color }}>
              {playerChampion.role} • {playerChampion.element}
            </div>
          </div>

          {/* Fullbody Standing Render */}
          <div className="mk-render-stage">
            <div className="mk-render-glow p1-glow" style={{ background: playerChampion.color }} />
            <img 
              key={playerChampion.id}
              src={playerChampion.fullImage} 
              alt={playerChampion.name} 
              className="mk-render-img p1-img"
              style={{ transform: `scale(${playerChampion.scale || 1})` }}
            />
            <div className="mk-render-shadow" />
          </div>

          {/* Attributes & Special Skill */}
          <div className="mk-fighter-attributes">
            <div className="mk-stat-bar-row">
              <span className="mk-stat-label">
                <Heart size={12} className="mk-icon-hp" /> HP {playerChampion.hp}
              </span>
              <div className="mk-stat-track">
                <div className="mk-stat-fill fill-hp" style={{ width: `${hpPercent}%` }} />
              </div>
            </div>

            <div className="mk-stat-bar-row">
              <span className="mk-stat-label">
                <Flame size={12} className="mk-icon-atk" /> ATK {playerChampion.atk}
              </span>
              <div className="mk-stat-track">
                <div className="mk-stat-fill fill-atk" style={{ width: `${atkPercent}%` }} />
              </div>
            </div>

            <div className="mk-stat-bar-row">
              <span className="mk-stat-label">
                <Shield size={12} className="mk-icon-def" /> DEF {playerChampion.def}
              </span>
              <div className="mk-stat-track">
                <div className="mk-stat-fill fill-def" style={{ width: `${defPercent}%` }} />
              </div>
            </div>

            <div className="mk-stat-bar-row">
              <span className="mk-stat-label">
                <Zap size={12} className="mk-icon-spd" /> VEL {playerChampion.speed}
              </span>
              <div className="mk-stat-track">
                <div className="mk-stat-fill fill-spd" style={{ width: `${speedPercent}%` }} />
              </div>
            </div>

            {/* Special Skill Box */}
            <div className="mk-skill-box">
              <div className="mk-skill-header">
                <Sparkles size={13} className="mk-icon-skill" />
                <span className="mk-skill-title">{playerChampion.skillName}</span>
              </div>
              <p className="mk-skill-desc">{playerChampion.skillDesc}</p>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* CENTER COLUMN: MORTAL KOMBAT 11 ROSTER GRID */}
        {/* ==================================================================== */}
        <section className="mk-roster-center">
          <div className="mk-roster-frame">
            <div className="mk-roster-grid">
              {CHAMPIONS_LIST.map((champ) => {
                const isP1 = champ.id === selectedChampionId
                const isRival = champ.id === rivalChampionId

                return (
                  <div
                    key={champ.id}
                    className={`mk-slot ${isP1 ? 'is-p1' : ''} ${isRival ? 'is-rival' : ''}`}
                    onClick={() => handleSelectChampion(champ)}
                    title={`${champ.name} (${champ.role})`}
                  >
                    <div className="mk-slot-inner">
                      <img src={champ.avatar} alt={champ.name} className="mk-slot-avatar" />
                      <div className="mk-slot-overlay" />
                      <span className="mk-slot-name">{champ.name}</span>
                      
                      {/* Selection Tags */}
                      {isP1 && <div className="mk-badge-tag p1-badge">P1</div>}
                      {isRival && <div className="mk-badge-tag rival-badge">RIVAL</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick instructions / quote */}
          <div className="mk-center-quote">
            <span className="mk-quote-text">"{playerChampion.quote}"</span>
          </div>

          {/* Confirm Action Button */}
          <div className="mk-confirm-dock">
            <button 
              type="button" 
              className="mk-btn-confirm"
              onClick={handleConfirm}
            >
              <Swords size={22} className="mk-btn-swords" />
              <span>¡CONFIRMAR Y COMBATIR!</span>
            </button>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: RIVAL PLAYER 2 FIGHTER DISPLAY */}
        {/* ==================================================================== */}
        <section className="mk-fighter-pane mk-rival-pane">
          <div className="mk-fighter-header">
            <span className="mk-fighter-tag rival-tag">
              RIVAL ({rival?.name || 'SALA #101'})
            </span>
            <h2 className="mk-fighter-name" style={{ color: rivalChampion.color }}>
              {rivalChampion.name}
            </h2>
            <span className="mk-fighter-subtitle">{rivalChampion.title}</span>
            <div className="mk-fighter-role-pill rival-pill" style={{ borderColor: rivalChampion.color }}>
              {rivalChampion.role} • {rivalChampion.element}
            </div>
          </div>

          {/* Fullbody Standing Render (Mirrored facing left) */}
          <div className="mk-render-stage">
            <div className="mk-render-glow rival-glow" style={{ background: rivalChampion.color }} />
            <img 
              key={rivalChampion.id}
              src={rivalChampion.fullImage} 
              alt={rivalChampion.name} 
              className="mk-render-img rival-img"
              style={{ transform: `scale(${rivalChampion.scale || 1}) scaleX(-1)` }}
            />
            <div className="mk-render-shadow" />
          </div>

          {/* Attributes & Special Skill */}
          <div className="mk-fighter-attributes">
            <div className="mk-stat-bar-row">
              <span className="mk-stat-label">
                <Heart size={12} className="mk-icon-hp" /> HP {rivalChampion.hp}
              </span>
              <div className="mk-stat-track">
                <div className="mk-stat-fill fill-hp" style={{ width: `${rivalHpPercent}%` }} />
              </div>
            </div>

            <div className="mk-stat-bar-row">
              <span className="mk-stat-label">
                <Flame size={12} className="mk-icon-atk" /> ATK {rivalChampion.atk}
              </span>
              <div className="mk-stat-track">
                <div className="mk-stat-fill fill-atk" style={{ width: `${rivalAtkPercent}%` }} />
              </div>
            </div>

            <div className="mk-stat-bar-row">
              <span className="mk-stat-label">
                <Shield size={12} className="mk-icon-def" /> DEF {rivalChampion.def}
              </span>
              <div className="mk-stat-track">
                <div className="mk-stat-fill fill-def" style={{ width: `${rivalDefPercent}%` }} />
              </div>
            </div>

            <div className="mk-stat-bar-row">
              <span className="mk-stat-label">
                <Zap size={12} className="mk-icon-spd" /> VEL {rivalChampion.speed}
              </span>
              <div className="mk-stat-track">
                <div className="mk-stat-fill fill-spd" style={{ width: `${rivalSpeedPercent}%` }} />
              </div>
            </div>

            {/* Special Skill Box */}
            <div className="mk-skill-box rival-skill-box">
              <div className="mk-skill-header">
                <Sparkles size={13} className="mk-icon-skill" />
                <span className="mk-skill-title">{rivalChampion.skillName}</span>
              </div>
              <p className="mk-skill-desc">{rivalChampion.skillDesc}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
