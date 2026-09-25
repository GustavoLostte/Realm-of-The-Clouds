import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef, memo } from 'react'
import { SeamlessSprite } from './SeamlessSprite'
import { getDungeonText } from '../i18n/dungeonDemoTranslations'
import { generateUniqueId } from '../utils/uniqueId'

// Base configurations for thematic corridor enemies
export const ENEMY_CONFIGS = {
  slime: {
    idleAnim: '/DEMO/ENEMIES/SLIME/idle.webp',
    walkAnim: '/DEMO/ENEMIES/SLIME/walk.webp',
    attackAnim: '/DEMO/ENEMIES/SLIME/attack.webp',
    impactAnim: '/DEMO/ENEMIES/SLIME/impact.webp',
    deadAnim: '/DEMO/ENEMIES/SLIME/dead.webp',
    soundIdle: '/DEMO/ENEMIES/SLIME/sounds/idle.ogg',
    soundWalk: '/DEMO/ENEMIES/SLIME/sounds/walk.ogg',
    soundAttack: '/DEMO/ENEMIES/SLIME/sounds/attack.ogg',
    soundImpact: '/DEMO/ENEMIES/SLIME/sounds/impact.ogg',
    soundDead: '/DEMO/ENEMIES/SLIME/sounds/dead.ogg',
    aggroRange: 30,
    attackRange: 8.5,
    attackWindupMs: 380,
    attackDurationMs: 650,
    attackCooldownMs: 1600,
    speed: 2.8,
  },
  bat: {
    idleAnim: '/DEMO/ENEMIES/BAT/idle.webp',
    walkAnim: '/DEMO/ENEMIES/BAT/walk.webp',
    attackAnim: '/DEMO/ENEMIES/BAT/attack.webp',
    impactAnim: '/DEMO/ENEMIES/BAT/impact.webp',
    deadAnim: '/DEMO/ENEMIES/BAT/dead.webp',
    soundIdle: '/DEMO/ENEMIES/BAT/sounds/idle.ogg',
    soundWalk: '/DEMO/ENEMIES/BAT/sounds/walk.ogg',
    soundAttack: '/DEMO/ENEMIES/BAT/sounds/attack.ogg',
    soundImpact: '/DEMO/ENEMIES/BAT/sounds/impact.ogg',
    soundDead: '/DEMO/ENEMIES/BAT/sounds/dead.ogg',
    aggroRange: 38,
    attackRange: 10.5,
    attackWindupMs: 280,
    attackDurationMs: 480,
    attackCooldownMs: 1200,
    speed: 5.2,
  },
  skeleton: {
    idleAnim: '/DEMO/ENEMIES/SKELETONS/idle.webp',
    walkAnim: '/DEMO/ENEMIES/SKELETONS/walk.webp',
    attackAnim: '/DEMO/ENEMIES/SKELETONS/attack.webp',
    impactAnim: '/DEMO/ENEMIES/SKELETONS/impact.webp',
    deadAnim: '/DEMO/ENEMIES/SKELETONS/dead.webp',
    soundIdle: '/DEMO/ENEMIES/SKELETONS/sounds/idle.ogg',
    soundWalk: '/DEMO/ENEMIES/SKELETONS/sounds/walk.ogg',
    soundAttack: '/DEMO/ENEMIES/SKELETONS/sounds/attack.ogg',
    soundImpact: '/DEMO/ENEMIES/SKELETONS/sounds/impact.ogg',
    soundDead: '/DEMO/ENEMIES/SKELETONS/sounds/dead.ogg',
    aggroRange: 32,
    attackRange: 13.0,
    attackWindupMs: 350,
    attackDurationMs: 550,
    attackCooldownMs: 1400,
    speed: 3.8,
  },
}

export const createCorridorEnemy = ({
  id,
  name,
  nameKey = null,
  type = 'slime',
  level = 1,
  x,
  scale = 1.0,
  tier = 'medium',
  isSplitChild = false,
  originTemplateId,
  maxHp,
  hp,
  atk,
  speed,
  patrolRadius = 9,
  idleAnim,
  walkAnim,
  attackAnim,
  impactAnim,
  deadAnim,
  soundIdle,
  soundWalk,
  soundAttack,
  soundImpact,
  soundDead,
}) => {
  const cfg = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.slime
  const finalMaxHp = maxHp ?? (level * 80 + 160)
  const finalAtk = atk ?? Math.round(level * 4.5 + 20)

  return {
    id,
    originTemplateId: originTemplateId || id,
    name,
    nameKey,
    type,
    level,
    tier,
    isSplitChild,
    x: Math.max(12, Math.min(88, x ?? 50)),
    spawnX: Math.max(12, Math.min(88, x ?? 50)),
    minX: Math.max(12, Number(((x ?? 50) - patrolRadius).toFixed(1))),
    maxX: Math.min(88, Number(((x ?? 50) + patrolRadius).toFixed(1))),
    targetX: Math.max(12, Math.min(88, x ?? 50)),
    facing: -1,
    action: 'idle',
    actionTimer: 800 + Math.random() * 1500,
    attackCooldown: 150 + Math.random() * 250,
    attackWindupTimer: 0,
    attackAnimTimer: 0,
    hasExecutedDamage: false,
    respawnTimer: 0,
    speed: speed ?? cfg.speed,
    scale,
    maxHp: finalMaxHp,
    hp: hp ?? finalMaxHp,
    atk: finalAtk,
    isHit: false,
    hitStunTimer: 0,
    isDead: false,
    animNonce: `${id}_spawn`,
    idleSoundTimer: 2500 + Math.random() * 4000,
    walkSoundTimer: 0,
    floatingTexts: [],
    idleAnim: idleAnim || cfg.idleAnim,
    walkAnim: walkAnim || cfg.walkAnim,
    attackAnim: attackAnim || cfg.attackAnim,
    impactAnim: impactAnim || cfg.impactAnim,
    deadAnim: deadAnim || cfg.deadAnim,
    soundIdle: soundIdle || cfg.soundIdle,
    soundWalk: soundWalk || cfg.soundWalk,
    soundAttack: soundAttack || cfg.soundAttack,
    soundImpact: soundImpact || cfg.soundImpact,
    soundDead: soundDead || cfg.soundDead,
    attackRange: cfg.attackRange,
    attackWindupMs: cfg.attackWindupMs,
    attackDurationMs: cfg.attackDurationMs,
    attackCooldownMs: cfg.attackCooldownMs,
    aggroRange: cfg.aggroRange,
  }
}

