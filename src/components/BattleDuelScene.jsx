import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  Trophy,
  Award,
  ChevronUp,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Crosshair,
  RefreshCw
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { getChampionById, getOpponentChampion, getChampionAnimConfig } from '../data/championsData'
import { VirtualJoystick } from './VirtualJoystick'

// Helper to determine active sprite visual based on animation state
function getFighterVisual(champ, anim) {
  if (champ?.animations) {
    if (anim === 'attacking' || anim === 'attack1') return champ.animations.attack1 || champ.animations.idle
    if (anim === 'attack2') return champ.animations.attack2 || champ.animations.idle
    if (anim === 'special') return champ.animations.special || champ.animations.attack2 || champ.animations.idle
    if (anim === 'defending' || anim === 'defend') return champ.animations.defend || champ.animations.idle
    if (anim === 'defend_hold') return champ.animations.defend_hold || champ.animations.defend || champ.animations.idle
    if (anim === 'hit') return champ.animations.hit || champ.animations.idle
    if (anim === 'knockdown') return champ.animations.knockdown || champ.animations.idle
    if (anim === 'lose') return champ.animations.lose || champ.animations.knockdown || champ.animations.idle
    if (anim === 'lose_hold') return champ.animations.lose_hold || champ.animations.lose || champ.animations.idle
    if (anim === 'victory') return champ.animations.victory || champ.animations.idle
    if (anim === 'jump') return champ.animations.jump || champ.animations.idle
    if (anim === 'run') return champ.animations.run || champ.animations.walk || champ.animations.idle
    if (anim === 'walk') return champ.animations.walk || champ.animations.idle
    if (champ.animations[anim]) return champ.animations[anim]
  }
  return champ?.idleAnim || champ?.fullImage
}

// Audio cache pool for instantaneous zero-latency sound effects
const audioPool = {}
function playChampSound(champ, action) {
  if (!soundManager?.enabled) return
  const soundUrl = champ?.sounds?.[action]
  if (soundUrl) {
    try {
      if (!audioPool[soundUrl]) {
        audioPool[soundUrl] = new Audio(soundUrl)
      }
      const sound = audioPool[soundUrl]
      sound.currentTime = 0
      sound.volume = 0.85
      sound.play().catch(() => {})
    } catch {}
  }
}

