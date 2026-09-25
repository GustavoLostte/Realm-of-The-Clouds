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
  CheckCircle2,
  Crosshair,
  HeartHandshake
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { 
  CHAMPIONS_LIST, 
  getChampionById, 
  getOpponentChampion, 
  CLASSES_LIST, 
  getChampionByClassAndGender 
} from '../data/championsData'

export function ChampionSelectScene({
  onBack,
  onConfirmChampion,
  rival = null,
  playerName = 'Comandante',
  playerAvatar = '/assets/avatars/avatar_king.webp',
}) {
  // Active selected champion ID (defaults to Knight Male / Kina)
  const [selectedChampionId, setSelectedChampionId] = useState('knight_male')
  
  // Selected gender filter for classes view ('male' | 'female')
  const [selectedGender, setSelectedGender] = useState('male')

  // View mode: 'classes' (4 classes + Valiria with gender toggle) or 'all' (full roster)
  const [viewMode, setViewMode] = useState('classes')
  
  // Rival champion
  const [rivalChampionId, setRivalChampionId] = useState('paladin_female')

  useEffect(() => {
    // Play combat arena ambient horn/clash on scene open
    soundManager?.playHorn?.()
  }, [])

  const playerChampion = getChampionById(selectedChampionId)
  const rivalChampion = getChampionById(rivalChampionId)

  const handleGenderChange = (gender) => {
    soundManager?.playClick?.()
    setSelectedGender(gender)
    const current = getChampionById(selectedChampionId)
    if (current.classId && current.classId !== 'valkyrie') {
      const switched = getChampionByClassAndGender(current.classId, gender)
      if (switched) {
        setSelectedChampionId(switched.id)
      }
    }
  }

  const handleSelectClass = (cls) => {
    soundManager?.playClick?.()
    soundManager?.playSwordSwing?.()
    const champ = getChampionByClassAndGender(cls.id, selectedGender)
    if (champ) {
      setSelectedChampionId(champ.id)
      const opp = getOpponentChampion(champ.id)
      setRivalChampionId(opp.id)
    }
  }

  const handleSelectChampion = (champion) => {
    soundManager?.playClick?.()
    soundManager?.playSwordSwing?.()
    setSelectedChampionId(champion.id)
    if (champion.gender) {
      setSelectedGender(champion.gender)
    }
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

  // Calculate percentages for stat bars (max base 100 for atk/def/speed, 6500 for hp)
  const hpPercent = Math.min(100, Math.round((playerChampion.hp / 6500) * 100))
  const atkPercent = Math.min(100, playerChampion.atk)
  const defPercent = Math.min(100, playerChampion.def)
  const speedPercent = Math.min(100, playerChampion.speed)

  const rivalHpPercent = Math.min(100, Math.round((rivalChampion.hp / 6500) * 100))
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
            <span>DUELO DE COMANDANTES</span>
          </div>
          <h1 className="mk-header-title">SELECCIÓN DE CLASE Y CAMPEÓN</h1>
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
            <div className="mk-header-row-tags">
              <span className="mk-fighter-tag p1-tag">JUGADOR 1 (TÚ)</span>
              {playerChampion.gender && (
                <span className={`mk-gender-badge ${playerChampion.gender}`}>
                  {playerChampion.gender === 'male' ? '♂ MASCULINO' : '♀ FEMENINO'}
                </span>
              )}
            </div>
            <h2 className="mk-fighter-name" style={{ color: playerChampion.color }}>
              {playerChampion.name}
            </h2>
            <span className="mk-fighter-subtitle">{playerChampion.title}</span>
            <div className="mk-fighter-role-pill" style={{ borderColor: playerChampion.color }}>
              {playerChampion.role} • {playerChampion.element}
            </div>
          </div>

          {/* Fullbody Standing Render (Playing real-time animated WebP idle) */}
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
            {/* View Mode & Gender Controls */}
            <div className="mk-roster-controls">
              {/* Gender Selector Bar */}
              <div className="mk-gender-bar">
                <button 
                  type="button" 
                  className={`mk-gender-btn ${selectedGender === 'male' ? 'is-active' : ''}`}
                  onClick={() => handleGenderChange('male')}
                  title="Cambiar a variante masculina"
                >
                  <span className="mk-gender-symbol">♂</span>
                  <span>MASCULINO</span>
                </button>
                <button 
                  type="button" 
                  className={`mk-gender-btn ${selectedGender === 'female' ? 'is-active' : ''}`}
                  onClick={() => handleGenderChange('female')}
                  title="Cambiar a variante femenina"
                >
                  <span className="mk-gender-symbol">♀</span>
                  <span>FEMENINO</span>
                </button>
              </div>

              {/* View Mode Toggle Tabs */}
              <div className="mk-view-mode-tabs">
                <button 
                  type="button"
                  className={`mk-tab-btn ${viewMode === 'classes' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('classes')}
                >
                  Por Clases
                </button>
                <button 
                  type="button"
                  className={`mk-tab-btn ${viewMode === 'all' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('all')}
                >
                  Todos ({CHAMPIONS_LIST.length})
                </button>
              </div>
            </div>

            {/* 1. CLASSE-BASED GRID */}
            {viewMode === 'classes' ? (
              <div className="mk-roster-grid mk-classes-grid">
                {CLASSES_LIST.map((cls) => {
                  const champ = cls.genders[selectedGender] || cls.genders.male
                  const isP1 = playerChampion.classId === cls.id
                  const isRival = rivalChampion.classId === cls.id

                  return (
                    <div
                      key={cls.id}
                      className={`mk-slot ${isP1 ? 'is-p1' : ''} ${isRival ? 'is-rival' : ''}`}
                      onClick={() => handleSelectClass(cls)}
                      title={`${cls.name} (${cls.alias}) - ${cls.role}`}
                    >
                      <div className="mk-slot-inner">
                        <img src={champ.avatar} alt={cls.name} className="mk-slot-avatar" />
                        <div className="mk-slot-overlay" />
                        <span className="mk-slot-name">{cls.name}</span>
                        <span className="mk-slot-subtag">{cls.alias}</span>
                        
                        {/* Selection Tags */}
                        {isP1 && <div className="mk-badge-tag p1-badge">P1</div>}
                        {isRival && <div className="mk-badge-tag rival-badge">RIVAL</div>}
                      </div>
                    </div>
                  )
                })}

                {/* Valiria Legend Slot */}
                {(() => {
                  const valiriaChamp = getChampionById('valiria')
                  const isP1 = selectedChampionId === 'valiria'
                  const isRival = rivalChampionId === 'valiria'
                  return (
                    <div
                      key="valiria"
                      className={`mk-slot valiria-slot ${isP1 ? 'is-p1' : ''} ${isRival ? 'is-rival' : ''}`}
                      onClick={() => handleSelectChampion(valiriaChamp)}
                      title="Valiria (Ángel Valquiria) - Leyenda"
                    >
                      <div className="mk-slot-inner">
                        <img src={valiriaChamp.avatar} alt="Valiria" className="mk-slot-avatar" />
                        <div className="mk-slot-overlay" />
                        <span className="mk-slot-name">Valiria</span>
                        <span className="mk-slot-subtag">Leyenda</span>
                        {isP1 && <div className="mk-badge-tag p1-badge">P1</div>}
                        {isRival && <div className="mk-badge-tag rival-badge">RIVAL</div>}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              /* 2. FULL ROSTER GRID (ALL 10 HEROES) */
              <div className="mk-roster-grid mk-all-grid">
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
                        {champ.gender && (
                          <span className="mk-slot-subtag">
                            {champ.gender === 'male' ? '♂ Masc' : '♀ Fem'}
                          </span>
                        )}
                        
                        {isP1 && <div className="mk-badge-tag p1-badge">P1</div>}
                        {isRival && <div className="mk-badge-tag rival-badge">RIVAL</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
            <div className="mk-header-row-tags">
              <span className="mk-fighter-tag rival-tag">
                RIVAL ({rival?.name || 'SALA #101'})
              </span>
              {rivalChampion.gender && (
                <span className={`mk-gender-badge ${rivalChampion.gender}`}>
                  {rivalChampion.gender === 'male' ? '♂ MASCULINO' : '♀ FEMENINO'}
                </span>
              )}
            </div>
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
              style={{ transform: `scaleX(-1) scale(${rivalChampion.scale || 1})` }}
            />
            <div className="mk-render-shadow" />
          </div>

          {/* Rival Attributes & Special Skill */}
          <div className="mk-fighter-attributes">
            <div className="mk-stat-bar-row">
              <span className="mk-stat-label">
                <Heart size={12} className="mk-icon-hp" /> HP {rivalChampion.hp}
              </span>
              <div className="mk-stat-track">
                <div className="mk-stat-fill fill-hp rival-fill-hp" style={{ width: `${rivalHpPercent}%` }} />
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

            {/* Rival Special Skill Box */}
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
