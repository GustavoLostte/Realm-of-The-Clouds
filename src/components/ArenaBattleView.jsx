import React, { useState, useEffect, useCallback, useRef } from 'react'
import './ArenaBattleView.css'
import { 
  Swords, 
  Flame, 
  Shield, 
  Sparkles, 
  Crown, 
  Zap, 
  Heart, 
  Trophy, 
  X, 
  Award
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { getLeagueForTrophies } from '../data/arenaData'

export function ArenaBattleView({
  isOpen,
  onClose,
  rival,
  troops = {},
  equippedRelics = {},
  unlockedTechIds = [],
  consumables = {},
  onUseConsumable,
  onVictory,
  onDefeat,
  resources = {},
  onRetreatCost,
}) {
  const { t } = useTranslation()

  // Base fighter statistics derived from player progression & army
  const playerInfantry = troops?.infantry || 0
  const playerArchers = troops?.archers || 0
  const playerCommanders = troops?.commander || 0
  const relicBonusHp = equippedRelics?.accessory === 'relic_manto_vencedor' ? 150 : 0
  const techAttackBonus = unlockedTechIds.includes('tech-tactics') ? 1.15 : 1.0

  const maxPlayerHp = Math.round((1000 + (playerCommanders * 60) + (playerInfantry * 15) + relicBonusHp))
  const [playerHp, setPlayerHp] = useState(maxPlayerHp)
  const [playerFury, setPlayerFury] = useState(20) // Starts at 20/100
  const [playerShield, setPlayerShield] = useState(0) // Damage reduction percentage (0 to 0.65)
  const [playerAnim, setPlayerAnim] = useState('idle') // 'idle' | 'attacking' | 'hit' | 'defending'

  // Rival fighter statistics
  const rivalPower = rival?.power || 350
  const maxRivalHp = Math.round(900 + (rivalPower * 1.8))
  const [rivalHp, setRivalHp] = useState(maxRivalHp)
  const [rivalFury, setRivalFury] = useState(10)
  const [rivalShield, setRivalShield] = useState(0)
  const [rivalAnim, setRivalAnim] = useState('idle')

  // Combat turn state
  const [turn, setTurn] = useState('player') // 'player' | 'rival' | 'resolving'
  const [turnCount, setTurnCount] = useState(1)
  const [combatLog, setCombatLog] = useState([
    { id: 1, text: `¡El combate ha comenzado! Kael entra a la arena de ${rival?.name || 'Soberano Rival'}.`, type: 'info' }
  ])
  const [floatingTexts, setFloatingTexts] = useState([])
  const [battleResult, setBattleResult] = useState(null) // 'victory' | 'defeat' | null
  const [shakeScreen, setShakeScreen] = useState(false)
  const [showRetreatConfirm, setShowRetreatConfirm] = useState(false)

  const isCombatActive = isOpen && !battleResult
  const timerRef = useRef(null)

  // Floating text helper
  const addFloatingText = useCallback((target, text, type = 'damage') => {
    const id = Date.now() + Math.random()
    setFloatingTexts((prev) => [...prev, { id, target, text, type }])
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id))
    }, 1200)
  }, [])

  // Trigger screen shake on heavy impact
  const triggerShake = useCallback(() => {
    setShakeScreen(true)
    setTimeout(() => setShakeScreen(false), 450)
  }, [])

  // League info
  const rivalTrophies = rival?.trophies || 250
  const currentLeague = getLeagueForTrophies(rivalTrophies)
  const winTrophies = rival?.rewards?.trophies || 28
  const lossTrophies = Math.abs(rival?.rewards?.lossTrophies || 12)
  const winGold = rival?.rewards?.gold || 450
  const winShards = 3

  // Reset battle when opened
  useEffect(() => {
    if (!isOpen) return
    setPlayerHp(maxPlayerHp)
    setPlayerFury(20)
    setPlayerShield(0)
    setPlayerAnim('idle')

    setRivalHp(maxRivalHp)
    setRivalFury(10)
    setRivalShield(0)
    setRivalAnim('idle')

    setTurn('player')
    setTurnCount(1)
    setBattleResult(null)
    setCombatLog([
      { id: Date.now(), text: `¡Duelo de Soberanos iniciado! Kael se enfrenta a ${rival?.name || 'Soberano Rival'}.`, type: 'info' }
    ])
    setFloatingTexts([])
    soundManager?.playButtonClick?.()
  }, [isOpen, maxPlayerHp, maxRivalHp, rival])

  // ==============================================================================
  // PLAYER TACTICAL ACTIONS
  // ==============================================================================

  const executePlayerAttack = (actionType) => {
    if (turn !== 'player' || battleResult) return

    setTurn('resolving')

    let baseDamage = 0
    let furyGain = 0
    let furyCost = 0
    let isCrit = false
    let actionName = ''

    if (actionType === 'basic') {
      // 1. Corte Celestial
      baseDamage = Math.round((130 + Math.random() * 40) * techAttackBonus)
      furyGain = 25
      actionName = 'Corte Celestial'
      soundManager?.playHeroAttack?.()
      setPlayerAnim('attacking')
    } else if (actionType === 'shield') {
      // 2. Baluarte de Aetheria (Defensa)
      const healAmount = Math.round(maxPlayerHp * 0.10)
      setPlayerShield(0.65)
      setPlayerHp((prev) => Math.min(maxPlayerHp, prev + healAmount))
      setPlayerFury((prev) => Math.min(100, prev + 15))
      actionName = 'Baluarte de Aetheria'
      soundManager?.playPopChime?.(1.4)
      setPlayerAnim('defending')
      addFloatingText('player', `+${healAmount} HP (Escudo -65%)`, 'heal')
      
      setCombatLog((prev) => [
        { id: Date.now(), text: `🛡️ Kael levantó el Baluarte de Aetheria: Escudo divino activo y regeneró ${healAmount} HP.`, type: 'heal' },
        ...prev.slice(0, 4)
      ])

      setTimeout(() => {
        setPlayerAnim('idle')
        advanceToRivalTurn()
      }, 700)
      return
    } else if (actionType === 'special') {
      // 3. Juicio Arcano
      if (playerFury < 40) return
      furyCost = 40
      baseDamage = Math.round((280 + Math.random() * 80) * techAttackBonus)
      actionName = 'Juicio Arcano'
      isCrit = Math.random() < 0.4
      if (isCrit) baseDamage = Math.round(baseDamage * 1.35)
      soundManager?.playPurchaseFanfare?.()
      setPlayerAnim('attacking')
      triggerShake()
    } else if (actionType === 'ultimate') {
      // 4. Ira del Rey Celestial (Ultimate)
      if (playerFury < 100) return
      furyCost = 100
      baseDamage = Math.round((600 + Math.random() * 140) * techAttackBonus)
      actionName = '⚡ Ira del Rey Celestial'
      isCrit = true
      soundManager?.playVictory?.()
      setPlayerAnim('attacking')
      triggerShake()
    }

    // Apply damage to rival
    const mitigation = rivalShield > 0 ? rivalShield : 0
    const finalDamage = Math.max(10, Math.round(baseDamage * (1 - mitigation)))

    if (furyCost > 0) {
      setPlayerFury((prev) => Math.max(0, prev - furyCost))
    }
    if (furyGain > 0) {
      setPlayerFury((prev) => Math.min(100, prev + furyGain))
    }
    setRivalShield(0) // Rival shield consumed by hit

    setRivalAnim('hit')
    addFloatingText('rival', isCrit ? `¡CRÍTICO! -${finalDamage}` : `-${finalDamage}`, isCrit ? 'crit' : 'damage')

    setCombatLog((prev) => [
      { id: Date.now(), text: `⚔️ Kael usó [${actionName}] e infligió ${finalDamage} de daño a ${rival?.name || 'Rival'}.`, type: isCrit ? 'crit' : 'attack' },
      ...prev.slice(0, 4)
    ])

    const nextRivalHp = Math.max(0, rivalHp - finalDamage)
    setRivalHp(nextRivalHp)

    setTimeout(() => {
      setPlayerAnim('idle')
      setRivalAnim('idle')

      if (nextRivalHp <= 0) {
        handleVictoryTrigger()
      } else {
        advanceToRivalTurn()
      }
    }, 750)
  }

  // Use Healing Potion
  const handleUsePotion = () => {
    if (turn !== 'player' || battleResult) return
    const healAmount = Math.round(maxPlayerHp * 0.35)
    setPlayerHp((prev) => Math.min(maxPlayerHp, prev + healAmount))
    addFloatingText('player', `+${healAmount} HP`, 'heal')
    soundManager?.playPopChime?.(1.6)
    onUseConsumable?.('potion_healing')
    setCombatLog((prev) => [
      { id: Date.now(), text: `🧪 Kael bebió una Pócima Sagrada y recuperó ${healAmount} HP.`, type: 'heal' },
      ...prev.slice(0, 4)
    ])
  }

  // ==============================================================================
  // RIVAL TACTICAL AI TURN
  // ==============================================================================

  const advanceToRivalTurn = () => {
    setTurn('rival')

    timerRef.current = setTimeout(() => {
      executeRivalTurn()
    }, 900)
  }

  const executeRivalTurn = () => {
    if (battleResult) return

    let baseDamage = 0
    let actionName = ''
    let isCrit = false
    let isShielding = false

    // AI Decision Tree
    if (rivalFury >= 100) {
      // Rival Ultimate
      baseDamage = 340 + Math.round(Math.random() * 100)
      setRivalFury(0)
      actionName = 'Devastación Umbría'
      isCrit = true
      triggerShake()
    } else if (rivalHp < maxRivalHp * 0.35 && rivalShield === 0 && Math.random() < 0.5) {
      // Rival Shield
      isShielding = true
      setRivalShield(0.60)
      setRivalFury((prev) => Math.min(100, prev + 20))
      actionName = 'Guardia Oscura'
      setRivalAnim('defending')
      addFloatingText('rival', '¡ESCUDO -60%!', 'heal')
    } else if (rivalFury >= 40 && Math.random() < 0.65) {
      // Rival Special Strike
      baseDamage = 210 + Math.round(Math.random() * 70)
      setRivalFury((prev) => Math.max(0, prev - 40))
      actionName = 'Corte del Vacío'
    } else {
      // Rival Basic Strike
      baseDamage = 110 + Math.round(Math.random() * 50)
      setRivalFury((prev) => Math.min(100, prev + 25))
      actionName = 'Asalto Sombrío'
    }

    if (isShielding) {
      soundManager?.playPopChime?.(0.9)
      setCombatLog((prev) => [
        { id: Date.now(), text: `🛡️ ${rival?.name || 'El Rival'} activó [${actionName}] preparándose para tu próximo golpe.`, type: 'info' },
        ...prev.slice(0, 4)
      ])

      setTimeout(() => {
        setRivalAnim('idle')
        setTurn('player')
        setTurnCount((c) => c + 1)
      }, 700)
      return
    }

    // Apply damage to player
    setRivalAnim('attacking')
    soundManager?.playHeroAttack?.()

    const mitigation = playerShield > 0 ? playerShield : 0
    const finalDamage = Math.max(10, Math.round(baseDamage * (1 - mitigation)))
    setPlayerShield(0) // Player shield consumed

    setPlayerAnim('hit')
    addFloatingText('player', mitigation > 0 ? `¡BLOQUEADO! -${finalDamage}` : `-${finalDamage}`, mitigation > 0 ? 'heal' : 'damage')

    setCombatLog((prev) => [
      { id: Date.now(), text: `💥 ${rival?.name || 'Rival'} usó [${actionName}] causando ${finalDamage} de daño a Kael.`, type: 'damage' },
      ...prev.slice(0, 4)
    ])

    const nextPlayerHp = Math.max(0, playerHp - finalDamage)
    setPlayerHp(nextPlayerHp)

    setTimeout(() => {
      setRivalAnim('idle')
      setPlayerAnim('idle')

      if (nextPlayerHp <= 0) {
        handleDefeatTrigger()
      } else {
        setTurn('player')
        setTurnCount((c) => c + 1)
        soundManager?.playPopChime?.(1.2)
      }
    }, 750)
  }

  // ==============================================================================
  // VICTORY & DEFEAT RESOLUTION
  // ==============================================================================

  const handleVictoryTrigger = () => {
    setBattleResult('victory')
    soundManager?.playArenaVictory?.()
  }

  const handleDefeatTrigger = () => {
    setBattleResult('defeat')
    soundManager?.playArenaDefeat?.()
  }

  const handleClaimVictory = () => {
    const battleLoot = {
      trophies: winTrophies,
      gold: winGold,
      honor: 25,
      celestialShards: winShards,
    }
    onVictory?.(rival, battleLoot)
  }

  const handleAcceptDefeat = () => {
    onDefeat?.(rival, { lossTrophies })
  }

  const handleRetreat = () => {
    if (playerHp < maxPlayerHp * 0.9) {
      handleAcceptDefeat()
    } else {
      onClose?.()
    }
  }

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className={`arena-battle-overlay ${shakeScreen ? 'screen-shake' : ''}`}>
      <div className="arena-battle-stage" style={{ backgroundImage: "url('/assets/arena_battle_bg.webp')" }}>
        
        {/* Top Battle Header */}
        <div className="battle-top-hud">
          <div className="battle-league-pill">
            <Trophy size={16} className="league-icon-trophy" />
            <span className="league-title-txt">{currentLeague.name}</span>
            <span className="league-stake-txt">🏆 +{winTrophies} / -{lossTrophies}</span>
          </div>

          <div className="battle-turn-indicator">
            <span className="turn-count-badge">Ronda {turnCount}</span>
            <span className={`turn-status-badge ${turn === 'player' ? 'player-turn' : 'rival-turn'}`}>
              {turn === 'player' ? '⚔️ ¡TU TURNO!' : `⏳ Turno de ${rival?.name || 'Rival'}...`}
            </span>
          </div>

          <button 
            className="battle-retreat-btn" 
            onClick={() => setShowRetreatConfirm(true)}
            title="Retirarse del combate"
          >
            <X size={18} />
            <span className="retreat-txt">Retirarse</span>
          </button>
        </div>

        {/* The Duelists Arena Field */}
        <div className="duel-arena-field">
          
          {/* LEFT FIGHTER: KAEL (PLAYER CHAMPION) */}
          <div className={`fighter-side player-side ${playerAnim}`}>
            {/* Fighter Info Card */}
            <div className="fighter-status-card">
              <div className="fighter-identity">
                <Crown size={16} className="crown-icon-gold" />
                <span className="fighter-name">
                  {rival?.playerChampion ? `${rival.playerChampion.name} (${rival.playerChampion.title})` : 'Rey Celestial (Kael)'}
                </span>
                {playerShield > 0 && <span className="shield-active-badge">🛡️ -65%</span>}
              </div>

              {/* HP Bar */}
              <div className="hp-bar-container">
                <div 
                  className="hp-bar-fill player-hp" 
                  style={{ width: `${Math.max(0, (playerHp / maxPlayerHp) * 100)}%` }} 
                />
                <span className="hp-numeric-txt">{playerHp} / {maxPlayerHp} HP</span>
              </div>

              {/* Fury Bar */}
              <div className="fury-bar-container" title="Furia Celestial para Juicio e Ira">
                <div 
                  className="fury-bar-fill" 
                  style={{ width: `${playerFury}%` }} 
                />
                <span className="fury-numeric-txt">
                  <Flame size={10} /> {playerFury}/100 Furia
                  {playerFury >= 100 && ' — ¡ULTIMATE LISTO!'}
                </span>
              </div>
            </div>

            {/* Fighter Visual Sprite */}
            <div className="fighter-visual-wrap">
              <div className="fighter-shadow" />
              <img 
                src={rival?.playerChampion?.fullImage || '/assets/characters/fullbody_cutout/01_rey_celestial.webp'} 
                alt={rival?.playerChampion?.name || 'Kael Rey Celestial'} 
                className="fighter-sprite player-sprite" 
                draggable="false" 
              />
              {playerShield > 0 && <div className="divine-shield-aura" />}
            </div>

            {/* Floating Texts for Player */}
            <div className="floating-text-container player-floats">
              {floatingTexts.filter((t) => t.target === 'player').map((item) => (
                <div key={item.id} className={`floating-msg ${item.type}`}>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* VS Center Emblem */}
          <div className="vs-center-emblem">
            <div className="vs-circle">
              <Swords size={26} className="vs-swords-icon" />
              <span className="vs-text">VS</span>
            </div>
          </div>

          {/* RIGHT FIGHTER: RIVAL SOVEREIGN (MALAKOR / RIVAL) */}
          <div className={`fighter-side rival-side ${rivalAnim}`}>
            {/* Fighter Info Card */}
            <div className="fighter-status-card rival-card">
              <div className="fighter-identity">
                <span className="fighter-name">{rival?.name || 'Lord Malakor'}</span>
                <span className="fighter-title">[{rival?.kingdom || 'Caudillo Celestial'}]</span>
                {rivalShield > 0 && <span className="shield-active-badge dark">🛡️ -60%</span>}
              </div>

              {/* HP Bar */}
              <div className="hp-bar-container">
                <div 
                  className="hp-bar-fill rival-hp" 
                  style={{ width: `${Math.max(0, (rivalHp / maxRivalHp) * 100)}%` }} 
                />
                <span className="hp-numeric-txt">{rivalHp} / {maxRivalHp} HP</span>
              </div>

              {/* Fury Bar */}
              <div className="fury-bar-container rival-fury-container">
                <div 
                  className="fury-bar-fill rival-fury" 
                  style={{ width: `${rivalFury}%` }} 
                />
                <span className="fury-numeric-txt">
                  <Zap size={10} /> {rivalFury}/100 Furia
                </span>
              </div>
            </div>

            {/* Fighter Visual Sprite */}
            <div className="fighter-visual-wrap">
              <div className="fighter-shadow" />
              <img 
                src={rival?.avatar || '/assets/champions/malakor.jpg'} 
                alt="Soberano Rival" 
                className="fighter-sprite rival-sprite" 
                draggable="false"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = '/assets/characters/fullbody_cutout/03_paladin_sagrado.webp'
                }}
              />
              {rivalShield > 0 && <div className="dark-shield-aura" />}
            </div>

            {/* Floating Texts for Rival */}
            <div className="floating-text-container rival-floats">
              {floatingTexts.filter((t) => t.target === 'rival').map((item) => (
                <div key={item.id} className={`floating-msg ${item.type}`}>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Combat Action Log Ribbon */}
        <div className="combat-action-ribbon">
          <p className="last-action-txt">
            {combatLog[0]?.text}
          </p>
        </div>

        {/* BOTTOM TACTICAL ACTION BAR */}
        <div className="tactical-actions-dock">
          {/* Action 1: Basic Attack */}
          <button 
            className="action-btn basic-btn" 
            onClick={() => executePlayerAttack('basic')}
            disabled={turn !== 'player' || battleResult !== null}
            title="Corte Celestial: Ataque físico básico (+25 Furia)"
          >
            <div className="action-icon-wrap basic">
              <Swords size={22} />
            </div>
            <div className="action-info">
              <span className="action-name">Corte Celestial</span>
              <span className="action-gain">+25 Furia</span>
            </div>
          </button>

          {/* Action 2: Shield / Defense */}
          <button 
            className="action-btn shield-btn" 
            onClick={() => executePlayerAttack('shield')}
            disabled={turn !== 'player' || battleResult !== null}
            title="Baluarte de Aetheria: Reduce 65% el próximo golpe y sana +90 HP"
          >
            <div className="action-icon-wrap shield">
              <Shield size={22} />
            </div>
            <div className="action-info">
              <span className="action-name">Baluarte Aetheria</span>
              <span className="action-gain">-65% Daño / +HP</span>
            </div>
          </button>

          {/* Action 3: Special Attack */}
          <button 
            className={`action-btn special-btn ${playerFury < 40 ? 'locked-fury' : ''}`} 
            onClick={() => executePlayerAttack('special')}
            disabled={turn !== 'player' || playerFury < 40 || battleResult !== null}
            title="Juicio Arcano: Daño crítico de luz celestial (Consume 40 Furia)"
          >
            <div className="action-icon-wrap special">
              <Sparkles size={22} />
            </div>
            <div className="action-info">
              <span className="action-name">Juicio Arcano</span>
              <span className="action-cost">40 Furia</span>
            </div>
          </button>

          {/* Action 4: Ultimate Attack */}
          <button 
            className={`action-btn ultimate-btn ${playerFury >= 100 ? 'ultimate-ready' : 'locked-fury'}`} 
            onClick={() => executePlayerAttack('ultimate')}
            disabled={turn !== 'player' || playerFury < 100 || battleResult !== null}
            title="Ira del Rey Celestial: Golpe cósmico demoledor (Consume 100 Furia)"
          >
            <div className="action-icon-wrap ultimate">
              <Zap size={24} />
            </div>
            <div className="action-info">
              <span className="action-name">⚡ Ira Celestial</span>
              <span className="action-cost">{playerFury >= 100 ? '¡LISTO!' : '100 Furia'}</span>
            </div>
          </button>

          {/* Action 5: Health Potion */}
          {(consumables?.potion_healing > 0 || true) && (
            <button 
              className="action-btn potion-btn" 
              onClick={handleUsePotion}
              disabled={turn !== 'player' || playerHp >= maxPlayerHp || battleResult !== null}
              title="Pócima Sagrada: Recupera 35% de vida máxima"
            >
              <div className="action-icon-wrap potion">
                <Heart size={20} />
              </div>
              <div className="action-info">
                <span className="action-name">Pócima</span>
                <span className="action-gain">+35% HP</span>
              </div>
            </button>
          )}
        </div>

        {/* VICTORY MODAL OVERLAY */}
        {battleResult === 'victory' && (
          <div className="battle-outcome-overlay victory-flow">
            <div className="outcome-card candy-victory">
              <div className="outcome-crown-wrap">
                <Crown size={52} className="outcome-crown" />
              </div>

              <h2 className="outcome-title victory-txt">¡VICTORIA GLORIOSA!</h2>
              <p className="outcome-subtitle">
                Has derrotado al campeón de <strong className="rival-highlight">{rival?.name || 'Soberano Rival'}</strong> en el Coliseo.
              </p>

              {/* Loot Grid */}
              <div className="outcome-loot-grid">
                <div className="loot-card trophy-loot">
                  <Trophy size={22} className="loot-icon gold" />
                  <span className="loot-val">+{winTrophies}</span>
                  <span className="loot-label">Coronas ELO</span>
                </div>

                <div className="loot-card gold-loot">
                  <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" className="loot-img" />
                  <span className="loot-val">+{winGold}</span>
                  <span className="loot-label">Oro Imperial</span>
                </div>

                <div className="loot-card shard-loot">
                  <Sparkles size={22} className="loot-icon cyan" />
                  <span className="loot-val">+{winShards}</span>
                  <span className="loot-label">Fragmentos</span>
                </div>

                <div className="loot-card honor-loot">
                  <Award size={22} className="loot-icon purple" />
                  <span className="loot-val">+25</span>
                  <span className="loot-label">Honor de Liga</span>
                </div>
              </div>

              <button className="outcome-claim-btn" onClick={handleClaimVictory}>
                <span>¡Reclamar Triunfo y Volver!</span>
              </button>
            </div>
          </div>
        )}

        {/* DEFEAT MODAL OVERLAY */}
        {battleResult === 'defeat' && (
          <div className="battle-outcome-overlay defeat-flow">
            <div className="outcome-card candy-defeat">
              <div className="outcome-defeat-icon">
                <Shield size={48} className="defeat-shield" />
              </div>

              <h2 className="outcome-title defeat-txt">DERROTA EN EL COLISEO</h2>
              <p className="outcome-subtitle">
                Tu escuadrón cayó ante la táctica de <strong>{rival?.name || 'Soberano Rival'}</strong>.
              </p>

              <div className="outcome-penalty-box">
                <Trophy size={20} className="penalty-trophy" />
                <span className="penalty-txt">Pérdida de Coronas: -{lossTrophies}</span>
              </div>

              <button className="outcome-retreat-btn" onClick={handleAcceptDefeat}>
                <span>Retirarse y Reagrupar Héroes</span>
              </button>
            </div>
          </div>
        )}

        {/* RETREAT CONFIRMATION MODAL */}
        {showRetreatConfirm && (
          <div className="retreat-confirm-modal" onClick={() => setShowRetreatConfirm(false)}>
            <div className="retreat-confirm-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="retreat-title">¿Abandonar el Duelo?</h3>
              <p className="retreat-desc">
                Si te rindes en medio del combate, se contará como una derrota y perderás {lossTrophies} Coronas de Liga.
              </p>
              <div className="retreat-actions">
                <button className="retreat-cancel-btn" onClick={() => setShowRetreatConfirm(false)}>
                  Seguir Luchando
                </button>
                <button className="retreat-confirm-btn" onClick={handleRetreat}>
                  Rendirse
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
