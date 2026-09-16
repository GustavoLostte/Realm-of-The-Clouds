import React, { useState, useEffect, useCallback } from 'react'
import './BattleDuelScene.css'
import { 
  ArrowLeft, 
  Swords, 
  Shield, 
  Flame, 
  Zap, 
  Sparkles, 
  Heart, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Trophy,
  Award
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { getChampionById, getOpponentChampion } from '../data/championsData'

export function BattleDuelScene({
  playerChampion = null,
  rivalChampion = null,
  onExitBattle,
  onVictory,
  onDefeat,
}) {
  // Fallbacks if not passed
  const pChamp = playerChampion || getChampionById('kael')
  const rChamp = rivalChampion || getOpponentChampion(pChamp.id)

  const maxPlayerHp = pChamp.hp || 1500
  const maxRivalHp = rChamp.hp || 1550

  const [playerHp, setPlayerHp] = useState(maxPlayerHp)
  const [rivalHp, setRivalHp] = useState(maxRivalHp)
  const [playerFury, setPlayerFury] = useState(25)
  const [rivalFury, setRivalFury] = useState(15)
  const [playerShield, setPlayerShield] = useState(0)
  const [rivalShield, setRivalShield] = useState(0)

  // Animation states: 'idle' | 'attacking' | 'hit' | 'defending'
  const [playerAnim, setPlayerAnim] = useState('idle')
  const [rivalAnim, setRivalAnim] = useState('idle')
  
  // Turn control: 'player' | 'rival' | 'resolving' | 'ended'
  const [turn, setTurn] = useState('player')
  const [turnCount, setTurnCount] = useState(1)
  const [battleOutcome, setBattleOutcome] = useState(null) // 'victory' | 'defeat' | null
  const [floatingTexts, setFloatingTexts] = useState([])
  const [shakeScreen, setShakeScreen] = useState(false)
  const [soundActive, setSoundActive] = useState(soundManager?.enabled ?? true)

  // Trigger battle music on mount
  useEffect(() => {
    soundManager?.playBattleMusic?.()
    return () => {
      // Don't stop immediately if handled higher up, but ensure silence on unmount
    }
  }, [])

  // Floating damage number helper
  const addFloatingText = useCallback((target, text, type = 'damage') => {
    const id = Date.now() + Math.random()
    setFloatingTexts((prev) => [...prev, { id, target, text, type }])
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id))
    }, 1200)
  }, [])

  const triggerShake = useCallback(() => {
    setShakeScreen(true)
    setTimeout(() => setShakeScreen(false), 450)
  }, [])

  // ==============================================================================
  // COMBAT ACTIONS
  // ==============================================================================

  const handlePlayerAttack = (actionType) => {
    if (turn !== 'player' || battleOutcome) return
    setTurn('resolving')

    let baseDmg = 0
    let isCrit = Math.random() > 0.65

    if (actionType === 'basic') {
      soundManager?.playHeroAttack?.()
      setPlayerAnim('attacking')
      baseDmg = Math.round(pChamp.atk * 1.5 + Math.random() * 30)
      if (isCrit) baseDmg = Math.round(baseDmg * 1.5)
      setPlayerFury((prev) => Math.min(100, prev + 25))
    } else if (actionType === 'skill') {
      soundManager?.playPurchaseFanfare?.()
      soundManager?.playCriticalHit?.()
      setPlayerAnim('attacking')
      baseDmg = Math.round(pChamp.atk * 2.8 + Math.random() * 45)
      isCrit = true
      setPlayerFury(0)
    } else if (actionType === 'defend') {
      soundManager?.playShieldBlock?.()
      setPlayerAnim('defending')
      setPlayerShield(0.60)
      addFloatingText('player', '🛡️ ESCUDO +60%', 'heal')
      setTimeout(() => {
        setPlayerAnim('idle')
        resolveRivalTurn()
      }, 700)
      return
    }

    setTimeout(() => {
      setPlayerAnim('idle')
      setRivalAnim('hit')
      triggerShake()

      // Calculate damage reduced by shield
      const actualDmg = Math.max(15, Math.round(baseDmg * (1 - rivalShield)))
      setRivalShield(0)

      setRivalHp((prev) => {
        const next = Math.max(0, prev - actualDmg)
        addFloatingText('rival', isCrit ? `💥 -${actualDmg} CRÍT!` : `-${actualDmg}`, isCrit ? 'crit' : 'damage')

        if (next <= 0) {
          setTimeout(() => handleBattleEnd('victory'), 800)
        } else {
          setTimeout(() => {
            setRivalAnim('idle')
            resolveRivalTurn()
          }, 900)
        }
        return next
      })
    }, 450)
  }

  const resolveRivalTurn = () => {
    setTurn('rival')
    setTimeout(() => {
      if (rivalHp <= 0) return

      // Rival AI logic
      const useUltimate = rivalFury >= 80
      let rDmg = 0
      let isCrit = Math.random() > 0.7

      if (useUltimate) {
        soundManager?.playCriticalHit?.()
        setRivalAnim('attacking')
        rDmg = Math.round(rChamp.atk * 2.5 + Math.random() * 40)
        setRivalFury(0)
      } else {
        soundManager?.playEnemyAttack?.('orc')
        setRivalAnim('attacking')
        rDmg = Math.round(rChamp.atk * 1.4 + Math.random() * 25)
        setRivalFury((prev) => Math.min(100, prev + 25))
      }

      if (isCrit) rDmg = Math.round(rDmg * 1.4)

      setTimeout(() => {
        setRivalAnim('idle')
        setPlayerAnim('hit')
        triggerShake()

        const finalDmg = Math.max(10, Math.round(rDmg * (1 - playerShield)))
        setPlayerShield(0)

        setPlayerHp((prev) => {
          const next = Math.max(0, prev - finalDmg)
          addFloatingText('player', isCrit ? `💥 -${finalDmg} CRÍT!` : `-${finalDmg}`, isCrit ? 'crit' : 'damage')

          if (next <= 0) {
            setTimeout(() => handleBattleEnd('defeat'), 800)
          } else {
            setTimeout(() => {
              setPlayerAnim('idle')
              setTurn('player')
              setTurnCount((c) => c + 1)
            }, 700)
          }
          return next
        })
      }, 500)
    }, 800)
  }

  const handleBattleEnd = (result) => {
    setBattleOutcome(result)
    setTurn('ended')
    if (result === 'victory') {
      soundManager?.playVictory?.()
      onVictory?.(rChamp)
    } else {
      soundManager?.playArenaDefeat?.()
      onDefeat?.(rChamp)
    }
  }

  const handleExitClick = () => {
    soundManager?.playClick?.()
    onExitBattle?.()
  }

  const handleToggleSound = () => {
    const next = soundManager?.toggleSound?.()
    setSoundActive(next)
  }

  // Percentage calculations for HP bars
  const pHealthPercent = Math.max(0, Math.round((playerHp / maxPlayerHp) * 100))
  const rHealthPercent = Math.max(0, Math.round((rivalHp / maxRivalHp) * 100))

  return (
    <div className={`battle-map-scene ${shakeScreen ? 'shake-viewport' : ''}`}>
      {/* Background Atmosphere Layers */}
      <div className="battle-map-vignette" />
      <div className="battle-map-horizon-fog" />

      {/* TOP BAR HUD */}
      <header className="battle-hud-top">
        {/* Left: Salir de Batalla button */}
        <button 
          id="btn-exit-battle"
          className="battle-exit-btn"
          onClick={handleExitClick}
          title="Salir de la escena de batalla"
        >
          <ArrowLeft size={18} />
          <span>Salir de Batalla</span>
        </button>

        {/* Center: Match Info */}
        <div className="battle-round-badge">
          <Swords size={15} className="round-icon" />
          <span>RONDA {turnCount}</span>
        </div>

        {/* Right: Sound Control */}
        <button 
          className="battle-sound-toggle"
          onClick={handleToggleSound}
          title={soundActive ? 'Silenciar audio' : 'Activar audio'}
        >
          {soundActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </header>

      {/* DUAL HEALTH BARS HUD */}
      <div className="battle-hp-hud-container">
        {/* PLAYER HP BAR */}
        <div className="fighter-hp-card player-hp-card">
          <div className="hp-card-header">
            <span className="hp-fighter-name" style={{ color: pChamp.color }}>
              {pChamp.name}
            </span>
            <span className="hp-numeric">
              <Heart size={12} className="heart-icon" /> {playerHp} / {maxPlayerHp}
            </span>
          </div>
          <div className="hp-bar-track">
            <div 
              className="hp-bar-fill fill-player" 
              style={{ width: `${pHealthPercent}%` }} 
            />
          </div>
          <div className="fury-bar-track">
            <div 
              className="fury-bar-fill" 
              style={{ width: `${playerFury}%` }} 
            />
          </div>
        </div>

        {/* VS ICON IN CENTER */}
        <div className="battle-vs-emblem">
          <span className="vs-txt-v">V</span>
          <span className="vs-txt-s">S</span>
        </div>

        {/* RIVAL HP BAR */}
        <div className="fighter-hp-card rival-hp-card">
          <div className="hp-card-header">
            <span className="hp-numeric">
              <Heart size={12} className="heart-icon rival-heart" /> {rivalHp} / {maxRivalHp}
            </span>
            <span className="hp-fighter-name" style={{ color: rChamp.color }}>
              {rChamp.name}
            </span>
          </div>
          <div className="hp-bar-track">
            <div 
              className="hp-bar-fill fill-rival" 
              style={{ width: `${rHealthPercent}%` }} 
            />
          </div>
          <div className="fury-bar-track">
            <div 
              className="fury-bar-fill rival-fury-fill" 
              style={{ width: `${rivalFury}%` }} 
            />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3D MAP ARENA FLOOR WITH CHARACTERS FACING EACH OTHER */}
      {/* ==================================================================== */}
      <main className="battle-arena-ground">
        {/* LEFT FIGHTER: PLAYER (Kael or Malakor) */}
        <div className={`arena-fighter-slot player-slot anim-${playerAnim}`}>
          {/* Floating Damage Numbers */}
          <div className="arena-float-anchor">
            {floatingTexts.filter((t) => t.target === 'player').map((item) => (
              <div key={item.id} className={`floating-hit-tag ${item.type}`}>
                {item.text}
              </div>
            ))}
          </div>

          {/* Character Idle Animation */}
          <div className="fighter-avatar-wrapper">
            <div className="fighter-ground-shadow" />
            <div className="fighter-aura-glow" style={{ background: pChamp.color }} />
            <img 
              src={pChamp.idleAnim || pChamp.fullImage} 
              alt={pChamp.name} 
              className="fighter-idle-sprite player-sprite"
              draggable="false" 
            />
            {playerShield > 0 && <div className="shield-barrier-fx" />}
          </div>

          <div className="fighter-pedestal-label">
            <span>{pChamp.name}</span>
          </div>
        </div>

        {/* RIGHT FIGHTER: RIVAL (Opposite Champion) */}
        <div className={`arena-fighter-slot rival-slot anim-${rivalAnim}`}>
          {/* Floating Damage Numbers */}
          <div className="arena-float-anchor">
            {floatingTexts.filter((t) => t.target === 'rival').map((item) => (
              <div key={item.id} className={`floating-hit-tag ${item.type}`}>
                {item.text}
              </div>
            ))}
          </div>

          {/* Character Idle Animation (Facing Left towards Player) */}
          <div className="fighter-avatar-wrapper">
            <div className="fighter-ground-shadow" />
            <div className="fighter-aura-glow" style={{ background: rChamp.color }} />
            <img 
              src={rChamp.idleAnim || rChamp.fullImage} 
              alt={rChamp.name} 
              className="fighter-idle-sprite rival-sprite"
              draggable="false" 
            />
            {rivalShield > 0 && <div className="shield-barrier-fx rival-barrier" />}
          </div>

          <div className="fighter-pedestal-label rival-pedestal">
            <span>{rChamp.name}</span>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* BOTTOM COMBAT ACTIONS CONTROLLER */}
      {/* ==================================================================== */}
      <footer className="battle-action-dock">
        {turn === 'player' && !battleOutcome && (
          <div className="battle-action-buttons">
            <button 
              type="button"
              className="battle-btn attack-btn"
              onClick={() => handlePlayerAttack('basic')}
            >
              <Swords size={20} className="action-icon" />
              <div className="action-txt-wrap">
                <span className="action-main">Ataque Básico</span>
                <span className="action-sub">Combo de Impacto (+25 Furia)</span>
              </div>
            </button>

            <button 
              type="button"
              className={`battle-btn skill-btn ${playerFury < 100 ? 'is-disabled' : 'is-ready'}`}
              onClick={() => handlePlayerAttack('skill')}
              disabled={playerFury < 100}
            >
              <Flame size={20} className="action-icon flame-icon" />
              <div className="action-txt-wrap">
                <span className="action-main">{pChamp.skillName}</span>
                <span className="action-sub">{playerFury >= 100 ? '¡ULTIMATE LISTO!' : `Requiere 100 Furia (${playerFury}/100)`}</span>
              </div>
            </button>

            <button 
              type="button"
              className="battle-btn defend-btn"
              onClick={() => handlePlayerAttack('defend')}
            >
              <Shield size={20} className="action-icon" />
              <div className="action-txt-wrap">
                <span className="action-main">Defensa Táctica</span>
                <span className="action-sub">Escudo -60% Daño Próximo Turno</span>
              </div>
            </button>
          </div>
        )}

        {turn === 'rival' && !battleOutcome && (
          <div className="battle-waiting-banner">
            <Sparkles size={16} className="spin-icon" />
            <span>Turno del Rival... {rChamp.name} está preparando su ataque.</span>
          </div>
        )}

        {turn === 'resolving' && !battleOutcome && (
          <div className="battle-waiting-banner resolving">
            <span>¡Resolviendo impacto de combate!</span>
          </div>
        )}

        {/* BATTLE OUTCOME OVERLAY (VICTORY / DEFEAT) */}
        {battleOutcome && (
          <div className={`battle-outcome-modal outcome-${battleOutcome}`}>
            <div className="outcome-card">
              <div className="outcome-icon-wrap">
                {battleOutcome === 'victory' ? <Trophy size={48} className="icon-gold" /> : <Award size={48} className="icon-red" />}
              </div>
              <h2 className="outcome-title">
                {battleOutcome === 'victory' ? '¡VICTORIA GLORIOSA!' : '¡DERROTA EN LA ARENA!'}
              </h2>
              <p className="outcome-subtitle">
                {battleOutcome === 'victory' 
                  ? `Tu campeón ${pChamp.name} ha vencido con honor a ${rChamp.name}.`
                  : `${rChamp.name} ha dominado el terreno de combate.`}
              </p>

              <button 
                type="button" 
                className="outcome-btn-exit"
                onClick={handleExitClick}
              >
                <ArrowLeft size={18} />
                <span>Salir de la Batalla</span>
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  )
}