export const getCorridorEnemies = (corridorIndex, lang = 'us') => {
  const mapNum = Math.floor(corridorIndex / 3) + 1
  const hallNum = (corridorIndex % 3) + 1

  if (mapNum === 1) {
    if (hallNum === 3) {
      return [
        createCorridorEnemy({
          id: `slime_guard_${corridorIndex}_1`,
          nameKey: 'slime_guard',
          name: getDungeonText(lang, 'enemies', 'slime_guard'),
          type: 'slime',
          level: 11,
          x: 44,
          scale: 1.32,
          tier: 'medium',
          maxHp: 480,
          atk: 58,
          speed: 2.8,
          patrolRadius: 8,
        }),
        createCorridorEnemy({
          id: `slime_boss_${corridorIndex}`,
          nameKey: 'slime_boss',
          name: getDungeonText(lang, 'enemies', 'slime_boss'),
          type: 'slime',
          level: 15,
          x: 74,
          scale: 1.95,
          tier: 'large',
          maxHp: 1800,
          atk: 105,
          speed: 2.2,
          patrolRadius: 6,
        }),
      ]
    }

    const baseLvl = hallNum === 1 ? 3 : 7
    return [
      createCorridorEnemy({
        id: `slime_${corridorIndex}_1`,
        nameKey: 'slime_forest',
        name: getDungeonText(lang, 'enemies', 'slime_forest'),
        type: 'slime',
        level: baseLvl,
        x: 38,
        scale: 1.18,
        tier: 'small',
        maxHp: baseLvl * 80 + 160,
        atk: baseLvl * 4 + 20,
        speed: 2.8,
        patrolRadius: 9,
      }),
      createCorridorEnemy({
        id: `slime_${corridorIndex}_2`,
        nameKey: 'slime_spiky',
        name: getDungeonText(lang, 'enemies', 'slime_spiky'),
        type: 'slime',
        level: baseLvl + 2,
        x: 60,
        scale: 1.32,
        tier: 'medium',
        maxHp: (baseLvl + 2) * 95 + 200,
        atk: (baseLvl + 2) * 4 + 26,
        speed: 3.0,
        patrolRadius: 8,
      }),
      createCorridorEnemy({
        id: `slime_${corridorIndex}_3`,
        nameKey: 'slime_giant',
        name: getDungeonText(lang, 'enemies', 'slime_giant'),
        type: 'slime',
        level: baseLvl + 4,
        x: 82,
        scale: 1.60,
        tier: 'large',
        maxHp: (baseLvl + 4) * 120 + 280,
        atk: (baseLvl + 4) * 5 + 32,
        speed: 2.6,
        patrolRadius: 7,
      }),
    ]
  }

  if (mapNum === 2) {
    if (hallNum === 3) {
      return [
        createCorridorEnemy({
          id: `bat_guard_${corridorIndex}_1`,
          nameKey: 'bat_guard',
          name: getDungeonText(lang, 'enemies', 'bat_guard'),
          type: 'bat',
          level: 26,
          x: 42,
          scale: 1.05,
          maxHp: 950,
          atk: 120,
          speed: 5.4,
          patrolRadius: 12,
        }),
        createCorridorEnemy({
          id: `bat_boss_${corridorIndex}`,
          nameKey: 'bat_boss',
          name: getDungeonText(lang, 'enemies', 'bat_boss'),
          type: 'bat',
          level: 32,
          x: 75,
          scale: 1.65,
          maxHp: 3500,
          atk: 175,
          speed: 4.8,
          patrolRadius: 10,
        }),
      ]
    }

    const baseLvl = hallNum === 1 ? 18 : 22
    return [
      createCorridorEnemy({
        id: `bat_${corridorIndex}_1`,
        nameKey: 'bat_spore',
        name: getDungeonText(lang, 'enemies', 'bat_spore'),
        type: 'bat',
        level: baseLvl,
        x: 36,
        scale: 0.95,
        maxHp: baseLvl * 70 + 200,
        atk: baseLvl * 4 + 30,
        speed: 5.2,
        patrolRadius: 13,
      }),
      createCorridorEnemy({
        id: `bat_${corridorIndex}_2`,
        nameKey: 'bat_night',
        name: getDungeonText(lang, 'enemies', 'bat_night'),
        type: 'bat',
        level: baseLvl + 2,
        x: 58,
        scale: 1.10,
        maxHp: (baseLvl + 2) * 85 + 240,
        atk: (baseLvl + 2) * 4 + 38,
        speed: 5.6,
        patrolRadius: 14,
      }),
      createCorridorEnemy({
        id: `bat_${corridorIndex}_3`,
        nameKey: 'bat_colossal',
        name: getDungeonText(lang, 'enemies', 'bat_colossal'),
        type: 'bat',
        level: baseLvl + 4,
        x: 82,
        scale: 1.30,
        maxHp: (baseLvl + 4) * 110 + 350,
        atk: (baseLvl + 4) * 5 + 46,
        speed: 5.0,
        patrolRadius: 12,
      }),
    ]
  }

  if (hallNum === 3) {
    return []
  }

  const baseLvl = hallNum === 1 ? 36 : 41
  return [
    createCorridorEnemy({
      id: `skel_${corridorIndex}_1`,
      nameKey: 'skel_guard',
      name: getDungeonText(lang, 'enemies', 'skel_guard'),
      type: 'skeleton',
      level: baseLvl,
      x: 36,
      scale: 1.15,
      maxHp: baseLvl * 85 + 260,
      atk: baseLvl * 4.5 + 40,
      speed: 3.8,
      patrolRadius: 10,
    }),
    createCorridorEnemy({
      id: `skel_${corridorIndex}_2`,
      nameKey: 'skel_warrior',
      name: getDungeonText(lang, 'enemies', 'skel_warrior'),
      type: 'skeleton',
      level: baseLvl + 2,
      x: 60,
      scale: 1.30,
      maxHp: (baseLvl + 2) * 105 + 320,
      atk: (baseLvl + 2) * 5 + 48,
      speed: 4.0,
      patrolRadius: 11,
    }),
    createCorridorEnemy({
      id: `skel_${corridorIndex}_3`,
      nameKey: 'skel_commander',
      name: getDungeonText(lang, 'enemies', 'skel_commander'),
      type: 'skeleton',
      level: baseLvl + 5,
      x: 82,
      scale: 1.55,
      maxHp: (baseLvl + 5) * 140 + 450,
      atk: (baseLvl + 5) * 5.5 + 60,
      speed: 3.6,
      patrolRadius: 9,
    }),
  ]
}

