import React, { useState, useEffect } from 'react'
import { 
  Swords, 
  Flame, 
  ShieldAlert, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Crown, 
  Target,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Info,
  X,
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import { SmartLoader } from './SmartLoader'
import { preloadImages, getArenaCriticalAssets } from '../utils/smartAssetLoader'

export function ArenaBattleView({
  isOpen,
  onClose,
  rival,
  troops,
  equippedRelics = {},
  unlockedTechIds = [],
  onVictory,
  onDefeat,
  resources = {},
  onRetreatCost,
}) {
  const { t } = useTranslation()
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  const [buildings, setBuildings] = useState([])
  const [attackingBuildingId, setAttackingBuildingId] = useState(null)
  const [battleResult, setBattleResult] = useState(null) // 'victory' | 'defeat' | null
  const [battleLog, setBattleLog] = useState([])
  const [lootedTotals, setLootedTotals] = useState({
    gold: 0,
    stone: 0,
    wood: 0,
    food: 0,
    honor: 0,
    trophies: 0,
    gems: 0,
  })
  const [shakeScreen, setShakeScreen] = useState(false)
  const [showRetreatConfirm, setShowRetreatConfirm] = useState(false)
  const [showAssaultTutorial, setShowAssaultTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [floatingTexts, setFloatingTexts] = useState([]) // Array of { id, text, type, x, y }
  const [isArenaLoading, setIsArenaLoading] = useState(true)
  const [arenaLoadProgress, setArenaLoadProgress] = useState(0)

  // Tutorial handlers
  const handleOpenTutorial = () => {
    soundManager?.playClick?.()
    setTutorialStep(0)
    setShowAssaultTutorial(true)
  }

  const handleCloseTutorial = () => {
    soundManager?.playClick?.()
    setShowAssaultTutorial(false)
    try {
      localStorage.setItem('toc_assault_tutorial_seen', 'true')
    } catch (e) {
      console.warn('Could not save tutorial preference', e)
    }
  }

  const handleNextTutorialStep = () => {
    soundManager?.playClick?.()
    if (tutorialStep < 2) {
      setTutorialStep((prev) => prev + 1)
    } else {
      handleCloseTutorial()
    }
  }

  const handlePrevTutorialStep = () => {
    soundManager?.playClick?.()
    if (tutorialStep > 0) {
      setTutorialStep((prev) => prev - 1)
    }
  }

  // Bonuses from player army, relics, and tech
  const troopBreachBonus = Math.min(0.25, ((troops?.infantry || 0) * 0.02) + ((troops?.commander || 0) * 0.10))
  const relicLootMultiplier = equippedRelics?.accessory === 'relic_manto_vencedor' ? 1.25 : 1.0
  const techBreachBonus = unlockedTechIds.includes('tech-tactics') ? 0.08 : 0

  // Total breach success rate boost
  const playerBreachBonus = troopBreachBonus + techBreachBonus

  // Generate 6 buildings for the rival kingdom when battle opens
  useEffect(() => {
    if (!isOpen || !rival) return

    setIsArenaLoading(true)
    setArenaLoadProgress(20)

    const criticalAssets = getArenaCriticalAssets(rival)
    preloadImages(criticalAssets, (pct) => {
      setArenaLoadProgress(Math.max(20, pct))
    }, 450).then(() => {
      setArenaLoadProgress(100)
    })

    setAttemptsLeft(3)
    setBattleResult(null)
    setAttackingBuildingId(null)
    setFloatingTexts([])
    setLootedTotals({
      gold: 0,
      stone: 0,
      wood: 0,
      food: 0,
      honor: 0,
      trophies: 0,
      gems: 0,
    })
    setBattleLog([
      `[Ciudadela] ¡Has arribado a los dominios del ${rival.kingdom}!`,
      `[Misión] Tienes 3 intentos para saquear sus edificaciones. ¡Elige sabiamente!`,
    ])

    const rivalLevel = rival.level || 1
    const baseGold = rival.rewards?.gold || 2200
    const baseStone = rival.rewards?.stone || 900
    const baseHonor = rival.rewards?.honor || 30
    const baseTrophies = rival.rewards?.trophies || 24

    const generatedBuildings = [
      {
        id: 'b_castillo',
        name: `Castillo de ${rival.name}`,
        category: 'Sede Imperial',
        image: '/assets/buildings/castillo/castillo_idle.webp',
        desc: 'Cámara de la corona y bóvedas reales. Alto botín, guardia reforzada.',
        baseChance: 0.65,
        rewards: {
          gold: Math.round(baseGold * 0.45 * relicLootMultiplier),
          stone: Math.round(baseStone * 0.35 * relicLootMultiplier),
          trophies: Math.round(baseTrophies * 0.6),
          honor: Math.round(baseHonor * 0.5),
          gems: Math.random() < 0.4 ? 2 : 0,
        },
        status: 'intact', // 'intact' | 'attacking' | 'looted' | 'defended'
        resultText: '',
      },
      {
        id: 'b_almacen',
        name: 'Gran Almacén Real',
        category: 'Bóveda de Recursos',
        image: '/assets/buildings/almacen/almacen.webp',
        desc: 'Reservas de construcción: madera refinada, granito y lingotes.',
        baseChance: 0.72,
        rewards: {
          gold: Math.round(baseGold * 0.30 * relicLootMultiplier),
          stone: Math.round(baseStone * 0.65 * relicLootMultiplier),
          wood: Math.round((baseGold * 0.45 + 300) * relicLootMultiplier),
        },
        status: 'intact',
        resultText: '',
      },
      {
        id: 'b_gold_mine',
        name: 'Mina de Oro Profunda',
        category: 'Yacimiento Aurífero',
        image: '/assets/buildings/gold_mine/gold_mine_idle.webp',
        desc: 'Vetas subterráneas de oro puro y cofres de los mineros.',
        baseChance: 0.78,
        rewards: {
          gold: Math.round(baseGold * 0.48 * relicLootMultiplier),
        },
        status: 'intact',
        resultText: '',
      },
      {
        id: 'b_molino',
        name: 'Molino y Granero Real',
        category: 'Suministros Agrícolas',
        image: '/assets/buildings/molino/molino_idle.webp',
        desc: 'Silos repletos de grano, trigo imperial y caudales agrícolas.',
        baseChance: 0.85,
        rewards: {
          food: Math.round((450 + rivalLevel * 140) * relicLootMultiplier),
          gold: Math.round(baseGold * 0.18 * relicLootMultiplier),
        },
        status: 'intact',
        resultText: '',
      },
      {
        id: 'b_cuartel',
        name: 'Cuartel de la Guarnición',
        category: 'Bastión Militar',
        image: '/assets/buildings/cuartel/cuartel_idle.webp',
        desc: 'Armería de la guardia rival. Alto honor militar y botín bélico.',
        baseChance: 0.60,
        rewards: {
          honor: Math.round(baseHonor * 0.65),
          gold: Math.round(baseGold * 0.22 * relicLootMultiplier),
          trophies: Math.round(baseTrophies * 0.4),
        },
        status: 'intact',
        resultText: '',
      },
      {
        id: 'b_archer_tower',
        name: 'Torre de Balistas y Vigía',
        category: 'Torreón Defensivo',
        image: '/assets/buildings/archer_tower/archer_tower_idle.webp',
        desc: 'Puesto de vigía fronterizo con pertrechos de piedra y arquería.',
        baseChance: 0.68,
        rewards: {
          stone: Math.round(baseStone * 0.45 * relicLootMultiplier),
          gold: Math.round(baseGold * 0.16 * relicLootMultiplier),
        },
        status: 'intact',
        resultText: '',
      },
    ]

    setBuildings(generatedBuildings)
  }, [isOpen, rival, relicLootMultiplier])

  // Auto-launch tutorial on first time player enters Assault
  useEffect(() => {
    if (!isOpen || !rival) return
    try {
      const hasSeen = localStorage.getItem('toc_assault_tutorial_seen')
      if (hasSeen !== 'true') {
        setShowAssaultTutorial(true)
        setTutorialStep(0)
      }
    } catch {
      // ignore
    }
  }, [isOpen, rival])

  // Handle attack click on a building (1 of 3 taps)
  const handleAttackBuilding = (buildingId) => {
    if (attemptsLeft <= 0 || attackingBuildingId || battleResult) return

    const targetIndex = buildings.findIndex((b) => b.id === buildingId)
    if (targetIndex === -1) return

    const targetBuilding = buildings[targetIndex]
    if (targetBuilding.status !== 'intact') return

    // Play attack sound
    soundManager.playSwordSwing?.()

    // Screen impact
    setShakeScreen(true)
    setTimeout(() => setShakeScreen(false), 260)

    setAttackingBuildingId(buildingId)

    // Calculate breach success
    const finalSuccessChance = Math.min(0.95, targetBuilding.baseChance + playerBreachBonus)
    const isSuccess = Math.random() < finalSuccessChance

    const newAttempts = attemptsLeft - 1
    setAttemptsLeft(newAttempts)

    setTimeout(() => {
      setBuildings((prev) => {
        return prev.map((b) => {
          if (b.id !== buildingId) return b

          if (isSuccess) {
            return {
              ...b,
              status: 'looted',
              resultText: `¡SAQUEADO!`,
            }
          } else {
            return {
              ...b,
              status: 'defended',
              resultText: `¡DEFENDIDO!`,
            }
          }
        })
      })

      setAttackingBuildingId(null)

      if (isSuccess) {
        soundManager.playVictory?.()

        // Accumulate loot
        const rew = targetBuilding.rewards
        setLootedTotals((prev) => ({
          gold: prev.gold + (rew.gold || 0),
          stone: prev.stone + (rew.stone || 0),
          wood: prev.wood + (rew.wood || 0),
          food: prev.food + (rew.food || 0),
          honor: prev.honor + (rew.honor || 0),
          trophies: prev.trophies + (rew.trophies || 0),
          gems: prev.gems + (rew.gems || 0),
        }))

        // Log message
        const lootParts = []
        if (rew.gold) lootParts.push(`+${rew.gold} Oro`)
        if (rew.stone) lootParts.push(`+${rew.stone} Piedra`)
        if (rew.wood) lootParts.push(`+${rew.wood} Madera`)
        if (rew.food) lootParts.push(`+${rew.food} Víveres`)
        if (rew.honor) lootParts.push(`+${rew.honor} Honor`)
        if (rew.gems) lootParts.push(`+${rew.gems} Cristales`)

        setBattleLog((prev) => [
          `[Asalto Exitoso] ¡Botín asegurado en ${targetBuilding.name}: ${lootParts.join(', ')}!`,
          ...prev.slice(0, 3),
        ])

        // Add floating text
        const floatId = Date.now()
        setFloatingTexts((prev) => [
          ...prev,
          { id: floatId, text: lootParts.join(' '), type: 'success', buildingId },
        ])
        setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((f) => f.id !== floatId))
        }, 1800)
      } else {
        soundManager.playHit?.()
        setBattleLog((prev) => [
          `[Defendido] ¡La guarnición enemiga defendió el ${targetBuilding.name}! Bóveda protegida (0 botín).`,
          ...prev.slice(0, 3),
        ])

        const floatId = Date.now()
        setFloatingTexts((prev) => [
          ...prev,
          { id: floatId, text: '¡Defendido / Vacío! 0 🪙', type: 'defense', buildingId },
        ])
        setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((f) => f.id !== floatId))
        }, 1800)
      }

      // Check if all 3 attempts have been exhausted
      if (newAttempts <= 0) {
        setTimeout(() => {
          setLootedTotals((currLoot) => {
            const hasLoot = currLoot.gold > 0 || currLoot.stone > 0 || currLoot.trophies > 0 || currLoot.food > 0

            // If player got loot, guarantee at least the base trophies if not reached
            if (hasLoot) {
              const finalTrophies = Math.max(rival.rewards?.trophies || 15, currLoot.trophies)
              const finalHonor = Math.max(rival.rewards?.honor || 20, currLoot.honor)
              const finalLoot = {
                ...currLoot,
                trophies: finalTrophies,
                honor: finalHonor,
              }
              setBattleResult('victory')
              soundManager.playArenaVictory?.()
              return finalLoot
            } else {
              setBattleResult('defeat')
              soundManager.playArenaDefeat?.()
              return currLoot
            }
          })
        }, 1100)
      }
    }, 450)
  }

  // Close or retreat click handler
  const handleCloseClick = () => {
    if (battleResult) {
      if (battleResult === 'victory') {
        onVictory?.(rival, lootedTotals)
      } else {
        onDefeat?.(rival)
      }
      return
    }

    // If the player hasn't attacked any building yet (still on attempt 3 and untouched),
    // allow clean, penalty-free exit immediately back to the arena menu
    const hasAttackedAny = buildings.some((b) => b.status !== 'intact')
    if (attemptsLeft >= 3 && !hasAttackedAny) {
      soundManager.playClick?.()
      onClose?.()
      return
    }

    setShowRetreatConfirm(true)
  }

  // Support Escape key to exit or retreat
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCloseClick()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, battleResult, attemptsLeft, buildings])

  // Confirm retreat with cost & loss
  const handleConfirmRetreat = () => {
    setShowRetreatConfirm(false)
    soundManager.playButtonClick?.()

    if (onRetreatCost) {
      onRetreatCost({ gold: 50, food: 25 })
    }

    if (onDefeat && rival) {
      onDefeat(rival)
    } else {
      onClose()
    }
  }

  // Claim final loot and return
  const handleClaimAndFinish = () => {
    if (battleResult === 'victory') {
      onVictory?.(rival, lootedTotals)
    } else {
      onDefeat?.(rival)
    }
  }

  if (!isOpen || !rival) return null

  return (
    <div className="arena-battle-overlay">
      {isArenaLoading && (
        <SmartLoader
          isOpen={isArenaLoading}
          variant="arena"
          title={rival.kingdom || t('loader.preparingSiege')}
          subtitle={rival.name || t('loader.deployingTroops')}
          progress={arenaLoadProgress}
          onFinished={() => setIsArenaLoading(false)}
        />
      )}

      <div 
        className={`arena-battle-stage pvp-siege-realm ${shakeScreen ? 'screen-shake' : ''}`}
        style={{ backgroundImage: `url('/assets/arena_battle_bg.webp')` }}
      >
        {/* Top Header Bar: Rival Realm & Attempts Counter */}
        <header className="arena-battle-header pvp-siege-header">
          {/* Rival Profile Identity */}
          <div className="pvp-rival-identity">
            <div className="pvp-rival-avatar-wrap">
              <img 
                src={rival.avatar || '/assets/avatars/avatar_king.webp'} 
                alt={rival.name} 
                className="pvp-rival-avatar" 
              />
              <span className="pvp-rival-lvl-badge">Nv.{rival.level || 1}</span>
            </div>
            <div className="pvp-rival-text">
              <div className="pvp-rival-title-row">
                <h2 className="pvp-rival-kingdom">{rival.kingdom}</h2>
                <span className="pvp-rival-league-pill" style={{ background: rival.league?.gradient }}>
                  <img 
                    src={rival.league?.image || '/assets/hud_icons/btn_ranking.webp'} 
                    alt={rival.league?.name} 
                    className="pvp-mini-icon" 
                  />
                  {t(`arenaItems.leagues.${rival.league?.id}`) || rival.league?.name || t('arena.league')}
                </span>
              </div>
              <span className="pvp-rival-ruler">{t('arena.sovereignRuler', { name: rival.name })}</span>
            </div>
          </div>

          {/* 3-Attempts Remaining Counter */}
          <div className="pvp-attempts-box">
            <div className="attempts-header-label">
              <Swords size={16} className="swords-icon-anim" />
              <span>{t('arena.attemptsCount', { attempts: attemptsLeft })}</span>
            </div>
            <div className="attempts-indicators-row">
              {[1, 2, 3].map((slot) => {
                const isAvailable = slot <= attemptsLeft
                return (
                  <div 
                    key={slot} 
                    className={`attempt-orb ${isAvailable ? 'available' : 'consumed'}`}
                    title={isAvailable ? t('arena.attemptAvailable', { slot }) : t('arena.attemptConsumed', { slot })}
                  >
                    <Flame size={16} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live Loot Stash & Close */}
          <div className="pvp-header-right">
            {/* Assault Help / Tutorial Trigger Button */}
            <button 
              type="button"
              className="pvp-tutorial-trigger-btn"
              onClick={handleOpenTutorial}
              title={t('arena.assaultTutorial.btnTooltip')}
              aria-label={t('arena.assaultTutorial.btnTooltip')}
            >
              <HelpCircle size={15} className="pvp-help-icon" />
              <span className="pvp-tutorial-btn-text">{t('arena.assaultTutorial.btnLabel')}</span>
            </button>

            <div className="pvp-live-loot-pill" title={t('arena.liveLootTooltip')}>
              <div className="loot-chip gold">
                <img src="/assets/hud_icons/icon_gold.webp" alt={t('resources.gold')} className="chip-icon" />
                <span>+{lootedTotals.gold}</span>
              </div>
              {lootedTotals.stone > 0 && (
                <div className="loot-chip stone">
                  <img src="/assets/hud_icons/icon_stone.webp" alt={t('resources.stone')} className="chip-icon" />
                  <span>+{lootedTotals.stone}</span>
                </div>
              )}
              {lootedTotals.wood > 0 && (
                <div className="loot-chip wood">
                  <img src="/assets/hud_icons/btn_build.webp" alt={t('resources.wood')} className="chip-icon" />
                  <span>+{lootedTotals.wood}</span>
                </div>
              )}
              {lootedTotals.food > 0 && (
                <div className="loot-chip food">
                  <img src="/assets/hud_icons/icon_wheat.webp" alt={t('resources.food')} className="chip-icon" />
                  <span>+{lootedTotals.food}</span>
                </div>
              )}
              {lootedTotals.honor > 0 && (
                <div className="loot-chip honor">
                  <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.honor')} className="chip-icon" />
                  <span>+{lootedTotals.honor}</span>
                </div>
              )}
            </div>
          </div>

          {/* Guaranteed Permanent "X" Exit Button (Always top-right, unclipped, accessible at all times) */}
          <button 
            className="modal-close-candy-btn pvp-arena-close-btn"
            onClick={handleCloseClick}
            title={t('arena.retreatTitle')}
            aria-label={t('common.close')}
          >
            <img src="/assets/hud_icons/btn_close.webp" alt={t('common.close')} draggable="false" />
          </button>
        </header>

        {/* Tactical Directive Banner */}
        <div className="pvp-siege-banner-strip pvp-tactical-directive">
          <div className="directive-dot-pulse" />
          <Swords size={18} className="banner-swords-icon" />
          <div className="directive-content">
            <strong className="directive-title">
              {attemptsLeft > 0 
                ? t('arena.directiveTitle') 
                : t('arena.directiveTitleDone')}
            </strong>
            <span className="directive-sub">
              {attemptsLeft > 0 
                ? t('arena.directiveSub', { attempts: attemptsLeft }) 
                : t('arena.directiveSubDone')}
            </span>
          </div>
          <button 
            type="button" 
            className="directive-help-pill"
            onClick={handleOpenTutorial}
            title={t('arena.assaultTutorial.btnTooltip')}
          >
            <HelpCircle size={13} />
            <span>{t('arena.assaultTutorial.btnLabel')}</span>
          </button>
        </div>

        {/* Rival Kingdom Citadel: 6 Interactive Buildings */}
        <div className="pvp-citadel-container">
          <div className="pvp-buildings-grid">
            {buildings.map((b, idx) => {
              const isIntact = b.status === 'intact'
              const isLooted = b.status === 'looted'
              const isDefended = b.status === 'defended'
              const isAttacking = attackingBuildingId === b.id
              const canClick = isIntact && attemptsLeft > 0 && !attackingBuildingId && !battleResult
              const chancePercent = Math.min(95, Math.round((b.baseChance + playerBreachBonus) * 100))
              const hasAttackedAny = attemptsLeft < 3 || attackingBuildingId !== null || buildings.some((item) => item.status !== 'intact')

              return (
                <div 
                  key={b.id}
                  className={`citadel-building-card ${b.status} ${isAttacking ? 'attacking' : ''} ${canClick ? 'clickable' : 'locked'}`}
                  onClick={() => canClick && handleAttackBuilding(b.id)}
                  title={canClick ? t('arena.tapToAttackTooltip', { name: b.name, chance: chancePercent }) : b.name}
                >
                  {/* Top Badges Row: Breach Chance & Status */}
                  <div className="building-card-top-row">
                    <span className="building-chance-badge" title={t('arena.chanceTooltip')}>
                      🎯 {chancePercent}%
                    </span>

                    {/* Status Overlay Badge */}
                    {isLooted && (
                      <div className="building-status-pill looted">
                        <CheckCircle2 size={13} />
                        <span>{b.resultText || t('arena.statusLooted')}</span>
                      </div>
                    )}
                    {isDefended && (
                      <div className="building-status-pill defended">
                        <Shield size={13} />
                        <span>{b.resultText || t('arena.statusDefended')}</span>
                      </div>
                    )}
                  </div>

                  {/* Building Visual Sprite */}
                  <div className="building-sprite-frame">
                    <img 
                      src={b.image} 
                      alt={b.name} 
                      className={`building-sprite-img ${isLooted ? 'looted-sprite' : ''} ${isDefended ? 'defended-sprite' : ''}`}
                      draggable="false" 
                    />

                    {/* First-time guidance pointer for first building */}
                    {idx === 0 && canClick && attemptsLeft === 3 && !hasAttackedAny && !showAssaultTutorial && !isArenaLoading && (
                      <div 
                        className="first-time-assault-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAttackBuilding(b.id)
                        }}
                      >
                        <div className="pointer-arrow-bounce">👇</div>
                        <span className="pointer-text">{t('arena.assaultTutorial.firstBuildingPointer')}</span>
                      </div>
                    )}

                    {/* Floating callout when building can be attacked */}
                    {canClick && (
                      <div className="building-touch-callout">
                        <span>{t('arena.tapToAttack')}</span>
                      </div>
                    )}

                    {/* Floating text if active for this building */}
                    {floatingTexts.filter((f) => f.buildingId === b.id).map((f) => (
                      <div key={f.id} className={`citadel-floating-loot ${f.type}`}>
                        {f.text}
                      </div>
                    ))}
                  </div>

                  {/* Loot Preview Chips (What you're attacking for) */}
                  <div className="building-loot-preview-row" title={t('arena.buildingLootTooltip')}>
                    {Boolean(b.rewards.gold) && (
                      <span className="loot-tag gold">
                        <img src="/assets/hud_icons/icon_gold.webp" alt={t('resources.gold')} className="loot-tag-icon" />
                        +{b.rewards.gold}
                      </span>
                    )}
                    {Boolean(b.rewards.stone) && (
                      <span className="loot-tag stone">
                        <img src="/assets/hud_icons/icon_stone.webp" alt={t('resources.stone')} className="loot-tag-icon" />
                        +{b.rewards.stone}
                      </span>
                    )}
                    {Boolean(b.rewards.wood) && (
                      <span className="loot-tag wood">
                        <img src="/assets/hud_icons/btn_build.webp" alt={t('resources.wood')} className="loot-tag-icon" />
                        +{b.rewards.wood}
                      </span>
                    )}
                    {Boolean(b.rewards.food) && (
                      <span className="loot-tag food">
                        <img src="/assets/hud_icons/icon_wheat.webp" alt={t('resources.food')} className="loot-tag-icon" />
                        +{b.rewards.food}
                      </span>
                    )}
                    {Boolean(b.rewards.honor) && (
                      <span className="loot-tag honor">
                        <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.honor')} className="loot-tag-icon" />
                        +{b.rewards.honor}H
                      </span>
                    )}
                    {Boolean(b.rewards.trophies) && (
                      <span className="loot-tag trophies">
                        <Crown size={11} color="#fef08a" />
                        +{b.rewards.trophies}
                      </span>
                    )}
                    {Boolean(b.rewards.gems) && (
                      <span className="loot-tag gems">
                        <img src="/assets/hud_icons/icon_gem.webp" alt={t('resources.gems')} className="loot-tag-icon" />
                        +{b.rewards.gems}
                      </span>
                    )}
                  </div>

                  {/* Building Meta Details */}
                  <div className="building-info-bar">
                    <div className="building-title-wrap">
                      <h4 className="building-name">{b.name}</h4>
                      <span className="building-category">{b.category}</span>
                    </div>
                  </div>

                  {/* Explicit Action Button for Mobile & Desktop Ergonomics */}
                  <div className="building-card-action-wrap">
                    {canClick ? (
                      <button 
                        type="button" 
                        className="building-attack-btn tactical-attack-glow"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAttackBuilding(b.id)
                        }}
                      >
                        <Swords size={15} className="attack-btn-swords" />
                        <span>{t('arena.attackThisBuilding')}</span>
                      </button>
                    ) : isLooted ? (
                      <div className="building-action-status looted">
                        <CheckCircle2 size={14} />
                        <span>{t('arena.lootedStatus')}</span>
                      </div>
                    ) : isDefended ? (
                      <div className="building-action-status defended">
                        <Shield size={14} />
                        <span>{t('arena.defendedStatus')}</span>
                      </div>
                    ) : (
                      <div className="building-action-status locked">
                        <span>{t('arena.noAttempts')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Battle Log Feed */}
        <div className="arena-battle-log-dock pvp-siege-log">
          {battleLog.map((log, idx) => (
            <div key={idx} className="arena-log-line">{log}</div>
          ))}
        </div>

        {/* VICTORY OUTCOME MODAL */}
        {battleResult === 'victory' && (
          <div className="arena-outcome-modal victory">
            <div className="outcome-card-content">
              <div className="outcome-icon-box">
                <Crown size={38} color="#fef08a" />
              </div>
              <h2 className="outcome-title">{t('arena.victoryAssaultTitle')}</h2>
              <p className="outcome-desc">
                {t('arena.victoryAssaultDesc', { kingdom: rival.kingdom })}
              </p>

              <div className="outcome-rewards-pills">
                <div className="reward-item trophies">
                  <img src="/assets/hud_icons/btn_ranking.webp" alt={t('resources.trophies')} className="pill-icon-img" />
                  <span className="pill-val">+{lootedTotals.trophies || rival.rewards.trophies} {t('resources.trophies')}</span>
                </div>
                {lootedTotals.gold > 0 && (
                  <div className="reward-item gold">
                    <img src="/assets/hud_icons/icon_gold.webp" alt={t('resources.gold')} className="pill-icon-img" />
                    <span className="pill-val">+{lootedTotals.gold} {t('resources.gold')}</span>
                  </div>
                )}
                {lootedTotals.stone > 0 && (
                  <div className="reward-item stone">
                    <img src="/assets/hud_icons/icon_stone.webp" alt={t('resources.stone')} className="pill-icon-img" />
                    <span className="pill-val">+{lootedTotals.stone} {t('resources.stone')}</span>
                  </div>
                )}
                {lootedTotals.wood > 0 && (
                  <div className="reward-item wood">
                    <img src="/assets/hud_icons/btn_build.webp" alt={t('resources.wood')} className="pill-icon-img" />
                    <span className="pill-val">+{lootedTotals.wood} {t('resources.wood')}</span>
                  </div>
                )}
                {lootedTotals.food > 0 && (
                  <div className="reward-item food">
                    <img src="/assets/hud_icons/icon_wheat.webp" alt={t('resources.food')} className="pill-icon-img" />
                    <span className="pill-val">+{lootedTotals.food} {t('resources.food')}</span>
                  </div>
                )}
                <div className="reward-item honor">
                  <img src="/assets/hud_icons/btn_ranking.webp" alt={t('arena.honor')} className="pill-icon-img" />
                  <span className="pill-val">+{lootedTotals.honor || rival.rewards.honor} {t('resources.honor')}</span>
                </div>
                {lootedTotals.gems > 0 && (
                  <div className="reward-item gems">
                    <img src="/assets/hud_icons/icon_gem.webp" alt={t('resources.gems')} className="pill-icon-img" />
                    <span className="pill-val">+{lootedTotals.gems} {t('resources.gems')}</span>
                  </div>
                )}
              </div>

              <button 
                className="btn-claim-arena-loot"
                onClick={handleClaimAndFinish}
              >
                {t('common.claim')}
              </button>
            </div>
          </div>
        )}

        {/* DEFEAT / REPELLED OUTCOME MODAL */}
        {battleResult === 'defeat' && (
          <div className="arena-outcome-modal defeat">
            <div className="outcome-card-content">
              <div className="outcome-icon-box defeat">
                <XCircle size={38} color="#fca5a5" />
              </div>
              <h2 className="outcome-title defeat">{t('combat.defeatTitle')}</h2>
              <p className="outcome-desc">
                {t('combat.defeatDesc')}
              </p>

              <div className="outcome-rewards-pills">
                <div className="reward-item trophies-lost">
                  <img src="/assets/hud_icons/btn_ranking.webp" alt={t('resources.trophies')} className="pill-icon-img" />
                  <span className="pill-val">{rival.rewards.lossTrophies} {t('resources.trophies')}</span>
                </div>
              </div>

              <button 
                className="btn-claim-arena-loot"
                onClick={handleClaimAndFinish}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}

        {/* Retreat Confirmation Modal */}
        {showRetreatConfirm && (
          <div className="retreat-confirm-modal-backdrop" onClick={() => setShowRetreatConfirm(false)}>
            <div className="retreat-confirm-card" onClick={(e) => e.stopPropagation()}>
              <div className="retreat-header">
                <div className="retreat-warning-icon">
                  <ShieldAlert size={36} color="#ef4444" />
                </div>
                <h4>{t('arena.retreatConfirmTitle')}</h4>
                <p className="retreat-desc">
                  {t('arena.retreatConfirmDesc')}
                </p>
              </div>

              <div className="retreat-cost-breakdown">
                <span className="cost-title">{t('arena.retreatCostsTitle')}</span>
                <div className="cost-pills">
                  <div className="retreat-pill danger">
                    <img src="/assets/hud_icons/btn_ranking.webp" alt={t('resources.trophies')} className="pill-res-icon" style={{ width: 18, height: 18 }} />
                    <span>-{Math.abs(rival?.rewards?.lossTrophies || 15)} {t('resources.trophies')}</span>
                  </div>
                  <div className="retreat-pill gold">
                    <img src="/assets/hud_icons/icon_gold.webp" alt={t('resources.gold')} className="pill-res-icon" style={{ width: 18, height: 18 }} />
                    <span>-50 {t('resources.gold')}</span>
                  </div>
                  <div className="retreat-pill food">
                    <img src="/assets/hud_icons/icon_wheat.webp" alt={t('resources.food')} className="pill-res-icon" style={{ width: 18, height: 18 }} />
                    <span>-25 {t('resources.food')}</span>
                  </div>
                </div>
              </div>

              <div className="retreat-actions-row">
                <button 
                  className="btn-stay-fight"
                  onClick={() => setShowRetreatConfirm(false)}
                >
                  {t('arena.continueAssault')}
                </button>
                <button 
                  className="btn-confirm-retreat"
                  onClick={handleConfirmRetreat}
                >
                  {t('arena.confirmRetreat')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ASSAULT STEP-BY-STEP TUTORIAL MODAL */}
        {showAssaultTutorial && (
          <div className="assault-tutorial-backdrop" onClick={handleCloseTutorial}>
            <div className="assault-tutorial-card" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="tutorial-card-header">
                <div className="tutorial-header-icon-wrap">
                  <Swords size={22} color="#fef08a" />
                </div>
                <div className="tutorial-header-text">
                  <h3 className="tutorial-modal-title">{t('arena.assaultTutorial.modalTitle')}</h3>
                  <span className="tutorial-modal-subtitle">{t('arena.assaultTutorial.modalSubtitle')}</span>
                </div>
                <button 
                  type="button" 
                  className="tutorial-close-btn"
                  onClick={handleCloseTutorial}
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Step indicator dots */}
              <div className="tutorial-step-dots-row">
                {[0, 1, 2].map((stepIdx) => (
                  <button
                    key={stepIdx}
                    type="button"
                    className={`tutorial-dot-pill ${tutorialStep === stepIdx ? 'active' : ''} ${stepIdx < tutorialStep ? 'completed' : ''}`}
                    onClick={() => {
                      soundManager?.playClick?.()
                      setTutorialStep(stepIdx)
                    }}
                    title={`Paso ${stepIdx + 1}`}
                  >
                    <span className="dot-number">{stepIdx + 1}</span>
                    <span className="dot-label">
                      {stepIdx === 0 ? '1. Intentos' : stepIdx === 1 ? '2. Edificios' : '3. Botín & Salida'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Slide Content */}
              <div className="tutorial-slide-body">
                {tutorialStep === 0 && (
                  <div className="tutorial-step-content anim-slide-in">
                    <div className="tutorial-visual-card visual-attempts">
                      <div className="showcase-orbs-row">
                        <div className="showcase-orb flame-glow">
                          <Flame size={24} color="#f97316" />
                          <span>Intento 1</span>
                        </div>
                        <div className="showcase-orb flame-glow">
                          <Flame size={24} color="#f97316" />
                          <span>Intento 2</span>
                        </div>
                        <div className="showcase-orb flame-glow">
                          <Flame size={24} color="#f97316" />
                          <span>Intento 3</span>
                        </div>
                      </div>
                      <div className="showcase-badge safe-troops">
                        <Shield size={16} color="#4ade80" />
                        <span>¡Tropas del Cuartel seguras al 100%!</span>
                      </div>
                    </div>
                    <h4 className="tutorial-step-title">{t('arena.assaultTutorial.step1Title')}</h4>
                    <p className="tutorial-step-desc">{t('arena.assaultTutorial.step1Desc')}</p>
                    <div className="tutorial-tip-box">
                      <Info size={16} className="tip-icon" />
                      <span>{t('arena.assaultTutorial.step1Tip')}</span>
                    </div>
                  </div>
                )}

                {tutorialStep === 1 && (
                  <div className="tutorial-step-content anim-slide-in">
                    <div className="tutorial-visual-card visual-building">
                      <div className="showcase-mock-card">
                        <div className="mock-card-top">
                          <span className="mock-chance">🎯 85% Probabilidad</span>
                          <span className="mock-name">Castillo Imperial</span>
                        </div>
                        <div className="mock-card-preview">
                          <img src="/assets/buildings/castillo/castillo_idle.webp" alt="Castillo" className="mock-img" />
                        </div>
                        <div className="mock-attack-btn-preview">
                          <Swords size={14} />
                          <span>¡ATACAR ESTE EDIFICIO!</span>
                        </div>
                      </div>
                    </div>
                    <h4 className="tutorial-step-title">{t('arena.assaultTutorial.step2Title')}</h4>
                    <p className="tutorial-step-desc">{t('arena.assaultTutorial.step2Desc')}</p>
                    <div className="tutorial-tip-box">
                      <Sparkles size={16} className="tip-icon gold" />
                      <span>{t('arena.assaultTutorial.step2Tip')}</span>
                    </div>
                  </div>
                )}

                {tutorialStep === 2 && (
                  <div className="tutorial-step-content anim-slide-in">
                    <div className="tutorial-visual-card visual-loot">
                      <div className="showcase-loot-chips">
                        <div className="showcase-chip gold">
                          <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" />
                          <span>Oro + Botín</span>
                        </div>
                        <div className="showcase-chip crowns">
                          <Crown size={16} color="#fef08a" />
                          <span>Coronas de Liga</span>
                        </div>
                        <div className="showcase-chip exit">
                          <img src="/assets/hud_icons/btn_close.webp" alt="Salir" className="mock-close-img" />
                          <span>Salida Segura</span>
                        </div>
                      </div>
                    </div>
                    <h4 className="tutorial-step-title">{t('arena.assaultTutorial.step3Title')}</h4>
                    <p className="tutorial-step-desc">{t('arena.assaultTutorial.step3Desc')}</p>
                    <div className="tutorial-tip-box safe-tip">
                      <CheckCircle2 size={16} className="tip-icon green" />
                      <span>{t('arena.assaultTutorial.step3Tip')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Controls */}
              <div className="tutorial-card-footer">
                <div className="footer-left-actions">
                  {tutorialStep > 0 ? (
                    <button 
                      type="button" 
                      className="tutorial-btn-prev"
                      onClick={handlePrevTutorialStep}
                    >
                      <ChevronLeft size={16} />
                      <span>{t('arena.assaultTutorial.btnPrev')}</span>
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="tutorial-btn-skip"
                      onClick={handleCloseTutorial}
                    >
                      <span>{t('arena.assaultTutorial.btnSkip')}</span>
                    </button>
                  )}
                </div>

                <div className="footer-step-counter">
                  <span>{tutorialStep + 1} / 3</span>
                </div>

                <div className="footer-right-actions">
                  <button 
                    type="button" 
                    className={`tutorial-btn-next ${tutorialStep === 2 ? 'btn-finish' : ''}`}
                    onClick={handleNextTutorialStep}
                  >
                    <span>{tutorialStep === 2 ? t('arena.assaultTutorial.btnGotIt') : t('arena.assaultTutorial.btnNext')}</span>
                    {tutorialStep < 2 && <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
