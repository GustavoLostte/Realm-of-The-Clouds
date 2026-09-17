import React, { useState, useEffect, useRef } from 'react'
import { 
  Swords, 
  ShieldAlert, 
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './DungeonCombatModal.css'

// Orc Campaign Dungeons (First 3 Dungeons / Rooms vs Orc)
const ORC_DUNGEON = {
  id: 'orc-warlord-citadel',
  name: 'Bastión del Fuego Negro: Duelo con el Orco',
  subtitle: 'Combate Cinematográfico - Primeras 3 Mazmorras',
  rooms: [
    {
      name: 'Orco Explorador de Avanzada',
      title: 'Vanguardia de los Páramos',
      type: 'orc_scout',
      hp: 95,
      attackDamage: 18,
      rewards: { gold: 200, wood: 120, stone: 80, gems: 5 },
      enemyAvatar: '/assets/mazmorras/orc_avatar.webp',
      needleSpeed: 0.70,
      enemyIcon: '/assets/hud_icons/btn_army.webp',
    },
    {
      name: 'Orco Berserker de Fuego',
      title: 'Guardián del Hacha Flamígera',
      type: 'orc_berserker',
      hp: 155,
      attackDamage: 25,
      rewards: { gold: 450, wood: 260, stone: 190, gems: 12 },
      needleSpeed: 0.80,
      enemyAvatar: '/assets/mazmorras/orc_avatar.webp',
      enemyIcon: '/assets/hud_icons/icon_bomb.webp',
    },
    {
      name: 'Caudillo Orco Vorgath',
      title: '¡GRAN JEFE DE LA MAZMORRA!',
      type: 'orc_boss',
      hp: 225,
      attackDamage: 36,
      rewards: { gold: 1200, wood: 700, stone: 550, gems: 35 },
      needleSpeed: 0.95,
      enemyAvatar: '/assets/mazmorras/orc_avatar.webp',
      enemyIcon: '/assets/hud_icons/icon_skull.webp',
    },
  ],
}

export function DungeonCombatModal({ isOpen, onClose, onVictory, troops }) {
  const { t } = useTranslation()
  const dungeon = ORC_DUNGEON
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const currentRoom = dungeon.rooms[currentRoomIndex] || dungeon.rooms[0]

  // Combat State
  const [gameState, setGameState] = useState('IN_COMBAT') // 'IN_COMBAT' | 'ROOM_VICTORY' | 'DUNGEON_VICTORY' | 'DEFEAT'
  const [playerHp, setPlayerHp] = useState(120)
  const [playerMaxHp] = useState(120)
  const [enemyHp, setEnemyHp] = useState(currentRoom.hp)
  const [enemyMaxHp, setEnemyMaxHp] = useState(currentRoom.hp)

  // Active Cinematic Clip: 'idle' | 'hero_atk' | 'orc_atk'
  const [activeClip, setActiveClip] = useState('idle')

  // Video refs for seamless zero-latency switching
  const idleVideoRef = useRef(null)
  const heroAtkVideoRef = useRef(null)
  const orcAtkVideoRef = useRef(null)

  // Timing Meter (0 to 100%)
  const needlePosRef = useRef(50)
  const needleRef = useRef(null)
  const [isAttacking, setIsAttacking] = useState(false)
  const isAttackingRef = useRef(false)
  const [screenShake, setScreenShake] = useState(false)
  const [floatingDamage, setFloatingDamage] = useState(null)
  const [critFlash, setCritFlash] = useState(false)

  // Accumulated Loot across rooms
  const [totalLoot, setTotalLoot] = useState({ gold: 0, wood: 0, stone: 0, gems: 0 })

  // Needle oscillation animation via requestAnimationFrame
  const animRef = useRef(null)
  const startTimeRef = useRef(performance.now())

  // Reset or initialize on open / close
  useEffect(() => {
    if (!isOpen) {
      setCurrentRoomIndex(0)
      setGameState('IN_COMBAT')
      setPlayerHp(120)
      setEnemyHp(dungeon.rooms[0].hp)
      setEnemyMaxHp(dungeon.rooms[0].hp)
      setTotalLoot({ gold: 0, wood: 0, stone: 0, gems: 0 })
      setFloatingDamage(null)
      setActiveClip('idle')
      isAttackingRef.current = false
      setIsAttacking(false)
      return
    }

    if (gameState !== 'IN_COMBAT') return

    // Ensure idle video is playing
    if (idleVideoRef.current) {
      idleVideoRef.current.currentTime = 0
      idleVideoRef.current.play().catch(() => {})
    }

    startTimeRef.current = performance.now()
    const speed = currentRoom.needleSpeed || 1.35
    let lastNeedleTime = 0

    const loop = (now) => {
      animRef.current = requestAnimationFrame(loop)
      lastNeedleTime = now

      const elapsed = (now - startTimeRef.current) / 1000
      // Sine wave oscillation between ~4% and ~96%
      const pos = 50 + 46 * Math.sin(elapsed * Math.PI * speed)
      needlePosRef.current = pos
      if (needleRef.current) {
        needleRef.current.style.left = `${pos}%`
      }
    }

    animRef.current = requestAnimationFrame(loop)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isOpen, gameState, currentRoomIndex])

  // Playback control when switching active video (pauses inactive videos to optimize mobile hardware)
  useEffect(() => {
    if (activeClip === 'idle') {
      heroAtkVideoRef.current?.pause()
      orcAtkVideoRef.current?.pause()
      if (idleVideoRef.current) {
        idleVideoRef.current.playbackRate = 1.0
        idleVideoRef.current.play().catch(() => {})
      }
    } else if (activeClip === 'hero_atk') {
      idleVideoRef.current?.pause()
      orcAtkVideoRef.current?.pause()
      if (heroAtkVideoRef.current) {
        heroAtkVideoRef.current.currentTime = 0
        heroAtkVideoRef.current.playbackRate = 1.35
        heroAtkVideoRef.current.play().catch(() => {})
      }
    } else if (activeClip === 'orc_atk') {
      idleVideoRef.current?.pause()
      heroAtkVideoRef.current?.pause()
      if (orcAtkVideoRef.current) {
        orcAtkVideoRef.current.currentTime = 0
        orcAtkVideoRef.current.playbackRate = 1.35
        orcAtkVideoRef.current.play().catch(() => {})
      }
    }
  }, [activeClip])

  // Handle Player Strike (optimized for instant 0ms mobile response)
  const handleStrike = () => {
    if (isAttackingRef.current || gameState !== 'IN_COMBAT') return

    isAttackingRef.current = true
    setIsAttacking(true)

    // Calculate accuracy based on needle position
    const hitPosition = needlePosRef.current
    const distFromCenter = Math.abs(hitPosition - 50)

    let strikeType = 'miss'
    let damageToEnemy = 0
    let damageToPlayer = 0

    if (distFromCenter <= 7.5) {
      // CRITICAL HIT! (Golden Center Zone) - 65 to 80 dmg
      strikeType = 'critical'
      damageToEnemy = Math.floor(68 + Math.random() * 14)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 80])
      }
    } else if (distFromCenter <= 20.0) {
      // PERFECT HIT! (Green Zone) - 40 to 50 dmg
      strikeType = 'perfect'
      damageToEnemy = Math.floor(45 + Math.random() * 10)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35)
      }
    } else if (distFromCenter <= 38.0) {
      // GOOD HIT! (Blue Zone) - 24 to 32 dmg
      strikeType = 'good'
      damageToEnemy = Math.floor(30 + Math.random() * 8)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20)
      }
    } else {
      // MISS! (Red Zone)
      strikeType = 'miss'
      damageToPlayer = Math.floor(currentRoom.attackDamage + Math.random() * 4)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([70, 40, 70])
      }
    }

    if (strikeType !== 'miss') {
      // --- HERO ATTACKS ---
      soundManager.playSwordSwing()
      setActiveClip('hero_atk')

      // Impact frame timing (at ~280ms)
      setTimeout(() => {
        if (strikeType === 'critical') {
          soundManager.playCriticalHit()
          setCritFlash(true)
          setScreenShake(true)
          setTimeout(() => {
            setCritFlash(false)
            setScreenShake(false)
          }, 300)
        } else {
          soundManager.playHit()
          setScreenShake(true)
          setTimeout(() => setScreenShake(false), 200)
        }

        setFloatingDamage({
          text: strikeType === 'critical' ? `¡¡CRÍTICO!! -${damageToEnemy}` : `-${damageToEnemy}`,
          type: strikeType,
          target: 'enemy'
        })

        // Functional state update avoids stale closures
        setEnemyHp((prevHp) => {
          const nextHp = Math.max(0, prevHp - damageToEnemy)
          if (nextHp <= 0) {
            // Conclude victory after animation plays out
            setTimeout(() => {
              handleEnemyDefeated()
            }, 600)
          }
          return nextHp
        })
      }, 280)

      // When attack sequence concludes (~1.1s), retaliate if enemy is still alive
      setTimeout(() => {
        setEnemyHp((latestHp) => {
          if (latestHp > 0) {
            // Enemy strikes back!
            setActiveClip('orc_atk')
            const rawDmg = currentRoom.attackDamage || 20
            const counterDmg = strikeType === 'critical' ? Math.max(6, Math.floor(rawDmg * 0.6)) : Math.max(8, Math.floor(rawDmg * 0.85))

            setTimeout(() => {
              soundManager.playHit()
              setScreenShake(true)
              setTimeout(() => setScreenShake(false), 250)
              setFloatingDamage({
                text: strikeType === 'critical' ? `¡ATURDIDO! -${counterDmg} HP` : `¡CONTRAATAQUE! -${counterDmg} HP`,
                type: 'miss',
                target: 'player'
              })
              setPlayerHp((prevP) => {
                const nextP = Math.max(0, prevP - counterDmg)
                if (nextP <= 0) {
                  setTimeout(() => {
                    setGameState('DEFEAT')
                    isAttackingRef.current = false
                    setIsAttacking(false)
                    soundManager.playHit()
                  }, 650)
                }
                return nextP
              })
            }, 300)

            setTimeout(() => {
              setActiveClip('idle')
              isAttackingRef.current = false
              setIsAttacking(false)
              setFloatingDamage(null)
            }, 1100)
          } else {
            setActiveClip('idle')
            isAttackingRef.current = false
            setIsAttacking(false)
            setFloatingDamage(null)
          }
          return latestHp
        })
      }, 1100)

    } else {
      // --- ORC COUNTER-ATTACKS ---
      setActiveClip('orc_atk')

      // Impact timing for Orc axe (~300ms)
      setTimeout(() => {
        soundManager.playHit()
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 250)

        setFloatingDamage({
          text: `¡FALLO! -${damageToPlayer} HP`,
          type: 'miss',
          target: 'player'
        })

        setPlayerHp((prevHp) => {
          const nextHp = Math.max(0, prevHp - damageToPlayer)
          if (nextHp <= 0) {
            setTimeout(() => {
              setGameState('DEFEAT')
              isAttackingRef.current = false
              setIsAttacking(false)
              soundManager.playHit()
            }, 650)
          }
          return nextHp
        })
      }, 300)

      // When Orc counter finishes (~1.1s), return to idle
      setTimeout(() => {
        setActiveClip('idle')
        isAttackingRef.current = false
        setIsAttacking(false)
        setFloatingDamage(null)
      }, 1100)
    }
  }

  // Handle Enemy Defeated
  const handleEnemyDefeated = () => {
    soundManager.playVictory()
    isAttackingRef.current = false
    setIsAttacking(false)

    // Add room rewards to total
    const r = currentRoom.rewards
    setTotalLoot((prev) => ({
      gold: prev.gold + (r.gold || 0),
      wood: prev.wood + (r.wood || 0),
      stone: prev.stone + (r.stone || 0),
      gems: prev.gems + (r.gems || 0),
    }))

    if (currentRoomIndex < dungeon.rooms.length - 1) {
      setGameState('ROOM_VICTORY')
    } else {
      setGameState('DUNGEON_VICTORY')
    }
  }

  // Next Room
  const handleNextRoom = () => {
    const nextIdx = currentRoomIndex + 1
    setCurrentRoomIndex(nextIdx)
    const nextRoom = dungeon.rooms[nextIdx]
    setEnemyHp(nextRoom.hp)
    setEnemyMaxHp(nextRoom.hp)
    // Heal hero 45 HP between rooms
    setPlayerHp((prev) => Math.min(playerMaxHp, prev + 45))
    setGameState('IN_COMBAT')
    setActiveClip('idle')
    setIsAttacking(false)
    soundManager.playClick()
  }

  // Claim & Exit
  const handleClaimAndExit = () => {
    soundManager.playCollect()
    if (onVictory) {
      onVictory(totalLoot)
    }
    onClose()
  }

  const handleStrikeRef = useRef(handleStrike)
  handleStrikeRef.current = handleStrike

  // Keyboard Spacebar listener
  useEffect(() => {
    if (!isOpen || gameState !== 'IN_COMBAT') return

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleStrikeRef.current?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, gameState])

  if (!isOpen) return null

  const playerHpPct = Math.max(0, (playerHp / playerMaxHp) * 100)
  const enemyHpPct = Math.max(0, (enemyHp / enemyMaxHp) * 100)

  return (
    <div className="dungeon-modal-backdrop" onClick={onClose}>
      <div 
        className={`dungeon-modal-container ${screenShake ? 'screen-shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Golden Critical Flash Overlay */}
        {critFlash && <div className="dungeon-crit-flash-overlay" />}

        {/* Dungeon Header */}
        <div className="dungeon-header">
          <div className="dungeon-title-wrap">
            <span className="dungeon-badge-icon">
              <img src="/assets/hud_icons/btn_expedition.webp" alt={t('dungeonCombat.dungeonName') || 'Mazmorra'} className="mini-res-icon" style={{ width: 22, height: 22 }} />
            </span>
            <div>
              <div className="dungeon-name">{t('dungeonCombat.dungeonName') || dungeon.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#f5a623', fontWeight: 700 }}>
                {t('dungeonCombat.dungeonSubtitle') || dungeon.subtitle}
              </div>
            </div>
          </div>

          {/* Room Step Indicator */}
          <div className="dungeon-room-tracker">
            {dungeon.rooms.map((room, idx) => (
              <div 
                key={idx}
                className={`dungeon-step-pill ${
                  idx < currentRoomIndex ? 'completed' : idx === currentRoomIndex ? 'active' : ''
                }`}
              >
                {idx < currentRoomIndex && (
                  <img src="/assets/hud_icons/icon_check.webp" alt="" className="mini-res-icon" style={{ width: 12, height: 12, marginRight: 3, verticalAlign: -1 }} />
                )}
                {t('dungeonCombat.roomPill', { room: idx + 1 }) || `Sala ${idx + 1}`}
                {idx === dungeon.rooms.length - 1 ? ` ${t('dungeonCombat.bossBadge') || '[JEFE]'}` : ''}
              </div>
            ))}
          </div>

          <button className="modal-close-candy-btn" onClick={onClose} title={t('dungeonCombat.closeTitle') || 'Cerrar Mazmorra'}>
            <img src="/assets/hud_icons/btn_close.webp" alt="Cerrar" draggable="false" />
          </button>
        </div>

        {/* Cinematic Arena Viewport */}
        <div className="dungeon-arena">
          {/* Seamless Video Stage */}
          <div className="dungeon-cinematic-viewport">
            <img 
              src="/assets/mazmorras/orc_idle_poster.webp" 
              alt="Arena" 
              className="cinematic-backdrop-poster" 
              draggable="false" 
            />
            <video
              ref={idleVideoRef}
              src="/assets/mazmorras/hero_vs_orc_idle_720p.mp4"
              poster="/assets/mazmorras/orc_idle_poster.webp"
              className={`cinematic-video ${activeClip === 'idle' ? 'visible' : 'hidden'}`}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            />
            <video
              ref={heroAtkVideoRef}
              src="/assets/mazmorras/hero_vs_orc_hero_attack_720p.mp4"
              className={`cinematic-video ${activeClip === 'hero_atk' ? 'visible' : 'hidden'}`}
              playsInline
              muted
              preload="metadata"
            />
            <video
              ref={orcAtkVideoRef}
              src="/assets/mazmorras/hero_vs_orc_orc_attack_720p.mp4"
              className={`cinematic-video ${activeClip === 'orc_atk' ? 'visible' : 'hidden'}`}
              playsInline
              muted
              preload="metadata"
            />
            <div className="dungeon-arena-overlay" />
          </div>

          {/* Health Row with Character Avatars */}
          <div className="combat-health-row">
            {/* Player Card */}
            <div className="fighter-card player">
              <div className="fighter-card-content">
                <img 
                  src="/assets/mazmorras/hero_avatar.webp" 
                  alt="Héroe" 
                  className="fighter-avatar-thumb hero" 
                />
                <div className="fighter-text-wrap">
                  <div className="fighter-info">
                    <span className="fighter-name">
                      <img src="/assets/hud_icons/btn_army.webp" alt="Campeón" className="mini-res-icon" /> {t('dungeonCombat.playerHeroName') || 'Campeón Real'}
                    </span>
                    <span className="fighter-hp-val">{playerHp} / {playerMaxHp} HP</span>
                  </div>
                  <div className="hp-bar-outer">
                    <div className="hp-bar-inner player" style={{ width: `${playerHpPct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* VS Badge */}
            <div className="combat-center-badge">
              <span className="combat-vs-label">{t('dungeonCombat.duelBadge') || 'DUELO'}</span>
              <span className="combat-round-num">{t('dungeonCombat.roundNum', { current: currentRoomIndex + 1 }) || `Sala ${currentRoomIndex + 1}/3`}</span>
            </div>

            {/* Enemy Card */}
            <div className="fighter-card enemy">
              <div className="fighter-card-content reverse">
                <img 
                  src={currentRoom.enemyAvatar || '/assets/mazmorras/orc_avatar.webp'} 
                  alt="Orco" 
                  className="fighter-avatar-thumb enemy" 
                />
                <div className="fighter-text-wrap">
                  <div className="fighter-info">
                    <span className="fighter-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <img src={currentRoom.enemyIcon} alt="" className="mini-res-icon" style={{ width: 16, height: 16 }} />
                      {t(`dungeonCombat.rooms.${currentRoomIndex}.name`) || currentRoom.name}
                    </span>
                    <span className="fighter-hp-val">{enemyHp} / {enemyMaxHp} HP</span>
                  </div>
                  <div className="hp-bar-outer">
                    <div className="hp-bar-inner enemy" style={{ width: `${enemyHpPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Damage Numbers */}
          <div className="cinematic-damage-layer">
            {floatingDamage && floatingDamage.target === 'player' && (
              <div className={`floating-damage-popup player-pos ${floatingDamage.type}`}>
                {floatingDamage.text}
              </div>
            )}
            {floatingDamage && floatingDamage.target === 'enemy' && (
              <div className={`floating-damage-popup enemy-pos ${floatingDamage.type}`}>
                {floatingDamage.text}
              </div>
            )}
          </div>

          {/* Bottom Timing Controller Panel */}
          <div className="combat-controls-panel">
            {/* Timing Meter Bar */}
            <div className="timing-meter-wrap">
              <div className="timing-bar-track">
                {/* Zone distribution: Miss 12%, Good 18%, Perfect 13%, Critical 14%, Perfect 13%, Good 18%, Miss 12% */}
                <div className="meter-zone miss" style={{ width: '12%' }} />
                <div className="meter-zone good" style={{ width: '18%' }} />
                <div className="meter-zone perfect" style={{ width: '13%' }} />
                <div className="meter-zone critical" style={{ width: '14%' }} />
                <div className="meter-zone perfect" style={{ width: '13%' }} />
                <div className="meter-zone good" style={{ width: '18%' }} />
                <div className="meter-zone miss" style={{ width: '12%' }} />

                {/* Oscillating Needle */}
                <div 
                  ref={needleRef}
                  className="timing-needle" 
                  style={{ left: '50%' }} 
                />
              </div>

              {/* Labels below meter */}
              <div className="timing-labels-row">
                <span className="label-miss">{t('dungeonCombat.timingMiss') || 'Fallo'}</span>
                <span className="label-good">{t('dungeonCombat.timingGood') || 'Bueno'}</span>
                <span className="label-perfect">{t('dungeonCombat.timingPerfect') || 'Perfecto'}</span>
                <span className="label-critical">{t('dungeonCombat.timingCritical') || '¡CRÍTICO!'}</span>
                <span className="label-perfect">{t('dungeonCombat.timingPerfect') || 'Perfecto'}</span>
                <span className="label-good">{t('dungeonCombat.timingGood') || 'Bueno'}</span>
                <span className="label-miss">{t('dungeonCombat.timingMiss') || 'Fallo'}</span>
              </div>
            </div>

            {/* Giant Strike Action Button */}
            <button 
              className="strike-action-btn"
              onPointerDown={(e) => {
                if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                  e.preventDefault()
                  handleStrike()
                }
              }}
              onClick={handleStrike}
              disabled={isAttacking || gameState !== 'IN_COMBAT'}
            >
              <Swords size={24} />
              <span>{t('dungeonCombat.strikeBtn') || '¡GOLPE CRÍTICO!'}</span>
              <span className="strike-key-hint">{t('dungeonCombat.strikeHint') || '[ESPACIO]'}</span>
            </button>
          </div>

          {/* ROOM VICTORY OVERLAY (with translucent backdrop & card) */}
          {gameState === 'ROOM_VICTORY' && (
            <div className="dungeon-result-overlay">
              <div className="dungeon-result-card">
                <div className="result-trophy-icon">
                  <img src="/assets/hud_icons/btn_ranking.webp" alt="Victoria" className="result-trophy-img" style={{ width: 52, height: 52, objectFit: 'contain' }} />
                </div>
                <div className="result-heading victory">{t('dungeonCombat.roomVictoryTitle', { room: currentRoomIndex + 1 }) || `¡Sala ${currentRoomIndex + 1} Conquistada!`}</div>
                <div className="result-subtext">
                  {t('dungeonCombat.roomVictorySubtext', { enemy: t(`dungeonCombat.rooms.${currentRoomIndex}.name`) || currentRoom.name }) || `Has derrotado al ${currentRoom.name}. Has recuperado botín y descansado para restaurar +45 HP.`}
                </div>

                <div className="loot-rewards-row">
                  <div className="loot-chip gold">
                    <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" className="chip-res-icon" /> +{currentRoom.rewards.gold} {t('resources.gold') || 'Oro'}
                  </div>
                  <div className="loot-chip wood">
                    <img src="/assets/hud_icons/icon_wood.webp" alt="Madera" className="chip-res-icon" /> +{currentRoom.rewards.wood} {t('resources.wood') || 'Madera'}
                  </div>
                  <div className="loot-chip stone">
                    <img src="/assets/hud_icons/icon_stone.webp" alt="Piedra" className="chip-res-icon" /> +{currentRoom.rewards.stone} {t('resources.stone') || 'Piedra'}
                  </div>
                  <div className="loot-chip gems">
                    <img src="/assets/hud_icons/icon_gem.webp" alt="Cristales" className="chip-res-icon" /> +{currentRoom.rewards.gems} {t('resources.gems') || 'Cristales'}
                  </div>
                </div>

                <div className="result-actions-row">
                  <button className="result-next-btn" onClick={handleNextRoom}>
                    {t('dungeonCombat.nextRoomBtn', { room: currentRoomIndex + 2 }) || `¡Avanzar a la Sala ${currentRoomIndex + 2}!`} <ArrowRight size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  </button>
                  <button className="result-quit-btn" onClick={handleClaimAndExit}>
                    {t('dungeonCombat.quitWithLootBtn') || 'Retirarse con el Botín'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DUNGEON COMPLETE / BOSS DEFEATED OVERLAY */}
          {gameState === 'DUNGEON_VICTORY' && (
            <div className="dungeon-result-overlay">
              <div className="dungeon-result-card">
                <div className="result-trophy-icon">
                  <img src="/assets/hud_icons/btn_ranking.webp" alt="Victoria" className="result-trophy-img" style={{ width: 52, height: 52, objectFit: 'contain' }} />
                </div>
                <div className="result-heading victory">{t('dungeonCombat.dungeonVictoryTitle') || '¡¡MAZMORRA CONQUISTADA!!'}</div>
                <div className="result-subtext">
                  {t('dungeonCombat.dungeonVictorySubtext', { enemy: t(`dungeonCombat.rooms.${currentRoomIndex}.name`) || currentRoom.name }) || `¡El ${currentRoom.name} ha caído! El gran botín legendario del Bastión Orco ahora enriquece a tu reino.`}
                </div>

                <div className="loot-rewards-row">
                  <div className="loot-chip gold">
                    <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" className="chip-res-icon" /> +{totalLoot.gold} {t('resources.gold') || 'Oro'}
                  </div>
                  <div className="loot-chip wood">
                    <img src="/assets/hud_icons/icon_wood.webp" alt="Madera" className="chip-res-icon" /> +{totalLoot.wood} {t('resources.wood') || 'Madera'}
                  </div>
                  <div className="loot-chip stone">
                    <img src="/assets/hud_icons/icon_stone.webp" alt="Piedra" className="chip-res-icon" /> +{totalLoot.stone} {t('resources.stone') || 'Piedra'}
                  </div>
                  <div className="loot-chip gems">
                    <img src="/assets/hud_icons/icon_gem.webp" alt="Cristales" className="chip-res-icon" /> +{totalLoot.gems} {t('resources.gems') || 'Cristales'}
                  </div>
                </div>

                <div className="result-actions-row">
                  <button className="result-next-btn" onClick={handleClaimAndExit}>
                    <img src="/assets/hud_icons/btn_ranking.webp" alt="Corona" className="btn-action-res-icon" /> {t('dungeonCombat.claimLegendaryLootBtn') || 'Reclamar Gran Botín para el Reino'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DEFEAT OVERLAY */}
          {gameState === 'DEFEAT' && (
            <div className="dungeon-result-overlay">
              <div className="dungeon-result-card">
                <div className="result-trophy-icon">
                  <img src="/assets/hud_icons/icon_skull.webp" alt="Derrota" style={{ width: 64, height: 64 }} />
                </div>
                <div className="result-heading defeat">{t('dungeonCombat.defeatTitle') || 'Has Caído en Combate'}</div>
                <div className="result-subtext">
                  {t('dungeonCombat.defeatSubtext', { room: currentRoomIndex + 1 }) || `El hacha del Orco te ha superado en la Sala ${currentRoomIndex + 1}. Ajusta tu timing y reclama tu revancha.`}
                </div>

                <div className="result-actions-row">
                  <button 
                    className="result-next-btn"
                    onClick={() => {
                      setCurrentRoomIndex(0)
                      setPlayerHp(120)
                      setEnemyHp(dungeon.rooms[0].hp)
                      setEnemyMaxHp(dungeon.rooms[0].hp)
                      setGameState('IN_COMBAT')
                      setActiveClip('idle')
                      setIsAttacking(false)
                      soundManager.playClick()
                    }}
                  >
                    <RotateCcw size={18} style={{ display: 'inline', verticalAlign: 'middle' }} /> {t('dungeonCombat.retryBtn') || 'Reintentar Duelo'}
                  </button>
                  <button className="result-quit-btn" onClick={onClose}>
                    {t('dungeonCombat.returnCityBtn') || 'Regresar a la Ciudad'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