export const DungeonEnemiesLayer = memo(forwardRef(function DungeonEnemiesLayer({
  corridorIndex = 0,
  lang = 'us',
  groundOffset = '31.48%',
  isTransitioning = { current: false },
  champPosRef = { current: 18 },
  champFacingRef = { current: 1 },
  champActorRef = { current: null },
  onPlayerHit = null,
  onEnemyKilled = null,
  onWaveCleared = null,
  playEnemySound = () => {},
  playEnemyPositionalSound = () => {},
  triggerScreenShake = () => {},
}, ref) {
  const langRef = useRef(lang)
  langRef.current = lang

  const [enemies, setEnemies] = useState(() => getCorridorEnemies(corridorIndex, lang))
  const enemiesRef = useRef(enemies)
  enemiesRef.current = enemies

  const corridorIndexRef = useRef(corridorIndex)
  corridorIndexRef.current = corridorIndex

  // Track living count to notify parent of wave clearance without parent re-render
  const waveClearedNotifiedRef = useRef(false)

  // Dynamically update monster names on language change in real time
  useEffect(() => {
    setEnemies((prev) =>
      prev.map((e) => {
        if (!e.nameKey) return e
        return {
          ...e,
          name: getDungeonText(lang, 'enemies', e.nameKey),
        }
      })
    )
  }, [lang])

  // Reset enemies when corridor changes
  useEffect(() => {
    waveClearedNotifiedRef.current = false
    const fresh = getCorridorEnemies(corridorIndex, langRef.current)
    setEnemies(fresh)
    enemiesRef.current = fresh
  }, [corridorIndex])

  // Continuous Corridor Repopulation: Guarantees corridors are never permanently barren
  useEffect(() => {
    const repopulateInterval = setInterval(() => {
      if (isTransitioning.current) return
      const currentIdx = corridorIndexRef.current
      const currentEnemies = enemiesRef.current || []
      const livingEnemies = currentEnemies.filter((e) => !e.isDead)

      if (livingEnemies.length === 0) {
        const templates = getCorridorEnemies(currentIdx, langRef.current)
        if (templates.length > 0) {
          const fresh = templates.map((tpl) => ({
            ...tpl,
            floatingTexts: [
              { id: generateUniqueId('respawn'), text: getDungeonText(langRef.current, 'combat', 'respawn'), type: 'respawn' },
            ],
          }))
          setEnemies(fresh)
          enemiesRef.current = fresh

          if (fresh[0]?.soundIdle) {
            playEnemyPositionalSound(fresh[0].soundIdle, 50, 0.45)
          }

          setTimeout(() => {
            setEnemies((cur) => {
              const updated = cur.map((item) => ({
                ...item,
                floatingTexts: item.floatingTexts.filter((t) => t.type !== 'respawn'),
              }))
              enemiesRef.current = updated
              return updated
            })
          }, 1200)
        }
      }
    }, 4500)

    return () => clearInterval(repopulateInterval)
  }, [isTransitioning, playEnemyPositionalSound])

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getLivingEnemies: () => (enemiesRef.current || []).filter((e) => !e.isDead),
    getLivingCount: () => (enemiesRef.current || []).filter((e) => !e.isDead).length,
    getEnemies: () => enemiesRef.current || [],
    resetCorridor: (newIdx) => {
      waveClearedNotifiedRef.current = false
      const fresh = getCorridorEnemies(newIdx)
      setEnemies(fresh)
      enemiesRef.current = fresh
    },
    hitEnemiesInRange: (playerX, facing, swordReach, isAoe, attackType, customDmg = null) => {
      const getEnemyBodyRadius = (enemy) => {
        const scale = enemy.scale || 1.0
        let baseRadius = 4.4
        if (enemy.type === 'slime') baseRadius = 4.4
        else if (enemy.type === 'skeleton') baseRadius = 3.6
        else if (enemy.type === 'bat') baseRadius = 5.0
        return baseRadius * scale
      }

      const living = (enemiesRef.current || []).filter((e) => !e.isDead)
      let hitAny = false

      living.forEach((enemy) => {
        const dist = Math.abs(enemy.x - playerX)
        const isFacingEnemy = (enemy.x >= playerX && facing === 1) || (enemy.x <= playerX && facing === -1)
        const enemyRadius = getEnemyBodyRadius(enemy)
        const maxContactReach = swordReach + enemyRadius

        if (dist <= maxContactReach && (isFacingEnemy || isAoe)) {
          hitAny = true
          executeHitOnEnemy(enemy.id, attackType, customDmg, playerX)
        }
      })

      return hitAny
    },
    triggerEnemyHit: (enemyId, attackType, customDmg = null) => {
      const px = champPosRef.current ?? 18
      executeHitOnEnemy(enemyId, attackType, customDmg, px)
    },
  }))

  // Dedicated Hit Execution on a single enemy
  const executeHitOnEnemy = useCallback((enemyId, attackType, customDmg, playerX) => {
    const targetEnemy = enemiesRef.current?.find((s) => s.id === enemyId)
    if (!targetEnemy || targetEnemy.isDead) return

    let baseMin = 48, baseMax = 72
    let critChance = 0.32
    let critMultiplier = 2.4

    if (attackType === 'attack1_1') {
      baseMin = 55; baseMax = 80; critChance = 0.28; critMultiplier = 2.2
    } else if (attackType === 'attack1_2') {
      baseMin = 85; baseMax = 120; critChance = 0.38; critMultiplier = 2.4
    } else if (attackType === 'attack1_3') {
      baseMin = 170; baseMax = 240; critChance = 0.55; critMultiplier = 2.8
    } else if (attackType === 'attack2_1' || attackType === 'kick') {
      baseMin = 95; baseMax = 140; critChance = 0.35; critMultiplier = 2.5
    } else if (attackType === 'attack2_2' || attackType === 'attack2') {
      baseMin = 185; baseMax = 260; critChance = 0.50; critMultiplier = 2.7
    } else if (attackType === 'special') {
      baseMin = 140; baseMax = 195; critChance = 0.40; critMultiplier = 2.5
    } else if (attackType === 'special2') {
      baseMin = 350; baseMax = 500; critChance = 0.65; critMultiplier = 2.9
    } else if (attackType === 'dash_attack') {
      baseMin = 120; baseMax = 165; critChance = 0.42; critMultiplier = 2.5
    } else if (attackType === 'jump_attack') {
      baseMin = 130; baseMax = 180; critChance = 0.45; critMultiplier = 2.6
    } else if (typeof customDmg === 'number') {
      baseMin = Math.round(customDmg * 0.9)
      baseMax = Math.round(customDmg * 1.1)
    }

    const rawDmg = Math.floor(baseMin + Math.random() * (baseMax - baseMin + 1))
    const isCrit = Math.random() < critChance
    const finalDmg = isCrit ? Math.round(rawDmg * critMultiplier) : rawDmg

    const floatingId = generateUniqueId('efloat')
    const knockbackDir = targetEnemy.x >= playerX ? 1 : -1

    const isHeavyAttack = attackType === 'attack1_3' || attackType === 'attack2_2' || attackType === 'special2'
    const isBoss = (targetEnemy.scale || 1) >= 1.4
    const isElite = (targetEnemy.scale || 1) >= 1.15

    let baseKnockback = isHeavyAttack ? 0.45 : 0.20
    if (isCrit) baseKnockback *= 1.25
    if (isBoss) baseKnockback *= 0.25
    else if (isElite) baseKnockback *= 0.55
    const knockbackAmt = Number(baseKnockback.toFixed(3))

    playEnemySound(targetEnemy.soundImpact || targetEnemy.impactSound, isCrit ? 0.95 : 0.75)

    if (isCrit || isHeavyAttack) {
      triggerScreenShake(isCrit ? 150 : 120)
    }

    let pendingKillData = null

    setEnemies((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== enemyId) return s

        const nextHp = Math.max(0, s.hp - finalDmg)
        const isNowDead = nextHp <= 0

        const newFloatingTexts = [
          ...s.floatingTexts,
          {
            id: floatingId,
            text: isCrit
              ? getDungeonText(langRef.current, 'combat', 'crit', { dmg: finalDmg })
              : `-${finalDmg}`,
            crit: isCrit,
            type: isCrit ? 'crit' : 'damage',
          },
        ]

        let newX = s.x
        if (!isNowDead) {
          newX = Math.max(12, Math.min(88, Number((s.x + knockbackDir * knockbackAmt).toFixed(2))))
        }

      if (isNowDead) {
        playEnemySound(s.soundDead || '/DEMO/ENEMIES/SLIME/sounds/dead.ogg', 0.85)

        const expAward = Math.round(s.level * 25 + 60)
        const goldAward = Math.round(s.level * 18 + 45)

        // Generate physical drops
        const lootDrops = []
        const goldCoins = Math.round(s.level * 18 + 35 + Math.random() * 25)
        lootDrops.push({
          type: 'gold',
          amount: goldCoins,
          x: Math.max(8, Math.min(92, Number((s.x + (Math.random() - 0.5) * 4).toFixed(1)))),
        })

        if (Math.random() < 0.70) {
          lootDrops.push({
            type: 'potion_hp',
            amount: 1,
            x: Math.max(8, Math.min(92, Number((s.x + (Math.random() - 0.5) * 5).toFixed(1)))),
          })
        }
        if (Math.random() < 0.55) {
          lootDrops.push({
            type: 'potion_mp',
            amount: 1,
            x: Math.max(8, Math.min(92, Number((s.x + (Math.random() - 0.5) * 5).toFixed(1)))),
          })
        }

        // Material drop
        lootDrops.push({
          type: 'material',
          materialType: s.type,
          amount: s.tier === 'large' ? 3 : s.tier === 'medium' ? 2 : 1,
          x: Math.max(8, Math.min(92, Number((s.x + (Math.random() - 0.5) * 3).toFixed(1)))),
        })

        // Stash pending kill data for asynchronous parent notification outside render
        pendingKillData = {
          enemy: s,
          exp: expAward,
          gold: goldAward,
          lootDrops,
        }

        // Check Slime division mechanic
        if (s.type === 'slime') {
          const isLarge = s.tier === 'large' || (s.scale >= 1.5)
          const isMedium = !isLarge && (s.tier === 'medium' || (s.scale >= 1.25 && s.scale < 1.5))

          if (isLarge || isMedium) {
            setTimeout(() => {
              if (isTransitioning.current) return
              const targetCorridor = corridorIndexRef.current

              const nextTier = isLarge ? 'medium' : 'small'
              const nextScale = isLarge ? 1.32 : 1.18
              const nextNameKey = isLarge ? 'slime_split_medium' : 'slime_split_small'
              const nextName = getDungeonText(langRef.current, 'enemies', nextNameKey)

              const childHp = Math.max(50, Math.round(s.maxHp * 0.45))
              const childAtk = Math.max(12, Math.round(s.atk * (isLarge ? 0.70 : 0.65)))
              const childSpeed = Number(((s.speed || 2.8) * (isLarge ? 1.15 : 1.25)).toFixed(2))
              const xLeft = Math.max(14, Number((s.x - (isLarge ? 3.8 : 2.8)).toFixed(2)))
              const xRight = Math.min(86, Number((s.x + (isLarge ? 3.8 : 2.8)).toFixed(2)))
              const timestamp = Date.now()

              const child1 = createCorridorEnemy({
                id: `${s.id}_split_1_${timestamp}`,
                name: nextName,
                nameKey: nextNameKey,
                type: 'slime',
                level: Math.max(1, s.level - 1),
                x: xLeft,
                scale: nextScale,
                tier: nextTier,
                isSplitChild: true,
                originTemplateId: s.originTemplateId || s.id,
                maxHp: childHp,
                hp: childHp,
                atk: childAtk,
                speed: childSpeed,
                patrolRadius: isLarge ? 8 : 6,
              })

              const child2 = createCorridorEnemy({
                id: `${s.id}_split_2_${timestamp}`,
                name: nextName,
                nameKey: nextNameKey,
                type: 'slime',
                level: Math.max(1, s.level - 1),
                x: xRight,
                scale: nextScale,
                tier: nextTier,
                isSplitChild: true,
                originTemplateId: s.originTemplateId || s.id,
                maxHp: childHp,
                hp: childHp,
                atk: childAtk,
                speed: childSpeed,
                patrolRadius: isLarge ? 8 : 6,
              })

              playEnemySound(s.soundImpact || '/DEMO/ENEMIES/SLIME/sounds/impact.ogg', 0.85)

              const divisionText = getDungeonText(langRef.current, 'combat', 'division')
              setEnemies((prev) => {
                if (corridorIndexRef.current !== targetCorridor) return prev
                const updated = [
                  ...prev,
                  {
                    ...child1,
                    facing: -1,
                    floatingTexts: [{ id: generateUniqueId('div'), text: divisionText, type: 'division' }],
                  },
                  {
                    ...child2,
                    facing: 1,
                    floatingTexts: [{ id: generateUniqueId('div'), text: divisionText, type: 'division' }],
                  },
                ]
                enemiesRef.current = updated
                return updated
              })

              setTimeout(() => {
                setEnemies((prev) => {
                  const updated = prev.map((item) => {
                    if (item.id === child1.id || item.id === child2.id) {
                      return {
                        ...item,
                        isSplitChild: false,
                        floatingTexts: item.floatingTexts.filter((t) => t.type !== 'division'),
                      }
                    }
                    return item
                  })
                  enemiesRef.current = updated
                  return updated
                })
              }, 500)
            }, 380)
          }
        }

        // Clean up dead corpse from state after death animation (1100ms)
        const deadEnemyId = enemyId
        setTimeout(() => {
          setEnemies((cur) => {
            const updated = cur.filter((item) => item.id !== deadEnemyId)
            enemiesRef.current = updated
            return updated
          })
        }, 1100)
      }

      return {
        ...s,
        hp: nextHp,
        x: newX,
        isHit: !isNowDead,
        hitStunTimer: isNowDead ? 0 : 380, // Solid 380ms stun without 16ms glitch
        isDead: isNowDead,
        action: isNowDead ? 'dead' : s.action,
        animNonce: isNowDead ? `${enemyId}_dead_${Date.now()}` : s.animNonce,
        respawnTimer: isNowDead && !s.isSplitChild ? 5500 : 0,
        floatingTexts: newFloatingTexts,
      }
    })
    enemiesRef.current = updated
    return updated
  })

    // Safely dispatch parent kill notification asynchronously outside React's setEnemies pass
    if (pendingKillData) {
      const killPayload = pendingKillData
      queueMicrotask(() => {
        onEnemyKilled?.(killPayload)
      })
    }

    // Reset hit state cleanly after stun duration
    setTimeout(() => {
      setEnemies((prev) => {
        const updated = prev.map((s) => s.id === enemyId ? {
          ...s,
          isHit: false,
          hitStunTimer: 0,
        } : s)
        enemiesRef.current = updated
        return updated
      })
    }, 380)

    // Remove floating damage text after 850ms
    setTimeout(() => {
      setEnemies((prev) => {
        const updated = prev.map((s) => s.id === enemyId ? {
          ...s,
          floatingTexts: s.floatingTexts.filter((t) => t.id !== floatingId)
        } : s)
        enemiesRef.current = updated
        return updated
      })
    }, 850)
  }, [playEnemySound, triggerScreenShake, onEnemyKilled, isTransitioning])

  // High-Performance 60 FPS Framerate-Independent Enemy AI & Motion Loop
  useEffect(() => {
    let animId
    let lastTime = performance.now()
    let lastRenderTime = 0

    const loop = (currentTime) => {
      const deltaMs = Math.min(50, Math.max(1, currentTime - lastTime))
      lastTime = currentTime
      const now = currentTime

      if (isTransitioning.current) {
        animId = requestAnimationFrame(loop)
        return
      }

      const prevEnemies = enemiesRef.current || []
      if (prevEnemies.length === 0) {
        animId = requestAnimationFrame(loop)
        return
      }

      // Check wave cleared
      const livingCount = prevEnemies.filter((e) => !e.isDead).length
      if (livingCount === 0 && !waveClearedNotifiedRef.current) {
        waveClearedNotifiedRef.current = true
        queueMicrotask(() => {
          onWaveCleared?.()
        })
      }

      const px = champPosRef.current ?? 18
      const pendingHits = []

      const nextEnemies = prevEnemies.map((enemy) => {
        // Dead enemies wait for fade-out animation to finish before being cleaned up
        if (enemy.isDead) {
          return enemy
        }

        // Hit stun handling: preserve isHit and decrement timer
        let nextHitStunTimer = enemy.hitStunTimer || 0
        let nextIsHit = enemy.isHit
        if (nextHitStunTimer > 0) {
          nextHitStunTimer = Math.max(0, nextHitStunTimer - deltaMs)
          nextIsHit = nextHitStunTimer > 0
        }

        let newAction = enemy.action
        let newTimer = enemy.actionTimer - deltaMs
        let newX = enemy.x
        let newFacing = enemy.facing
        let newTargetX = enemy.targetX
        let currentAnimNonce = enemy.animNonce
        let newIdleSoundTimer = (enemy.idleSoundTimer || 3000) - deltaMs
        let newWalkSoundTimer = (enemy.walkSoundTimer || 2000) - deltaMs

        const nextAttackCooldown = Math.max(0, (enemy.attackCooldown || 0) - deltaMs)
        let newWindup = enemy.attackWindupTimer || 0
        let newAttackAnimTimer = enemy.attackAnimTimer || 0
        let hasExecutedDamage = enemy.hasExecutedDamage || false

        const distToPlayer = Math.abs(newX - px)
        const inAggro = distToPlayer <= enemy.aggroRange
        const inAttackRange = distToPlayer <= enemy.attackRange

        // If stunned by impact, freeze motion
        if (nextIsHit) {
          return {
            ...enemy,
            isHit: nextIsHit,
            hitStunTimer: nextHitStunTimer,
            attackCooldown: nextAttackCooldown,
          }
        }

        // ATTACK WINDUP & EXECUTION
        if (newAction === 'attack') {
          newAttackAnimTimer -= deltaMs
          newWindup -= deltaMs

          // Damage delivery window
          if (newWindup <= 0 && !hasExecutedDamage) {
            hasExecutedDamage = true
            if (distToPlayer <= enemy.attackRange * 1.25) {
              const champ = champActorRef.current
              const isGuarding = champ?.isGuarding || false
              const isDivineShield = champ?.isDivineShield || false

              let hitType = 'hit'
              let dmg = enemy.atk
              if (isDivineShield) {
                hitType = 'divine_shield'
                dmg = 0
              } else if (isGuarding) {
                hitType = 'block'
                dmg = Math.max(1, Math.round(enemy.atk * 0.25))
              }

              pendingHits.push({
                type: hitType,
                dmg,
                sound: enemy.soundAttack,
              })
            }
          }

          if (newAttackAnimTimer <= 0) {
            newAction = 'idle'
            currentAnimNonce = `idle_${enemy.id}_${now}`
            newTimer = 600 + Math.random() * 800
          }

          return {
            ...enemy,
            action: newAction,
            actionTimer: newTimer,
            attackWindupTimer: newWindup,
            attackAnimTimer: newAttackAnimTimer,
            hasExecutedDamage,
            attackCooldown: nextAttackCooldown,
            animNonce: currentAnimNonce,
            isHit: nextIsHit,
            hitStunTimer: nextHitStunTimer,
          }
        }

        // TRIGGER ATTACK IF IN RANGE
        if (inAttackRange && nextAttackCooldown <= 0) {
          newAction = 'attack'
          newWindup = enemy.attackWindupMs || 350
          newAttackAnimTimer = enemy.attackDurationMs || 650
          hasExecutedDamage = false
          newFacing = px > newX ? 1 : -1
          currentAnimNonce = `attack_${enemy.id}_${now}`
          playEnemyPositionalSound(enemy.soundAttack, newX, 0.70)

          return {
            ...enemy,
            action: newAction,
            facing: newFacing,
            attackWindupTimer: newWindup,
            attackAnimTimer: newAttackAnimTimer,
            hasExecutedDamage,
            attackCooldown: enemy.attackCooldownMs || 1500,
            animNonce: currentAnimNonce,
            isHit: nextIsHit,
            hitStunTimer: nextHitStunTimer,
          }
        }

        // AI DECISION TREE: CHASE vs PATROL vs IDLE
        const step = (enemy.speed * (deltaMs / 1000))

        if (inAggro && !inAttackRange) {
          newAction = 'chase'
          newFacing = px > newX ? 1 : -1
          const dir = Math.sign(px - newX)
          newX = Number((newX + dir * step).toFixed(2))
          newX = Math.max(enemy.minX, Math.min(enemy.maxX, newX))

          if (newWalkSoundTimer <= 0) {
            playEnemyPositionalSound(enemy.soundWalk, newX, 0.35)
            newWalkSoundTimer = 2200 + Math.random() * 1000
          }
        } else if (newAction === 'idle') {
          if (newIdleSoundTimer <= 0) {
            playEnemyPositionalSound(enemy.soundIdle, newX, 0.40)
            newIdleSoundTimer = 4000 + Math.random() * 4500
          }

          if (newTimer <= 0) {
            newAction = 'walk'
            currentAnimNonce = `${enemy.id}_walk`
            newTimer = 1800 + Math.random() * 2600
            newTargetX = Number((enemy.minX + Math.random() * (enemy.maxX - enemy.minX)).toFixed(1))
            newFacing = newTargetX >= newX ? 1 : -1
          }
        } else if (newAction === 'walk') {
          const dist = newTargetX - newX
          if (newWalkSoundTimer <= 0) {
            playEnemyPositionalSound(enemy.soundWalk, newX, 0.35)
            newWalkSoundTimer = 2400 + Math.random() * 1200
          }

          if (Math.abs(dist) <= Math.max(0.25, step) || newTimer <= 0) {
            newX = newTargetX
            newAction = 'idle'
            currentAnimNonce = `${enemy.id}_idle`
            newTimer = 2200 + Math.random() * 2400
          } else {
            newFacing = dist > 0 ? 1 : -1
            newX = Math.max(enemy.minX, Math.min(enemy.maxX, Number((newX + Math.sign(dist) * step).toFixed(2))))
          }
        }

        return {
          ...enemy,
          x: Math.max(enemy.minX, Math.min(enemy.maxX, Number(newX.toFixed(2)))),
          facing: newFacing,
          action: newAction,
          animNonce: currentAnimNonce,
          targetX: newTargetX,
          actionTimer: newTimer,
          idleSoundTimer: newIdleSoundTimer,
          walkSoundTimer: newWalkSoundTimer,
          attackCooldown: nextAttackCooldown,
          isHit: nextIsHit,
          hitStunTimer: nextHitStunTimer,
        }
      })

      enemiesRef.current = nextEnemies

      // Throttle React state update of the isolated enemies container (30 FPS for AI coordinates)
      if (now - lastRenderTime >= 33) {
        setEnemies(nextEnemies)
        lastRenderTime = now
      }

      // Execute pending player hits asynchronously outside render
      if (pendingHits.length > 0) {
        pendingHits.forEach((hit) => {
          queueMicrotask(() => {
            onPlayerHit?.(hit)
          })
        })
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [champPosRef, champFacingRef, champActorRef, isTransitioning, onPlayerHit, onWaveCleared, playEnemyPositionalSound])

  return (
    <>
      {enemies.map((slime, idx) => (
        <EnemyActor
          key={slime.id ? `${slime.id}_${idx}` : `enemy_${idx}`}
          slime={slime}
          groundOffset={groundOffset}
          isEs={langRef.current === 'es'}
        />
      ))}
    </>
  )
}))