export function BattleDuelScene({
  playerChampion = null,
  rivalChampion = null,
  onExitBattle,
  onVictory,
  onDefeat,
}) {
  // Default to Luke as playable fighter (or passed champion)
  const initialPlayer = playerChampion || getChampionById('luke')
  const initialRival = rivalChampion || getOpponentChampion(initialPlayer.id)

  const [pChamp, setPChamp] = useState(initialPlayer)
  const [rChamp, setRChamp] = useState(initialRival)

  const maxPlayerHp = pChamp.hp || 4800
  const maxRivalHp = rChamp.hp || 5000

  const [playerHp, setPlayerHp] = useState(maxPlayerHp)
  const [rivalHp, setRivalHp] = useState(maxRivalHp)
  const [playerFury, setPlayerFury] = useState(35)
  const [rivalFury, setRivalFury] = useState(20)

  // Animation states & browser frame-zero decoders nonces
  const [playerAnim, setPlayerAnim] = useState('idle')
  const [rivalAnim, setRivalAnim] = useState('idle')
  const [pAnimNonce, setPAnimNonce] = useState(() => Date.now())
  const [rAnimNonce, setRAnimNonce] = useState(() => Date.now())

  // Real-time 2D Positions & Physics (Close melee engagement standoff: 41% vs 59%)
  const [pPosX, setPPosX] = useState(41) // percentage across battlefield width
  const [pPosY, setPPosY] = useState(0)  // vertical jump elevation in px
  const [pFacing, setPFacing] = useState(1) // 1 = right, -1 = left

  const [rPosX, setRPosX] = useState(59)
  const [rPosY, setRPosY] = useState(0)
  const [rFacing, setRFacing] = useState(-1)

  // Combat status & feedback
  const [battleOutcome, setBattleOutcome] = useState(null) // 'victory' | 'defeat' | null
  const [showVictoryWord, setShowVictoryWord] = useState(false)
  const [floatingTexts, setFloatingTexts] = useState([])
  const [shakeScreen, setShakeScreen] = useState(false)
  const [shakeHeavy, setShakeHeavy] = useState(false)
  const [blockTremor, setBlockTremor] = useState(false)
  const [soundActive, setSoundActive] = useState(soundManager?.enabled ?? true)
  const [comboCount, setComboCount] = useState(0)

  // Visual state for pressed hotkeys
  const [activeKeys, setActiveKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    k: false,
    l: false,
    i: false,
    o: false,
  })

  // Mutable refs for 60 FPS physics game loop without React state closure lag
  const pPosRef = useRef({ x: 41, y: 0, velY: 0, isJumping: false })
  const rPosRef = useRef({ x: 59, y: 0, velY: 0 })
  const pFacingRef = useRef(1)
  const rFacingRef = useRef(-1)

  const pAnimRef = useRef('idle')
  const rAnimRef = useRef('idle')

  const isGuardingRef = useRef(false)
  const isRivalGuardingRef = useRef(false)
  const isActionLockedRef = useRef(false)
  const keysDownRef = useRef({})
  const runSoundTimeRef = useRef(0)
  const comboTimerRef = useRef(null)
  const rivalAiTimerRef = useRef(0)
  const rivalGuardTimerRef = useRef(0)
  const battleEndedRef = useRef(false)

  // Strict action timer refs ensuring every single animation completes from frame 0 to end
  const pActionTimerRef = useRef(null)
  const pImpactTimerRef = useRef(null)
  const pImpactTimer2Ref = useRef(null)
  const rActionTimerRef = useRef(null)
  const rImpactTimerRef = useRef(null)
  const pHitTimerRef = useRef(null)
  const rHitTimerRef = useRef(null)
  const pJumpTimerRef = useRef({ active: false, startTime: 0, duration: 0 })
  const pDefendTimerRef = useRef(null)
  const rDefendTimerRef = useRef(null)
  const blockTremorTimerRef = useRef(null)
  const losePhaseTimerRef = useRef(null)
  const outcomeTimerRef = useRef(null)
  const outcomeModalTimerRef = useRef(null)

  // Play active combat music on scene entry & restore pre-battle music on unmount
  useEffect(() => {
    soundManager?.playCombatMusic?.()
    return () => {
      soundManager?.stopCombatMusic?.(true)
      if (pActionTimerRef.current) clearTimeout(pActionTimerRef.current)
      if (pImpactTimerRef.current) clearTimeout(pImpactTimerRef.current)
      if (pImpactTimer2Ref.current) clearTimeout(pImpactTimer2Ref.current)
      if (rActionTimerRef.current) clearTimeout(rActionTimerRef.current)
      if (rImpactTimerRef.current) clearTimeout(rImpactTimerRef.current)
      if (pHitTimerRef.current) clearTimeout(pHitTimerRef.current)
      if (rHitTimerRef.current) clearTimeout(rHitTimerRef.current)
      if (pDefendTimerRef.current) clearTimeout(pDefendTimerRef.current)
      if (rDefendTimerRef.current) clearTimeout(rDefendTimerRef.current)
      if (blockTremorTimerRef.current) clearTimeout(blockTremorTimerRef.current)
      if (losePhaseTimerRef.current) clearTimeout(losePhaseTimerRef.current)
      if (outcomeTimerRef.current) clearTimeout(outcomeTimerRef.current)
      if (outcomeModalTimerRef.current) clearTimeout(outcomeModalTimerRef.current)
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    }
  }, [])

  // Floating damage number helper
  const addFloatingText = useCallback((target, text, type = 'damage') => {
    const id = Date.now() + Math.random()
    setFloatingTexts((prev) => [...prev, { id, target, text, type }])
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id))
    }, 1100)
  }, [])

  const triggerShake = useCallback((heavy = false) => {
    if (heavy) {
      setShakeHeavy(true)
      setTimeout(() => setShakeHeavy(false), 500)
    } else {
      setShakeScreen(true)
      setTimeout(() => setShakeScreen(false), 350)
    }
  }, [])

  // Physical block impact tremor on fighter sprites
  const triggerBlockTremor = useCallback(() => {
    setBlockTremor(true)
    if (blockTremorTimerRef.current) clearTimeout(blockTremorTimerRef.current)
    blockTremorTimerRef.current = setTimeout(() => {
      setBlockTremor(false)
    }, 240)
  }, [])

  // Register combo hit
  const registerCombo = useCallback(() => {
    setComboCount((c) => c + 1)
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    comboTimerRef.current = setTimeout(() => {
      setComboCount(0)
    }, 2400)
  }, [])

  // Battle outcome resolution (declared before action triggers to avoid TDZ)
  const handleBattleFinish = useCallback((outcome) => {
    if (battleEndedRef.current) return
    battleEndedRef.current = true

    if (pActionTimerRef.current) clearTimeout(pActionTimerRef.current)
    if (pImpactTimerRef.current) clearTimeout(pImpactTimerRef.current)
    if (pImpactTimer2Ref.current) clearTimeout(pImpactTimer2Ref.current)
    if (rActionTimerRef.current) clearTimeout(rActionTimerRef.current)
    if (rImpactTimerRef.current) clearTimeout(rImpactTimerRef.current)
    if (pHitTimerRef.current) clearTimeout(pHitTimerRef.current)
    if (rHitTimerRef.current) clearTimeout(rHitTimerRef.current)
    if (pDefendTimerRef.current) clearTimeout(pDefendTimerRef.current)
    if (rDefendTimerRef.current) clearTimeout(rDefendTimerRef.current)
    if (blockTremorTimerRef.current) clearTimeout(blockTremorTimerRef.current)
    if (losePhaseTimerRef.current) clearTimeout(losePhaseTimerRef.current)
    if (outcomeTimerRef.current) clearTimeout(outcomeTimerRef.current)
    if (outcomeModalTimerRef.current) clearTimeout(outcomeModalTimerRef.current)
    isGuardingRef.current = false
    isRivalGuardingRef.current = false
    setBlockTremor(false)

    const now = Date.now()
    setPAnimNonce(now)
    setRAnimNonce(now + 1)

    if (outcome === 'victory') {
      // 1. Defeated rival plays their LOSE animation first in full
      rAnimRef.current = 'lose'
      setRivalAnim('lose')
      playChampSound(rChamp, 'lose')

      // Player stands in idle pose watching the defeated opponent fall
      pAnimRef.current = 'idle'
      setPlayerAnim('idle')

      const rConfig = getChampionAnimConfig(rChamp.id)
      const loseDuration = rConfig?.durations?.lose || 2665

      // 2. AFTER the lose animation finishes and rival is down, the victor celebrates!
      losePhaseTimerRef.current = setTimeout(() => {
        // Freeze rival in defeated pose on the ground
        rAnimRef.current = 'lose_hold'
        setRivalAnim('lose_hold')

        // Victor starts victory celebration animation
        setPAnimNonce(Date.now())
        pAnimRef.current = 'victory'
        setPlayerAnim('victory')
        playChampSound(pChamp, 'victory')

        const pConfig = getChampionAnimConfig(pChamp.id)
        const victoryDuration = pConfig?.durations?.victory || 2952

        outcomeTimerRef.current = setTimeout(() => {
          // 3. AFTER victor finishes their celebration, trigger the epic VICTORY word animation!
          setShowVictoryWord(true)
          triggerShake(false)
          soundManager?.playVictory?.()
          onVictory?.(rChamp)

          // 4. Shortly following the VICTORY banner slam, display the victory rewards card
          outcomeModalTimerRef.current = setTimeout(() => {
            setBattleOutcome('victory')
          }, 1100)
        }, victoryDuration)
      }, loseDuration)
    } else {
      // Player is defeated: Player plays their LOSE animation first in full
      pAnimRef.current = 'lose'
      setPlayerAnim('lose')
      playChampSound(pChamp, 'lose')

      // Rival stands in idle watching the player fall
      rAnimRef.current = 'idle'
      setRivalAnim('idle')

      const pConfig = getChampionAnimConfig(pChamp.id)
      const loseDuration = pConfig?.durations?.lose || 2665

      losePhaseTimerRef.current = setTimeout(() => {
        // Freeze player in defeated pose on the ground
        pAnimRef.current = 'lose_hold'
        setPlayerAnim('lose_hold')

        // Rival celebrates victory!
        setRAnimNonce(Date.now())
        rAnimRef.current = 'victory'
        setRivalAnim('victory')
        playChampSound(rChamp, 'victory')

        const rConfig = getChampionAnimConfig(rChamp.id)
        const victoryDuration = rConfig?.durations?.victory || 2500

        outcomeTimerRef.current = setTimeout(() => {
          soundManager?.playArenaDefeat?.()
          setBattleOutcome('defeat')
          onDefeat?.(rChamp)
        }, victoryDuration)
      }, loseDuration)
    }
  }, [pChamp, rChamp, triggerShake, onVictory, onDefeat])

  // RIVAL AI: Defend / Block (handles tactical shield raising and block recoil)
  const handleRivalDefend = useCallback((isStart = true) => {
    if (battleEndedRef.current) return
    if (isStart) {
      if (isRivalGuardingRef.current) return
      isRivalGuardingRef.current = true
      setRAnimNonce(Date.now())
      rAnimRef.current = 'defend'
      setRivalAnim('defend')

      if (rDefendTimerRef.current) clearTimeout(rDefendTimerRef.current)
      const rConfig = getChampionAnimConfig(rChamp.id)
      const defendDuration = rConfig?.durations?.defend || 300

      rDefendTimerRef.current = setTimeout(() => {
        if (isRivalGuardingRef.current && rAnimRef.current === 'defend') {
          rAnimRef.current = 'defend_hold'
          setRivalAnim('defend_hold')
        }
      }, defendDuration)
    } else {
      if (rDefendTimerRef.current) clearTimeout(rDefendTimerRef.current)
      isRivalGuardingRef.current = false
      if (!battleEndedRef.current && (rAnimRef.current === 'defend' || rAnimRef.current === 'defend_hold')) {
        rAnimRef.current = 'idle'
        setRivalAnim('idle')
      }
    }
  }, [rChamp])

  // ==============================================================================
  // COMBAT ACTIONS (K, L, I, O, SPACE) - SYNCHRONIZED TO EXACT WEBP DURATIONS
  // ==============================================================================

  // ACTION 1: Attack 1 (Key: K) - Light Attack / Fast Strike
  const handleTriggerAttack1 = useCallback(() => {
    if (isActionLockedRef.current || pJumpTimerRef.current.active || battleEndedRef.current) return
    isActionLockedRef.current = true

    const pConfig = getChampionAnimConfig(pChamp.id)
    const totalDuration = pConfig.durations.attack1
    const impactDelay = pConfig.impactDelays?.attack1 || Math.round(totalDuration / 2)

    const nonce = Date.now()
    setPAnimNonce(nonce)
    pAnimRef.current = 'attack1'
    setPlayerAnim('attack1')
    playChampSound(pChamp, 'attack1')
    soundManager?.playHeroAttack?.()

    if (pActionTimerRef.current) clearTimeout(pActionTimerRef.current)
    if (pImpactTimerRef.current) clearTimeout(pImpactTimerRef.current)
    if (pImpactTimer2Ref.current) clearTimeout(pImpactTimer2Ref.current)

    // 1. IMPACT: Triggers at the MIDPOINT of the attack animation (when the blade strikes the rival)
    pImpactTimerRef.current = setTimeout(() => {
      pImpactTimerRef.current = null

      // If player was interrupted by an incoming hit, cancel this strike!
      if (battleEndedRef.current || pAnimRef.current === 'hit' || pAnimRef.current === 'knockdown') {
        return
      }

      if (battleEndedRef.current) return
      const dist = Math.abs(pPosRef.current.x - rPosRef.current.x)
      const isFacing = (pFacingRef.current === 1 && pPosRef.current.x <= rPosRef.current.x) || (pFacingRef.current === -1 && pPosRef.current.x >= rPosRef.current.x)
      const inRange = dist <= pConfig.hitboxes.attack1 && isFacing

      if (inRange) {
        // INTERRUPT: Whoever attacks first lands; interrupt rival's pending attack immediately!
        if (rImpactTimerRef.current) {
          clearTimeout(rImpactTimerRef.current)
          rImpactTimerRef.current = null
        }
        if (rActionTimerRef.current) {
          clearTimeout(rActionTimerRef.current)
          rActionTimerRef.current = null
        }

        if (isRivalGuardingRef.current) {
          // Rival shields attack 1! Bilateral recoil & pushback
          const blockDmg = 20
          addFloatingText('rival', `🛡️ BLOQUEO! -${blockDmg}`, 'block')
          soundManager?.playShieldBlock?.()
          triggerShake(false)
          triggerBlockTremor()

          // Push defender (Rival) backward
          const rPushDir = rPosRef.current.x >= pPosRef.current.x ? 1 : -1
          rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + rPushDir * 3.2))
          setRPosX(rPosRef.current.x)

          // Recoil attacker (Player) backward
          pPosRef.current.x = Math.max(8, Math.min(94, pPosRef.current.x - rPushDir * 2.6))
          setPPosX(pPosRef.current.x)

          setPlayerFury((f) => Math.min(100, f + 8))

          setRivalHp((prev) => {
            const next = Math.max(0, prev - blockDmg)
            if (next <= 0) {
              handleBattleFinish('victory')
            }
            return next
          })
          return
        }

        const isCrit = Math.random() > 0.6
        const baseDmg = Math.round(pChamp.atk * 1.8 + Math.random() * 30)
        const finalDmg = isCrit ? Math.round(baseDmg * 1.5) : baseDmg

        addFloatingText('rival', isCrit ? `💥 -${finalDmg} CRÍT!` : `-${finalDmg}`, isCrit ? 'crit' : 'damage')
        triggerShake(false)
        registerCombo()

        // Rival plays full hit reaction (if not already grounded in knockdown)
        const rConfig = getChampionAnimConfig(rChamp.id)
        const rHitDur = rConfig.durations.hit

        if (rAnimRef.current !== 'knockdown') {
          playChampSound(rChamp, 'hit')
          setRAnimNonce(Date.now())
          rAnimRef.current = 'hit'
          setRivalAnim('hit')
        }

        setPlayerFury((f) => Math.min(100, f + 16))

        setRivalHp((prev) => {
          const next = Math.max(0, prev - finalDmg)
          if (next <= 0) {
            handleBattleFinish('victory')
          } else {
            if (rAnimRef.current !== 'knockdown') {
              if (rHitTimerRef.current) clearTimeout(rHitTimerRef.current)
              rHitTimerRef.current = setTimeout(() => {
                if (!battleEndedRef.current && rAnimRef.current === 'hit') {
                  rAnimRef.current = 'idle'
                  setRivalAnim('idle')
                }
              }, rHitDur)
            }
          }
          return next
        })
      } else {
        addFloatingText('player', '💨 ¡FUERA DE ALCANCE!', 'heal')
      }
    }, impactDelay)

    // 2. RECOVERY: At the end of the swing follow-through, unlock player controls and return to idle
    pActionTimerRef.current = setTimeout(() => {
      isActionLockedRef.current = false
      pActionTimerRef.current = null
      if (!battleEndedRef.current && pAnimRef.current === 'attack1') {
        pAnimRef.current = 'idle'
        setPlayerAnim('idle')
      }
    }, totalDuration)
  }, [pChamp, rChamp, addFloatingText, triggerShake, triggerBlockTremor, registerCombo, handleBattleFinish])

  // ACTION 2: Attack 2 (Key: L) - 2-Hit Combo: Hit 1 at beginning, Hit 2 at end of animation
  const handleTriggerAttack2 = useCallback(() => {
    if (isActionLockedRef.current || pJumpTimerRef.current.active || battleEndedRef.current) return
    isActionLockedRef.current = true

    const pConfig = getChampionAnimConfig(pChamp.id)
    const totalDuration = pConfig.durations.attack2
    const hit1Delay = pConfig.impactDelays?.attack2_hit1 || 350
    const hit2Delay = pConfig.impactDelays?.attack2_hit2 || (totalDuration - 250)

    const nonce = Date.now()
    setPAnimNonce(nonce)
    pAnimRef.current = 'attack2'
    setPlayerAnim('attack2')
    playChampSound(pChamp, 'attack2')
    soundManager?.playSwordSwing?.()

    if (pActionTimerRef.current) clearTimeout(pActionTimerRef.current)
    if (pImpactTimerRef.current) clearTimeout(pImpactTimerRef.current)
    if (pImpactTimer2Ref.current) clearTimeout(pImpactTimer2Ref.current)

    // Helper to execute each impact of Attack 2 during animation playback
    const executeAttack2Hit = (hitIndex) => {
      // If player was interrupted by an incoming hit, knockdown or battle ended, cancel this strike!
      if (battleEndedRef.current || pAnimRef.current === 'hit' || pAnimRef.current === 'knockdown') {
        return
      }

      const dist = Math.abs(pPosRef.current.x - rPosRef.current.x)
      const isFacing = (pFacingRef.current === 1 && pPosRef.current.x <= rPosRef.current.x) || (pFacingRef.current === -1 && pPosRef.current.x >= rPosRef.current.x)
      const inRange = dist <= pConfig.hitboxes.attack2 && isFacing

      if (inRange) {
        // INTERRUPT: Whoever attacks first lands; interrupt rival's pending attack immediately!
        if (rImpactTimerRef.current) {
          clearTimeout(rImpactTimerRef.current)
          rImpactTimerRef.current = null
        }
        if (rActionTimerRef.current) {
          clearTimeout(rActionTimerRef.current)
          rActionTimerRef.current = null
        }

        if (isRivalGuardingRef.current) {
          // Rival shields this hit! Bilateral recoil & pushback
          const blockDmg = hitIndex === 1 ? 15 : 22
          addFloatingText('rival', `🛡️ BLOQUEO! -${blockDmg}`, 'block')
          soundManager?.playShieldBlock?.()
          triggerShake(false)
          triggerBlockTremor()

          // Push defender (Rival) backward
          const rPushDir = rPosRef.current.x >= pPosRef.current.x ? 1 : -1
          const pushAmount = hitIndex === 1 ? 2.6 : 3.8
          const recoilAmount = hitIndex === 1 ? 2.0 : 3.0
          rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + rPushDir * pushAmount))
          setRPosX(rPosRef.current.x)

          // Recoil attacker (Player) backward
          pPosRef.current.x = Math.max(8, Math.min(94, pPosRef.current.x - rPushDir * recoilAmount))
          setPPosX(pPosRef.current.x)

          setPlayerFury((f) => Math.min(100, f + (hitIndex === 1 ? 6 : 8)))

          setRivalHp((prev) => {
            const next = Math.max(0, prev - blockDmg)
            if (next <= 0) {
              handleBattleFinish('victory')
            }
            return next
          })
          return
        }

        // Direct hit on rival
        soundManager?.playSwordSwing?.()
        const isHit2 = hitIndex === 2
        const isCrit = isHit2 && Math.random() > 0.45
        const baseDmg = isHit2
          ? Math.round(pChamp.atk * 1.8 + Math.random() * 30)
          : Math.round(pChamp.atk * 1.3 + Math.random() * 20)
        const finalDmg = isCrit ? Math.round(baseDmg * 1.4) : baseDmg

        // Pushback on rival: hit 2 produces a deeper knockback as the enemy drops
        const pushDir = pFacingRef.current
        const pushDist = isHit2 ? 5.6 : 2.4
        rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + pushDir * pushDist))
        setRPosX(rPosRef.current.x)

        const hitLabel = isCrit
          ? `💥 -${finalDmg} ¡DERRIBO CRÍTICO!`
          : isHit2
            ? `💥 -${finalDmg} ¡CAÍDA POR IMPACTO!`
            : `⚔️ -${finalDmg} 1ER TAJO!`
        addFloatingText('rival', hitLabel, (isCrit || isHit2) ? 'crit' : 'damage')
        triggerShake(isHit2)
        registerCombo()

        const rConfig = getChampionAnimConfig(rChamp.id)
        // Hit 2 knocks the rival down to the ground ('knockdown'); Hit 1 inflicts flinch ('hit')
        const reactAnim = isHit2 ? 'knockdown' : (rAnimRef.current === 'knockdown' ? 'knockdown' : 'hit')
        const reactDur = isHit2 ? rConfig.durations.knockdown : rConfig.durations.hit

        playChampSound(rChamp, reactAnim)
        if (isHit2) {
          soundManager?.playCriticalHit?.()
        }
        setRAnimNonce(Date.now())
        rAnimRef.current = reactAnim
        setRivalAnim(reactAnim)

        setPlayerFury((f) => Math.min(100, f + (isHit2 ? 16 : 10)))

        setRivalHp((prev) => {
          const next = Math.max(0, prev - finalDmg)
          if (next <= 0) {
            handleBattleFinish('victory')
          } else {
            if (rHitTimerRef.current) clearTimeout(rHitTimerRef.current)
            rHitTimerRef.current = setTimeout(() => {
              if (!battleEndedRef.current && (rAnimRef.current === 'hit' || rAnimRef.current === 'knockdown')) {
                rAnimRef.current = 'idle'
                setRivalAnim('idle')
              }
            }, reactDur)
          }
          return next
        })
      } else {
        addFloatingText('player', '💨 ¡FUERA DE ALCANCE!', 'heal')
      }
    }

    // 1. PRIMER IMPACTO: En el transcurso de la animación, al principio (hit1Delay)
    pImpactTimerRef.current = setTimeout(() => {
      pImpactTimerRef.current = null
      executeAttack2Hit(1)
    }, hit1Delay)

    // 2. SEGUNDO IMPACTO: En el transcurso de la animación, al final (hit2Delay)
    pImpactTimer2Ref.current = setTimeout(() => {
      pImpactTimer2Ref.current = null
      executeAttack2Hit(2)
    }, hit2Delay)

    // 3. RECUPERACIÓN / FIN DE ANIMACIÓN: Al completarse la duración total de la animación
    pActionTimerRef.current = setTimeout(() => {
      pActionTimerRef.current = null
      isActionLockedRef.current = false
      if (!battleEndedRef.current && pAnimRef.current === 'attack2') {
        pAnimRef.current = 'idle'
        setPlayerAnim('idle')
      }
    }, totalDuration)
  }, [pChamp, rChamp, addFloatingText, triggerShake, triggerBlockTremor, registerCombo, handleBattleFinish])

  // ACTION 3: Special / Ultimate Attack (Key: I)
  const handleTriggerSpecial = useCallback(() => {
    if (isActionLockedRef.current || pJumpTimerRef.current.active || battleEndedRef.current) return
    isActionLockedRef.current = true

    const pConfig = getChampionAnimConfig(pChamp.id)
    const totalDuration = pConfig.durations.special
    const impactDelay = pConfig.impactDelays?.special || Math.round(totalDuration / 2)

    const nonce = Date.now()
    setPAnimNonce(nonce)
    pAnimRef.current = 'special'
    setPlayerAnim('special')
    playChampSound(pChamp, 'special')
    soundManager?.playCriticalHit?.()
    soundManager?.playPurchaseFanfare?.()

    if (pActionTimerRef.current) clearTimeout(pActionTimerRef.current)
    if (pImpactTimerRef.current) clearTimeout(pImpactTimerRef.current)
    if (pImpactTimer2Ref.current) clearTimeout(pImpactTimer2Ref.current)

    // 1. IMPACT: Triggers at the MIDPOINT of the special animation (when the energy burst explodes)
    pImpactTimerRef.current = setTimeout(() => {
      pImpactTimerRef.current = null

      // If player was interrupted by an incoming hit, cancel this strike!
      if (battleEndedRef.current || pAnimRef.current === 'hit' || pAnimRef.current === 'knockdown') {
        return
      }

      if (battleEndedRef.current) return
      const dist = Math.abs(pPosRef.current.x - rPosRef.current.x)
      const isFacing = (pFacingRef.current === 1 && pPosRef.current.x <= rPosRef.current.x) || (pFacingRef.current === -1 && pPosRef.current.x >= rPosRef.current.x)
      const inRange = dist <= pConfig.hitboxes.special && isFacing

      if (inRange) {
        // INTERRUPT: Special interrupts rival immediately!
        if (rImpactTimerRef.current) {
          clearTimeout(rImpactTimerRef.current)
          rImpactTimerRef.current = null
        }
        if (rActionTimerRef.current) {
          clearTimeout(rActionTimerRef.current)
          rActionTimerRef.current = null
        }

        if (isRivalGuardingRef.current) {
          handleRivalDefend(false)
          soundManager?.playShieldBlock?.()
          triggerBlockTremor()
          addFloatingText('rival', '💥 ¡GUARDIA ROTA!', 'crit')
        }

        const finalDmg = Math.round(pChamp.atk * 6.2 + Math.random() * 70)

        // Devastating knockback
        const pushDir = pFacingRef.current
        rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + pushDir * 8))
        setRPosX(rPosRef.current.x)

        const skillTitle = pChamp.id === 'luke' ? '¡SENTENCIA CELESTIAL!' : '¡FURIA DEL CAOS!'
        addFloatingText('rival', `🔥 -${finalDmg} ${skillTitle}`, 'crit')
        triggerShake(true)
        registerCombo()

        const rConfig = getChampionAnimConfig(rChamp.id)
        const knockdownDur = rConfig.durations.knockdown

        playChampSound(rChamp, 'knockdown')
        setRAnimNonce(Date.now())
        rAnimRef.current = 'knockdown'
        setRivalAnim('knockdown')

        setPlayerFury(0)

        setRivalHp((prev) => {
          const next = Math.max(0, prev - finalDmg)
          if (next <= 0) {
            handleBattleFinish('victory')
          } else {
            if (rHitTimerRef.current) clearTimeout(rHitTimerRef.current)
            rHitTimerRef.current = setTimeout(() => {
              if (!battleEndedRef.current && rAnimRef.current === 'knockdown') {
                rAnimRef.current = 'idle'
                setRivalAnim('idle')
              }
            }, knockdownDur)
          }
          return next
        })
      } else {
        addFloatingText('player', '💨 ¡FUERA DE ALCANCE!', 'heal')
      }
    }, impactDelay)

    // 2. RECOVERY: When the full special burst finishes, unlock player actions and return to idle
    pActionTimerRef.current = setTimeout(() => {
      isActionLockedRef.current = false
      pActionTimerRef.current = null
      if (!battleEndedRef.current && pAnimRef.current === 'special') {
        pAnimRef.current = 'idle'
        setPlayerAnim('idle')
      }
    }, totalDuration)
  }, [pChamp, rChamp, addFloatingText, triggerShake, triggerBlockTremor, handleRivalDefend, registerCombo, handleBattleFinish])

  // ACTION 4: Defend / Block (Key: O or Key: S)
  const handleTriggerDefend = useCallback((isStart = true) => {
    if (battleEndedRef.current || pJumpTimerRef.current.active) return
    if (isStart) {
      if (isActionLockedRef.current) return
      if (isGuardingRef.current) return // Already guarding; ignore OS key repeat

      isGuardingRef.current = true
      setPAnimNonce(Date.now())
      pAnimRef.current = 'defend'
      setPlayerAnim('defend')

      if (pDefendTimerRef.current) clearTimeout(pDefendTimerRef.current)
      const pConfig = getChampionAnimConfig(pChamp.id)
      const defendDuration = pConfig?.durations?.defend || 300

      // Transition smoothly to frozen hold on the last frame once the animation reaches apex
      pDefendTimerRef.current = setTimeout(() => {
        if (isGuardingRef.current && pAnimRef.current === 'defend') {
          pAnimRef.current = 'defend_hold'
          setPlayerAnim('defend_hold')
        }
      }, defendDuration)
    } else {
      if (pDefendTimerRef.current) clearTimeout(pDefendTimerRef.current)
      isGuardingRef.current = false
      if (!isActionLockedRef.current && !pJumpTimerRef.current.active && (pAnimRef.current === 'defend' || pAnimRef.current === 'defend_hold')) {
        pAnimRef.current = 'idle'
        setPlayerAnim('idle')
      }
    }
  }, [pChamp])

  // JUMP (Key: Space or Key: W) - SYNCHRONIZED ~1.9s ARC & LANDING
  const handleTriggerJump = useCallback(() => {
    if (pJumpTimerRef.current.active || isActionLockedRef.current || battleEndedRef.current) return

    const pConfig = getChampionAnimConfig(pChamp.id)
    const jumpDuration = pConfig.durations.jump

    pJumpTimerRef.current = {
      active: true,
      startTime: performance.now(),
      duration: jumpDuration,
    }
    pPosRef.current.isJumping = true

    const nonce = Date.now()
    setPAnimNonce(nonce)
    pAnimRef.current = 'jump'
    setPlayerAnim('jump')
    playChampSound(pChamp, 'jump')
  }, [pChamp])

  // Mobile virtual joystick horizontal movement callback (-1 | 0 | 1)
  const handleJoystickMoveX = useCallback((dir) => {
    if (dir === -1) {
      keysDownRef.current['a'] = true
      keysDownRef.current['d'] = false
      setActiveKeys((prev) => ({ ...prev, a: true, d: false }))
    } else if (dir === 1) {
      keysDownRef.current['d'] = true
      keysDownRef.current['a'] = false
      setActiveKeys((prev) => ({ ...prev, d: true, a: false }))
    } else {
      keysDownRef.current['a'] = false
      keysDownRef.current['d'] = false
      setActiveKeys((prev) => ({ ...prev, a: false, d: false }))
    }
  }, [])

  // Swap controlled champion (Luke <-> Malakor)
  const handleSwapControlledChampion = () => {
    soundManager?.playClick?.()
    if (pActionTimerRef.current) clearTimeout(pActionTimerRef.current)
    if (pImpactTimerRef.current) clearTimeout(pImpactTimerRef.current)
    if (pImpactTimer2Ref.current) clearTimeout(pImpactTimer2Ref.current)
    if (rActionTimerRef.current) clearTimeout(rActionTimerRef.current)
    if (rImpactTimerRef.current) clearTimeout(rImpactTimerRef.current)
    if (pHitTimerRef.current) clearTimeout(pHitTimerRef.current)
    if (rHitTimerRef.current) clearTimeout(rHitTimerRef.current)
    if (losePhaseTimerRef.current) clearTimeout(losePhaseTimerRef.current)
    if (outcomeTimerRef.current) clearTimeout(outcomeTimerRef.current)
    if (outcomeModalTimerRef.current) clearTimeout(outcomeModalTimerRef.current)
    if (pDefendTimerRef.current) clearTimeout(pDefendTimerRef.current)
    if (rDefendTimerRef.current) clearTimeout(rDefendTimerRef.current)
    if (blockTremorTimerRef.current) clearTimeout(blockTremorTimerRef.current)
    isActionLockedRef.current = false
    isGuardingRef.current = false
    isRivalGuardingRef.current = false
    setBlockTremor(false)
    pJumpTimerRef.current = { active: false, startTime: 0, duration: 0 }

    const tempP = pChamp
    const tempR = rChamp
    setPChamp(tempR)
    setRChamp(tempP)
    setPlayerHp(tempR.hp || 5000)
    setRivalHp(tempP.hp || 4800)
    pPosRef.current = { x: 41, y: 0, velY: 0, isJumping: false }
    rPosRef.current = { x: 59, y: 0, velY: 0 }
    setPPosX(41)
    setPPosY(0)
    setRPosX(59)
    setRPosY(0)
    pAnimRef.current = 'idle'
    rAnimRef.current = 'idle'
    setPlayerAnim('idle')
    setRivalAnim('idle')
    const now = Date.now()
    setPAnimNonce(now)
    setRAnimNonce(now)
  }

  // ==============================================================================
  // KEYBOARD INPUT EVENT LISTENERS (W, A, S, D, SPACE, K, L, I, O)
  // ==============================================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing inside text fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return

      const key = e.key.toLowerCase()
      const code = e.code

      if (code === 'Space' || key === ' ') {
        e.preventDefault()
        keysDownRef.current['space'] = true
        setActiveKeys((prev) => ({ ...prev, space: true }))
        handleTriggerJump()
        return
      }

      if (key === 'w' || code === 'KeyW' || code === 'ArrowUp') {
        e.preventDefault()
        keysDownRef.current['w'] = true
        setActiveKeys((prev) => ({ ...prev, w: true }))
        handleTriggerJump()
      } else if (key === 'a' || code === 'KeyA' || code === 'ArrowLeft') {
        keysDownRef.current['a'] = true
        setActiveKeys((prev) => ({ ...prev, a: true }))
      } else if (key === 'd' || code === 'KeyD' || code === 'ArrowRight') {
        keysDownRef.current['d'] = true
        setActiveKeys((prev) => ({ ...prev, d: true }))
      } else if (key === 's' || code === 'KeyS' || code === 'ArrowDown') {
        e.preventDefault()
        keysDownRef.current['s'] = true
        setActiveKeys((prev) => ({ ...prev, s: true }))
        handleTriggerDefend(true)
      } else if (key === 'k' || code === 'KeyK') {
        keysDownRef.current['k'] = true
        setActiveKeys((prev) => ({ ...prev, k: true }))
        handleTriggerAttack1()
      } else if (key === 'l' || code === 'KeyL') {
        keysDownRef.current['l'] = true
        setActiveKeys((prev) => ({ ...prev, l: true }))
        handleTriggerAttack2()
      } else if (key === 'i' || code === 'KeyI') {
        keysDownRef.current['i'] = true
        setActiveKeys((prev) => ({ ...prev, i: true }))
        handleTriggerSpecial()
      } else if (key === 'o' || code === 'KeyO') {
        keysDownRef.current['o'] = true
        setActiveKeys((prev) => ({ ...prev, o: true }))
        handleTriggerDefend(true)
      }
    }

    const handleKeyUp = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return

      const key = e.key.toLowerCase()
      const code = e.code

      if (code === 'Space' || key === ' ') {
        keysDownRef.current['space'] = false
        setActiveKeys((prev) => ({ ...prev, space: false }))
      } else if (key === 'w' || code === 'KeyW' || code === 'ArrowUp') {
        keysDownRef.current['w'] = false
        setActiveKeys((prev) => ({ ...prev, w: false }))
      } else if (key === 'a' || code === 'KeyA' || code === 'ArrowLeft') {
        keysDownRef.current['a'] = false
        setActiveKeys((prev) => ({ ...prev, a: false }))
      } else if (key === 'd' || code === 'KeyD' || code === 'ArrowRight') {
        keysDownRef.current['d'] = false
        setActiveKeys((prev) => ({ ...prev, d: false }))
      } else if (key === 's' || code === 'KeyS' || code === 'ArrowDown') {
        keysDownRef.current['s'] = false
        setActiveKeys((prev) => ({ ...prev, s: false }))
        handleTriggerDefend(false)
      } else if (key === 'k' || code === 'KeyK') {
        keysDownRef.current['k'] = false
        setActiveKeys((prev) => ({ ...prev, k: false }))
      } else if (key === 'l' || code === 'KeyL') {
        keysDownRef.current['l'] = false
        setActiveKeys((prev) => ({ ...prev, l: false }))
      } else if (key === 'i' || code === 'KeyI') {
        keysDownRef.current['i'] = false
        setActiveKeys((prev) => ({ ...prev, i: false }))
      } else if (key === 'o' || code === 'KeyO') {
        keysDownRef.current['o'] = false
        setActiveKeys((prev) => ({ ...prev, o: false }))
        handleTriggerDefend(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleTriggerAttack1, handleTriggerAttack2, handleTriggerSpecial, handleTriggerDefend, handleTriggerJump])

  // ==============================================================================
  // 60 FPS REAL-TIME ARCADE PHYSICS & OPPONENT AI LOOP
  // ==============================================================================
  useEffect(() => {
    let animFrameId
    let lastTime = performance.now()

    const physicsLoop = (time) => {
      const dt = Math.min(32, time - lastTime)
      lastTime = time

      if (!battleEndedRef.current) {
        // 1. Player Horizontal Movement (A and D)
        const isJumping = pJumpTimerRef.current.active
        // Ground speed: 0.55. Air speed: 0.18 (+15% air speed, prevents excessive flying while allowing agile repositions)
        const moveSpeed = isJumping ? 0.18 : 0.55
        let isMoving = false

        // Can navigate horizontally if not locked by attack or guard
        if (!isActionLockedRef.current && !isGuardingRef.current) {
          const bodyBuffer = 3.6 // Minimum spacing to prevent ghost body clipping while on ground
          if (keysDownRef.current['a']) {
            const minX = (!isJumping && pPosRef.current.x > rPosRef.current.x)
              ? Math.max(6, rPosRef.current.x + bodyBuffer)
              : 6
            pPosRef.current.x = Math.max(minX, pPosRef.current.x - moveSpeed)
            isMoving = true
            pFacingRef.current = -1
          } else if (keysDownRef.current['d']) {
            const maxX = (!isJumping && pPosRef.current.x < rPosRef.current.x)
              ? Math.min(94, rPosRef.current.x - bodyBuffer)
              : 94
            pPosRef.current.x = Math.min(maxX, pPosRef.current.x + moveSpeed)
            isMoving = true
            pFacingRef.current = 1
          }
        }

        // Automatic face-to-face orientation when stopping and on ground
        if (!isMoving && !isJumping) {
          pFacingRef.current = pPosRef.current.x <= rPosRef.current.x ? 1 : -1
        }
        rFacingRef.current = rPosRef.current.x >= pPosRef.current.x ? -1 : 1

        // Movement footsteps audio
        if (isMoving && !isJumping) {
          if (time - runSoundTimeRef.current > 380) {
            runSoundTimeRef.current = time
            playChampSound(pChamp, 'run')
          }
        }

        // 2. Player Vertical Jump Physics & Full Animation Cycle (+15% height: 28px -> 32.2px)
        if (isJumping) {
          const elapsed = time - pJumpTimerRef.current.startTime
          const totalJumpDur = pJumpTimerRef.current.duration

          if (elapsed < totalJumpDur) {
            // Calibrated athletic jump elevation:
            // Combines baked-in vertical sprite frame rise with 32.2px CSS elevation apex
            const anticipation = totalJumpDur * 0.09
            const flightEnd = totalJumpDur * 0.78
            if (elapsed < anticipation) {
              pPosRef.current.y = 0
            } else if (elapsed < flightEnd) {
              const flightProgress = (elapsed - anticipation) / (flightEnd - anticipation)
              pPosRef.current.y = Math.sin(flightProgress * Math.PI) * 32.2
            } else {
              pPosRef.current.y = 0
            }

            // Lock animation strictly to 'jump' so it is never overwritten by movement
            pAnimRef.current = 'jump'
          } else {
            // Jump completed its full ~1900ms cycle!
            pJumpTimerRef.current.active = false
            pPosRef.current.isJumping = false
            pPosRef.current.y = 0
            if (!isActionLockedRef.current && !isGuardingRef.current) {
              pAnimRef.current = isMoving ? 'run' : 'idle'
              setPlayerAnim(pAnimRef.current)
            }
          }
        }

        // 3. Update Player Animation State (Only when NOT locked by attack/hit/jump/guard)
        if (!isActionLockedRef.current && !isGuardingRef.current && !pJumpTimerRef.current.active) {
          if (isMoving) {
            if (pAnimRef.current !== 'run') {
              pAnimRef.current = 'run'
              setPlayerAnim('run')
            }
          } else {
            if (pAnimRef.current !== 'idle') {
              pAnimRef.current = 'idle'
              setPlayerAnim('idle')
            }
          }
        }

        // 4. Rival Interactive AI (Moves, tracks and counters in close melee)
        const dist = Math.abs(pPosRef.current.x - rPosRef.current.x)

        if (rAnimRef.current === 'idle' || rAnimRef.current === 'run') {
          // Both are melee: rival aggressively closes the distance to close melee striking range (5.5%)
          if (dist > 5.5) {
            const dir = pPosRef.current.x < rPosRef.current.x ? -0.22 : 0.22
            rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + dir))
            if (rAnimRef.current !== 'run') {
              rAnimRef.current = 'run'
              setRivalAnim('run')
            }
          } else if (dist < 3.6) {
            // Slight separation if overlapping bodies too closely
            const dir = pPosRef.current.x < rPosRef.current.x ? 0.12 : -0.12
            rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + dir))
          } else {
            if (rAnimRef.current !== 'idle') {
              rAnimRef.current = 'idle'
              setRivalAnim('idle')
            }
          }
        }

        // Rival Tactical Guard AI Trigger (chance to guard for ~850ms when in close melee range)
        if (time - rivalGuardTimerRef.current > 3400 && dist <= 5.8 && rAnimRef.current === 'idle' && !isRivalGuardingRef.current) {
          rivalGuardTimerRef.current = time
          if (Math.random() < 0.32) {
            handleRivalDefend(true)
            setTimeout(() => {
              if (!battleEndedRef.current && isRivalGuardingRef.current) {
                handleRivalDefend(false)
              }
            }, 850)
          }
        }

        // Rival Attack AI Trigger (strikes every ~2.6s when strictly in close melee range <= 5.8%)
        if (time - rivalAiTimerRef.current > 2600 && dist <= 5.8 && rAnimRef.current === 'idle' && !isRivalGuardingRef.current) {
          rivalAiTimerRef.current = time
          
          const rConfig = getChampionAnimConfig(rChamp.id)
          const rAttackDur = rConfig.durations.attack1
          const rImpactDelay = rConfig.impactDelays?.attack1 || Math.round(rAttackDur / 2)

          const rNonce = Date.now()
          setRAnimNonce(rNonce)
          rAnimRef.current = 'attack1'
          setRivalAnim('attack1')
          playChampSound(rChamp, 'attack1')
          soundManager?.playEnemyAttack?.('orc')

          if (rActionTimerRef.current) clearTimeout(rActionTimerRef.current)
          if (rImpactTimerRef.current) clearTimeout(rImpactTimerRef.current)

          // 1. Rival impact triggers at the MIDPOINT of the attack animation (when the blade hits)
          rImpactTimerRef.current = setTimeout(() => {
            rImpactTimerRef.current = null

            // If rival was interrupted by a player hit, cancel rival's strike!
            if (battleEndedRef.current || rAnimRef.current === 'hit' || rAnimRef.current === 'knockdown') {
              return
            }

            if (battleEndedRef.current) return

            const currentDist = Math.abs(pPosRef.current.x - rPosRef.current.x)
            const currentRConfig = getChampionAnimConfig(rChamp.id)

            // Strict melee verification at moment of impact: if player backed away, attack misses
            if (currentDist > currentRConfig.hitboxes.attack1) {
              addFloatingText('rival', '💨 ¡FALLADO!', 'heal')
              return
            }

            // If player is airborne high, rival attack misses!
            if (pPosRef.current.y > 14) {
              addFloatingText('player', '💨 ¡ESQUIVADO!', 'heal')
            } else if (isGuardingRef.current) {
              // Player shields the attack! Bilateral recoil & pushback
              const blockDmg = 25
              addFloatingText('player', `🛡️ BLOQUEO! -${blockDmg}`, 'block')
              soundManager?.playShieldBlock?.()
              triggerShake(false)
              triggerBlockTremor()

              // Bilateral pushback & recoil:
              // Push Player (defender) backward away from Rival
              const pPushDir = pPosRef.current.x <= rPosRef.current.x ? -1 : 1
              pPosRef.current.x = Math.max(8, Math.min(94, pPosRef.current.x + pPushDir * 3.2))
              setPPosX(pPosRef.current.x)

              // Recoil Rival (attacker) backward away from Player
              rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x - pPushDir * 2.6))
              setRPosX(rPosRef.current.x)

              setRivalFury((f) => Math.min(100, f + 8))

              setPlayerHp((prev) => {
                const next = Math.max(0, prev - blockDmg)
                if (next <= 0) {
                  handleBattleFinish('defeat')
                }
                return next
              })
            } else {
              // Direct hit on player: INTERRUPT player's pending attack!
              if (pImpactTimerRef.current) {
                clearTimeout(pImpactTimerRef.current)
                pImpactTimerRef.current = null
              }
              if (pImpactTimer2Ref.current) {
                clearTimeout(pImpactTimer2Ref.current)
                pImpactTimer2Ref.current = null
              }
              if (pActionTimerRef.current) {
                clearTimeout(pActionTimerRef.current)
                pActionTimerRef.current = null
              }

              const hitDmg = Math.round(rChamp.atk * 1.5 + Math.random() * 25)
              addFloatingText('player', `-${hitDmg}`, 'damage')
              triggerShake(false)
              playChampSound(pChamp, 'hit')

              const pConfig = getChampionAnimConfig(pChamp.id)
              const pHitDur = pConfig.durations.hit

              isActionLockedRef.current = true
              setPAnimNonce(Date.now())
              pAnimRef.current = 'hit'
              setPlayerAnim('hit')

              setPlayerHp((prev) => {
                const next = Math.max(0, prev - hitDmg)
                if (next <= 0) {
                  handleBattleFinish('defeat')
                }
                else {
                  if (pHitTimerRef.current) clearTimeout(pHitTimerRef.current)
                  pHitTimerRef.current = setTimeout(() => {
                    isActionLockedRef.current = false
                    if (!battleEndedRef.current && pAnimRef.current === 'hit') {
                      pAnimRef.current = 'idle'
                      setPlayerAnim('idle')
                    }
                  }, pHitDur)
                }
                return next
              })
            }
          }, rImpactDelay)

          // 2. Rival recovery: returns to idle when the full attack animation finishes
          rActionTimerRef.current = setTimeout(() => {
            rActionTimerRef.current = null
            if (!battleEndedRef.current && rAnimRef.current === 'attack1') {
              rAnimRef.current = 'idle'
              setRivalAnim('idle')
            }
          }, rAttackDur)
        }

        // Commit coordinates to state for smooth transform updates
        setPPosX(pPosRef.current.x)
        setPPosY(pPosRef.current.y)
        setPFacing(pFacingRef.current)

        setRPosX(rPosRef.current.x)
        setRPosY(rPosRef.current.y)
        setRFacing(rFacingRef.current)
      }

      animFrameId = requestAnimationFrame(physicsLoop)
    }

    animFrameId = requestAnimationFrame(physicsLoop)
    return () => cancelAnimationFrame(animFrameId)
  }, [pChamp, rChamp, triggerShake, triggerBlockTremor, handleRivalDefend, addFloatingText, handleBattleFinish])

  const handleExitClick = () => {
    soundManager?.playClick?.()
    if (outcomeTimerRef.current) clearTimeout(outcomeTimerRef.current)
    if (outcomeModalTimerRef.current) clearTimeout(outcomeModalTimerRef.current)
    setShowVictoryWord(false)
    setBattleOutcome(null)
    onExitBattle?.()
  }

  const handleToggleSound = () => {
    const next = soundManager?.toggleSound?.()
    setSoundActive(next)
  }

  // Distances & health percentages
  const liveDist = Math.abs(pPosX - rPosX)
  const isInStrikingRange = liveDist <= 5.8
  const pHealthPercent = Math.max(0, Math.round((playerHp / maxPlayerHp) * 100))
  const rHealthPercent = Math.max(0, Math.round((rivalHp / maxRivalHp) * 100))

  return (
    <div className="battle-scene-wrapper">
      <div className={`battle-map-scene ${shakeScreen ? 'shake-viewport' : ''} ${shakeHeavy ? 'shake-heavy' : ''}`}>
      {/* Background Atmosphere Layers */}
      <div className="battle-map-vignette" />
      <div className="battle-map-horizon-fog" />

      {/* TOP BAR HUD */}
      <header className="battle-hud-top">
        {/* Left: Exit button */}
        <button 
          id="btn-exit-battle"
          className="battle-exit-btn"
          onClick={handleExitClick}
          title="Salir de la escena de batalla"
        >
          <ArrowLeft size={18} />
          <span>Salir</span>
        </button>

        {/* Center: Fighter Control Info & Swap */}
        <div className="battle-center-header-badge">
          <button 
            type="button"
            className="battle-swap-ctrl-btn"
            onClick={handleSwapControlledChampion}
            title="Haz clic para alternar el luchador que controlas"
          >
            <RefreshCw size={13} className="swap-icon" />
            <span>Luchador Activo: <strong>{pChamp.name}</strong></span>
            <span className="swap-hint-tag">Cambiar</span>
          </button>
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

        {/* VS / COMBO INDICATOR IN CENTER */}
        <div className="battle-vs-emblem">
          {comboCount > 1 ? (
            <span className="combo-counter-txt">x{comboCount}</span>
          ) : (
            <>
              <span className="vs-txt-v">V</span>
              <span className="vs-txt-s">S</span>
            </>
          )}
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
      {/* 3D MAP ARENA FLOOR WITH DYNAMIC 2D FIGHTERS & JUMP ELEVATION */}
      {/* ==================================================================== */}
      <main className={`battle-arena-ground ${blockTremor ? 'block-impact-tremor' : ''}`}>
        {/* PLAYER FIGHTER (Controlled: Malakor / Kael) */}
        <div 
          className={`arena-fighter-slot player-slot anim-${playerAnim}`}
          style={{
            left: `${pPosX}%`,
            transform: `translateX(-50%) translateY(${-pPosY}px)`,
          }}
        >
          {/* Floating Damage Numbers */}
          <div className="arena-float-anchor">
            {floatingTexts.filter((t) => t.target === 'player').map((item) => (
              <div key={item.id} className={`floating-hit-tag ${item.type}`}>
                {item.text}
              </div>
            ))}
          </div>

          {/* Character Dynamic Sprite with Mirror Facing */}
          <div className="fighter-avatar-wrapper">
            {/* Ground contact shadow scales with jump height */}
            <div 
              className="fighter-ground-shadow" 
              style={{
                transform: `scale(${Math.max(0.45, 1 - pPosY / 55)})`,
                opacity: Math.max(0.3, 1 - pPosY / 45),
              }}
            />
            <div className="fighter-aura-glow" style={{ background: pChamp.color }} />
            {(() => {
              const visual = getFighterVisual(pChamp, playerAnim)
              const isAction = ['attack1', 'attack2', 'special', 'jump', 'hit', 'defend', 'defend_hold', 'knockdown', 'victory', 'lose', 'lose_hold'].includes(playerAnim)
              const src = isAction ? `${visual}?v=${pAnimNonce}` : visual
              return (
                <img 
                  key={`${pChamp.id}-${playerAnim}-${isAction ? pAnimNonce : 'loop'}`}
                  src={src} 
                  alt={pChamp.name} 
                  className={`fighter-idle-sprite player-sprite state-${playerAnim}`}
                  style={{ transform: `scaleX(${pFacing})` }}
                  draggable="false" 
                />
              )
            })()}
          </div>

          <div className="fighter-pedestal-label">
            <span>{pChamp.name} (TÚ)</span>
          </div>
        </div>

        {/* RIVAL FIGHTER */}
        <div 
          className={`arena-fighter-slot rival-slot anim-${rivalAnim}`}
          style={{
            left: `${rPosX}%`,
            transform: `translateX(-50%) translateY(${-rPosY}px)`,
          }}
        >
          {/* Floating Damage Numbers */}
          <div className="arena-float-anchor">
            {floatingTexts.filter((t) => t.target === 'rival').map((item) => (
              <div key={item.id} className={`floating-hit-tag ${item.type}`}>
                {item.text}
              </div>
            ))}
          </div>

          <div className="fighter-avatar-wrapper">
            <div 
              className="fighter-ground-shadow" 
              style={{
                transform: `scale(${Math.max(0.35, 1 - rPosY / 120)})`,
                opacity: Math.max(0.2, 1 - rPosY / 90),
              }}
            />
            <div className="fighter-aura-glow" style={{ background: rChamp.color }} />
            {(() => {
              const visual = getFighterVisual(rChamp, rivalAnim)
              const isAction = ['attack1', 'attack2', 'special', 'jump', 'hit', 'defend', 'defend_hold', 'knockdown', 'victory', 'lose', 'lose_hold'].includes(rivalAnim)
              const src = isAction ? `${visual}?v=${rAnimNonce}` : visual
              return (
                <img 
                  key={`${rChamp.id}-${rivalAnim}-${isAction ? rAnimNonce : 'loop'}`}
                  src={src} 
                  alt={rChamp.name} 
                  className={`fighter-idle-sprite rival-sprite state-${rivalAnim}`}
                  style={{ transform: `scaleX(${rFacing})` }}
                  draggable="false" 
                />
              )
            })()}
          </div>

          <div className="fighter-pedestal-label rival-pedestal">
            <span>{rChamp.name}</span>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* ARCADE CONTROLS DOCK: WASD + SPACE (D-PAD) & K, L, I, O (ACTIONS) */}
      {/* ==================================================================== */}
      <footer className="battle-action-dock arcade-dock">
        <div className="arcade-controller-wrapper">
          {/* MOBILE: VIRTUAL TOUCH JOYSTICK (60 FPS Analog Left/Right/Jump/Guard) */}
          <div className="arcade-mobile-joystick-wrap">
            <VirtualJoystick
              onMoveX={handleJoystickMoveX}
              onJump={handleTriggerJump}
              onDefend={handleTriggerDefend}
              disabled={battleOutcome !== null}
            />
          </div>

          {/* DESKTOP: D-PAD & JUMP (W, A, S, D, SPACE) */}
          <div className="arcade-cluster arcade-dpad-cluster arcade-desktop-dpad-wrap">
            <div className="arcade-cluster-title">
              <span>MOVIMIENTO • WASD</span>
            </div>

            <div className="arcade-dpad-grid">
              {/* Row 1: W (Up / Leap) */}
              <div className="dpad-row dpad-row-top">
                <button
                  type="button"
                  className={`arcade-btn dpad-btn btn-w ${activeKeys.w ? 'is-pressed' : ''}`}
                  onMouseDown={handleTriggerJump}
                  onTouchStart={handleTriggerJump}
                  title="Salto / Impulso (W / Flecha Arriba)"
                >
                  <span className="arcade-key-badge">W</span>
                  <ChevronUp size={16} />
                </button>
              </div>

              {/* Row 2: A, S, D */}
              <div className="dpad-row dpad-row-mid">
                <button
                  type="button"
                  className={`arcade-btn dpad-btn btn-a ${activeKeys.a ? 'is-pressed' : ''}`}
                  onMouseDown={() => {
                    keysDownRef.current['a'] = true
                    setActiveKeys((prev) => ({ ...prev, a: true }))
                  }}
                  onMouseUp={() => {
                    keysDownRef.current['a'] = false
                    setActiveKeys((prev) => ({ ...prev, a: false }))
                  }}
                  onTouchStart={() => {
                    keysDownRef.current['a'] = true
                    setActiveKeys((prev) => ({ ...prev, a: true }))
                  }}
                  onTouchEnd={() => {
                    keysDownRef.current['a'] = false
                    setActiveKeys((prev) => ({ ...prev, a: false }))
                  }}
                  title="Mover a la Izquierda (A / Flecha Izq)"
                >
                  <span className="arcade-key-badge">A</span>
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  className={`arcade-btn dpad-btn btn-s ${activeKeys.s ? 'is-pressed' : ''}`}
                  onMouseDown={() => handleTriggerDefend(true)}
                  onMouseUp={() => handleTriggerDefend(false)}
                  onTouchStart={() => handleTriggerDefend(true)}
                  onTouchEnd={() => handleTriggerDefend(false)}
                  title="Agacharse / Guardia (S / Flecha Abajo)"
                >
                  <span className="arcade-key-badge">S</span>
                  <ChevronDown size={16} />
                </button>

                <button
                  type="button"
                  className={`arcade-btn dpad-btn btn-d ${activeKeys.d ? 'is-pressed' : ''}`}
                  onMouseDown={() => {
                    keysDownRef.current['d'] = true
                    setActiveKeys((prev) => ({ ...prev, d: true }))
                  }}
                  onMouseUp={() => {
                    keysDownRef.current['d'] = false
                    setActiveKeys((prev) => ({ ...prev, d: false }))
                  }}
                  onTouchStart={() => {
                    keysDownRef.current['d'] = true
                    setActiveKeys((prev) => ({ ...prev, d: true }))
                  }}
                  onTouchEnd={() => {
                    keysDownRef.current['d'] = false
                    setActiveKeys((prev) => ({ ...prev, d: false }))
                  }}
                  title="Mover a la Derecha (D / Flecha Der)"
                >
                  <span className="arcade-key-badge">D</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Row 3: SPACE (Jump Bar) */}
              <div className="dpad-row dpad-row-space">
                <button
                  type="button"
                  className={`arcade-btn space-bar-btn ${activeKeys.space ? 'is-pressed' : ''}`}
                  onMouseDown={handleTriggerJump}
                  onTouchStart={handleTriggerJump}
                  title="Saltar (Barra Espaciadora)"
                >
                  <span className="arcade-key-badge space-badge">ESPACIO</span>
                  <span className="space-label">SALTAR</span>
                </button>
              </div>
            </div>
          </div>

          {/* CENTER: BATTLE RADAR & RANGE INDICATOR */}
          <div className="arcade-center-status">
            <div className={`range-radar-pill ${isInStrikingRange ? 'in-range' : ''}`}>
              <Crosshair size={14} className="radar-icon" />
              <span>Distancia Melee: <strong>{liveDist.toFixed(1)}%</strong></span>
              {isInStrikingRange ? (
                <span className="strike-ready-tag">¡RANGO MELEE!</span>
              ) : (
                <span className="out-of-range-tag">FUERA DE ALCANCE</span>
              )}
            </div>

            <div className="arcade-quick-legend">
              <span className="legend-chip"><strong>W, A, S, D</strong> Movimiento</span>
              <span className="legend-chip"><strong>ESPACIO</strong> Salto</span>
              <span className="legend-chip"><strong>K, L</strong> Ataques</span>
              <span className="legend-chip"><strong>I</strong> Especial</span>
              <span className="legend-chip"><strong>O</strong> Bloqueo</span>
            </div>
          </div>

          {/* RIGHT: COMBAT ACTIONS (K, L, I, O) + MOBILE JUMP */}
          <div className="arcade-cluster arcade-actions-cluster">
            <div className="arcade-cluster-title">
              <span>ACCIONES • K L I O</span>
            </div>

            <div className="arcade-actions-diamond">
              {/* TOP: I (Special Attack) + Mobile Jump */}
              <div className="action-row action-row-top">
                {/* Mobile Jump Button */}
                <button
                  type="button"
                  className={`arcade-action-btn btn-jump-mobile ${(activeKeys.space || activeKeys.w) ? 'is-pressed' : ''}`}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    handleTriggerJump()
                  }}
                  title="Salto Táctico"
                >
                  <div className="action-key-header">
                    <span className="arcade-key-badge badge-gold">▲</span>
                    <ChevronUp size={15} />
                  </div>
                  <span className="action-btn-title">SALTAR</span>
                  <span className="action-btn-sub">Impulso</span>
                </button>

                <button
                  type="button"
                  className={`arcade-action-btn btn-special-i ${activeKeys.i ? 'is-pressed' : ''} ${playerFury >= 100 ? 'is-ready' : ''}`}
                  onClick={handleTriggerSpecial}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      e.preventDefault()
                      handleTriggerSpecial()
                    }
                  }}
                  title="Ataque Especial Furia del Caos (Tecla I)"
                >
                  <div className="action-key-header">
                    <span className="arcade-key-badge badge-red">I</span>
                    <Flame size={15} className="flame-pulse-icon" />
                  </div>
                  <span className="action-btn-title">ESPECIAL</span>
                  <span className="action-btn-sub">Furia Caos</span>
                </button>
              </div>

              {/* MIDDLE: K (Attack 1) and L (Attack 2) */}
              <div className="action-row action-row-mid">
                <button
                  type="button"
                  className={`arcade-action-btn btn-attack1-k ${activeKeys.k ? 'is-pressed' : ''}`}
                  onClick={handleTriggerAttack1}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      e.preventDefault()
                      handleTriggerAttack1()
                    }
                  }}
                  title="Ataque 1: Combo Ligero (Tecla K)"
                >
                  <div className="action-key-header">
                    <span className="arcade-key-badge badge-blue">K</span>
                    <Swords size={15} />
                  </div>
                  <span className="action-btn-title">ATAQUE 1</span>
                  <span className="action-btn-sub">Combo Ágil</span>
                </button>

                <button
                  type="button"
                  className={`arcade-action-btn btn-attack2-l ${activeKeys.l ? 'is-pressed' : ''}`}
                  onClick={handleTriggerAttack2}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      e.preventDefault()
                      handleTriggerAttack2()
                    }
                  }}
                  title="Ataque 2: Tajo Pesado (Tecla L)"
                >
                  <div className="action-key-header">
                    <span className="arcade-key-badge badge-amber">L</span>
                    <Zap size={15} />
                  </div>
                  <span className="action-btn-title">ATAQUE 2</span>
                  <span className="action-btn-sub">Tajo Fuerte</span>
                </button>
              </div>

              {/* BOTTOM: O (Defend / Shield) */}
              <div className="action-row action-row-bot">
                <button
                  type="button"
                  className={`arcade-action-btn btn-defend-o ${activeKeys.o ? 'is-pressed' : ''}`}
                  onMouseDown={() => handleTriggerDefend(true)}
                  onMouseUp={() => handleTriggerDefend(false)}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    handleTriggerDefend(true)
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    handleTriggerDefend(false)
                  }}
                  title="Defensa Táctica / Bloqueo con Escudo (Tecla O)"
                >
                  <div className="action-key-header">
                    <span className="arcade-key-badge badge-cyan">O</span>
                    <Shield size={15} />
                  </div>
                  <span className="action-btn-title">DEFENSA</span>
                  <span className="action-btn-sub">Guardia -80%</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ARCADE VICTORY WORD SLAM ANIMATION */}
        {showVictoryWord && (
          <div className={`arcade-victory-banner-wrap ${battleOutcome ? 'has-outcome' : ''}`}>
            <div className="victory-light-burst" />
            <div className="victory-spark-rays" />
            <div className="victory-word-box">
              <div className="victory-emblem-crown">👑</div>
              <h1 className="arcade-victory-text" data-text="VICTORY">VICTORY</h1>
              <div className="victory-ribbon-sub">
                <span>★ SUPREMACÍA EN LA ARENA ★</span>
              </div>
            </div>
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
                  ? `Tu campeón ${pChamp.name} ha demostrado su supremacía bélica sobre ${rChamp.name}.`
                  : `${rChamp.name} ha ganado el enfrentamiento. ¡Entrena y regresa más fuerte!`}
              </p>

              <button 
                type="button" 
                className="outcome-btn-exit"
                onClick={handleExitClick}
              >
                <ArrowLeft size={18} />
                <span>Continuar</span>
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  </div>
  )
}
