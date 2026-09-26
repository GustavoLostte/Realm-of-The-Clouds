import React, { useState, useEffect, useRef, useCallback } from 'react'
import { SeamlessSprite } from './SeamlessSprite'
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
  RefreshCw,
  RotateCcw,
  BookOpen,
  X
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
    if (anim === 'special2') return champ.animations.special2 || champ.animations.special || champ.animations.idle
    if (anim === 'defending' || anim === 'defend') return champ.animations.defend || champ.animations.idle
    if (anim === 'defend_hold') return champ.animations.defend_hold || champ.animations.defend || champ.animations.idle
    if (anim === 'defend_down') return champ.animations.defend_down || champ.animations.defend || champ.animations.down || champ.animations.idle
    if (anim === 'hit') return champ.animations.hit || champ.animations.idle
    if (anim === 'knockdown') return champ.animations.knockdown || champ.animations.idle
    if (anim === 'lose') return champ.animations.lose || champ.animations.knockdown || champ.animations.idle
    if (anim === 'lose_hold') return champ.animations.lose_hold || champ.animations.lose || champ.animations.idle
    if (anim === 'victory') return champ.animations.victory || champ.animations.idle
    if (anim === 'jump') return champ.animations.jump || champ.animations.idle
    if (anim === 'run') return champ.animations.run || champ.animations.walk || champ.animations.idle
    if (anim === 'walk') return champ.animations.walk || champ.animations.idle
    if (anim === 'dash_front') return champ.animations.dash_front || champ.animations.run || champ.animations.idle
    if (anim === 'dash_back') return champ.animations.dash_back || champ.animations.run || champ.animations.idle
    if (anim === 'down' || anim === 'crouch') return champ.animations.down || champ.animations.idle
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
  isTraining = false,
}) {
  // Default to Valiria as playable fighter (or passed champion)
  const initialPlayer = playerChampion || getChampionById('valiria')
  const initialRival = rivalChampion || getOpponentChampion(initialPlayer.id)

  const [pChamp, setPChamp] = useState(initialPlayer)
  const [rChamp, setRChamp] = useState(initialRival)

  const maxPlayerHp = pChamp.hp || 4800
  const maxRivalHp = rChamp.hp || 5000

  const [playerHp, setPlayerHp] = useState(maxPlayerHp)
  const [rivalHp, setRivalHp] = useState(maxRivalHp)
  const [playerFury, setPlayerFury] = useState(isTraining ? 100 : 35)
  const [rivalFury, setRivalFury] = useState(isTraining ? 100 : 20)

  // Training mode dummy AI, guide state, and quick reset
  const [dummyAiMode, setDummyAiMode] = useState('passive') // 'passive' | 'guard' | 'sparring'
  const dummyAiModeRef = useRef('passive')
  const [showMoveList, setShowMoveList] = useState(false)
  const resetTrainingRef = useRef(null)

  // Animation states & browser frame-zero decoders nonces
  const [playerAnim, setPlayerAnim] = useState('idle')
  const [rivalAnim, setRivalAnim] = useState('idle')
  const [pAnimNonce, setPAnimNonce] = useState(() => Date.now())
  const [rAnimNonce, setRAnimNonce] = useState(() => Date.now())

  // Real-time 2D Positions & Physics (Balanced melee engagement standoff: 30% vs 70%)
  const [pPosX, setPPosX] = useState(30) // percentage across battlefield width
  const [pPosY, setPPosY] = useState(0)  // vertical jump elevation in px
  const [pFacing, setPFacing] = useState(1) // 1 = right, -1 = left

  const [rPosX, setRPosX] = useState(70)
  const [rPosY, setRPosY] = useState(0)
  const [rFacing, setRFacing] = useState(-1)

  // Mobile layout & orientation detection for virtual touch joystick sizing
  const [screenMetrics, setScreenMetrics] = useState(() => ({
    isMobile: typeof window !== 'undefined' ? (window.innerWidth <= 950 || window.innerHeight <= 520) : false,
    isLandscape: typeof window !== 'undefined' ? (window.innerWidth > window.innerHeight && window.innerHeight <= 520) : false
  }))

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 950 || window.innerHeight <= 520
      const isLandscape = window.innerWidth > window.innerHeight && window.innerHeight <= 520
      setScreenMetrics({ isMobile, isLandscape })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    u: false,
    o: false,
  })

  // Mutable refs for 60 FPS physics game loop without React state closure lag
  const pPosRef = useRef({ x: 30, y: 0, velY: 0, isJumping: false })
  const rPosRef = useRef({ x: 70, y: 0, velY: 0 })
  const pFacingRef = useRef(1)
  const rFacingRef = useRef(-1)

  const pAnimRef = useRef('idle')
  const rAnimRef = useRef('idle')

  // Physical-pixel scaled combat distance for consistent gameplay across all screen sizes
  const getPixelDist = useCallback((percentDist) => {
    const screenW = typeof window !== 'undefined' ? (window.innerWidth || 1200) : 1200
    return (percentDist / 100) * screenW
  }, [])

  const getDynamicBuffer = useCallback(() => {
    const screenW = typeof window !== 'undefined' ? (window.innerWidth || 1200) : 1200
    return Math.max(4.0, Math.min(26.0, (96 / screenW) * 100))
  }, [])

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
  const pImpactTimer3Ref = useRef(null)
  const rActionTimerRef = useRef(null)
  const rImpactTimerRef = useRef(null)
  const pHitTimerRef = useRef(null)
  const rHitTimerRef = useRef(null)
  const pJumpTimerRef = useRef({ active: false, startTime: 0, duration: 0 })
  const pJumpCountRef = useRef(0)
  const pDashTimerRef = useRef({ active: false, type: null, startTime: 0, duration: 0, facingAtStart: 1 })
  const lastTapRef = useRef({ key: null, time: 0 })
  const dirHoldStartRef = useRef(0)
  const isRunningRef = useRef(false)
  const isCrouchingRef = useRef(false)
  const pDefendTimerRef = useRef(null)
  const rDefendTimerRef = useRef(null)
  const blockTremorTimerRef = useRef(null)
  const losePhaseTimerRef = useRef(null)
  const outcomeTimerRef = useRef(null)
  const outcomeModalTimerRef = useRef(null)

  // Play active combat music on scene entry & restore pre-battle music on unmount
  useEffect(() => {
    soundManager?.playCombatMusic?.()
    // Preload all fighter sprites into browser memory cache
    ;[pChamp, rChamp].forEach((champ) => {
      if (champ?.animations) {
        Object.values(champ.animations).forEach((src) => {
          if (src && typeof src === 'string') {
            const img = new Image()
            img.src = src
          }
        })
      }
    })
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

    if (isTraining) {
      triggerShake(true)
      soundManager?.playVictory?.()
      addFloatingText(outcome === 'victory' ? 'rival' : 'player', '💥 ¡¡K.O. DE PRÁCTICA!!', 'crit')
      setTimeout(() => {
        resetTrainingRef.current?.()
      }, 1600)
      return
    }

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
  }, [pChamp, rChamp, triggerShake, onVictory, onDefeat, isTraining, addFloatingText])

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

  // DOJO DE CAMPEONES: Reset fighters to starting sparring state
  const handleResetTrainingFighters = useCallback(() => {
    soundManager?.playClick?.()
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

    battleEndedRef.current = false
    isActionLockedRef.current = false
    isGuardingRef.current = false
    isRivalGuardingRef.current = false
    setBlockTremor(false)
    setShowVictoryWord(false)
    setBattleOutcome(null)
    setComboCount(0)

    pPosRef.current = { x: 30, y: 0, velY: 0, isJumping: false }
    rPosRef.current = { x: 70, y: 0, velY: 0 }
    setPPosX(30)
    setPPosY(0)
    setRPosX(70)
    setRPosY(0)
    pFacingRef.current = 1
    rFacingRef.current = -1
    setPFacing(1)
    setRFacing(-1)

    pAnimRef.current = 'idle'
    rAnimRef.current = 'idle'
    setPlayerAnim('idle')
    setRivalAnim('idle')
    const now = Date.now()
    setPAnimNonce(now)
    setRAnimNonce(now + 1)

    setPlayerHp(maxPlayerHp)
    setRivalHp(maxRivalHp)
    setPlayerFury(100)
    setRivalFury(50)

    if (dummyAiModeRef.current === 'guard') {
      setTimeout(() => {
        handleRivalDefend(true)
      }, 100)
    }

    addFloatingText('player', '✨ ¡ESTADO RESTAURADO!', 'buff')
  }, [maxPlayerHp, maxRivalHp, handleRivalDefend, addFloatingText])

  useEffect(() => {
    resetTrainingRef.current = handleResetTrainingFighters
  }, [handleResetTrainingFighters])

  // DOJO DE CAMPEONES: Select Dummy AI behavior mode
  const handleSelectDummyMode = useCallback((mode) => {
    soundManager?.playClick?.()
    setDummyAiMode(mode)
    dummyAiModeRef.current = mode
    if (mode === 'guard') {
      handleRivalDefend(true)
      addFloatingText('rival', '🛡️ ¡MODO GUARDIA ACTIVO!', 'buff')
    } else {
      if (isRivalGuardingRef.current) {
        handleRivalDefend(false)
      }
      if (mode === 'passive') {
        addFloatingText('rival', '🛑 ¡MODO PASIVO (DUMMY)!', 'buff')
      } else if (mode === 'sparring') {
        addFloatingText('rival', '⚔️ ¡MODO SPARRING ACTIVO!', 'buff')
      }
    }
  }, [handleRivalDefend, addFloatingText])

  // ==============================================================================
  // COMBAT ACTIONS (K, L, I, O, SPACE) - SYNCHRONIZED TO EXACT WEBP DURATIONS
  // ==============================================================================

  // ACTION 1: Attack 1 (Key: K) - Light Attack / 3-Hit Spear Combo (Supports Dash Cancel)
  const handleTriggerAttack1 = useCallback(() => {
    const isDashing = pDashTimerRef.current?.active
    if ((isActionLockedRef.current && !isDashing) || pJumpTimerRef.current.active || battleEndedRef.current) return
    isActionLockedRef.current = true

    if (isDashing) {
      const wasFront = pDashTimerRef.current.type === 'front'
      const dashKey = wasFront ? (pFacingRef.current === 1 ? 'E' : 'Q') : (pFacingRef.current === 1 ? 'Q' : 'E')
      pDashTimerRef.current.active = false
      addFloatingText('player', wasFront ? `⚡ DASH COMBO (${dashKey} + J)!` : `🛡️ COUNTER (${dashKey} + J)!`, 'buff')
    }

    const pConfig = getChampionAnimConfig(pChamp.id)
    const totalDuration = pConfig.durations.attack1 || 2088
    const hit1Delay = pConfig.impactDelays?.attack1_hit1 || 450
    const hit2Delay = pConfig.impactDelays?.attack1_hit2 || 1150
    const hit3Delay = pConfig.impactDelays?.attack1_hit3 || 1750

    const nonce = Date.now()
    setPAnimNonce(nonce)
    pAnimRef.current = 'attack1'
    setPlayerAnim('attack1')
    playChampSound(pChamp, 'attack1')

    if (pActionTimerRef.current) clearTimeout(pActionTimerRef.current)
    if (pImpactTimerRef.current) clearTimeout(pImpactTimerRef.current)
    if (pImpactTimer2Ref.current) clearTimeout(pImpactTimer2Ref.current)
    if (pImpactTimer3Ref.current) clearTimeout(pImpactTimer3Ref.current)

    const executeAttack1Hit = (hitIndex) => {
      if (battleEndedRef.current || pAnimRef.current === 'hit' || pAnimRef.current === 'knockdown') {
        return
      }

      const dist = Math.abs(pPosRef.current.x - rPosRef.current.x)
      const isFacing = (pFacingRef.current === 1 && pPosRef.current.x <= rPosRef.current.x) || (pFacingRef.current === -1 && pPosRef.current.x >= rPosRef.current.x)
      const inRange = getPixelDist(dist) <= ((pConfig.hitboxes.attack1 || 7.2) * 16.5) && isFacing

      if (inRange) {
        if (rImpactTimerRef.current) {
          clearTimeout(rImpactTimerRef.current)
          rImpactTimerRef.current = null
        }
        if (rActionTimerRef.current) {
          clearTimeout(rActionTimerRef.current)
          rActionTimerRef.current = null
        }

        if (isRivalGuardingRef.current) {
          const blockDmg = hitIndex === 3 ? 22 : 12
          addFloatingText('rival', `🛡️ BLOQUEO! -${blockDmg}`, 'block')
          soundManager?.playShieldBlock?.()
          triggerShake(false)
          triggerBlockTremor()

          const rPushDir = rPosRef.current.x >= pPosRef.current.x ? 1 : -1
          const pushAmt = hitIndex === 3 ? 3.5 : 1.8
          rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + rPushDir * pushAmt))
          setRPosX(rPosRef.current.x)
          pPosRef.current.x = Math.max(8, Math.min(94, pPosRef.current.x - rPushDir * 1.5))
          setPPosX(pPosRef.current.x)

          setPlayerFury((f) => Math.min(100, f + 6))
          setRivalHp((prev) => {
            const next = Math.max(0, prev - blockDmg)
            if (next <= 0) handleBattleFinish('victory')
            return next
          })
          return
        }

        const isHit3 = hitIndex === 3
        const isCrit = isHit3 && Math.random() > 0.4
        const baseDmg = isHit3
          ? Math.round(pChamp.atk * 1.6 + Math.random() * 25)
          : Math.round(pChamp.atk * 0.95 + Math.random() * 15)
        const finalDmg = isCrit ? Math.round(baseDmg * 1.4) : baseDmg

        const pushDir = pFacingRef.current
        const pushDist = isHit3 ? 5.2 : 2.0
        rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + pushDir * pushDist))
        setRPosX(rPosRef.current.x)

        const hitLabel = isCrit
          ? `💥 -${finalDmg} ¡REMATE CELESTIAL!`
          : isHit3
            ? `⚡ -${finalDmg} ¡ESTOCADA FINAL!`
            : hitIndex === 2
              ? `⚔️ -${finalDmg} 2DO TAJO!`
              : `⚔️ -${finalDmg} 1ER GOLPE!`
        addFloatingText('rival', hitLabel, (isCrit || isHit3) ? 'crit' : 'damage')
        triggerShake(isHit3)
        registerCombo()

        const rConfig = getChampionAnimConfig(rChamp.id)
        const reactAnim = isHit3 ? 'knockdown' : (rAnimRef.current === 'knockdown' ? 'knockdown' : 'hit')
        const reactDur = isHit3 ? rConfig.durations.knockdown : rConfig.durations.hit

        playChampSound(rChamp, reactAnim)
        if (isHit3) soundManager?.playCriticalHit?.()

        setRAnimNonce(Date.now())
        rAnimRef.current = reactAnim
        setRivalAnim(reactAnim)

        setPlayerFury((f) => Math.min(100, f + (isHit3 ? 14 : 7)))

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

    // 3 sequential impacts matching 3-hit spear combo animation
    pImpactTimerRef.current = setTimeout(() => {
      pImpactTimerRef.current = null
      executeAttack1Hit(1)
    }, hit1Delay)

    pImpactTimer2Ref.current = setTimeout(() => {
      pImpactTimer2Ref.current = null
      executeAttack1Hit(2)
    }, hit2Delay)

    pImpactTimer3Ref.current = setTimeout(() => {
      pImpactTimer3Ref.current = null
      executeAttack1Hit(3)
    }, hit3Delay)

    pActionTimerRef.current = setTimeout(() => {
      isActionLockedRef.current = false
      pActionTimerRef.current = null
      if (!battleEndedRef.current && pAnimRef.current === 'attack1') {
        pAnimRef.current = 'idle'
        setPlayerAnim('idle')
      }
    }, totalDuration)
  }, [pChamp, rChamp, addFloatingText, triggerShake, triggerBlockTremor, registerCombo, handleBattleFinish])

  // ACTION 2: Attack 2 (Key: L) - 2-Hit Kick Combo (Supports Dash Cancel)
  const handleTriggerAttack2 = useCallback(() => {
    const isDashing = pDashTimerRef.current?.active
    if ((isActionLockedRef.current && !isDashing) || pJumpTimerRef.current.active || battleEndedRef.current) return
    isActionLockedRef.current = true

    if (isDashing) {
      const wasFront = pDashTimerRef.current.type === 'front'
      const dashKey = wasFront ? (pFacingRef.current === 1 ? 'E' : 'Q') : (pFacingRef.current === 1 ? 'Q' : 'E')
      pDashTimerRef.current.active = false
      addFloatingText('player', wasFront ? `🌪️ DASH COMBO (${dashKey} + K)!` : `💥 COUNTER (${dashKey} + K)!`, 'buff')
    }

    const pConfig = getChampionAnimConfig(pChamp.id)
    const totalDuration = pConfig.durations.attack2 || 1320
    const hit1Delay = pConfig.impactDelays?.attack2_hit1 || 350
    const hit2Delay = pConfig.impactDelays?.attack2_hit2 || 950

    const nonce = Date.now()
    setPAnimNonce(nonce)
    pAnimRef.current = 'attack2'
    setPlayerAnim('attack2')
    playChampSound(pChamp, 'attack2')

    if (pActionTimerRef.current) clearTimeout(pActionTimerRef.current)
    if (pImpactTimerRef.current) clearTimeout(pImpactTimerRef.current)
    if (pImpactTimer2Ref.current) clearTimeout(pImpactTimer2Ref.current)
    if (pImpactTimer3Ref.current) clearTimeout(pImpactTimer3Ref.current)

    // Helper to execute each impact of Attack 2 during animation playback
    const executeAttack2Hit = (hitIndex) => {
      if (battleEndedRef.current || pAnimRef.current === 'hit' || pAnimRef.current === 'knockdown') {
        return
      }

      const dist = Math.abs(pPosRef.current.x - rPosRef.current.x)
      const isFacing = (pFacingRef.current === 1 && pPosRef.current.x <= rPosRef.current.x) || (pFacingRef.current === -1 && pPosRef.current.x >= rPosRef.current.x)
      const inRange = getPixelDist(dist) <= ((pConfig.hitboxes.attack2 || 6.8) * 16.5) && isFacing

      if (inRange) {
        if (rImpactTimerRef.current) {
          clearTimeout(rImpactTimerRef.current)
          rImpactTimerRef.current = null
        }
        if (rActionTimerRef.current) {
          clearTimeout(rActionTimerRef.current)
          rActionTimerRef.current = null
        }

        if (isRivalGuardingRef.current) {
          const blockDmg = hitIndex === 1 ? 15 : 22
          addFloatingText('rival', `🛡️ BLOQUEO! -${blockDmg}`, 'block')
          soundManager?.playShieldBlock?.()
          triggerShake(false)
          triggerBlockTremor()

          const rPushDir = rPosRef.current.x >= pPosRef.current.x ? 1 : -1
          const pushAmount = hitIndex === 1 ? 2.6 : 3.8
          const recoilAmount = hitIndex === 1 ? 2.0 : 3.0
          rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + rPushDir * pushAmount))
          setRPosX(rPosRef.current.x)

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

        const isHit2 = hitIndex === 2
        const isCrit = isHit2 && Math.random() > 0.45
        const baseDmg = isHit2
          ? Math.round(pChamp.atk * 1.8 + Math.random() * 30)
          : Math.round(pChamp.atk * 1.3 + Math.random() * 20)
        const finalDmg = isCrit ? Math.round(baseDmg * 1.4) : baseDmg

        const pushDir = pFacingRef.current
        const pushDist = isHit2 ? 5.6 : 2.4
        rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + pushDir * pushDist))
        setRPosX(rPosRef.current.x)

        const hitLabel = isCrit
          ? `💥 -${finalDmg} ¡DERRIBO CRÍTICO!`
          : isHit2
            ? `💥 -${finalDmg} ¡PATADA FINAL!`
            : `🦵 -${finalDmg} 1RA PATADA!`
        addFloatingText('rival', hitLabel, (isCrit || isHit2) ? 'crit' : 'damage')
        triggerShake(isHit2)
        registerCombo()

        const rConfig = getChampionAnimConfig(rChamp.id)
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

    pImpactTimerRef.current = setTimeout(() => {
      pImpactTimerRef.current = null
      executeAttack2Hit(1)
    }, hit1Delay)

    pImpactTimer2Ref.current = setTimeout(() => {
      pImpactTimer2Ref.current = null
      executeAttack2Hit(2)
    }, hit2Delay)

    pActionTimerRef.current = setTimeout(() => {
      pActionTimerRef.current = null
      isActionLockedRef.current = false
      if (!battleEndedRef.current && pAnimRef.current === 'attack2') {
        pAnimRef.current = 'idle'
        setPlayerAnim('idle')
      }
    }, totalDuration)
  }, [pChamp, rChamp, addFloatingText, triggerShake, triggerBlockTremor, registerCombo, handleBattleFinish])

  // ACTION 3: Special / Ultimate Attack (Supports Dash Cancel)
  const handleTriggerSpecial = useCallback((variant = 1) => {
    const isDashing = pDashTimerRef.current?.active
    if ((isActionLockedRef.current && !isDashing) || pJumpTimerRef.current.active || battleEndedRef.current) return
    isActionLockedRef.current = true

    if (isDashing) {
      pDashTimerRef.current.active = false
      addFloatingText('player', '✨ DASH CANCEL SPECIAL!', 'buff')
    }

    const isVariant2 = variant === 2
    const animKey = isVariant2 ? 'special2' : 'special'
    const pConfig = getChampionAnimConfig(pChamp.id)
    const totalDuration = pConfig.durations[animKey] || (isVariant2 ? 3264 : 3384)
    const impactDelay = pConfig.impactDelays?.[animKey] || Math.round(totalDuration / 2)

    const nonce = Date.now()
    setPAnimNonce(nonce)
    pAnimRef.current = animKey
    setPlayerAnim(animKey)
    playChampSound(pChamp, animKey)

    if (pActionTimerRef.current) clearTimeout(pActionTimerRef.current)
    if (pImpactTimerRef.current) clearTimeout(pImpactTimerRef.current)
    if (pImpactTimer2Ref.current) clearTimeout(pImpactTimer2Ref.current)
    if (pImpactTimer3Ref.current) clearTimeout(pImpactTimer3Ref.current)

    // 1. IMPACT: Triggers at the strike moment of the special animation
    pImpactTimerRef.current = setTimeout(() => {
      pImpactTimerRef.current = null

      if (battleEndedRef.current || pAnimRef.current === 'hit' || pAnimRef.current === 'knockdown') {
        return
      }

      if (battleEndedRef.current) return
      const dist = Math.abs(pPosRef.current.x - rPosRef.current.x)
      const isFacing = (pFacingRef.current === 1 && pPosRef.current.x <= rPosRef.current.x) || (pFacingRef.current === -1 && pPosRef.current.x >= rPosRef.current.x)
      const inRange = getPixelDist(dist) <= ((pConfig.hitboxes[animKey] || 9.5) * 16.5) && isFacing

      if (inRange) {
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

        const finalDmg = isVariant2
          ? Math.round(pChamp.atk * 6.6 + Math.random() * 80)
          : Math.round(pChamp.atk * 6.2 + Math.random() * 70)

        // Devastating knockback
        const pushDir = pFacingRef.current
        rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + pushDir * 8.5))
        setRPosX(rPosRef.current.x)

        const skillTitle = isVariant2
          ? '¡ESTOCADA SÍSMICA!'
          : (pChamp.id === 'valiria' ? '¡LANZA DEL DESTINO!' : '¡FURIA ASTRAL!')
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

    pActionTimerRef.current = setTimeout(() => {
      isActionLockedRef.current = false
      pActionTimerRef.current = null
      if (!battleEndedRef.current && (pAnimRef.current === 'special' || pAnimRef.current === 'special2')) {
        pAnimRef.current = 'idle'
        setPlayerAnim('idle')
      }
    }, totalDuration)
  }, [pChamp, rChamp, addFloatingText, triggerShake, triggerBlockTremor, handleRivalDefend, registerCombo, handleBattleFinish])

  // ACTION 4: Defend / Block (Key: O)
  const handleTriggerDefend = useCallback((isStart = true) => {
    if (battleEndedRef.current || pJumpTimerRef.current.active || pDashTimerRef.current.active) return
    if (isStart) {
      if (isActionLockedRef.current) return
      if (isGuardingRef.current) return // Already guarding; ignore OS key repeat

      isGuardingRef.current = true
      setPAnimNonce(Date.now())
      
      const guardAnim = isCrouchingRef.current ? 'defend_down' : 'defend'
      pAnimRef.current = guardAnim
      setPlayerAnim(guardAnim)
      playChampSound(pChamp, 'defend')

      if (pDefendTimerRef.current) clearTimeout(pDefendTimerRef.current)
      const pConfig = getChampionAnimConfig(pChamp.id)
      const defendDuration = pConfig?.durations?.[guardAnim] || 1176

      // Transition smoothly to frozen hold on the last frame once the animation reaches apex
      pDefendTimerRef.current = setTimeout(() => {
        if (isGuardingRef.current && (pAnimRef.current === 'defend' || pAnimRef.current === 'defend_down')) {
          pAnimRef.current = isCrouchingRef.current ? 'defend_down' : 'defend_hold'
          setPlayerAnim(isCrouchingRef.current ? 'defend_down' : 'defend_hold')
        }
      }, defendDuration)
    } else {
      if (pDefendTimerRef.current) clearTimeout(pDefendTimerRef.current)
      isGuardingRef.current = false
      if (!isActionLockedRef.current && !pJumpTimerRef.current.active && !pDashTimerRef.current.active && (pAnimRef.current === 'defend' || pAnimRef.current === 'defend_hold' || pAnimRef.current === 'defend_down')) {
        pAnimRef.current = isCrouchingRef.current ? 'defend_down' : 'idle'
        setPlayerAnim(isCrouchingRef.current ? 'defend_down' : 'idle')
      }
    }
  }, [pChamp])

  // ACTION: Down / Crouch (Key: S or ArrowDown or Virtual D-Pad Down)
  const handleTriggerDown = useCallback((isStart = true) => {
    if (battleEndedRef.current || pJumpTimerRef.current.active || pDashTimerRef.current.active) return
    if (isStart) {
      if (isActionLockedRef.current) return
      if (isCrouchingRef.current) return

      isCrouchingRef.current = true
      isGuardingRef.current = true
      setPAnimNonce(Date.now())
      pAnimRef.current = 'defend_down'
      setPlayerAnim('defend_down')
      playChampSound(pChamp, 'defend')
    } else {
      if (isCrouchingRef.current) {
        isCrouchingRef.current = false
        isGuardingRef.current = false
        if (!isActionLockedRef.current && !pJumpTimerRef.current.active && !pDashTimerRef.current.active) {
          pAnimRef.current = 'idle'
          setPlayerAnim('idle')
        }
      }
    }
  }, [pChamp])

  // DASH (Dash Front: 2x adelante | Dash Back: 2x atrás)
  const handleTriggerDash = useCallback((type) => {
    if (isActionLockedRef.current || battleEndedRef.current || isGuardingRef.current || pJumpTimerRef.current.active) return

    const pConfig = getChampionAnimConfig(pChamp.id)
    const duration = type === 'front'
      ? (pConfig?.durations?.dash_front || 500)
      : (pConfig?.durations?.dash_back || 500)

    isActionLockedRef.current = true
    pDashTimerRef.current = {
      active: true,
      type,
      startTime: performance.now(),
      duration,
      facingAtStart: pFacingRef.current,
    }

    const animName = type === 'front' ? 'dash_front' : 'dash_back'
    setPAnimNonce(Date.now())
    pAnimRef.current = animName
    setPlayerAnim(animName)
    playChampSound(pChamp, animName)

    addFloatingText('player', type === 'front' ? '⚡ DASH FRONTAL' : '💨 DASH TRASERO', 'buff')
  }, [pChamp, addFloatingText])

  // Double tap detector for horizontal directions (Left / Right)
  const handleDirectionTap = useCallback((dirKey) => {
    const now = performance.now()
    const last = lastTapRef.current
    const isDoubleTap = last.key === dirKey && (now - last.time) < 320

    lastTapRef.current = { key: dirKey, time: now }

    if (isDoubleTap) {
      const facing = pFacingRef.current // 1 = facing right, -1 = facing left
      const isForward = (facing === 1 && dirKey === 'right') || (facing === -1 && dirKey === 'left')
      const isBackward = (facing === 1 && dirKey === 'left') || (facing === -1 && dirKey === 'right')

      if (isForward) {
        handleTriggerDash('front')
        return true
      } else if (isBackward) {
        handleTriggerDash('back')
        return true
      }
    }
    return false
  }, [handleTriggerDash])

  // JUMP & DOUBLE JUMP (Key: Space or Key: W)
  const handleTriggerJump = useCallback(() => {
    if (isActionLockedRef.current || battleEndedRef.current || isGuardingRef.current || pDashTimerRef.current.active) return

    const pConfig = getChampionAnimConfig(pChamp.id)
    const baseJumpDuration = pConfig?.durations?.jump || 984

    // FIRST JUMP FROM GROUND
    if (!pJumpTimerRef.current.active || pJumpCountRef.current === 0) {
      pJumpCountRef.current = 1
      pJumpTimerRef.current = {
        active: true,
        count: 1,
        startTime: performance.now(),
        duration: baseJumpDuration,
        apex: 38,
      }
      pPosRef.current.isJumping = true
      setPAnimNonce(Date.now())
      pAnimRef.current = 'jump'
      setPlayerAnim('jump')
      playChampSound(pChamp, 'jump')
      return
    }

    // SECOND JUMP IN AIR (DOUBLE JUMP)
    if (pJumpTimerRef.current.active && pJumpCountRef.current === 1) {
      pJumpCountRef.current = 2
      const currentY = pPosRef.current.y || 18
      pJumpTimerRef.current = {
        active: true,
        count: 2,
        startTime: performance.now(),
        duration: baseJumpDuration * 0.88,
        startY: currentY,
        addedApex: 34,
      }
      setPAnimNonce(Date.now())
      pAnimRef.current = 'jump'
      setPlayerAnim('jump')
      playChampSound(pChamp, 'jump')
      addFloatingText('player', '¡DOBLE SALTO!', 'buff')
    }
  }, [pChamp, addFloatingText])

  // Mobile virtual joystick horizontal movement callback (-1 | 0 | 1)
  const handleJoystickMoveX = useCallback((dir) => {
    if (dir === -1) {
      handleDirectionTap('left')
      keysDownRef.current['a'] = true
      keysDownRef.current['d'] = false
      setActiveKeys((prev) => ({ ...prev, a: true, d: false }))
    } else if (dir === 1) {
      handleDirectionTap('right')
      keysDownRef.current['d'] = true
      keysDownRef.current['a'] = false
      setActiveKeys((prev) => ({ ...prev, d: true, a: false }))
    } else {
      keysDownRef.current['a'] = false
      keysDownRef.current['d'] = false
      dirHoldStartRef.current = 0
      isRunningRef.current = false
      setActiveKeys((prev) => ({ ...prev, a: false, d: false }))
    }
  }, [handleDirectionTap])

  // Swap controlled champion (Valiria <-> Sombra)
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
    isCrouchingRef.current = false
    setBlockTremor(false)
    pJumpTimerRef.current = { active: false, startTime: 0, duration: 0 }
    pJumpCountRef.current = 0
    pDashTimerRef.current = { active: false, type: null, startTime: 0, duration: 0, facingAtStart: 1 }
    dirHoldStartRef.current = 0
    isRunningRef.current = false

    const tempP = pChamp
    const tempR = rChamp
    setPChamp(tempR)
    setRChamp(tempP)
    setPlayerHp(tempR.hp || 5000)
    setRivalHp(tempP.hp || 4800)
    if (isTraining) {
      setPlayerFury(100)
      setRivalFury(50)
      addFloatingText('player', `🎮 Controlando a ${tempR.name}`, 'buff')
    }
    pPosRef.current = { x: 30, y: 0, velY: 0, isJumping: false }
    rPosRef.current = { x: 70, y: 0, velY: 0 }
    setPPosX(30)
    setPPosY(0)
    setRPosX(70)
    setRPosY(0)
    pAnimRef.current = 'idle'
    rAnimRef.current = 'idle'
    setPlayerAnim('idle')
    setRivalAnim('idle')
    const now = Date.now()
    setPAnimNonce(now)
    setRAnimNonce(now)

    if (isTraining && dummyAiModeRef.current === 'guard') {
      setTimeout(() => {
        handleRivalDefend(true)
      }, 120)
    }
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
        if (!e.repeat) {
          handleTriggerJump()
        }
        return
      }

      if (key === 'w' || code === 'KeyW' || code === 'ArrowUp') {
        e.preventDefault()
        keysDownRef.current['w'] = true
        setActiveKeys((prev) => ({ ...prev, w: true }))
        if (!e.repeat) {
          handleTriggerJump()
        }
      } else if (key === 'a' || code === 'KeyA' || code === 'ArrowLeft') {
        if (!e.repeat) {
          handleDirectionTap('left')
        }
        keysDownRef.current['a'] = true
        setActiveKeys((prev) => ({ ...prev, a: true }))
      } else if (key === 'd' || code === 'KeyD' || code === 'ArrowRight') {
        if (!e.repeat) {
          handleDirectionTap('right')
        }
        keysDownRef.current['d'] = true
        setActiveKeys((prev) => ({ ...prev, d: true }))
      } else if (key === 's' || code === 'KeyS' || code === 'ArrowDown') {
        e.preventDefault()
        keysDownRef.current['s'] = true
        setActiveKeys((prev) => ({ ...prev, s: true }))
        handleTriggerDown(true)
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
        handleTriggerSpecial(1)
      } else if (key === 'u' || code === 'KeyU') {
        keysDownRef.current['u'] = true
        setActiveKeys((prev) => ({ ...prev, u: true }))
        handleTriggerSpecial(2)
      } else if (key === 'o' || code === 'KeyO') {
        keysDownRef.current['o'] = true
        setActiveKeys((prev) => ({ ...prev, o: true }))
        handleTriggerDefend(true)
      } else if (key === 'e' || code === 'KeyE') {
        keysDownRef.current['e'] = true
        setActiveKeys((prev) => ({ ...prev, e: true }))
        if (!e.repeat) {
          // Si ve a la derecha (facing === 1), E es Dash Front. Si ve a la izquierda, E es Dash Back.
          const facing = pFacingRef.current
          handleTriggerDash(facing === 1 ? 'front' : 'back')
        }
      } else if (key === 'q' || code === 'KeyQ') {
        keysDownRef.current['q'] = true
        setActiveKeys((prev) => ({ ...prev, q: true }))
        if (!e.repeat) {
          // Si ve a la izquierda (facing === -1), Q es Dash Front. Si ve a la derecha, Q es Dash Back.
          const facing = pFacingRef.current
          handleTriggerDash(facing === -1 ? 'front' : 'back')
        }
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
        if (!keysDownRef.current['d']) {
          dirHoldStartRef.current = 0
          isRunningRef.current = false
        }
      } else if (key === 'd' || code === 'KeyD' || code === 'ArrowRight') {
        keysDownRef.current['d'] = false
        setActiveKeys((prev) => ({ ...prev, d: false }))
        if (!keysDownRef.current['a']) {
          dirHoldStartRef.current = 0
          isRunningRef.current = false
        }
      } else if (key === 's' || code === 'KeyS' || code === 'ArrowDown') {
        keysDownRef.current['s'] = false
        setActiveKeys((prev) => ({ ...prev, s: false }))
        handleTriggerDown(false)
      } else if (key === 'k' || code === 'KeyK') {
        keysDownRef.current['k'] = false
        setActiveKeys((prev) => ({ ...prev, k: false }))
      } else if (key === 'l' || code === 'KeyL') {
        keysDownRef.current['l'] = false
        setActiveKeys((prev) => ({ ...prev, l: false }))
      } else if (key === 'i' || code === 'KeyI') {
        keysDownRef.current['i'] = false
        setActiveKeys((prev) => ({ ...prev, i: false }))
      } else if (key === 'u' || code === 'KeyU') {
        keysDownRef.current['u'] = false
        setActiveKeys((prev) => ({ ...prev, u: false }))
      } else if (key === 'o' || code === 'KeyO') {
        keysDownRef.current['o'] = false
        setActiveKeys((prev) => ({ ...prev, o: false }))
        handleTriggerDefend(false)
      } else if (key === 'e' || code === 'KeyE') {
        keysDownRef.current['e'] = false
        setActiveKeys((prev) => ({ ...prev, e: false }))
      } else if (key === 'q' || code === 'KeyQ') {
        keysDownRef.current['q'] = false
        setActiveKeys((prev) => ({ ...prev, q: false }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleTriggerAttack1, handleTriggerAttack2, handleTriggerSpecial, handleTriggerDefend, handleTriggerDown, handleTriggerJump, handleDirectionTap])

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
        // 1. DASH PHYSICS EXECUTION (High-speed burst: Front or Back)
        if (pDashTimerRef.current.active) {
          const dash = pDashTimerRef.current
          const elapsed = time - dash.startTime

          if (elapsed < dash.duration) {
            // Vuelo ágil sincronizado a 500ms total
            const isLaunchActive = dash.type === 'front'
              ? (elapsed >= 60 && elapsed <= (dash.duration * 0.85))
              : (elapsed <= (dash.duration * 0.85))

            if (isLaunchActive) {
              const dashSpeed = 1.15
              const dirMultiplier = dash.type === 'front' ? dash.facingAtStart : -dash.facingAtStart
              const bodyBuffer = getDynamicBuffer()

              if (dirMultiplier > 0) {
                // Moving right
                const maxX = (pPosRef.current.x < rPosRef.current.x)
                  ? Math.min(94, rPosRef.current.x - bodyBuffer)
                  : 94
                pPosRef.current.x = Math.min(maxX, pPosRef.current.x + dashSpeed)
              } else {
                // Moving left
                const minX = (pPosRef.current.x > rPosRef.current.x)
                  ? Math.max(6, rPosRef.current.x + bodyBuffer)
                  : 6
                pPosRef.current.x = Math.max(minX, pPosRef.current.x - dashSpeed)
              }
            }
          } else {
            // Dash finished!
            pDashTimerRef.current.active = false
            isActionLockedRef.current = false

            // Requirement: "el run pasa despues del dash"
            // If the user continues holding the forward direction, seamlessly transition into RUN
            const hasForwardHeld = (dash.facingAtStart === 1 && keysDownRef.current['d']) ||
                                   (dash.facingAtStart === -1 && keysDownRef.current['a'])
            if (dash.type === 'front' && hasForwardHeld) {
              isRunningRef.current = true
              pAnimRef.current = 'run'
              setPlayerAnim('run')
            } else if (keysDownRef.current['a'] || keysDownRef.current['d']) {
              pAnimRef.current = isRunningRef.current ? 'run' : 'walk'
              setPlayerAnim(pAnimRef.current)
            } else {
              isRunningRef.current = false
              dirHoldStartRef.current = 0
              pAnimRef.current = 'idle'
              setPlayerAnim('idle')
            }
          }
        }

        // 2. PLAYER HORIZONTAL MOVEMENT (Walk & Run)
        const isJumping = pJumpTimerRef.current.active
        const isDashing = pDashTimerRef.current.active
        let isMoving = false

        if (!isActionLockedRef.current && !isGuardingRef.current && !isDashing) {
          const bodyBuffer = getDynamicBuffer()
          const leftPressed = keysDownRef.current['a']
          const rightPressed = keysDownRef.current['d']

          if (leftPressed || rightPressed) {
            isMoving = true
            if (dirHoldStartRef.current === 0) {
              dirHoldStartRef.current = time
            }

            // Requirement: "o cuando despues de que el usuario tiene 2.5 segundos presionado el direccional"
            const holdElapsed = time - dirHoldStartRef.current
            if (holdElapsed >= 2500) {
              isRunningRef.current = true
            }

            const currentSpeed = isJumping 
              ? 0.22 
              : (isRunningRef.current ? 0.72 : 0.40)

            if (leftPressed && !rightPressed) {
              const minX = (!isJumping && pPosRef.current.x > rPosRef.current.x)
                ? Math.max(6, rPosRef.current.x + bodyBuffer)
                : 6
              pPosRef.current.x = Math.max(minX, pPosRef.current.x - currentSpeed)
              pFacingRef.current = -1
            } else if (rightPressed && !leftPressed) {
              const maxX = (!isJumping && pPosRef.current.x < rPosRef.current.x)
                ? Math.min(94, rPosRef.current.x - bodyBuffer)
                : 94
              pPosRef.current.x = Math.min(maxX, pPosRef.current.x + currentSpeed)
              pFacingRef.current = 1
            }
          } else {
            // No direction keys pressed
            dirHoldStartRef.current = 0
            isRunningRef.current = false
          }
        }

        // Automatic face-to-face orientation when stopping and on ground
        if (!isMoving && !isJumping && !isDashing) {
          pFacingRef.current = pPosRef.current.x <= rPosRef.current.x ? 1 : -1
        }
        rFacingRef.current = rPosRef.current.x >= pPosRef.current.x ? -1 : 1

        // Movement footsteps audio (walk vs run)
        if (isMoving && !isJumping && !isDashing) {
          const stepInterval = isRunningRef.current ? 260 : 480
          if (time - runSoundTimeRef.current > stepInterval) {
            runSoundTimeRef.current = time
            playChampSound(pChamp, isRunningRef.current ? 'run' : 'walk')
          }
        }

        // 3. PLAYER VERTICAL JUMP PHYSICS (Single & Double Jump)
        if (isJumping) {
          const jumpData = pJumpTimerRef.current
          const elapsed = time - jumpData.startTime
          const totalJumpDur = jumpData.duration

          if (elapsed < totalJumpDur) {
            if (jumpData.count === 1) {
              // First jump from ground: anticipation -> sine arc -> landing
              const anticipation = totalJumpDur * 0.08
              const flightEnd = totalJumpDur * 0.82
              if (elapsed < anticipation) {
                pPosRef.current.y = 0
              } else if (elapsed < flightEnd) {
                const flightProgress = (elapsed - anticipation) / (flightEnd - anticipation)
                pPosRef.current.y = Math.sin(flightProgress * Math.PI) * (jumpData.apex || 38)
              } else {
                pPosRef.current.y = 0
              }
            } else {
              // Double jump in mid-air: additional upward impulse from mid-air Y
              const progress = elapsed / totalJumpDur // 0 to 1
              const impulse = Math.sin(progress * Math.PI) * (jumpData.addedApex || 34)
              const startDecay = (jumpData.startY || 0) * (1 - progress * progress)
              pPosRef.current.y = Math.max(0, impulse + startDecay)
            }

            // Lock animation strictly to 'jump' so it is never overwritten by movement
            pAnimRef.current = 'jump'
          } else {
            // Jump completed and landed!
            pJumpTimerRef.current.active = false
            pJumpCountRef.current = 0
            pPosRef.current.isJumping = false
            pPosRef.current.y = 0

            if (!isActionLockedRef.current && !isGuardingRef.current && !pDashTimerRef.current.active) {
              pAnimRef.current = isMoving ? (isRunningRef.current ? 'run' : 'walk') : 'idle'
              setPlayerAnim(pAnimRef.current)
            }
          }
        }

        // 4. UPDATE PLAYER ANIMATION STATE (Only when NOT locked by action/jump/guard/dash)
        if (!isActionLockedRef.current && !isGuardingRef.current && !pJumpTimerRef.current.active && !pDashTimerRef.current.active) {
          if (isMoving) {
            const nextAnim = isRunningRef.current ? 'run' : 'walk'
            if (pAnimRef.current !== nextAnim) {
              pAnimRef.current = nextAnim
              setPlayerAnim(nextAnim)
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

        if (isTraining && dummyAiModeRef.current === 'passive') {
          // Training Dummy Mode: PASSIVE (Stays completely stationary in idle)
          if (rAnimRef.current !== 'idle' && rAnimRef.current !== 'hit' && rAnimRef.current !== 'knockdown' && rAnimRef.current !== 'lose' && rAnimRef.current !== 'lose_hold') {
            rAnimRef.current = 'idle'
            setRivalAnim('idle')
          }
        } else if (isTraining && dummyAiModeRef.current === 'guard') {
          // Training Dummy Mode: GUARD (Holds shield defense continuously to practice breaking guard)
          if (!isRivalGuardingRef.current && rAnimRef.current !== 'hit' && rAnimRef.current !== 'knockdown' && rAnimRef.current !== 'lose' && rAnimRef.current !== 'lose_hold') {
            handleRivalDefend(true)
          }
        } else {
          // Standard Sparring & Real Arena Combat AI
          if (rAnimRef.current === 'idle' || rAnimRef.current === 'run') {
            const pxDist = getPixelDist(dist)
            // Both are melee: rival closes the distance to striking range (~115px)
            if (pxDist > 115) {
              const dir = pPosRef.current.x < rPosRef.current.x ? -0.22 : 0.22
              rPosRef.current.x = Math.max(8, Math.min(94, rPosRef.current.x + dir))
              if (rAnimRef.current !== 'run') {
                rAnimRef.current = 'run'
                setRivalAnim('run')
              }
            } else if (pxDist < 96) {
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

          // Rival Tactical Guard AI Trigger (chance to guard for ~850ms when in striking range)
          if (time - rivalGuardTimerRef.current > 3400 && getPixelDist(dist) <= 125 && rAnimRef.current === 'idle' && !isRivalGuardingRef.current) {
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

          // Rival Attack AI Trigger (strikes every ~2.6s when strictly in striking range)
          if (time - rivalAiTimerRef.current > 2600 && getPixelDist(dist) <= 125 && rAnimRef.current === 'idle' && !isRivalGuardingRef.current) {
            rivalAiTimerRef.current = time
            
            const rConfig = getChampionAnimConfig(rChamp.id)
            const rAttackDur = rConfig.durations.attack1
            const rImpactDelay = rConfig.impactDelays?.attack1 || Math.round(rAttackDur / 2)

            const rNonce = Date.now()
            setRAnimNonce(rNonce)
            rAnimRef.current = 'attack1'
            setRivalAnim('attack1')
            playChampSound(rChamp, 'attack1')

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
              if (getPixelDist(currentDist) > 125) {
                // Missed because player jumped or moved away
                return
              }

              if (isGuardingRef.current) {
                // Player blocked with shield: -80% damage
                const blockedDmg = Math.max(1, Math.round(rChamp.atk * 0.3 + Math.random() * 8))
                addFloatingText('player', `🛡️ -${blockedDmg} BLOQUEADO`, 'block')
                soundManager?.playShieldBlock?.()
                triggerBlockTremor()
                setPlayerHp((prev) => {
                  const next = Math.max(0, prev - blockedDmg)
                  if (next <= 0) handleBattleFinish('defeat')
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
  const isInStrikingRange = getPixelDist(liveDist) <= 125
  const pHealthPercent = Math.max(0, Math.round((playerHp / maxPlayerHp) * 100))
  const rHealthPercent = Math.max(0, Math.round((rivalHp / maxRivalHp) * 100))

  return (
    <div className="battle-scene-wrapper">
      <div className={`battle-map-scene ${shakeScreen ? 'shake-viewport' : ''} ${shakeHeavy ? 'shake-heavy' : ''}`}>
      {/* Background Atmosphere Layers */}
      <div className="battle-map-vignette" />
      <div className="battle-map-horizon-fog" />

      {/* TOP BAR HUD */}
      <header className={`battle-hud-top ${isTraining ? 'is-training-bar' : ''}`}>
        {/* Left: Exit button */}
        <button 
          id="btn-exit-battle"
          className="battle-exit-btn"
          onClick={handleExitClick}
          title={isTraining ? "Salir del Dojo de Entrenamiento" : "Salir de la escena de batalla"}
        >
          <ArrowLeft size={18} />
          <span>Salir</span>
        </button>

        {isTraining ? (
          <div className="training-toolbar-center">
            <div className="training-title-tag">
              <span className="training-belt-icon">🥋</span>
              <span className="training-title-text">DOJO</span>
            </div>

            {/* Dummy AI Mode Selectors */}
            <div className="training-ai-modes">
              <button
                type="button"
                className={`training-mode-btn ${dummyAiMode === 'passive' ? 'is-active' : ''}`}
                onClick={() => handleSelectDummyMode('passive')}
                title="Modo Pasivo: El rival no se mueve ni ataca (Dummy de práctica)"
              >
                🛑 Pasivo
              </button>
              <button
                type="button"
                className={`training-mode-btn ${dummyAiMode === 'guard' ? 'is-active' : ''}`}
                onClick={() => handleSelectDummyMode('guard')}
                title="Modo Guardia: El rival bloquea continuamente para practicar romper defensa"
              >
                🛡️ Guardia
              </button>
              <button
                type="button"
                className={`training-mode-btn ${dummyAiMode === 'sparring' ? 'is-active' : ''}`}
                onClick={() => handleSelectDummyMode('sparring')}
                title="Modo Sparring: El rival se mueve y ataca como en combate real"
              >
                ⚔️ Sparring
              </button>
            </div>

            {/* Training Action Tools */}
            <div className="training-quick-tools">
              <button 
                type="button"
                className="training-tool-btn btn-reset"
                onClick={handleResetTrainingFighters}
                title="Restaurar vida, furia y posiciones de los campeones"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>

              <button 
                type="button"
                className="training-tool-btn btn-swap"
                onClick={handleSwapControlledChampion}
                title={`Cambiar control para manejar a ${rChamp.name}`}
              >
                <RefreshCw size={13} />
                <span>Luchador: <strong>{pChamp.name}</strong></span>
              </button>

              <button 
                type="button"
                className="training-tool-btn btn-moves"
                onClick={() => setShowMoveList(true)}
                title="Ver guía completa de movimientos y comandos de los campeones"
              >
                <BookOpen size={13} />
                <span>Guía</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Match Center: Fighter Control Info & Swap */
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
        )}

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
            <SeamlessSprite 
              src={getFighterVisual(pChamp, playerAnim)} 
              alt={pChamp.name} 
              className={`fighter-idle-sprite player-sprite state-${playerAnim}`}
              facing={pFacing}
              anim={playerAnim}
              draggable={false} 
            />
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
            <SeamlessSprite 
              src={getFighterVisual(rChamp, rivalAnim)} 
              alt={rChamp.name} 
              className={`fighter-idle-sprite rival-sprite state-${rivalAnim}`}
              facing={rFacing}
              anim={rivalAnim}
              draggable={false} 
            />
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
          {/* MOBILE: VIRTUAL TOUCH JOYSTICK (60 FPS Analog Left/Right/Jump/Crouch) */}
          <div className="arcade-mobile-joystick-wrap">
            <VirtualJoystick
              onMoveX={handleJoystickMoveX}
              onJump={handleTriggerJump}
              onDefend={handleTriggerDown}
              disabled={battleOutcome !== null}
              size={screenMetrics.isMobile ? (screenMetrics.isLandscape ? 92 : 88) : 118}
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
                  title="Salto / Doble Salto (W / Flecha Arriba)"
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
                    handleDirectionTap('left')
                    keysDownRef.current['a'] = true
                    setActiveKeys((prev) => ({ ...prev, a: true }))
                  }}
                  onMouseUp={() => {
                    keysDownRef.current['a'] = false
                    setActiveKeys((prev) => ({ ...prev, a: false }))
                    if (!keysDownRef.current['d']) {
                      dirHoldStartRef.current = 0
                      isRunningRef.current = false
                    }
                  }}
                  onTouchStart={() => {
                    handleDirectionTap('left')
                    keysDownRef.current['a'] = true
                    setActiveKeys((prev) => ({ ...prev, a: true }))
                  }}
                  onTouchEnd={() => {
                    keysDownRef.current['a'] = false
                    setActiveKeys((prev) => ({ ...prev, a: false }))
                    if (!keysDownRef.current['d']) {
                      dirHoldStartRef.current = 0
                      isRunningRef.current = false
                    }
                  }}
                  title="Mover Izq / 2x Dash Atrás (A / Flecha Izq)"
                >
                  <span className="arcade-key-badge">A</span>
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  className={`arcade-btn dpad-btn btn-s ${activeKeys.s ? 'is-pressed' : ''}`}
                  onMouseDown={() => handleTriggerDown(true)}
                  onMouseUp={() => handleTriggerDown(false)}
                  onTouchStart={() => handleTriggerDown(true)}
                  onTouchEnd={() => handleTriggerDown(false)}
                  title="Agacharse / Guardia Baja (S / Flecha Abajo)"
                >
                  <span className="arcade-key-badge">S</span>
                  <ChevronDown size={16} />
                </button>

                <button
                  type="button"
                  className={`arcade-btn dpad-btn btn-d ${activeKeys.d ? 'is-pressed' : ''}`}
                  onMouseDown={() => {
                    handleDirectionTap('right')
                    keysDownRef.current['d'] = true
                    setActiveKeys((prev) => ({ ...prev, d: true }))
                  }}
                  onMouseUp={() => {
                    keysDownRef.current['d'] = false
                    setActiveKeys((prev) => ({ ...prev, d: false }))
                    if (!keysDownRef.current['a']) {
                      dirHoldStartRef.current = 0
                      isRunningRef.current = false
                    }
                  }}
                  onTouchStart={() => {
                    handleDirectionTap('right')
                    keysDownRef.current['d'] = true
                    setActiveKeys((prev) => ({ ...prev, d: true }))
                  }}
                  onTouchEnd={() => {
                    keysDownRef.current['d'] = false
                    setActiveKeys((prev) => ({ ...prev, d: false }))
                    if (!keysDownRef.current['a']) {
                      dirHoldStartRef.current = 0
                      isRunningRef.current = false
                    }
                  }}
                  title="Mover Der / 2x Dash Frontal (D / Flecha Der)"
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
              <span>ACCIONES • U I K L O</span>
            </div>

            <div className="arcade-actions-diamond">
              {/* TOP: U (Special 2 - Seismic Thrust) + I (Special 1 - Celestial Slash) */}
              <div className="action-row action-row-top">
                <button
                  type="button"
                  className={`arcade-action-btn btn-special-u ${activeKeys.u ? 'is-pressed' : ''} ${playerFury >= 100 ? 'is-ready' : ''}`}
                  onClick={() => handleTriggerSpecial(2)}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      e.preventDefault()
                      handleTriggerSpecial(2)
                    }
                  }}
                  title="Especial 2: Estocada Sísmica con Ondas (Tecla U)"
                >
                  <div className="action-key-header">
                    <span className="arcade-key-badge badge-gold">U</span>
                    <Zap size={15} style={{ color: '#fbbf24' }} />
                  </div>
                  <span className="action-btn-title">SÍSMICA</span>
                  <span className="action-btn-sub">Onda Choque</span>
                </button>

                <button
                  type="button"
                  className={`arcade-action-btn btn-special-i ${activeKeys.i ? 'is-pressed' : ''} ${playerFury >= 100 ? 'is-ready' : ''}`}
                  onClick={() => handleTriggerSpecial(1)}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      e.preventDefault()
                      handleTriggerSpecial(1)
                    }
                  }}
                  title="Especial 1: Lanza Celestial / Tajo de Luz (Tecla I)"
                >
                  <div className="action-key-header">
                    <span className="arcade-key-badge badge-red">I</span>
                    <Flame size={15} className="flame-pulse-icon" />
                  </div>
                  <span className="action-btn-title">CELESTIAL</span>
                  <span className="action-btn-sub">Tajo de Luz</span>
                </button>
              </div>

              {/* MIDDLE: K (Attack 1 - Spear Combo) and L (Attack 2 - Kick Combo) */}
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
                  title="Ataque 1: Combo de Lanza 3 Golpes (Tecla K)"
                >
                  <div className="action-key-header">
                    <span className="arcade-key-badge badge-blue">K</span>
                    <Swords size={15} />
                  </div>
                  <span className="action-btn-title">LANZA</span>
                  <span className="action-btn-sub">Combo 3 Golpes</span>
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
                  title="Ataque 2: Combo de Patadas (Tecla L)"
                >
                  <div className="action-key-header">
                    <span className="arcade-key-badge badge-amber">L</span>
                    <Zap size={15} />
                  </div>
                  <span className="action-btn-title">PATADAS</span>
                  <span className="action-btn-sub">Combo Ágil</span>
                </button>
              </div>

              {/* BOTTOM: Jump (Mobile) + O (Defend / Shield) */}
              <div className="action-row action-row-bot">
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
                  title="Guardia y Bloqueo (Tecla O / Agacharse + O para Guardia Baja)"
                >
                  <div className="action-key-header">
                    <span className="arcade-key-badge badge-cyan">O</span>
                    <Shield size={15} />
                  </div>
                  <span className="action-btn-title">GUARDIA</span>
                  <span className="action-btn-sub">Bloqueo -80%</span>
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

        {/* DOJO COMMAND SHEET / MOVE LIST MODAL */}
        {showMoveList && (
          <div className="battle-movelist-overlay" onClick={() => setShowMoveList(false)}>
            <div className="battle-movelist-modal" onClick={(e) => e.stopPropagation()}>
              <header className="movelist-modal-header">
                <div className="movelist-header-left">
                  <BookOpen size={22} className="movelist-icon" />
                  <div>
                    <h2 className="movelist-title">GUÍA DE COMBATE • DOJO DE CAMPEONES</h2>
                    <span className="movelist-subtitle">Manual de combate de Valiria (Ángel Valquiria)</span>
                  </div>
                </div>
                <button 
                  type="button"
                  className="movelist-close-btn"
                  onClick={() => setShowMoveList(false)}
                  title="Cerrar guía"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="movelist-modal-body">
                {/* Champions Showcase */}
                <div className="movelist-champions-grid">
                  {/* Valiria */}
                  <div className={`movelist-champ-card ${pChamp.id === 'valiria' ? 'is-active-champ' : ''}`}>
                    <div className="movelist-champ-header">
                      <div className="movelist-champ-avatar">
                        <img src="/assets/champions/valiria_avatar.webp" alt="Valiria" />
                      </div>
                      <div>
                        <h3 className="movelist-champ-name" style={{ color: '#38bdf8' }}>Valiria</h3>
                        <span className="movelist-champ-role">Ángel Valquiria • Ágil & Letal</span>
                      </div>
                      {pChamp.id === 'valiria' && <span className="movelist-active-tag">En Control</span>}
                    </div>
                    <ul className="movelist-attacks-list">
                      <li>
                        <div className="movelist-cmd-badge">K (Ataque 1)</div>
                        <div className="movelist-cmd-info">
                          <strong>Combo de Lanza (3 Golpes):</strong> Secuencia fluida de estocadas y cortes con la lanza sagrada.
                        </div>
                      </li>
                      <li>
                        <div className="movelist-cmd-badge">L (Ataque 2)</div>
                        <div className="movelist-cmd-info">
                          <strong>Combo de Patadas (2 Golpes):</strong> Cadena acrobática de patadas rápidas para romper guardias.
                        </div>
                      </li>
                      <li>
                        <div className="movelist-cmd-badge badge-fury">I (Especial 1)</div>
                        <div className="movelist-cmd-info">
                          <strong>Lanza Celestial (Tajo de Luz):</strong> Salto y tajo descendente masivo de fuego sagrado.
                        </div>
                      </li>
                      <li>
                        <div className="movelist-cmd-badge badge-fury">U (Especial 2)</div>
                        <div className="movelist-cmd-info">
                          <strong>Estocada Sísmica:</strong> Clava la lanza con fuerza creando ondas de choque expansivas en el suelo.
                        </div>
                      </li>
                      <li>
                        <div className="movelist-cmd-badge">O / S + O</div>
                        <div className="movelist-cmd-info">
                          <strong>Guardia Alta / Baja:</strong> Bloquea ataques de pie o agachada absorbiendo el 80% del daño.
                        </div>
                      </li>
                      <li>
                        <div className="movelist-cmd-badge">2x Adelante / Atrás</div>
                        <div className="movelist-cmd-info">
                          <strong>Dash Frontal / Trasero:</strong> Ráfaga de velocidad instantánea o salto evasivo.
                        </div>
                      </li>
                      <li>
                        <div className="movelist-cmd-badge">W / Espacio (x2)</div>
                        <div className="movelist-cmd-info">
                          <strong>Doble Salto:</strong> Salto acrobático inicial y un segundo impulso aéreo inmediato.
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Sombra de Valiria */}
                  <div className={`movelist-champ-card ${pChamp.id !== 'valiria' ? 'is-active-champ' : ''}`}>
                    <div className="movelist-champ-header">
                      <div className="movelist-champ-avatar">
                        <img src="/assets/champions/valiria_avatar.webp" alt="Sombra de Valiria" style={{ filter: 'hue-rotate(270deg)' }} />
                      </div>
                      <div>
                        <h3 className="movelist-champ-name" style={{ color: '#c084fc' }}>Sombra de Valiria</h3>
                        <span className="movelist-champ-role">Espejo Astral • Sparring Partner</span>
                      </div>
                      {pChamp.id !== 'valiria' && <span className="movelist-active-tag">En Control</span>}
                    </div>
                    <ul className="movelist-attacks-list">
                      <li>
                        <div className="movelist-cmd-badge">Modos IA</div>
                        <div className="movelist-cmd-info">
                          <strong>Sparring / Guardia / Pasivo:</strong> Selecciona el comportamiento del muñeco de prueba.
                        </div>
                      </li>
                      <li>
                        <div className="movelist-cmd-badge">🔄 Cambiar</div>
                        <div className="movelist-cmd-info">
                          <strong>Intercambio Inmediato:</strong> Toma el control directo del rival con el botón superior.
                        </div>
                      </li>
                      <li>
                        <div className="movelist-cmd-badge badge-fury">I (100% Furia)</div>
                        <div className="movelist-cmd-info">
                          <strong>Ira Astral:</strong> Descarga de energía etérea para probar defensas y contragolpes.
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Universal Controls Section */}
                <div className="movelist-universal-grid">
                  <div className="movelist-box">
                    <h4 className="movelist-box-title">⌨️ Controles de Teclado (PC)</h4>
                    <div className="movelist-keys-table">
                      <div className="key-row"><span className="kbd-badge">A / D</span> o <span className="kbd-badge">← / →</span><span>Desplazamiento horizontal (Caminar / Correr)</span></div>
                      <div className="key-row"><span className="kbd-badge">Espacio</span> o <span className="kbd-badge">W</span><span>Salto evasivo acrobático</span></div>
                      <div className="key-row"><span className="kbd-badge">S</span><span>Agacharse (Posición baja evasiva)</span></div>
                      <div className="key-row"><span className="kbd-badge">K</span><span>Ataque 1: Combo de Lanza (3 impactos)</span></div>
                      <div className="key-row"><span className="kbd-badge">L</span><span>Ataque 2: Combo de Patadas (2 impactos)</span></div>
                      <div className="key-row"><span className="kbd-badge">I</span><span>Especial 1: Lanza Celestial / Tajo de Luz (100% Furia)</span></div>
                      <div className="key-row"><span className="kbd-badge">U</span><span>Especial 2: Estocada Sísmica con Ondas (100% Furia)</span></div>
                      <div className="key-row"><span className="kbd-badge">O</span><span>Guardia Táctica / Bloqueo (-80% daño; S+O guardia baja)</span></div>
                    </div>
                  </div>

                  <div className="movelist-box">
                    <h4 className="movelist-box-title">📱 Controles Móviles (Táctil)</h4>
                    <div className="movelist-keys-table">
                      <div className="key-row"><span className="kbd-badge">Joystick Virtual</span><span>Desliza a la izquierda o derecha para moverte</span></div>
                      <div className="key-row"><span className="kbd-badge">Botón Salto</span><span>Salto acrobático evasivo</span></div>
                      <div className="key-row"><span className="kbd-badge">Botonera Derecha</span><span>Acceso directo a K (Golpe), L (Combo), I (Especial) y O (Guardia)</span></div>
                    </div>
                  </div>
                </div>

                {/* Tactical Tips */}
                <div className="movelist-tips-box">
                  <div className="tip-item">
                    <span className="tip-badge">🛡️ Romper Guardia</span>
                    <p>Si el rival se protege con escudo (Modo Guardia), la técnica especial (I) romperá su guardia y lo derribará.</p>
                  </div>
                  <div className="tip-item">
                    <span className="tip-badge">⚡ Prioridad e Interrupción</span>
                    <p>Golpear con Ataque 1 justo cuando el rival inicia su animación cancela su acción por completo.</p>
                  </div>
                  <div className="tip-item">
                    <span className="tip-badge">👥 Alternar Campeón</span>
                    <p>Puedes alternar el control en cualquier momento con el botón superior para practicar con ambos lados.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  </div>
  )
}