/**
 * Isolated, memoized presentation component for individual enemies
 * Guarantees that damage, hit states, and floating numbers on one enemy
 * do NOT force React reconciliation or sprite re-decoding across other enemies.
 */
const EnemyActor = memo(function EnemyActor({ slime, groundOffset, isEs }) {
  const hpPercent = Math.max(0, Math.min(100, (slime.hp / slime.maxHp) * 100))
  let enemySprite = slime.idleAnim
  let enemyAnimKey = 'idle'
  if (slime.isDead) {
    enemySprite = slime.deadAnim || slime.idleAnim
    enemyAnimKey = 'dead'
  } else if (slime.action === 'attack') {
    enemySprite = slime.attackAnim || slime.idleAnim
    enemyAnimKey = 'attack'
  } else if (slime.action === 'walk' || slime.action === 'chase') {
    enemySprite = slime.walkAnim || slime.idleAnim
    enemyAnimKey = 'walk'
  }

  return (
    <div
      className={`enemy-actor-root enemy-${slime.type || 'slime'} ${slime.isHit ? 'is-hit' : ''} ${slime.isDead ? 'is-dead' : ''} ${slime.action === 'attack' ? 'is-attacking' : ''} ${slime.action === 'walk' || slime.action === 'chase' ? 'is-walking' : 'is-idle'} ${slime.isSplitChild ? 'is-split-child' : ''}`}
      style={{
        left: `${Math.max(10, Math.min(90, slime.x ?? 50))}%`,
        transform: 'translateX(-50%)',
        bottom: groundOffset,
      }}
      title={`${slime.name} (${isEs ? 'Nv.' : 'Lv.'} ${slime.level})`}
    >
      {/* Ground Shadow */}
      <div 
        className="enemy-actor-shadow" 
        style={{
          transform: `translateX(-50%) scale(${slime.scale})`,
        }}
      />

      {/* Enemy Attack Telegraph Danger Indicator */}
      {slime.action === 'attack' && !slime.isDead && (
        <div className="enemy-attack-telegraph" />
      )}

      {/* Overhead Health Bar & Nameplate */}
      {!slime.isDead && (
        <div 
          className="enemy-actor-overhead"
          style={{
            bottom: `calc(var(--dungeon-sprite-height, 21dvh) * ${(
              (slime.type === 'skeleton' ? 0.94 : slime.type === 'bat' ? 0.86 : 0.72) * slime.scale
            ).toFixed(3)} + 8px)`,
          }}
        >
          <div className="enemy-overhead-name">
            {slime.name}
          </div>
          <div 
            className="enemy-overhead-hp-frame"
            style={{
              width: `calc(var(--dungeon-sprite-height) * 0.32 * ${slime.scale})`,
            }}
          >
            <div 
              className="enemy-overhead-hp-fill"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Floating Damage Popups (Directly Anchored Over Enemy Head) */}
      {slime.floatingTexts.map((f, fIdx) => (
        <div 
          key={f.id ? `${f.id}_${fIdx}` : `efloat_${fIdx}`} 
          className={`floating-damage-number ${f.type || (f.crit ? 'crit' : 'damage')}`}
          style={{
            bottom: `calc(var(--dungeon-sprite-height, 21dvh) * ${(
              (slime.type === 'skeleton' ? 0.85 : slime.type === 'bat' ? 0.75 : 0.65) * slime.scale
            ).toFixed(3)} + 16px)`,
            top: 'auto',
          }}
        >
          {f.text}
        </div>
      ))}

      {/* Enemy Animated Sprite */}
      <div 
        className="enemy-actor-sprite-wrap"
        style={{
          transform: `scaleX(${slime.facing ?? -1}) scale(${slime.scale})`,
          transformOrigin: '50% 97.22%',
        }}
      >
        <SeamlessSprite 
          src={enemySprite} 
          alt={slime.name}
          className="enemy-actor-sprite"
          anim={enemyAnimKey}
          animNonce={slime.animNonce || `${slime.id}_${enemyAnimKey}`}
          draggable={false}
        />
      </div>
    </div>
  )
})
