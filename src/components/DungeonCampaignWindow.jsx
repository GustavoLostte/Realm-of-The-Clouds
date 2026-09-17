import React, { useState, useEffect, useRef } from 'react'
import { 
  ArrowLeft, 
  Swords, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  RotateCcw,
  X,
  Coins,
  Gem,
  TreePine,
  Mountain,
  Clock,
  Wheat,
  ShieldAlert,
  Zap
} from 'lucide-react'
import { CAMPAIGN_BIOMES, ENEMY_CONFIGS, CAMPAIGN_SECTORS } from '../data/campaignBiomesData'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { SmartLoader } from './SmartLoader'
import { preloadImages, preloadVideo, getCombatCriticalAssets } from '../utils/smartAssetLoader'
import './DungeonCampaignWindow.css'

// Isolated high-performance timer component (prevents re-rendering the 1800+ line parent component 4x/sec!)
const CombatTurnTimer = React.memo(function CombatTurnTimer({
  isActive,
  maxTime,
  onTimeout,
  label
}) {
  const [timeLeft, setTimeLeft] = useState(maxTime)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(maxTime)
      return
    }
    const step = 0.25
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= step) {
          onTimeoutRef.current?.()
          return maxTime
        }
        return Math.max(0, +(prev - step).toFixed(2))
      })
    }, 250)
    return () => clearInterval(interval)
  }, [isActive, maxTime])

  const pct = Math.min(100, Math.max(0, (timeLeft / maxTime) * 100))
  const isUrgent = timeLeft <= 1.8
  const isWarning = timeLeft <= 3.0

  return (
    <div className="combat-turn-timer-strip">
      <div className="turn-timer-header">
        <div className="turn-timer-label">
          <Clock size={14} className={`timer-clock-icon ${isUrgent ? 'urgent-spin' : ''}`} />
          <span>{label}</span>
        </div>
        <span className={`turn-timer-seconds ${isUrgent ? 'urgent' : ''}`}>
          {timeLeft.toFixed(1)}s
        </span>
      </div>
      <div className="turn-timer-bar-track">
        <div 
          className={`turn-timer-bar-fill ${isUrgent ? 'urgent' : isWarning ? 'warning' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
})

export function DungeonCampaignWindow({ 
  isOpen, 
  onClose, 
  onClaimLoot, 
  troops = { infantry: 0, archers: 0, mages: 0, commander: 0 },
  completedNodes: propCompletedNodes,
  setCompletedNodes: propSetCompletedNodes,
  unlockedBiomes: propUnlockedBiomes,
  setUnlockedBiomes: propSetUnlockedBiomes,
  onNodeDefeated,
  consumables = { potion_heal: 0, potion_focus: 0, bomb_dwarf: 0 },
  onUseConsumable,
  equippedRelics = {},
  unlockedTechIds = [],
  onObtainRelic,
  gems = 0,
  onDungeonRevive,
  onOpenShop,
  resources = {},
  onRetreatCost,
}) {
  const { t } = useTranslation()
  // Biome & Progression State (support hoisted or internal state)
  const [internalUnlockedBiomes, setInternalUnlockedBiomes] = useState(['biome-1'])
  const [internalCompletedNodes, setInternalCompletedNodes] = useState([])

  const unlockedBiomes = propUnlockedBiomes || internalUnlockedBiomes
  const setUnlockedBiomes = propSetUnlockedBiomes || setInternalUnlockedBiomes

  const completedNodes = propCompletedNodes || internalCompletedNodes
  const setCompletedNodes = propSetCompletedNodes || setInternalCompletedNodes

  const [activeBiomeId, setActiveBiomeId] = useState('biome-1')
  const [selectedNodeId, setSelectedNodeId] = useState('node-1')
  const [accumulatedLoot, setAccumulatedLoot] = useState({ gold: 0, wood: 0, stone: 0, gems: 0 })

  // Current Biome and Selected Node objects (hoisted at top to guarantee initialization)
  const currentBiome = CAMPAIGN_BIOMES.find((b) => b.id === activeBiomeId) || CAMPAIGN_BIOMES[0]
  const selectedNode = currentBiome?.nodes?.find((n) => n.id === selectedNodeId) || currentBiome?.nodes?.[0] || null

  // Relic & Tech Combat Bonuses
  let relicHpBonus = 0
  let relicDmgBonus = 0
  let relicCritThresholdBonus = 0
  let relicReductionBonus = 0

  if (equippedRelics?.weapon === 'relic_espada_jade') {
    relicDmgBonus += 14
    relicCritThresholdBonus += 2.0
  }
  if (equippedRelics?.accessory === 'relic_caliz_titan') {
    relicHpBonus += 60
    relicReductionBonus += 8
  }
  if (equippedRelics?.accessory === 'relic_emblema_leon') {
    relicDmgBonus += 15
  }
  if (equippedRelics?.accessory === 'relic_broquel_hierro') {
    relicHpBonus += 25
    relicReductionBonus += 4
  }

  // Tech Bonuses
  if (unlockedTechIds.includes('tech-swords')) {
    relicHpBonus += 30
    relicReductionBonus += 4
  }
  if (unlockedTechIds.includes('tech-tactics')) {
    relicDmgBonus += 12
  }
  if (unlockedTechIds.includes('tech-bows')) {
    relicCritThresholdBonus += 1.8
  }

  // Tactical Army Bonuses
  const infantryCount = troops.infantry || 0
  const archersCount = troops.archers || 0
  const magesCount = troops.mages || 0
  const commanderCount = troops.commander || 0

  const armyBonusHp = infantryCount * 25 + commanderCount * 50
  const effectiveMaxHp = 120 + armyBonusHp + relicHpBonus
  const damageReduction = Math.min(30, infantryCount * 3 + commanderCount * 8 + relicReductionBonus)
  const critThreshold = 7.5 + Math.min(5.0, archersCount * 0.8) + relicCritThresholdBonus
  const perfectThreshold = 20.0 + Math.min(6.5, archersCount * 1.1) + relicCritThresholdBonus
  const magicBonus = magesCount * (unlockedTechIds.includes('tech-crystals') ? 26 : 18)
  const commanderMult = commanderCount > 0 ? (unlockedTechIds.includes('tech-fury') ? 1.45 : 1.25) : 1.0

  // Active Combat State (null = map view, non-null = active duel)
  const MAX_TURN_TIME = 7.0
  const [combatNode, setCombatNode] = useState(null)
  const [isCombatLoading, setIsCombatLoading] = useState(false)
  const [combatLoadProgress, setCombatLoadProgress] = useState(0)
  const [pendingDuelNode, setPendingDuelNode] = useState(null)
  const [playerHp, setPlayerHp] = useState(effectiveMaxHp)
  const [playerMaxHp, setPlayerMaxHp] = useState(effectiveMaxHp)
  const [enemyHp, setEnemyHp] = useState(100)
  const [enemyMaxHp, setEnemyMaxHp] = useState(100)
  const [activeClip, setActiveClip] = useState('idle') // 'idle' | 'hero_atk' | 'orc_atk'
  const needlePosRef = useRef(50)
  const needleRef = useRef(null)
  const [isAttacking, setIsAttacking] = useState(false)
  const isAttackingRef = useRef(false)
  const [commanderSkillUsed, setCommanderSkillUsed] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [floatingDamage, setFloatingDamage] = useState(null)
  const [critFlash, setCritFlash] = useState(false)
  const [combatResult, setCombatResult] = useState(null) // null | 'VICTORY' | 'DEFEAT'
  const [biomeClearedCelebration, setBiomeClearedCelebration] = useState(false)
  const [showRetreatConfirm, setShowRetreatConfirm] = useState(false)
  const pendingCounterRef = useRef({ needed: false, strikeType: 'good' })

  // Combat Speed: 1x (Normal) or 2x (Turbo)
  const [combatSpeed, setCombatSpeed] = useState(() => {
    try {
      return Number(localStorage.getItem('toc_combat_speed')) || 1
    } catch {
      return 1
    }
  })
  const toggleCombatSpeed = () => {
    setCombatSpeed((prev) => {
      const next = prev === 1 ? 2 : 1
      try {
        localStorage.setItem('toc_combat_speed', String(next))
      } catch {}
      return next
    })
  }

  // Helper to retrieve animation, video and audio configurations per enemy type
  const getEnemyConfig = (node) => {
    if (!node) return ENEMY_CONFIGS.orc
    const type = node.enemyType || node.category || 'orc'
    return ENEMY_CONFIGS[type] || ENEMY_CONFIGS.orc
  }
  const currentEnemyConfig = getEnemyConfig(combatNode)


  // Scroll ref for smooth horizontal architecture canvas panning
  const canvasScrollRef = useRef(null)
  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: true, currentSector: 1 })

  // Drag-to-scroll state for touch & mouse
  const [isDragging, setIsDragging] = useState(false)
  const isPointerDownRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftStartRef = useRef(0)
  const hasMovedRef = useRef(false)

  const handleCanvasScroll = () => {
    if (!canvasScrollRef.current) return
    const el = canvasScrollRef.current
    const canLeft = el.scrollLeft > 25
    const canRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - 25)

    const centerPos = el.scrollLeft + el.clientWidth / 2
    const pct = (centerPos / 2400) * 100
    let curSec = 1
    if (pct >= 78) curSec = 6
    else if (pct >= 56) curSec = 5
    else if (pct >= 48) curSec = 4
    else if (pct >= 26) curSec = 3
    else if (pct >= 16) curSec = 2
    else curSec = 1

    setScrollState((prev) => {
      if (prev.canScrollLeft === canLeft && prev.canScrollRight === canRight && prev.currentSector === curSec) {
        return prev
      }
      return { canScrollLeft: canLeft, canScrollRight: canRight, currentSector: curSec }
    })
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest('button') || e.target.closest('.sector-header-marker')) return
    isPointerDownRef.current = true
    hasMovedRef.current = false
    startXRef.current = e.pageX
    scrollLeftStartRef.current = canvasScrollRef.current ? canvasScrollRef.current.scrollLeft : 0
    setIsDragging(true)
  }

  const handleMouseMove = (e) => {
    if (!isPointerDownRef.current || !canvasScrollRef.current) return
    const diff = e.pageX - startXRef.current
    if (Math.abs(diff) > 5) {
      hasMovedRef.current = true
    }
    canvasScrollRef.current.scrollLeft = scrollLeftStartRef.current - diff
  }

  const handleMouseUp = () => {
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false
      setIsDragging(false)
    }
  }

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return
    if (e.target.closest('button') || e.target.closest('.sector-header-marker')) return
    isPointerDownRef.current = true
    hasMovedRef.current = false
    startXRef.current = e.touches[0].pageX
    scrollLeftStartRef.current = canvasScrollRef.current ? canvasScrollRef.current.scrollLeft : 0
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isPointerDownRef.current || !canvasScrollRef.current || e.touches.length !== 1) return
    const diff = e.touches[0].pageX - startXRef.current
    if (Math.abs(diff) > 5) {
      hasMovedRef.current = true
    }
    canvasScrollRef.current.scrollLeft = scrollLeftStartRef.current - diff
  }

  const handleTouchEnd = () => {
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false
      setIsDragging(false)
    }
  }

  const handleScrollStep = (direction) => {
    if (!canvasScrollRef.current) return
    soundManager.playClick()
    const step = (canvasScrollRef.current.clientWidth || 600) * 0.72
    canvasScrollRef.current.scrollBy({
      left: direction * step,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    const handleGlobalUp = () => {
      if (isPointerDownRef.current) {
        isPointerDownRef.current = false
        setIsDragging(false)
      }
    }
    window.addEventListener('mouseup', handleGlobalUp)
    window.addEventListener('touchend', handleGlobalUp)
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp)
      window.removeEventListener('touchend', handleGlobalUp)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        handleCanvasScroll()
      }, 120)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleScrollToSector = (sectorId) => {
    if (!canvasScrollRef.current) return
    soundManager.playClick()
    const sec = CAMPAIGN_SECTORS.find((s) => s.id === sectorId)
    if (sec) {
      const firstNodeId = `node-${sec.range[0]}`
      const firstNode = currentBiome.nodes.find((n) => n.id === firstNodeId)
      if (firstNode) {
        setSelectedNodeId(firstNode.id)
        const targetX = (firstNode.gridX / 100) * 2400
        const viewportWidth = canvasScrollRef.current.clientWidth || 900
        canvasScrollRef.current.scrollTo({
          left: Math.max(0, targetX - viewportWidth / 2),
          behavior: 'smooth',
        })
      }
    }
  }

  // Auto-center camera on the selected node
  useEffect(() => {
    if (!isOpen || !selectedNode || !canvasScrollRef.current) return
    const targetX = (selectedNode.gridX / 100) * 2400
    const viewportWidth = canvasScrollRef.current.clientWidth || 900
    canvasScrollRef.current.scrollTo({
      left: Math.max(0, targetX - viewportWidth / 2),
      behavior: 'smooth',
    })
  }, [selectedNode?.id, isOpen])

  // QA / Testing helper for quick debugging in console
  useEffect(() => {
    window.__tocDevCampaign = {
      unlockAll: () => setCompletedNodes(['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11', 'node-12', 'node-13', 'node-14', 'node-15', 'node-16']),
      unlockMiniboss: () => setCompletedNodes(['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7', 'node-8']),
      unlockBoss: () => setCompletedNodes(['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7', 'node-8', 'node-9', 'node-10', 'node-11', 'node-12', 'node-13', 'node-14', 'node-15', 'node-16']),
      resetProgress: () => setCompletedNodes([])
    }
    return () => { delete window.__tocDevCampaign }
  }, [])

  // Video refs for 0-latency playback
  const idleVideoRef = useRef(null)
  const heroAtkVideoRef = useRef(null)
  const orcAtkVideoRef = useRef(null)

  // Needle oscillation animation
  const animRef = useRef(null)
  const startTimeRef = useRef(performance.now())

  // Check if a node is available to fight
  const isNodeAvailable = (node) => {
    if (completedNodes.includes(node.id)) return false
    // First node in biome is always available if not completed
    if (node.stage === 1) return true
    // Look for predecessors in current biome
    const predecessors = currentBiome.nodes.filter((n) => n.connectedTo?.includes(node.id))
    if (predecessors.length === 0) return true
    // If any predecessor is completed, node is unlocked!
    return predecessors.some((p) => completedNodes.includes(p.id))
  }

  // Check node status
  const getNodeStatus = (node) => {
    if (completedNodes.includes(node.id)) return 'completed'
    if (isNodeAvailable(node)) return 'available'
    return 'locked'
  }

  // Handle switching biomes
  const handleSelectBiome = (biomeId) => {
    if (!unlockedBiomes.includes(biomeId)) {
      soundManager.playHit()
      return
    }
    soundManager.playClick()
    setActiveBiomeId(biomeId)
    const b = CAMPAIGN_BIOMES.find((item) => item.id === biomeId)
    if (b && b.nodes.length > 0) {
      setSelectedNodeId(b.nodes[0].id)
    }
  }

  // Handle clicking a node in the architectural map
  const handleNodeClick = (node) => {
    if (hasMovedRef.current) return
    soundManager.playClick()
    setSelectedNodeId(node.id)

    // If it's the portal node and unlocked
    if (node.type === 'portal' && isNodeAvailable(node)) {
      handleEnterPortal(node)
    }
  }

  // Launch Duel for the selected node with intelligent asset preloading
  const handleStartDuel = (node) => {
    if (getNodeStatus(node) !== 'available') return
    soundManager.playSwordSwing()

    const enemyConfig = getEnemyConfig(node)
    const combatAssets = getCombatCriticalAssets(enemyConfig)

    setIsCombatLoading(true)
    setCombatLoadProgress(15)
    setPendingDuelNode(node)

    // Preload image assets and video buffer concurrently
    Promise.all([
      preloadImages(combatAssets, (pct) => {
        setCombatLoadProgress(Math.max(15, pct))
      }, 550),
      preloadVideo(enemyConfig?.idleVideo, 1400),
    ]).then(() => {
      setCombatLoadProgress(100)
    })
  }

  const handleCombatLoadFinished = () => {
    if (!pendingDuelNode) return
    const node = pendingDuelNode
    setCombatNode(node)
    setPlayerHp(effectiveMaxHp)
    setPlayerMaxHp(effectiveMaxHp)
    setEnemyHp(node.hp)
    setEnemyMaxHp(node.hp)
    isAttackingRef.current = false
    setActiveClip('idle')
    setIsAttacking(false)
    setCommanderSkillUsed(false)
    setCombatResult(null)
    setFloatingDamage(null)
    setIsCombatLoading(false)
    setPendingDuelNode(null)
  }

  // Handle entering Portal to next Biome
  const handleEnterPortal = (node) => {
    if (node.targetBiomeId && !unlockedBiomes.includes(node.targetBiomeId)) {
      soundManager.playVictory()
      setUnlockedBiomes((prev) => [...prev, node.targetBiomeId])
      setCompletedNodes((prev) => [...prev, node.id])
      setBiomeClearedCelebration(true)
    }
  }

  // Travel to next Biome after celebration
  const handleProceedToNextBiome = () => {
    setBiomeClearedCelebration(false)
    if (selectedNode?.targetBiomeId) {
      setActiveBiomeId(selectedNode.targetBiomeId)
      const nextB = CAMPAIGN_BIOMES.find((b) => b.id === selectedNode.targetBiomeId)
      if (nextB && nextB.nodes.length > 0) {
        setSelectedNodeId(nextB.nodes[0].id)
      }
    }
  }

  // Needle oscillation loop when in combat (Direct DOM manipulation for 60-120 FPS without React re-renders)
  useEffect(() => {
    if (!combatNode || combatResult) return

    if (idleVideoRef.current) {
      idleVideoRef.current.currentTime = 0
      idleVideoRef.current.play().catch(() => {})
    }

    startTimeRef.current = performance.now()
    const speed = combatNode.needleSpeed || 1.4
    let lastNeedleTime = 0

    const loop = (now) => {
      animRef.current = requestAnimationFrame(loop)
      lastNeedleTime = now

      const elapsed = (now - startTimeRef.current) / 1000
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
  }, [combatNode, combatResult])

  // Playback control when switching active video in combat (Pauses inactive videos to free up mobile GPU decoder)
  useEffect(() => {
    if (!combatNode) return
    const rate = combatSpeed === 2 ? 1.75 : 1.25
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
        heroAtkVideoRef.current.playbackRate = rate
        heroAtkVideoRef.current.play().catch(() => {})
      }
    } else if (activeClip === 'orc_atk') {
      idleVideoRef.current?.pause()
      heroAtkVideoRef.current?.pause()
      if (orcAtkVideoRef.current) {
        orcAtkVideoRef.current.currentTime = 0
        orcAtkVideoRef.current.playbackRate = rate
        orcAtkVideoRef.current.play().catch(() => {})
      }
    }
  }, [activeClip, combatNode, combatSpeed])

  // Safety timeout refs for combat animations
  const heroAtkTimeoutRef = useRef(null)
  const enemyAtkTimeoutRef = useRef(null)

  // Enemy counter-attacks hero back after hero strikes
  const executeEnemyCounter = (heroStrikeType) => {
    if (!combatNode || combatResult) return
    soundManager.playEnemyAttack(currentEnemyConfig.category)
    setActiveClip('orc_atk')

    const speedFactor = combatSpeed === 2 ? 1.65 : 1.0
    const hitDelay = Math.round((currentEnemyConfig.enemyHitDelay || 320) / speedFactor)
    const atkDuration = Math.round((currentEnemyConfig.enemyAtkDuration || 1150) / speedFactor)

    // Critical or Perfect hits stagger/daze the enemy, softening their counter-strike
    const staggerFactor = heroStrikeType === 'critical' ? 0.60 : heroStrikeType === 'perfect' ? 0.80 : 1.0
    const rawDamage = ((combatNode.attackDamage || 18) + Math.random() * 4) * staggerFactor
    const damageToPlayer = Math.max(6, Math.floor(rawDamage - damageReduction))

    setTimeout(() => {
      soundManager.playHit()
      setScreenShake(true)
      setTimeout(() => setScreenShake(false), Math.round(250 / speedFactor))

      const counterPrefix = heroStrikeType === 'critical'
        ? (t('campaignData.combat.dazed') || '[¡ATURDIDO!] -')
        : (t('campaignData.combat.counter') || '[¡CONTRAATAQUE!] -')
      setFloatingDamage({
        text: `${counterPrefix}${damageToPlayer} HP`,
        type: 'miss',
        target: 'player'
      })

      setPlayerHp((prevHp) => {
        const nextHp = Math.max(0, prevHp - damageToPlayer)
        if (nextHp <= 0) {
          setTimeout(() => {
            setCombatResult('DEFEAT')
            isAttackingRef.current = false
            setIsAttacking(false)
            soundManager.playHit()
          }, combatSpeed === 2 ? 600 : 900)
        }
        return nextHp
      })
    }, hitDelay)

    if (enemyAtkTimeoutRef.current) clearTimeout(enemyAtkTimeoutRef.current)
    enemyAtkTimeoutRef.current = setTimeout(() => {
      handleEnemyAtkEnded()
    }, atkDuration + 60)
  }

  const handleHeroAtkEnded = () => {
    if (heroAtkTimeoutRef.current) {
      clearTimeout(heroAtkTimeoutRef.current)
      heroAtkTimeoutRef.current = null
    }

    // If enemy survived the strike, execute enemy retaliation!
    if (pendingCounterRef.current.needed && !combatResult) {
      const type = pendingCounterRef.current.strikeType
      pendingCounterRef.current = { needed: false, strikeType: 'good' }
      executeEnemyCounter(type)
    } else {
      pendingCounterRef.current = { needed: false, strikeType: 'good' }
      setActiveClip('idle')
      isAttackingRef.current = false
      setIsAttacking(false)
      setFloatingDamage(null)
    }
  }

  const handleEnemyAtkEnded = () => {
    if (enemyAtkTimeoutRef.current) {
      clearTimeout(enemyAtkTimeoutRef.current)
      enemyAtkTimeoutRef.current = null
    }
    setActiveClip('idle')
    isAttackingRef.current = false
    setIsAttacking(false)
    setFloatingDamage(null)
  }

  // Cleanup animation timers on unmount
  useEffect(() => {
    return () => {
      if (heroAtkTimeoutRef.current) clearTimeout(heroAtkTimeoutRef.current)
      if (enemyAtkTimeoutRef.current) clearTimeout(enemyAtkTimeoutRef.current)
    }
  }, [])

  // Timeout when player runs out of time to attack
  const handleTimeoutMiss = () => {
    if (isAttackingRef.current || !combatNode || combatResult) return
    isAttackingRef.current = true
    setIsAttacking(true)

    // Enemy strikes because hero hesitated!
    soundManager.playEnemyAttack(currentEnemyConfig.category)
    setActiveClip('orc_atk')

    const rawDamage = (combatNode.attackDamage || 16) + Math.random() * 6
    const damageToPlayer = Math.max(8, Math.floor(rawDamage - damageReduction))
    const speedFactor = combatSpeed === 2 ? 1.65 : 1.0
    const hitDelay = Math.round((currentEnemyConfig.enemyHitDelay || 320) / speedFactor)
    const atkDuration = Math.round((currentEnemyConfig.enemyAtkDuration || 1150) / speedFactor)

    setTimeout(() => {
      soundManager.playHit()
      setScreenShake(true)
      setTimeout(() => setScreenShake(false), Math.round(250 / speedFactor))

      setFloatingDamage({
        text: `¡TIEMPO AGOTADO! -${damageToPlayer} HP`,
        type: 'miss',
        target: 'player'
      })

      setPlayerHp((prevHp) => {
        const nextHp = Math.max(0, prevHp - damageToPlayer)
        if (nextHp <= 0) {
          setTimeout(() => {
            setCombatResult('DEFEAT')
            isAttackingRef.current = false
            setIsAttacking(false)
            soundManager.playHit()
          }, combatSpeed === 2 ? 600 : 900)
        }
        return nextHp
      })
    }, hitDelay)

    if (enemyAtkTimeoutRef.current) clearTimeout(enemyAtkTimeoutRef.current)
    enemyAtkTimeoutRef.current = setTimeout(() => {
      handleEnemyAtkEnded()
    }, atkDuration + 60)
  }

  // Combat Strike execution (instant touch response, zero input lag)
  const handleStrike = (isUltimate = false) => {
    if (isAttackingRef.current || !combatNode || combatResult) return

    if (isUltimate) {
      if (commanderSkillUsed || commanderCount <= 0) return
      setCommanderSkillUsed(true)
    }

    isAttackingRef.current = true
    setIsAttacking(true)
    const hitPosition = needlePosRef.current
    const distFromCenter = Math.abs(hitPosition - 50)

    let strikeType = 'miss'
    let damageToEnemy = 0
    let damageToPlayer = 0

    if (isUltimate || distFromCenter <= critThreshold) {
      // CRITICAL HIT!
      strikeType = 'critical'
      damageToEnemy = Math.floor((70 + Math.random() * 15 + magicBonus + relicDmgBonus) * commanderMult * (isUltimate ? 1.45 : 1.0))
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 80])
      }
    } else if (distFromCenter <= perfectThreshold) {
      // PERFECT HIT!
      strikeType = 'perfect'
      damageToEnemy = Math.floor((48 + Math.random() * 10 + magicBonus + Math.floor(relicDmgBonus * 0.8)) * commanderMult)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35)
      }
    } else if (distFromCenter <= 38) {
      // GOOD HIT!
      strikeType = 'good'
      damageToEnemy = Math.floor((30 + Math.random() * 8 + Math.floor(magicBonus / 2) + Math.floor(relicDmgBonus * 0.5)) * commanderMult)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20)
      }
    } else {
      // MISS!
      strikeType = 'miss'
      const rawDamage = combatNode.attackDamage + Math.random() * 4
      damageToPlayer = Math.max(8, Math.floor(rawDamage - damageReduction))
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([70, 40, 70])
      }
    }

    const speedFactor = combatSpeed === 2 ? 1.65 : 1.0

    if (strikeType !== 'miss') {
      // HERO ATTACKS
      soundManager.playSwordSwing()
      soundManager.playHeroAttackEnemy(currentEnemyConfig.category)
      setActiveClip('hero_atk')

      const hitDelay = Math.round((currentEnemyConfig.heroHitDelay || 380) / speedFactor)
      const atkDuration = Math.round((currentEnemyConfig.heroAtkDuration || 1180) / speedFactor)

      setTimeout(() => {
        if (strikeType === 'critical') {
          soundManager.playCriticalHit()
          setCritFlash(true)
          setScreenShake(true)
          setTimeout(() => {
            setCritFlash(false)
            setScreenShake(false)
          }, Math.round(300 / speedFactor))
        } else {
          soundManager.playHit()
          setScreenShake(true)
          setTimeout(() => setScreenShake(false), Math.round(200 / speedFactor))
        }

        const critText = isUltimate ? `[¡FURIA REAL!] -${damageToEnemy}` : `¡¡CRÍTICO!! -${damageToEnemy}`
        setFloatingDamage({
          text: strikeType === 'critical' ? critText : `-${damageToEnemy}`,
          type: strikeType,
          target: 'enemy'
        })

        setEnemyHp((prevHp) => {
          const nextHp = Math.max(0, prevHp - damageToEnemy)
          if (nextHp <= 0) {
            pendingCounterRef.current = { needed: false, strikeType }
            setTimeout(() => {
              handleCombatVictory()
            }, combatSpeed === 2 ? 650 : 950)
          } else {
            pendingCounterRef.current = { needed: true, strikeType }
          }
          return nextHp
        })
      }, hitDelay)

      if (heroAtkTimeoutRef.current) clearTimeout(heroAtkTimeoutRef.current)
      heroAtkTimeoutRef.current = setTimeout(() => {
        handleHeroAtkEnded()
      }, atkDuration + 60)

    } else {
      pendingCounterRef.current = { needed: false, strikeType: 'miss' }
      // ENEMY COUNTER-ATTACK
      soundManager.playEnemyAttack(currentEnemyConfig.category)
      setActiveClip('orc_atk')

      const hitDelay = Math.round((currentEnemyConfig.enemyHitDelay || 320) / speedFactor)
      const atkDuration = Math.round((currentEnemyConfig.enemyAtkDuration || 1150) / speedFactor)

      setTimeout(() => {
        soundManager.playHit()
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), Math.round(250 / speedFactor))

        setFloatingDamage({
          text: `¡FALLO! -${damageToPlayer} HP`,
          type: 'miss',
          target: 'player'
        })

        setPlayerHp((prevHp) => {
          const nextHp = Math.max(0, prevHp - damageToPlayer)
          if (nextHp <= 0) {
            setTimeout(() => {
              setCombatResult('DEFEAT')
              isAttackingRef.current = false
              setIsAttacking(false)
              soundManager.playHit()
            }, combatSpeed === 2 ? 600 : 900)
          }
          return nextHp
        })
      }, hitDelay)

      if (enemyAtkTimeoutRef.current) clearTimeout(enemyAtkTimeoutRef.current)
      enemyAtkTimeoutRef.current = setTimeout(() => {
        handleEnemyAtkEnded()
      }, atkDuration + 60)
    }
  }

  // Handle victory in combat
  const handleCombatVictory = () => {
    soundManager.playVictory()
    setCombatResult('VICTORY')
    isAttackingRef.current = false
    setIsAttacking(false)

    // Add node rewards to accumulated loot
    const r = combatNode.rewards || {}
    setAccumulatedLoot((prev) => ({
      gold: prev.gold + (r.gold || 0),
      wood: prev.wood + (r.wood || 0),
      stone: prev.stone + (r.stone || 0),
      gems: prev.gems + (r.gems || 0),
    }))

    // Mark node as completed in progress
    if (!completedNodes.includes(combatNode.id)) {
      setCompletedNodes((prev) => [...prev, combatNode.id])
    }

    // Check boss relic drops
    const RELIC_BOSS_MAP = {
      'node-4': 'relic_broquel_hierro',
      'node-9': 'relic_espada_jade',
      'node-13': 'relic_amuleto_selva',
      'node-17': 'relic_corona_caos',
    }

    const droppedRelicId = RELIC_BOSS_MAP[combatNode.id]
    if (droppedRelicId && onObtainRelic) {
      onObtainRelic(droppedRelicId)
    }

    // Notify parent for quest evaluation and XP
    if (onNodeDefeated) {
      onNodeDefeated(combatNode)
    }
  }

  // Combat Consumable Quick Actions
  const handleUsePotion = () => {
    if ((consumables.potion_heal || 0) <= 0 || isAttackingRef.current) return
    soundManager.playQuestSuccess()
    setPlayerHp((prev) => Math.min(effectiveMaxHp, prev + 60))
    onUseConsumable?.('potion_heal')
    setFloatingDamage({
      text: '+60 HP (Poción)',
      type: 'perfect',
      target: 'player'
    })
  }

  const handleUseBomb = () => {
    if ((consumables.bomb_dwarf || 0) <= 0 || isAttackingRef.current) return
    soundManager.playHit()
    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 250)
    setEnemyHp((prev) => {
      const next = Math.max(0, prev - 50)
      if (next <= 0) {
        setTimeout(handleCombatVictory, combatSpeed === 2 ? 500 : 750)
      }
      return next
    })
    onUseConsumable?.('bomb_dwarf')
    setFloatingDamage({
      text: '-50 DAÑO (Bomba)',
      type: 'critical',
      target: 'enemy'
    })
  }

  // Calculate Retreat Cost in active battle
  const calculateRetreatCost = (node) => {
    if (!node) return { gold: 40, food: 20 }
    const baseRewardGold = node.rewards?.gold || 120
    const goldCost = Math.max(40, Math.min(300, Math.round(baseRewardGold * 0.4)))
    const foodCost = Math.max(20, Math.min(150, Math.round(goldCost * 0.5)))
    return { gold: goldCost, food: foodCost }
  }

  const handleRetreatClick = () => {
    if (combatResult) {
      handleReturnToMap()
      return
    }
    setShowRetreatConfirm(true)
  }

  const handleConfirmRetreat = () => {
    soundManager.playButtonClick()
    setShowRetreatConfirm(false)

    // Deduct retreat penalty
    const cost = calculateRetreatCost(combatNode)
    if (onRetreatCost) {
      onRetreatCost(cost)
    }

    // Cut accumulated loot from this expedition run by 50%
    setAccumulatedLoot((prev) => ({
      gold: Math.floor((prev.gold || 0) * 0.5),
      wood: Math.floor((prev.wood || 0) * 0.5),
      stone: Math.floor((prev.stone || 0) * 0.5),
      food: Math.floor((prev.food || 0) * 0.5),
      gems: Math.floor((prev.gems || 0) * 0.5),
    }))

    handleReturnToMap()
  }

  // Return to node map after battle
  const handleReturnToMap = () => {
    soundManager.playClick()
    setShowRetreatConfirm(false)
    if (heroAtkTimeoutRef.current) clearTimeout(heroAtkTimeoutRef.current)
    if (enemyAtkTimeoutRef.current) clearTimeout(enemyAtkTimeoutRef.current)
    setCombatNode(null)
    setCombatResult(null)
    setActiveClip('idle')
    isAttackingRef.current = false
    setIsAttacking(false)
    setFloatingDamage(null)
  }

  // Exit Campaign Window back to city, claiming all loot
  const handleExitToCity = () => {
    soundManager.playCollect()
    if (onClaimLoot) {
      onClaimLoot(accumulatedLoot)
    }
    onClose()
  }

  const handleStrikeRef = useRef(handleStrike)
  handleStrikeRef.current = handleStrike

  // Spacebar hotkey during combat & Escape to retreat or exit
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && combatNode && !combatResult) {
        e.preventDefault()
        handleStrikeRef.current?.()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        if (combatNode) {
          handleRetreatClick()
        } else {
          handleExitToCity()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, combatNode, combatResult])

  if (!isOpen) return null

  // Calculate Biome Completion Percentage
  const biomeTotalCombatNodes = currentBiome.nodes.filter((n) => n.type !== 'portal').length
  const biomeCompletedCount = currentBiome.nodes.filter((n) => completedNodes.includes(n.id) && n.type !== 'portal').length
  const biomeProgressPct = Math.round((biomeCompletedCount / Math.max(1, biomeTotalCombatNodes)) * 100)

  const playerHpPct = Math.max(0, (playerHp / playerMaxHp) * 100)
  const enemyHpPct = Math.max(0, (enemyHp / enemyMaxHp) * 100)

  // Dynamic localization helpers for campaign biome, nodes, and combat
  const currentBiomeName = t(`campaignData.${activeBiomeId === 'biome-1' ? 'biome1' : activeBiomeId}.name`) || currentBiome.name
  const currentBiomeSubtitle = t(`campaignData.${activeBiomeId === 'biome-1' ? 'biome1' : activeBiomeId}.subtitle`) || currentBiome.subtitle
  const selectedNodeName = selectedNode ? (t(`campaignData.nodes.${selectedNode.id}.name`) || selectedNode.name) : ''
  const selectedNodeSub = selectedNode ? (t(`campaignData.nodes.${selectedNode.id}.subtitle`) || selectedNode.subtitle) : ''
  const selectedNodeDesc = selectedNode ? (t(`campaignData.nodes.${selectedNode.id}.desc`) || selectedNode.description || t('dungeon.defaultNodeDesc') || 'Enfréntate a este peligroso adversario para despejar el camino del bioma.') : ''
  const combatNodeName = combatNode ? (t(`campaignData.nodes.${combatNode.id}.name`) || combatNode.name) : ''

  return (
    <div className="campaign-window-root">
      {/* Background prefetch for selected node battle assets so duel loads in 0ms */}
      {selectedNode && selectedNode.type !== 'portal' && (
        <>
          <link rel="prefetch" href={getEnemyConfig(selectedNode).idleVideo} as="video" />
          {getEnemyConfig(selectedNode).poster && (
            <link rel="prefetch" href={getEnemyConfig(selectedNode).poster} as="image" />
          )}
        </>
      )}

      {/* 1. TOP CAMPAIGN BAR */}
      <header className="campaign-topbar">
        <div className="campaign-bar-left">
          <button 
            className="campaign-back-btn" 
            onClick={handleExitToCity}
            title={t('dungeon.backToBastion')}
          >
            <ArrowLeft size={16} />
            <span className="back-btn-text-full">{t('dungeon.backToBastion')}</span>
            <span className="back-btn-text-mobile">{t('dungeon.bastion')}</span>
          </button>

          <div className="campaign-biome-info">
            <div className="biome-hero-icon-box">
              <img 
                src={currentBiome.icon} 
                alt={t('dungeon.campaign') || "Campaña"} 
                className="biome-hero-img" 
              />
            </div>
            <div className="biome-title-col">
              <div className="biome-title-row">
                <h1 className="biome-main-title">{currentBiomeName}</h1>
                <span className="biome-progress-tag">
                  {t('dungeon.conqueredProgress', { current: biomeCompletedCount, total: biomeTotalCombatNodes, pct: biomeProgressPct })}
                </span>
              </div>
              <div className="biome-subtext">{currentBiomeSubtitle}</div>
            </div>
          </div>
        </div>

        {/* Accumulated Loot in Campaign & Exit Candy Button */}
        <div className="campaign-topbar-right">
          <div className="campaign-loot-summary">
            <span className="loot-title-label">{t('dungeon.lootLabel')}</span>
            <div className="loot-stat gold"><Coins size={14} /> {accumulatedLoot.gold}</div>
            <div className="loot-stat wood"><TreePine size={14} /> {accumulatedLoot.wood}</div>
            <div className="loot-stat stone"><Mountain size={14} /> {accumulatedLoot.stone}</div>
            <div className="loot-stat gems"><Gem size={14} /> {accumulatedLoot.gems}</div>
          </div>

          <button 
            className="modal-close-candy-btn campaign-close-candy-btn"
            onClick={handleExitToCity}
            title={t('dungeon.backToBastion')}
            aria-label={t('dungeon.backToBastion')}
          >
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="campaign-workspace">
        {/* MAP VIEWPORT WRAPPER (With Floating Pan Arrows & Pinned Sector Bar) */}
        <div className="campaign-map-wrapper">
          {/* Floating Pan Controls */}
          {scrollState.canScrollLeft && (
            <button 
              className="campaign-scroll-arrow left"
              onClick={() => handleScrollStep(-1)}
              title={t('dungeon.panLeft') || "Desplazar a la izquierda"}
              aria-label={t('dungeon.panLeft') || "Desplazar mapa a la izquierda"}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {scrollState.canScrollRight && (
            <button 
              className="campaign-scroll-arrow right"
              onClick={() => handleScrollStep(1)}
              title={t('dungeon.panRight') || "Desplazar a la derecha (Ver más mazmorras)"}
              aria-label={t('dungeon.panRight') || "Desplazar mapa a la derecha"}
            >
              <span className="scroll-arrow-label">{t('dungeon.exploreDungeons', { count: 17 })}</span>
              <ChevronRight size={20} />
            </button>
          )}

          {/* Dedicated Sector Navigator Strip pinned to the map */}
          <div className="map-sectors-nav-strip">
            <div className="map-sectors-counter">
              <span className="counter-icon">📍</span>
              <span className="counter-text">{t('dungeon.dungeonCount', { count: 17 })}</span>
            </div>
            <div className="map-sectors-pills">
              {CAMPAIGN_SECTORS.map((sec) => {
                const secName = t(`campaignData.sectors.${sec.id}.name`) || sec.name
                const secDesc = t(`campaignData.sectors.${sec.id}.desc`) || sec.desc
                return (
                  <button
                    key={sec.id}
                    className={`map-sector-pill ${scrollState.currentSector === sec.id ? 'active' : ''}`}
                    onClick={() => handleScrollToSector(sec.id)}
                    title={`${secName} (${secDesc})`}
                  >
                    <img src={sec.icon} alt="" className="mini-res-icon" style={{ width: 12, height: 12 }} />
                    <span className="sector-pill-name">Sector {sec.id}</span>
                    <span className="sector-pill-range">[{sec.range[0] === sec.range[1] ? sec.range[0] : `${sec.range[0]}-${sec.range[1]}`}]</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* A. SYSTEM ARCHITECTURE NODE CANVAS (Scrollable 2400px Landscape) */}
          <div 
            className={`campaign-canvas-container ${isDragging ? 'is-dragging' : ''}`} 
            ref={canvasScrollRef}
            onScroll={handleCanvasScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
          <div className="architecture-map-viewport">
            {/* Background Grid & Ambiance */}
            <div className="circuit-grid-overlay" />

            {/* Sector Visual Boundaries */}
            <div className="sector-boundaries-layer">
              {[
                { x: 17.2, label: 'SECTOR II' },
                { x: 26.0, label: 'SECTOR III' },
                { x: 48.5, label: 'SECTOR IV' },
                { x: 56.0, label: 'SECTOR V' },
                { x: 78.5, label: 'SECTOR VI' }
              ].map((b, i) => (
                <div key={i} className="sector-boundary-divider" style={{ left: `${b.x}%` }}>
                  <span className="sector-boundary-label">{b.label}</span>
                </div>
              ))}
            </div>

            {/* Sector Markers Strip across the top of the map */}
            <div className="sector-markers-bar">
              {CAMPAIGN_SECTORS.map((sec) => {
                const sectorLeftPositions = {
                  1: 2.5,
                  2: 18.0,
                  3: 28.5,
                  4: 49.5,
                  5: 58.5,
                  6: 81.0,
                }
                const left = sectorLeftPositions[sec.id] || 0
                const secName = t(`campaignData.sectors.${sec.id}.name`) || sec.name
                const secDesc = t(`campaignData.sectors.${sec.id}.desc`) || sec.desc
                return (
                  <div 
                    key={sec.id} 
                    className="sector-header-marker" 
                    style={{ left: `${left}%` }}
                    onClick={() => handleScrollToSector(sec.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="sector-marker-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <img src={sec.icon} alt="" className="mini-res-icon" style={{ width: 14, height: 14 }} />
                      <span>{secName}</span>
                    </span>
                    <span className="sector-marker-desc">{secDesc}</span>
                  </div>
                )
              })}
            </div>

            {/* SVG Vector Bus Connecting Nodes (2400 x 600) */}
            <svg className="architecture-svg-canvas" viewBox="0 0 2400 600" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cableActiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <linearGradient id="cableCompletedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Render Connecting Lines between nodes */}
              {currentBiome.nodes.map((node) => {
                if (!node.connectedTo) return null
                const x1 = (node.gridX / 100) * 2400
                const y1 = (node.gridY / 100) * 600

                return node.connectedTo.map((targetId) => {
                  const targetNode = currentBiome.nodes.find((n) => n.id === targetId)
                  if (!targetNode) return null

                  const x2 = (targetNode.gridX / 100) * 2400
                  const y2 = (targetNode.gridY / 100) * 600

                  // Calculate bezier control points for smooth architecture cables
                  const cx1 = x1 + (x2 - x1) * 0.5
                  const cy1 = y1
                  const cx2 = x1 + (x2 - x1) * 0.5
                  const cy2 = y2
                  const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`

                  const isTargetUnlocked = isNodeAvailable(targetNode) || completedNodes.includes(targetNode.id)
                  const isOriginCompleted = completedNodes.includes(node.id)

                  let lineClass = 'cable-idle'
                  let stroke = 'rgba(255, 255, 255, 0.12)'

                  if (isOriginCompleted && completedNodes.includes(targetNode.id)) {
                    lineClass = 'cable-completed'
                    stroke = 'url(#cableCompletedGradient)'
                  } else if (isOriginCompleted && isTargetUnlocked) {
                    lineClass = 'cable-pulsing'
                    stroke = 'url(#cableActiveGradient)'
                  }

                  return (
                    <g key={`${node.id}-${targetId}`}>
                      {/* Background cable */}
                      <path d={d} className="cable-backdrop" fill="none" strokeWidth="4" />
                      {/* Active foreground cable */}
                      <path 
                        d={d} 
                        className={lineClass} 
                        fill="none" 
                        stroke={stroke} 
                        strokeWidth="3.5"
                        filter={lineClass === 'cable-pulsing' ? 'url(#glowEffect)' : undefined}
                      />
                    </g>
                  )
                })
              })}
            </svg>

            {/* Render Nodes as Interactive Circuit Chips */}
            {currentBiome.nodes.map((node) => {
              const status = getNodeStatus(node)
              const isSelected = selectedNodeId === node.id
              const isBoss = node.type === 'boss'
              const isMiniboss = node.type === 'miniboss'
              const nodeName = t(`campaignData.nodes.${node.id}.name`) || node.name

              return (
                <div
                  key={node.id}
                  className={`node-chip-card ${status} ${isSelected ? 'selected' : ''} ${isBoss ? 'boss-node' : ''} ${isMiniboss ? 'miniboss-node' : ''}`}
                  style={{
                    left: `${node.gridX}%`,
                    top: `${node.gridY}%`,
                  }}
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Node Status Indicator Aura */}
                  <div className="node-glow-ring" />

                  {/* Top Badge */}
                  <div className="node-header-badge">
                    <span className="node-stage-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      {isBoss ? (
                        <>
                          <img src="/assets/hud_icons/btn_ranking.webp" alt="Jefe" className="mini-res-icon" style={{ width: '12px', height: '12px' }} />
                          <span>BOSS</span>
                        </>
                      ) : isMiniboss ? (
                        <>
                          <img src="/assets/hud_icons/icon_skull.webp" alt="Miniboss" className="mini-res-icon" style={{ width: '12px', height: '12px' }} />
                          <span>MINIBOSS</span>
                        </>
                      ) : (
                        <span>{t('dungeon.levelStage', { stage: node.stage })}</span>
                      )}
                    </span>
                    {status === 'completed' && <CheckCircle2 size={13} className="check-icon" />}
                    {status === 'locked' && <Lock size={12} className="lock-icon" />}
                  </div>

                  {/* Avatar / Portrait Thumbnail */}
                  <div className="node-avatar-frame">
                    <img 
                      src={node.avatar || '/assets/mazmorras/orc_avatar.webp'} 
                      alt={nodeName} 
                      className="node-avatar-img"
                      draggable="false" 
                    />
                    <span className="node-icon-badge">
                      <img 
                        src={isBoss ? "/assets/hud_icons/btn_ranking.webp" : isMiniboss ? "/assets/hud_icons/icon_skull.webp" : "/assets/hud_icons/btn_army.webp"} 
                        alt="Icono" 
                        className="mini-res-icon" 
                        style={{ width: '14px', height: '14px' }}
                      />
                    </span>
                  </div>

                  {/* Title & Info */}
                  <div className="node-info-block">
                    <div className="node-name">{nodeName}</div>
                    <div className="node-hp-badge">
                      {status === 'completed' ? t('dungeon.defeated') : `${node.hp} HP`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

        {/* B. INSPECTION & DEPLOYMENT SIDE PANEL */}
        <aside className="campaign-inspector-panel">
          <div className="inspector-card">
            {/* Header with Type & Status */}
            <div className="inspector-header">
              <span className="inspector-badge-type" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {selectedNode.type === 'boss' ? (
                  <>
                    <img src="/assets/hud_icons/btn_ranking.webp" alt="Jefe" className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                    <span>{t('dungeon.biomeBoss')}</span>
                  </>
                ) : selectedNode.type === 'portal' ? (
                  <>
                    <img src="/assets/hud_icons/btn_expedition.webp" alt="Portal" className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                    <span>{t('dungeon.dimensionalPortal')}</span>
                  </>
                ) : (
                  <>
                    <img src="/assets/hud_icons/btn_army.webp" alt="Combate" className="mini-res-icon" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                    <span>{t('dungeon.combatNode')}</span>
                  </>
                )}
              </span>
              <span className={`inspector-status-pill ${getNodeStatus(selectedNode)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <img 
                  src={getNodeStatus(selectedNode) === 'completed' ? "/assets/hud_icons/icon_check.webp" : getNodeStatus(selectedNode) === 'available' ? "/assets/hud_icons/btn_army.webp" : "/assets/hud_icons/icon_lock.webp"} 
                  alt="Estado" 
                  className="mini-res-icon" 
                  style={{ width: 14, height: 14, objectFit: 'contain' }}
                />
                <span>{getNodeStatus(selectedNode) === 'completed' ? t('dungeon.nodeCleared') : getNodeStatus(selectedNode) === 'available' ? t('dungeon.nodeReady') : t('dungeon.nodeLocked')}</span>
              </span>
            </div>

            {/* Target Avatar Banner */}
            <div className="inspector-portrait-banner">
              <img 
                src={selectedNode.avatar || '/assets/mazmorras/orc_avatar.webp'} 
                alt={selectedNodeName} 
                className="inspector-portrait-img"
              />
              <div className="inspector-portrait-overlay" />
              <div className="inspector-title-wrap">
                <div className="inspector-enemy-name">{selectedNodeName}</div>
                <div className="inspector-enemy-sub">{selectedNodeSub}</div>
              </div>
            </div>

            {/* Description */}
            <p className="inspector-desc">{selectedNodeDesc}</p>

            {/* Combat Stats (HP, Attack, Needle Speed) */}
            {selectedNode.type !== 'portal' && (
              <div className="inspector-stats-grid">
                <div className="stat-box">
                  <span className="stat-label">{t('dungeon.healthHp')}</span>
                  <span className="stat-value hp">{selectedNode.hp} HP</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">{t('dungeon.attackPower')}</span>
                  <span className="stat-value atk">+{selectedNode.attackDamage} DMG</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">{t('dungeon.timingSpeed')}</span>
                  <span className="stat-value speed">{selectedNode.needleSpeed || 1.35}x</span>
                </div>
              </div>
            )}

            {/* Potential Rewards */}
            <div className="inspector-rewards-section">
              <div className="section-title">{t('dungeon.rewardsOnConquest')}</div>
              <div className="reward-chips-grid">
                {selectedNode.rewards?.gold && (
                  <div className="reward-chip gold"><Coins size={14} /> +{selectedNode.rewards.gold} {t('resources.gold')}</div>
                )}
                {selectedNode.rewards?.wood && (
                  <div className="reward-chip wood"><TreePine size={14} /> +{selectedNode.rewards.wood} {t('resources.wood')}</div>
                )}
                {selectedNode.rewards?.stone && (
                  <div className="reward-chip stone"><Mountain size={14} /> +{selectedNode.rewards.stone} {t('resources.stone')}</div>
                )}
                {selectedNode.rewards?.gems && (
                  <div className="reward-chip gems"><Gem size={14} /> +{selectedNode.rewards.gems} {t('resources.gems')}</div>
                )}
              </div>
            </div>

            {/* Action Deployment Button */}
            <div className="inspector-action-wrap">
              {selectedNode.type === 'portal' ? (
                <button 
                  className="start-duel-action-btn portal"
                  onClick={() => handleEnterPortal(selectedNode)}
                  disabled={getNodeStatus(selectedNode) !== 'available' && !completedNodes.includes(selectedNode.id)}
                >
                  <Sparkles size={20} />
                  <span>{t('dungeon.crossToBiome2')}</span>
                </button>
              ) : (
                <button 
                  className={`start-duel-action-btn ${getNodeStatus(selectedNode)}`}
                  onClick={() => handleStartDuel(selectedNode)}
                  disabled={getNodeStatus(selectedNode) !== 'available'}
                >
                  {getNodeStatus(selectedNode) === 'completed' ? (
                    <>
                      <CheckCircle2 size={20} />
                      <span>{t('dungeon.levelConquered')}</span>
                    </>
                  ) : getNodeStatus(selectedNode) === 'locked' ? (
                    <>
                      <Lock size={20} />
                      <span>{t('dungeon.completePreviousNodes')}</span>
                    </>
                  ) : (
                    <>
                      <Swords size={20} />
                      <span className="duel-btn-text-full">{t('dungeon.startCinematicDuel')}</span>
                      <span className="duel-btn-text-mobile">{t('dungeon.startDuel')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Smart Combat Preloader Curtain */}
      {isCombatLoading && pendingDuelNode && (
        <SmartLoader
          isOpen={isCombatLoading}
          variant="combat"
          title={t(`campaignData.nodes.${pendingDuelNode.id}.name`) || pendingDuelNode.title || t('loader.preparingBattle')}
          subtitle={t('dungeon.levelStage', { stage: pendingDuelNode.stage || 1 })}
          progress={combatLoadProgress}
          onFinished={handleCombatLoadFinished}
        />
      )}

      {/* 3. CINEMATIC DUEL MODAL / VIEWPORT (When fighting a node) */}
      {combatNode && (
        <div className="campaign-combat-overlay">
          <div className={`campaign-combat-stage ${screenShake ? 'screen-shake' : ''}`}>
            {critFlash && <div className="crit-flash-curtain" />}

            {/* Top Combat Bar */}
            <div className="combat-viewport-header">
              <div className="combat-header-node-info">
                <span className="combat-node-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {combatNode.type === 'boss' ? (
                    <>
                      <img src="/assets/hud_icons/btn_ranking.webp" alt="Jefe" className="mini-res-icon" />
                      <span>{t('dungeon.supremeBoss')}</span>
                    </>
                  ) : (
                    <span>{t('dungeon.levelStage', { stage: combatNode.stage })}</span>
                  )}
                </span>
                <span className="combat-enemy-title">{combatNodeName}</span>
              </div>
              <div className="combat-header-actions">
                <button 
                  className={`combat-speed-btn ${combatSpeed === 2 ? 'is-turbo' : ''}`}
                  onClick={toggleCombatSpeed}
                  type="button"
                  title={combatSpeed === 2 ? 'Velocidad Turbo 2x (Activa)' : 'Velocidad Normal 1x'}
                >
                  <Zap size={14} />
                  <span>{combatSpeed === 2 ? '2x TURBO' : '1x VELOCIDAD'}</span>
                </button>
                <button className="combat-abandon-btn" onClick={handleRetreatClick} title={t('dungeon.retreatToMap')}>
                  <X size={18} />
                  <span>{t('dungeon.retreat')}</span>
                </button>
                <button 
                  className="modal-close-candy-btn combat-close-candy-btn" 
                  onClick={handleRetreatClick} 
                  title={t('dungeon.retreatToMap')}
                  aria-label={t('dungeon.retreat')}
                >
                  <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
                </button>
              </div>
            </div>

            {/* Video Viewport: Dynamically loads the corresponding 720p animation for each enemy! */}
            <div className="combat-cinematic-viewport">
              {/* Instant Backdrop Poster rendered at 0ms so screen is never black while video buffers */}
              {currentEnemyConfig.poster && (
                <img 
                  src={currentEnemyConfig.poster} 
                  alt={currentEnemyConfig.name || "Arena"} 
                  className="cinematic-backdrop-poster" 
                  draggable="false"
                />
              )}
              <video
                ref={idleVideoRef}
                key={`idle-${currentEnemyConfig.category}`}
                src={currentEnemyConfig.idleVideo}
                poster={currentEnemyConfig.poster}
                className={`cinematic-actor ${activeClip === 'idle' ? 'visible' : 'hidden'}`}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
              <video
                ref={heroAtkVideoRef}
                key={`hero-atk-${currentEnemyConfig.category}`}
                src={currentEnemyConfig.heroAtkVideo}
                className={`cinematic-actor ${activeClip === 'hero_atk' ? 'visible' : 'hidden'}`}
                playsInline
                muted
                preload="metadata"
                onEnded={handleHeroAtkEnded}
              />
              <video
                ref={orcAtkVideoRef}
                key={`enemy-atk-${currentEnemyConfig.category}`}
                src={currentEnemyConfig.enemyAtkVideo}
                className={`cinematic-actor ${activeClip === 'orc_atk' ? 'visible' : 'hidden'}`}
                playsInline
                muted
                preload="metadata"
                onEnded={handleEnemyAtkEnded}
              />
              <div className="combat-arena-vignette" />
            </div>

            {/* Health HUD with Avatars */}
            <div className="combat-hud-bars">
              {/* Player Card */}
              <div className="hud-fighter-card player">
                <img src="/assets/mazmorras/hero_avatar.webp" alt={t('dungeon.bastionChampion') || "Campeón Real"} className="hud-avatar hero" />
                <div className="hud-bar-body">
                  <div className="hud-name-row">
                    <span className="hud-fighter-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <img src="/assets/hud_icons/btn_army.webp" alt="Campeón" className="mini-res-icon" />
                      <span>{t('dungeon.bastionChampion') || 'Campeón del Bastión'}</span>
                    </span>
                    <span className="hud-hp-num">{playerHp} / {playerMaxHp} HP</span>
                  </div>
                  <div className="hud-bar-track">
                    <div className="hud-bar-fill player" style={{ width: `${playerHpPct}%` }} />
                  </div>
                </div>
              </div>

              {/* VS Center Marker */}
              <div className="hud-vs-box">
                <span className="hud-vs-title">{t('dungeon.vsDuel') || 'DUELO'}</span>
                <span className="hud-vs-sub">{t('dungeon.oneButton') || '1 BOTÓN'}</span>
              </div>

              {/* Enemy Card */}
              <div className="hud-fighter-card enemy">
                <img 
                  src={combatNode.avatar || '/assets/mazmorras/orc_avatar.webp'} 
                  alt={combatNodeName} 
                  className="hud-avatar enemy" 
                />
                <div className="hud-bar-body">
                  <div className="hud-name-row reverse">
                    <span className="hud-fighter-title">{combatNodeName}</span>
                    <span className="hud-hp-num">{enemyHp} / {enemyMaxHp} HP</span>
                  </div>
                  <div className="hud-bar-track">
                    <div className="hud-bar-fill enemy" style={{ width: `${enemyHpPct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Damage Text */}
            <div className="combat-damage-overlay">
              {floatingDamage && floatingDamage.target === 'player' && (
                <div className={`floating-damage player-target ${floatingDamage.type}`}>
                  {floatingDamage.text}
                </div>
              )}
              {floatingDamage && floatingDamage.target === 'enemy' && (
                <div className={`floating-damage enemy-target ${floatingDamage.type}`}>
                  {floatingDamage.text}
                </div>
              )}
            </div>

            {/* Bottom Controls: Timing Meter, Garrison Banner & Giant Strike Button */}
            <div className="combat-timing-controller">
              {/* Tactical Army Banner in Duel */}
              <div className="combat-garrison-strip">
                <span className="garrison-strip-title">{t('dungeon.garrisonInBattle')}</span>
                <span className="garrison-badge-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <img src="/assets/hud_icons/icon_shield.webp" alt="Infantería" className="mini-res-icon" />
                  <span>{t('dungeon.infantryBonus', { count: infantryCount, bonus: infantryCount * 25 })}</span>
                </span>
                <span className="garrison-badge-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <img src="/assets/hud_icons/btn_army.webp" alt="Arqueras" className="mini-res-icon" />
                  <span>{t('dungeon.archersBonus', { count: archersCount })}</span>
                </span>
                <span className="garrison-badge-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <img src="/assets/hud_icons/icon_potion.webp" alt="Magos" className="mini-res-icon" />
                  <span>{t('dungeon.magesBonus', { count: magesCount, bonus: magicBonus })}</span>
                </span>
                {commanderCount > 0 && (
                  <span className="garrison-badge-tag commander" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <img src="/assets/hud_icons/btn_ranking.webp" alt="Paladín" className="mini-res-icon" />
                    <span>{t('dungeon.commanderBonus')}</span>
                  </span>
                )}
              </div>

              <div className="combat-controls-main-row">
                <div className="timing-meter-assembly">
                  {/* Turn countdown timer bar (Isolated memoized component: prevents full parent re-renders) */}
                  <CombatTurnTimer
                    isActive={Boolean(combatNode && !isAttacking && !combatResult)}
                    maxTime={MAX_TURN_TIME}
                    onTimeout={handleTimeoutMiss}
                    label={t('dungeon.timeToAttack')}
                  />

                  <div className="timing-track-bar">
                    <div className="zone miss" style={{ width: `${Math.max(6, 12 - archersCount * 1.5)}%` }} />
                    <div className="zone good" style={{ width: '18%' }} />
                    <div className="zone perfect" style={{ width: `${Math.min(16, 13 + archersCount * 1.0)}%` }} />
                    <div className="zone critical" style={{ width: `${Math.min(20, 14 + archersCount * 1.2)}%` }} />
                    <div className="zone perfect" style={{ width: `${Math.min(16, 13 + archersCount * 1.0)}%` }} />
                    <div className="zone good" style={{ width: '18%' }} />
                    <div className="zone miss" style={{ width: `${Math.max(6, 12 - archersCount * 1.5)}%` }} />
                    <div ref={needleRef} className="timing-indicator-needle" style={{ left: '50%' }} />
                  </div>

                  <div className="timing-sublabels">
                    <span className="sublabel-miss">{t('dungeon.timingMiss')}</span>
                    <span className="sublabel-good">{t('dungeon.timingGood')}</span>
                    <span className="sublabel-perfect">{t('dungeon.timingPerfect')}</span>
                    <span className="sublabel-critical">{t('dungeon.timingCritical')}</span>
                    <span className="sublabel-perfect">{t('dungeon.timingPerfect')}</span>
                    <span className="sublabel-good">{t('dungeon.timingGood')}</span>
                    <span className="sublabel-miss">{t('dungeon.timingMiss')}</span>
                  </div>
                </div>

                <div className="combat-buttons-row">
                  <button 
                    className="giant-strike-trigger"
                    onPointerDown={(e) => {
                      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                        e.preventDefault()
                        handleStrike(false)
                      }
                    }}
                    onClick={() => handleStrike(false)}
                    disabled={isAttacking || combatResult !== null}
                  >
                    <Swords size={26} />
                    <span>{t('dungeon.criticalStrike')}</span>
                    <span className="key-hint">[ESPACIO]</span>
                  </button>

                  {commanderCount > 0 && (
                    <button
                      className={`fury-strike-trigger ${commanderSkillUsed ? 'used' : 'ready pulse-gold'}`}
                      onPointerDown={(e) => {
                        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                          e.preventDefault()
                          handleStrike(true)
                        }
                      }}
                      onClick={() => handleStrike(true)}
                      disabled={isAttacking || combatResult !== null || commanderSkillUsed}
                      title={commanderSkillUsed ? t('dungeon.furyExhausted') : t('dungeon.royalFury')}
                    >
                      <img src="/assets/hud_icons/icon_speedup.webp" alt="Furia" className="mini-res-icon" style={{ width: '18px', height: '18px' }} />
                      <span>{commanderSkillUsed ? t('dungeon.furyExhausted') : t('dungeon.royalFury')}</span>
                    </button>
                  )}

                  {/* Combat Consumables Quick Belt */}
                  {(consumables.potion_heal > 0 || consumables.bomb_dwarf > 0) && (
                    <div className="combat-consumables-belt">
                      {consumables.potion_heal > 0 && (
                        <button 
                          className={`combat-item-btn potion ${playerHp < effectiveMaxHp * 0.5 ? 'urgent-pulse' : ''}`}
                          onPointerDown={(e) => {
                            if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                              e.preventDefault()
                              handleUsePotion()
                            }
                          }}
                          onClick={handleUsePotion}
                          disabled={isAttacking || playerHp >= effectiveMaxHp}
                          title={t('dungeon.usePotionTitle') || "Usar Poción de Vida (+60 HP)"}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <img src="/assets/hud_icons/icon_potion.webp" alt="Poción" className="mini-res-icon" />
                            <span>+60 HP</span>
                          </span>
                          <span className="item-pill">x{consumables.potion_heal}</span>
                        </button>
                      )}
                      {consumables.bomb_dwarf > 0 && (
                        <button 
                          className="combat-item-btn bomb"
                          onPointerDown={(e) => {
                            if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                              e.preventDefault()
                              handleUseBomb()
                            }
                          }}
                          onClick={handleUseBomb}
                          disabled={isAttacking || enemyHp <= 0}
                          title={t('dungeon.useBombTitle') || "Arrojar Bomba Enana (-50 Daño)"}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <img src="/assets/hud_icons/icon_bomb.webp" alt="Bomba" className="mini-res-icon" />
                            <span>-50 HP</span>
                          </span>
                          <span className="item-pill">x{consumables.bomb_dwarf}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* VICTORY OVERLAY DIALOG */}
            {combatResult === 'VICTORY' && (
              <div className="combat-result-curtain">
                <div className="combat-result-modal">
                  <div className="trophy-bounce">
                    <img src="/assets/hud_icons/icon_trophy.webp" alt="Victoria" style={{ width: '76px', height: '76px', objectFit: 'contain' }} />
                  </div>
                  <h2 className="result-headline gold">
                    {combatNode.type === 'boss' ? t('dungeon.bossDefeatedTitle') : t('dungeon.enemyDefeatedTitle', { name: combatNodeName })}
                  </h2>
                  <p className="result-copy">
                    {combatNode.type === 'boss'
                      ? t('dungeon.bossDefeatedDesc')
                      : t('dungeon.nodeDefeatedDesc')}
                  </p>

                  <div className="result-loot-chips">
                    <div className="r-chip gold"><Coins size={14} /> +{combatNode.rewards.gold} {t('resources.gold')}</div>
                    <div className="r-chip wood"><TreePine size={14} /> +{combatNode.rewards.wood} {t('resources.wood')}</div>
                    <div className="r-chip stone"><Mountain size={14} /> +{combatNode.rewards.stone} {t('resources.stone')}</div>
                    <div className="r-chip gems"><Gem size={14} /> +{combatNode.rewards.gems} {t('resources.gems')}</div>
                  </div>

                  <button className="confirm-return-map-btn" onClick={handleReturnToMap}>
                    <span>{t('dungeon.returnToMap')}</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* DEFEAT OVERLAY DIALOG */}
            {combatResult === 'DEFEAT' && (
              <div className="combat-result-curtain">
                <div className="combat-result-modal defeat">
                  <div className="trophy-bounce">
                    <img src="/assets/hud_icons/icon_skull.webp" alt="Derrota" style={{ width: '76px', height: '76px', objectFit: 'contain' }} />
                  </div>
                  <h2 className="result-headline red">{t('combat.defeatTitle')}</h2>
                  <p className="result-copy">
                    {t('dungeon.defeatDesc')}
                  </p>

                  <div className="defeat-revive-box">
                    <button 
                      className="btn-revive-hero-gems"
                      onClick={() => {
                        if ((gems || 0) >= 20) {
                          onDungeonRevive?.(20)
                          setPlayerHp(effectiveMaxHp)
                          setCommanderSkillUsed(false)
                          setCombatResult(null)
                          setActiveClip('idle')
                          isAttackingRef.current = false
                          setIsAttacking(false)
                          soundManager.playRevival()
                        } else {
                          onOpenShop?.('gems')
                        }
                      }}
                      title={t('dungeon.reviveTooltip') || "¡Revivir ahora mismo con vida completa y furia lista!"}
                    >
                      <Sparkles size={18} />
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span>{t('dungeon.secondChance')}</span>
                        <img src="/assets/hud_icons/icon_gem.webp" alt="Gemas" className="mini-res-icon" />
                        <span>)</span>
                      </span>
                    </button>
                    {(gems || 0) < 20 && (
                      <span className="revive-need-gems">{t('dungeon.needGemsNotice')}</span>
                    )}
                  </div>

                  <div className="defeat-actions-row">
                    <button 
                      className="confirm-return-map-btn"
                      onClick={() => {
                        setPlayerHp(playerMaxHp)
                        setEnemyHp(combatNode.hp)
                        setCombatResult(null)
                        setActiveClip('idle')
                        setIsAttacking(false)
                        soundManager.playClick()
                      }}
                    >
                      <RotateCcw size={16} /> {t('dungeon.retryDuel')}
                    </button>
                    <button className="defeat-quit-btn" onClick={handleReturnToMap}>
                      {t('dungeon.backToMap')}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Retreat Confirmation Modal */}
            {showRetreatConfirm && (
              <div className="retreat-confirm-modal-backdrop" onClick={() => setShowRetreatConfirm(false)}>
                <div className="retreat-confirm-card" onClick={(e) => e.stopPropagation()}>
                  <div className="retreat-header">
                    <ShieldAlert size={36} className="retreat-warning-icon" />
                    <h4>{t('dungeon.retreatTitle')}</h4>
                  </div>
                  <p className="retreat-desc">
                    {t('dungeon.retreatDesc', { name: combatNodeName })}
                  </p>
                  <div className="retreat-cost-breakdown">
                    <span className="cost-title">{t('dungeon.retreatTroopCost')}</span>
                    <div className="cost-pills">
                      <span className="retreat-pill gold">
                        <Coins size={14} /> -{calculateRetreatCost(combatNode).gold} {t('resources.gold')}
                      </span>
                      <span className="retreat-pill food">
                        <Wheat size={14} /> -{calculateRetreatCost(combatNode).food} {t('resources.food')}
                      </span>
                    </div>
                    {accumulatedLoot.gold > 0 && (
                      <p className="retreat-loot-warning" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img src="/assets/hud_icons/icon_warning.webp" alt="Alerta" className="mini-res-icon" style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        <span>{t('dungeon.retreatLootLoss', { amount: Math.floor(accumulatedLoot.gold * 0.5) })}</span>
                      </p>
                    )}
                  </div>
                  <div className="retreat-actions-row">
                    <button className="btn-stay-fight" onClick={() => setShowRetreatConfirm(false)}>
                      <Swords size={16} /> {t('dungeon.stayAndFight')}
                    </button>
                    <button className="btn-confirm-retreat" onClick={handleConfirmRetreat}>
                      <RotateCcw size={16} /> {t('dungeon.confirmFlee')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. BIOME 1 CONQUERED CELEBRATION MODAL */}
      {biomeClearedCelebration && (
        <div className="biome-celebration-backdrop">
          <div className="biome-celebration-modal">
            <div className="portal-swirl-icon">
              <img src="/assets/hud_icons/btn_expedition.webp" alt="Portal" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
            </div>
            <h2 className="celebration-title">{t('dungeon.biomeConqueredTitle')}</h2>
            <div className="celebration-subtitle">
              {t('dungeon.biomeConqueredSubtitle')}
            </div>
            <p className="celebration-desc">
              {t('dungeon.biomeConqueredDesc')}
            </p>

            <div className="celebration-rewards-row">
              <div className="r-chip gold"><Coins size={14} /> +1000 {t('resources.gold')}</div>
              <div className="r-chip gems"><Gem size={14} /> +50 {t('resources.gems')}</div>
            </div>

            <button className="proceed-biome-btn" onClick={handleProceedToNextBiome}>
              <Sparkles size={20} />
              <span>{t('dungeon.proceedBiome2')}</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
