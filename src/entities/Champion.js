import { getChampionById, getChampionAnimConfig } from '../data/championsData.js'
import { soundManager } from '../utils/audio.js'

/**
 * Universal Champion Class
 * Encapsulates all logic for any champion in the game:
 * - Sprite animation resolution
 * - Audio playback and sound pooling
 * - Movement and jump physics (60fps gravity arc, facing, bounds)
 * - Combat actions (light attack, heavy attack, specials, defend, dash)
 * - Timings, cooldowns, and lock state
 * 
 * Usage:
 *   const champ = new Champion('valiria', { initialX: 25 })
 *   champ.walk(1)  // walk right
 *   champ.jump()   // jump
 *   champ.attack('attack1') // attack with sound & anim
 */
// Exact head displacement curves measured frame-by-frame across the physical jump animation (28 frames @ 18ms = 504ms)
// Normalized to 288px sprite canvas height, with zero-discontinuity endpoints at t=0 and t=jumpDuration
const KINA_MALE_JUMP_HEAD_OFFSETS = [
  0.0, -1.5, -11.7, -22.5, -26.8, -22.5, -5.2, 22.9, 57.4, 76.9, 
  89.8, 100.6, 107.1, 113.6, 117.9, 117.9, 117.9, 115.8, 113.6, 105.0, 
  96.3, 81.2, 61.8, 38.0, 9.9, -7.4, -8.0, 0.0
]

const KINA_FEMALE_JUMP_HEAD_OFFSETS = [
  0.0, -4.7, -10.7, -15.4, -17.8, -15.4, -7.1, 8.3, 25.0, 35.7, 
  42.9, 48.8, 53.6, 55.9, 58.3, 59.5, 59.5, 58.3, 57.1, 54.8, 
  48.8, 41.7, 31.0, 19.1, 4.8, -5.9, -6.0, 0.0
]

function getKnightJumpHeadRatio(elapsed, isFemale = false) {
  const frameRateMs = 18
  const table = isFemale ? KINA_FEMALE_JUMP_HEAD_OFFSETS : KINA_MALE_JUMP_HEAD_OFFSETS
  const maxFrames = table.length - 1
  const t = Math.max(0, elapsed)
  const f = t / frameRateMs
  if (f >= maxFrames) return 0.0
  const i = Math.floor(f)
  const frac = f - i
  const v0 = table[i]
  const v1 = table[Math.min(maxFrames, i + 1)]
  const pixelOffset = v0 + (v1 - v0) * frac
  return pixelOffset / 288.0
}

export class Champion {
  constructor(championIdOrData = 'valiria', options = {}) {
    // 1. Resolve Champion Data
    if (typeof championIdOrData === 'string') {
      this.data = getChampionById(championIdOrData) || getChampionById('valiria')
    } else if (championIdOrData && typeof championIdOrData === 'object') {
      this.data = championIdOrData
    } else {
      this.data = getChampionById('valiria')
    }

    this.id = this.data.id || 'valiria'
    this.name = this.data.name || 'Campeón'
    this.title = this.data.title || ''
    this.role = this.data.role || 'Guerrero'
    this.avatar = this.data.avatar || '/assets/champions/valiria_avatar.webp'
    this.animations = this.data.animations || {}
    this.sounds = this.data.sounds || {}
    this.config = getChampionAnimConfig(this.id)
    this.classId = this.data.classId || (this.id.includes('mage') ? 'mage' : this.id.includes('healer') ? 'healer' : this.id.includes('paladin') ? 'paladin' : 'knight')
    this.gender = options.gender || this.data?.gender || (String(this.id).toLowerCase().includes('female') ? 'female' : 'male')
    this.isCaster = this.classId === 'mage' || this.classId === 'healer' || String(this.id).toLowerCase().includes('mage') || String(this.id).toLowerCase().includes('healer')
    this.level = options.level ?? this.data.level ?? 10
    this.badge = options.badge ?? this.data.badge ?? 'NX'

    // 2. Stats
    this.maxHp = this.data.hp || 5200
    this.hp = options.initialHp ?? this.maxHp
    this.atk = this.data.atk || 96
    this.def = this.data.def || 90
    this.speed = this.data.speed || 94
    this.fury = options.initialFury ?? 100
    this.maxFury = 100

    // 3. Positioning & Movement Physics
    this.posX = options.initialX ?? 25 // percentage across screen width (e.g. 5% to 95%)
    this.posY = options.initialY ?? 0  // vertical jump elevation in px
    this.facing = options.initialFacing ?? 1 // 1 = right, -1 = left
    this.minX = options.minX ?? 5
    this.maxX = options.maxX ?? 95
    this.canMoveTo = options.canMoveTo ?? null
    this.walkSpeed = options.walkSpeed ?? 0.138 // +15% walk speed adjustment
    this.runSpeed = options.runSpeed ?? 0.28 // Natural MMORPG stride (2x walk speed)
    this.jumpForce = options.jumpForce ?? 14
    this.gravity = options.gravity ?? 0.7

    // 4. Movement & Stance States
    this.isJumping = false
    this.velocityY = 0
    this.airElevation = 0
    this.jumpHeadRatio = 0
    this.moveDirection = 0 // -1 = left, 1 = right, 0 = still
    this.isRunning = false
    this.isGuarding = false
    this.isCrouching = false
    this.isActionLocked = false

    // 5. Dash Physics
    this.isDashing = false
    this.dashVelocity = 0
    this.dashFriction = 0.86

    // 6. Branching Combo System with Anti-Mash Input Buffer
    this.comboStep = 0 // 0: idle, 1: hit 1, 2: hit 2, 3: hit 3 (finisher)
    this.comboChain = [] // e.g. ['J'], ['J', 'K'], ['J', 'J', 'J']
    this.canBufferCombo = false
    this.bufferedAttack = null
    this.bufferedAttackTime = 0
    this.bufferedDashAttack = null
    this.attackCooldownUntil = 0
    this.cancelWindowTimer = null
    this.comboGraceTimer = null

    // 7. Active Animation State
    this.anim = 'idle'
    this.animNonce = Date.now()
    this.activeBanner = null // { text, type, id }

    // 8. Timers
    this.actionTimer = null
    this.dashLaunchTimer = null
    this.bannerTimer = null

    // 9. Event Callbacks
    this.onStateChange = options.onStateChange || null
    this.onActionBanner = options.onActionBanner || null

    // 10. Sound & Sprite Asset Cache
    this.audioPool = {}
    this._preloadSounds()
    this._preloadSprites()
  }

  // Preload all animation sprite images into memory for instant, flicker-free rendering
  _preloadSprites() {
    if (!this.animations || typeof window === 'undefined') return
    Object.values(this.animations).forEach((url) => {
      if (url && typeof url === 'string') {
        try {
          const img = new Image()
          img.src = url
          if (typeof img.decode === 'function') {
            img.decode().catch(() => {})
          }
        } catch {}
      }
    })
  }

  // Preload sound instances for zero-latency audio
  _preloadSounds() {
    if (!this.sounds) return
    Object.entries(this.sounds).forEach(([key, url]) => {
      if (url && typeof url === 'string') {
        try {
          const audio = new Audio(url)
          audio.preload = 'auto'
          this.audioPool[key] = audio
        } catch {}
      }
    })
  }

  // Play champion sound safely with smart fallback
  playSound(actionKey) {
    if (!soundManager?.canPlayGameSound?.() && soundManager?.enabled === false) return
    const soundUrl = this.sounds?.[actionKey] 
      || (actionKey.startsWith('attack1') ? this.sounds?.attack1 : null)
      || (actionKey.startsWith('attack2') ? this.sounds?.attack2 : null)
      || (actionKey.startsWith('dash') ? this.sounds?.[actionKey] || this.sounds?.dash_front : null)
      || (actionKey.startsWith('defend') ? this.sounds?.defend : null)
    if (!soundUrl) return

    try {
      if (soundManager?.sfxPool?.play) {
        soundManager.sfxPool.play(soundUrl, 0.8)
      } else {
        let audio = this.audioPool[actionKey]
        if (!audio) {
          audio = new Audio(soundUrl)
          this.audioPool[actionKey] = audio
        }
        audio.currentTime = 0
        audio.volume = 0.8
        audio.play().catch(() => {})
      }
    } catch {}
  }

  // Resolve active sprite for current animation
  getSprite() {
    let url = null
    if (this.animations) {
      if (this.animations[this.anim]) url = this.animations[this.anim]
      else if (this.anim === 'attacking' && this.animations.attack1) url = this.animations.attack1
      else if (this.anim === 'run' && !this.animations.run && this.animations.walk) url = this.animations.walk
    }
    if (!url) {
      url = this.data.idleAnim || this.data.fullImage || '/assets/champions/Valiria/idle.webp'
    }

    return url
  }

  // Set floating banner message
  showBanner(text, type = 'info', duration = 750, emit = true) {
    this.activeBanner = { text, type, id: Date.now() }
    if (this.onActionBanner) this.onActionBanner(this.activeBanner)

    if (this.bannerTimer) clearTimeout(this.bannerTimer)
    this.bannerTimer = setTimeout(() => {
      this.activeBanner = null
      if (emit) {
        this._emitChange()
      }
    }, duration)

    if (emit) {
      this._emitChange()
    }
  }

  // Set champion horizontal position & facing (used for corridor transitions)
  setPosition(x, facing = null) {
    this.posX = Math.max(this.minX, Math.min(this.maxX, x))
    if (facing !== null) {
      this.facing = facing > 0 ? 1 : -1
    }
    this._emitChange()
  }

  // Start walking in direction (-1: left, 1: right, 0: stop)
  walk(direction) {
    if (this.isCrouching || this.isGuarding) return
    this.moveDirection = direction
    this.isRunning = false

    if (direction !== 0) {
      this.facing = direction > 0 ? 1 : -1
      if (!this.isJumping && !this.isActionLocked) {
        this.setAnim('walk')
      }
    } else {
      if (!this.isJumping && !this.isActionLocked && !this.isGuarding && !this.isCrouching) {
        this.setAnim('idle')
      }
    }
    this._emitChange()
  }

  // Start running in direction
  run(direction) {
    if (this.isCrouching || this.isGuarding) return
    this.moveDirection = direction
    this.isRunning = direction !== 0

    if (direction !== 0) {
      this.facing = direction > 0 ? 1 : -1
      if (!this.isJumping && !this.isActionLocked) {
        this.setAnim('run')
      }
    } else {
      if (!this.isJumping && !this.isActionLocked && !this.isGuarding && !this.isCrouching) {
        this.setAnim('idle')
      }
    }
    this._emitChange()
  }

  // Stop horizontal movement
  stopMoving() {
    this.moveDirection = 0
    this.isRunning = false
    if (!this.isJumping && !this.isActionLocked && !this.isGuarding && !this.isCrouching) {
      this.setAnim('idle')
    }
    this._emitChange()
  }

  // Jump (Salto Ágil con ciclo completo garantizado sin cortes bruscos)
  jump() {
    if (this.isJumping || this.isActionLocked || this.isCrouching) return
    this.isJumping = true
    this.isActionLocked = true
    this.animNonce = Date.now()
    this.setAnim('jump')
    this.playSound('jump')

    // Durante el salto, el personaje avanza a su velocidad normal de caminata o carrera sin catapultas artificiales
    this.dashVelocity = 0

    if (this.actionTimer) clearTimeout(this.actionTimer)
    const jumpDuration = this.config?.durations?.jump || 504
    this.jumpStartTime = Date.now()
    this.jumpDuration = jumpDuration
    this.airElevation = 0
    this.jumpHeadRatio = 0

    this.actionTimer = setTimeout(() => {
      this.actionTimer = null
      this.isJumping = false
      this.isActionLocked = false
      this.dashVelocity = 0
      this.posY = 0
      this.velocityY = 0
      this.airElevation = 0
      this.jumpHeadRatio = 0

      // Execute any skill that was buffered while airborne
      if (this.bufferedSkill) {
        const skill = this.bufferedSkill
        this.bufferedSkill = null
        if (skill === 'seismic') {
          this.seismic()
          return
        } else if (skill === 'special' || skill === 'special2') {
          this.special(skill)
          return
        }
      }

      if (this.isCrouching) {
        this.setAnim(this.isGuarding ? 'defend_down' : 'down')
      } else if (this.isGuarding) {
        this.setAnim('defend')
      } else if (this.moveDirection !== 0) {
        this.setAnim(this.isRunning ? 'run' : 'walk')
      } else {
        this.setAnim('idle')
      }
      this._emitChange()
    }, jumpDuration)

    this._emitChange()
  }

  // Crouch down or stand back up
  // Crouch down or stand back up (locked during any active action/attack)
  crouch(isDown) {
    if (this.isJumping || this.isActionLocked) return
    this.isCrouching = isDown

    if (isDown) {
      this.moveDirection = 0
      this.isRunning = false
      if (this.isGuarding) {
        this.setAnim('defend_down')
        this.playSound('defend')
        this.showBanner('🛡 ¡Guardia Baja!', 'defend')
      } else {
        this.setAnim('down')
      }
    } else {
      if (this.isGuarding) {
        this.setAnim('defend')
        this.showBanner('🛡 ¡Guardia Alta!', 'defend')
      } else {
        this.setAnim(this.moveDirection !== 0 ? (this.isRunning ? 'run' : 'walk') : 'idle')
      }
    }
    this._emitChange()
  }

  // Defend / Guard (high guard or low crouch guard, locked during any active action/attack)
  defend(isGuarding = true) {
    if (this.isActionLocked) return
    this.isGuarding = isGuarding

    if (isGuarding) {
      this.moveDirection = 0
      this.isRunning = false
      this.playSound('defend')
      if (this.isCrouching) {
        this.setAnim('defend_down')
        this.showBanner('🛡 ¡Guardia Baja!', 'defend')
      } else {
        this.setAnim('defend')
        this.showBanner('🛡 ¡Guardia Alta!', 'defend')
      }
    } else {
      if (this.isCrouching) {
        this.setAnim('down')
      } else {
        if (this.anim === 'defend' || this.anim === 'defend_down') {
          this.setAnim(this.moveDirection !== 0 ? (this.isRunning ? 'run' : 'walk') : 'idle')
        }
      }
    }
    this._emitChange()
  }

  // Forward Dash (salto e impulso quirúrgico hacia adelante - ciclo 500ms garantizado)
  dashFront() {
    if (this.anim === 'special2' || this.isCrouching || this.isJumping) return false
    // Can cancel any normal basic attack into dash
    if (this.isActionLocked && !this.anim.startsWith('attack') && !this.isDashing) return false

    if (this.actionTimer) clearTimeout(this.actionTimer)
    if (this.comboGraceTimer) clearTimeout(this.comboGraceTimer)
    this._resetCombo()

    this.isActionLocked = true
    this.isDashing = true
    this.bufferedDashAttack = null
    this.animNonce = Date.now()
    this.setAnim('dash_front')
    this.playSound('dash_front')
    this.showBanner('💨 ¡Salto Veloz!', 'special')

    // Preparación / flexión previa al salto
    this.dashVelocity = 0

    if (this.dashLaunchTimer) clearTimeout(this.dashLaunchTimer)
    // Despegue aéreo ágil sincronizado (t = 60ms) con desplazamiento fluido y moderado
    this.dashLaunchTimer = setTimeout(() => {
      if (this.anim === 'dash_front') {
        const speed = this.isCaster ? 1.40 : 1.22
        this.dashVelocity = this.facing * speed
        this.dashFriction = 0.895
        this._emitChange()
      }
    }, 60)

    if (this.actionTimer) clearTimeout(this.actionTimer)
    const dashFrontDuration = this.config?.durations?.dash_front || 500
    this.actionTimer = setTimeout(() => {
      this.actionTimer = null
      this.isActionLocked = false
      this.isDashing = false
      this.dashVelocity = 0
      if (this.dashLaunchTimer) {
        clearTimeout(this.dashLaunchTimer)
        this.dashLaunchTimer = null
      }

      // Si el usuario presionó ataque durante el dash, se encadena limpiamente tras completar el dash
      if (this.bufferedDashAttack) {
        const dashContext = {
          wasFrontDash: true,
          dashKey: this.facing === 1 ? 'E' : 'Q'
        }
        const attackType = this.bufferedDashAttack.attackType
        this.bufferedDashAttack = null
        this._startComboStep1(attackType, dashContext)
        return
      }

      if (this.isCrouching) {
        this.setAnim(this.isGuarding ? 'defend_down' : 'down')
      } else if (this.isGuarding) {
        this.setAnim('defend')
      } else if (this.moveDirection !== 0) {
        this.setAnim(this.isRunning ? 'run' : 'walk')
      } else {
        this.setAnim('idle')
      }
      this._emitChange()
    }, dashFrontDuration)

    this._emitChange()
  }

  // Back Dash (paso rápido y salto evasivo hacia atrás - ciclo 500ms garantizado)
  dashBack() {
    if (this.anim === 'special2' || this.isCrouching || this.isJumping) return false
    if (this.isActionLocked && !this.anim.startsWith('attack') && !this.isDashing) return false

    if (this.actionTimer) clearTimeout(this.actionTimer)
    if (this.comboGraceTimer) clearTimeout(this.comboGraceTimer)
    this._resetCombo()

    this.isActionLocked = true
    this.isDashing = true
    this.bufferedDashAttack = null
    this.animNonce = Date.now()
    this.setAnim('dash_back')
    this.playSound('dash_back')
    this.showBanner('💨 ¡Paso Evasivo!', 'defend')

    const speed = this.isCaster ? 1.28 : 1.12
    this.dashVelocity = -this.facing * speed
    this.dashFriction = 0.895

    if (this.dashLaunchTimer) {
      clearTimeout(this.dashLaunchTimer)
      this.dashLaunchTimer = null
    }

    if (this.actionTimer) clearTimeout(this.actionTimer)
    const dashBackDuration = this.config?.durations?.dash_back || 500
    this.actionTimer = setTimeout(() => {
      this.actionTimer = null
      this.isActionLocked = false
      this.isDashing = false
      this.dashVelocity = 0
      if (this.dashLaunchTimer) {
        clearTimeout(this.dashLaunchTimer)
        this.dashLaunchTimer = null
      }

      // Si el usuario presionó ataque durante el dash evasivo:
      if (this.bufferedDashAttack) {
        const dashContext = {
          wasFrontDash: false,
          dashKey: this.facing === 1 ? 'Q' : 'E'
        }
        const attackType = this.bufferedDashAttack.attackType
        this.bufferedDashAttack = null
        this._startComboStep1(attackType, dashContext)
        return
      }

      if (this.isCrouching) {
        this.setAnim(this.isGuarding ? 'defend_down' : 'down')
      } else if (this.isGuarding) {
        this.setAnim('defend')
      } else if (this.moveDirection !== 0) {
        this.setAnim(this.isRunning ? 'run' : 'walk')
      } else {
        this.setAnim('idle')
      }
      this._emitChange()
    }, dashBackDuration)

    this._emitChange()
  }

  // Directional Dash: evaluates forward vs backdash
  dash(direction = null) {
    const dir = direction !== null ? direction : this.moveDirection
    if (!dir || dir === 0) {
      // Neutral / sin dirección de avance -> Retirada táctica (Dash hacia atrás)
      this.dashBack()
      return
    }
    const isForward = (dir > 0 && this.facing > 0) || (dir < 0 && this.facing < 0)
    if (isForward) {
      this.dashFront()
    } else {
      this.dashBack()
    }
  }

  // Dynamic Branching Combo Engine with Anti-Mash Input Buffer
  // Garantía estricta: Cada animación se cumple al 100% de su duración sin cortes ni glitches visuales.
  inputAttack(type = 'punch') {
    if (this.isJumping) {
      this._executeAirAttack(type)
      return
    }

    if (this.isCrouching) {
      this._executeCrouchAttack(type)
      return
    }

    const isPunch = (type === 'punch' || type === 'J' || type === 'attack1')
    const attackType = isPunch ? 'punch' : 'kick'

    // Si el personaje está en pleno Dash, se bufferea el ataque para salir disparado al culminar el Dash
    const isDashingNow = this.isDashing || this.anim === 'dash_front' || this.anim === 'dash_back'
    if (isDashingNow) {
      this.bufferedDashAttack = {
        attackType,
        wasFrontDash: (this.anim === 'dash_front'),
      }
      return
    }

    // Cooldown de recuperación tras remate: bufferea el ataque para que inicie de inmediato al vencer
    if (this.attackCooldownUntil && Date.now() < this.attackCooldownUntil) {
      this.bufferedAttack = attackType
      this.bufferedAttackTime = Date.now()
      return
    }

    // Si la acción está bloqueada (se está reproduciendo activamente una animación):
    if (this.isActionLocked) {
      // Si estamos en Hit 1 o Hit 2 de combo:
      if (this.comboStep === 1 || this.comboStep === 2) {
        // Si estamos en la ventana de gracia post-animación (la animación ya terminó pero espera el encadenamiento):
        if (this.canBufferCombo) {
          if (this.comboGraceTimer) {
            clearTimeout(this.comboGraceTimer)
            this.comboGraceTimer = null
          }
          if (this.comboStep === 1) {
            this._advanceComboStep2(attackType)
          } else if (this.comboStep === 2) {
            this._advanceComboStep3(attackType)
          }
          return
        }

        // Si la animación actual aún se está reproduciendo: Guardar en buffer para que se ejecute EXACTAMENTE al terminar
        this.bufferedAttack = attackType
        this.bufferedAttackTime = Date.now()
        return
      }

      // Si está en el remate final o en otra acción: bufferear para no perder el ataque
      this.bufferedAttack = attackType
      this.bufferedAttackTime = Date.now()
      return
    }

    // PASO 1: Primer golpe desde neutral/idle
    this._startComboStep1(attackType)
  }

  // Ejecuta Paso 1 del Combo
  _startComboStep1(attackType, dashContext = null) {
    const isPunch = (attackType === 'punch')
    const keyLabel = isPunch ? 'J' : 'K'

    this.comboStep = 1
    this.comboChain = dashContext ? [`${dashContext.dashKey}+${keyLabel}`] : [keyLabel]
    this.isActionLocked = true
    this.canBufferCombo = false
    this.bufferedAttack = null

    const wasFrontDash = dashContext?.wasFrontDash
    const animKey = isPunch ? 'attack1_1' : 'attack2_1'
    let banner = isPunch ? '⚔ ¡Corte Sagrado! [J]' : '🌋 ¡Golpe Sísmico! [K]'
    if (dashContext) {
      banner = wasFrontDash
        ? (isPunch ? '⚡ ¡Dash Tajo! (E + J)' : '🌋 ¡Dash Sísmico! (E + K)')
        : (isPunch ? '🛡 ¡Contraataque Tajo! (Q + J)' : '🌋 ¡Contraataque Sísmico! (Q + K)')
      if (wasFrontDash) {
        this.dashVelocity = this.facing * 1.35
        this.dashFriction = 0.88
      } else {
        this.dashVelocity = 0
      }
    }

    const duration = isPunch 
      ? (this.config?.durations?.attack1_1 || 182) 
      : (this.config?.durations?.attack2_1 || 742)

    this._playActionAnimation(animKey, isPunch ? 'attack1' : 'attack2', banner, duration, wasFrontDash ? 1.0 : 0.4, () => {
      // La animación 1 se ha cumplido al 100% de sus cuadros
      if (this.bufferedAttack && (Date.now() - this.bufferedAttackTime < 500)) {
        const nextType = this.bufferedAttack
        this.bufferedAttack = null
        this._advanceComboStep2(nextType)
      } else {
        // Ventana de gracia (130ms) para encadenar el siguiente golpe si el jugador no lo presionó antes
        this.canBufferCombo = true
        this.comboGraceTimer = setTimeout(() => {
          this._resetCombo()
        }, 130)
      }
    })
  }

  // Ejecuta Paso 2 del Combo (Ramificación)
  _advanceComboStep2(attackType) {
    if (this.comboGraceTimer) {
      clearTimeout(this.comboGraceTimer)
      this.comboGraceTimer = null
    }

    const isPunch = (attackType === 'punch')
    const keyLabel = isPunch ? 'J' : 'K'

    this.comboStep = 2
    this.comboChain.push(keyLabel)
    this.isActionLocked = true
    this.canBufferCombo = false
    this.bufferedAttack = null

    const animKey = isPunch ? 'attack1_2' : 'attack2_2'
    const banner = `⚡ ¡Combo x2! (${this.comboChain.join(' + ')})`
    const duration = isPunch 
      ? (this.config?.durations?.attack1_2 || 350) 
      : (this.config?.durations?.attack2_2 || 742)

    this._playActionAnimation(animKey, isPunch ? 'attack1' : 'attack2', banner, duration, 0.6, () => {
      // La animación 2 se ha cumplido al 100% de sus cuadros
      if (this.bufferedAttack && (Date.now() - this.bufferedAttackTime < 500)) {
        const nextType = this.bufferedAttack
        this.bufferedAttack = null
        this._advanceComboStep3(nextType)
      } else {
        this.canBufferCombo = true
        this.comboGraceTimer = setTimeout(() => {
          this._resetCombo()
        }, 130)
      }
    })
  }

  // Ejecuta Paso 3 del Combo (Remate Final)
  _advanceComboStep3(attackType) {
    if (this.comboGraceTimer) {
      clearTimeout(this.comboGraceTimer)
      this.comboGraceTimer = null
    }

    const isPunch = (attackType === 'punch')
    const keyLabel = isPunch ? 'J' : 'K'

    this.comboStep = 3
    this.comboChain.push(keyLabel)
    this.isActionLocked = true
    this.canBufferCombo = false
    this.bufferedAttack = null

    const animKey = isPunch ? 'attack1_3' : 'attack2_2'
    const banner = isPunch 
      ? `🔥 ¡COMBO SAGRADO x3! (${this.comboChain.join(' + ')})`
      : `🌋 ¡REMATE SÍSMICO x3! (${this.comboChain.join(' + ')})`
    const duration = isPunch 
      ? (this.config?.durations?.attack1_3 || 616) 
      : (this.config?.durations?.attack2_2 || 742)

    // Impulso cinético hacia adelante en el remate
    this.dashVelocity = this.facing * 0.45
    this.dashFriction = 0.88

    this._playActionAnimation(animKey, isPunch ? 'attack1' : 'attack2', banner, duration, 1.0, () => {
      // El remate final se cumplió al 100%
      this._resetCombo()
      // Enfriamiento de recuperación de 140ms para evitar spam descontrolado inmediato
      this.attackCooldownUntil = Date.now() + 140
    })
  }

  // Reproductor de animación de acción con garantía de completitud estricta
  _playActionAnimation(animKey, soundKey, bannerText, duration, forwardStep, onComplete) {
    if (this.actionTimer) clearTimeout(this.actionTimer)
    if (this.comboGraceTimer) clearTimeout(this.comboGraceTimer)

    this.animNonce = Date.now()
    this.setAnim(animKey, false)
    this.playSound(soundKey)
    this.showBanner(bannerText, this.comboStep >= 3 ? 'special2' : (this.comboStep === 2 ? 'special' : animKey), 750, false)

    // Micro-desplazamiento físico con respeto estricto a las colisiones
    if (forwardStep > 0) {
      let targetX = this.posX + (this.facing * forwardStep)
      let clampedX = Math.max(this.minX, Math.min(this.maxX, targetX))
      if (typeof this.canMoveTo === 'function') {
        clampedX = this.canMoveTo(clampedX, this.posX, this)
      }
      this.posX = clampedX
    }

    // Se garantiza que la animación corre durante la totalidad de su duración sin interrupción
    this.actionTimer = setTimeout(() => {
      this.actionTimer = null
      if (onComplete) onComplete()
    }, duration)

    this._emitChange()
  }

  // Reset combo back to neutral/idle
  _resetCombo() {
    this.comboStep = 0
    this.comboChain = []
    this.canBufferCombo = false
    this.bufferedDashAttack = null
    this.isActionLocked = false
    if (this.cancelWindowTimer) {
      clearTimeout(this.cancelWindowTimer)
      this.cancelWindowTimer = null
    }
    if (this.actionTimer) {
      clearTimeout(this.actionTimer)
      this.actionTimer = null
    }
    if (this.comboGraceTimer) {
      clearTimeout(this.comboGraceTimer)
      this.comboGraceTimer = null
    }

    // Si hay un ataque guardado en buffer reciente (< 450ms), encadenar paso 1 inmediatamente
    if (this.bufferedAttack && (Date.now() - this.bufferedAttackTime < 450)) {
      const nextType = this.bufferedAttack
      this.bufferedAttack = null
      this._startComboStep1(nextType)
      return
    }
    this.bufferedAttack = null

    if (this.isCrouching) {
      this.setAnim(this.isGuarding ? 'defend_down' : 'down')
    } else if (this.isGuarding) {
      this.setAnim('defend')
    } else if (this.moveDirection !== 0) {
      this.setAnim(this.isRunning ? 'run' : 'walk')
    } else {
      this.setAnim('idle')
    }
    this._emitChange()
  }

  // Crouch strike
  _executeCrouchAttack(type) {
    if (this.isActionLocked) return
    const isPunch = (type === 'punch' || type === 'J' || type === 'attack1')
    this.isActionLocked = true
    this.animNonce = Date.now()
    const animKey = isPunch ? 'attack1_1' : 'attack2_1'
    const duration = isPunch 
      ? (this.config?.durations?.attack1_1 || 182) 
      : (this.config?.durations?.attack2_1 || 742)
    this.setAnim(animKey, false)
    this.playSound(isPunch ? 'attack1' : 'attack2')
    this.showBanner(isPunch ? '⚔ ¡Golpe Bajo! [J]' : '🥋 ¡Barrida Baja! [K]', 'attack1', 750, false)

    if (this.actionTimer) clearTimeout(this.actionTimer)
    this.actionTimer = setTimeout(() => {
      this.actionTimer = null
      this.isActionLocked = false
      if (this.isCrouching) {
        this.setAnim(this.isGuarding ? 'defend_down' : 'down')
      } else if (this.isGuarding) {
        this.setAnim('defend')
      } else if (this.moveDirection !== 0) {
        this.setAnim(this.isRunning ? 'run' : 'walk')
      } else {
        this.setAnim('idle')
      }
      this._emitChange()
    }, duration)
    this._emitChange()
  }

  // Air strike (bloquea la acción hasta tocar tierra o completar ciclo)
  _executeAirAttack(type) {
    if (this.isActionLocked) return
    this.isActionLocked = true
    const isPunch = (type === 'punch' || type === 'J' || type === 'attack1')
    this.animNonce = Date.now()
    this.setAnim(isPunch ? 'attack1_2' : 'attack2_2', false)
    this.playSound(isPunch ? 'attack1' : 'attack2')
    this.showBanner(isPunch ? '⚔ ¡Golpe Aéreo!' : '🦅 ¡Patada Voladora!', 'special', 750, false)
    this._emitChange()
  }

  // Attack Action (delegates to Branching Combo Engine)
  attack(type = 'attack1') {
    this.inputAttack(type === 'attack2' ? 'kick' : 'punch')
  }

  // Checks if current action can be canceled by a special skill
  _canCancelIntoSkill() {
    if (!this.isActionLocked) return true
    // Cannot cancel during a Super Skill (special2)
    if (this.anim === 'special2') return false
    // Any basic attack, dash, guard, or combo can be canceled into a skill
    return true
  }

  // Perform Special Action (Cancela ataques básicos y permite bufferear en el aire)
  special(type = 'special') {
    // Si está en el aire, se bufferea la habilidad para detonar al tocar suelo
    if (this.isJumping) {
      this.bufferedSkill = type
      return true
    }

    if (!this._canCancelIntoSkill()) return false

    // Limpia limpiamente cualquier ataque o dash previo
    if (this.actionTimer) clearTimeout(this.actionTimer)
    if (this.comboGraceTimer) clearTimeout(this.comboGraceTimer)
    if (this.dashLaunchTimer) clearTimeout(this.dashLaunchTimer)
    this.isDashing = false
    this.dashVelocity = 0
    this.comboStep = 0
    this.comboChain = []
    this.canBufferCombo = false

    const duration = this.config?.durations?.[type] || (type === 'special' ? 616 : 1414)
    const bannerText = type === 'special' ? '🛡 ¡Poder del Escudo!' : '⚡ ¡SUPER SKILL (SS): EXPLOSIÓN CELESTIAL!'

    this._executeLockedAction(type, duration, bannerText, type)
    return true
  }

  // Habilidad 1: Poder del Escudo (Bloqueo Defensivo / Guardia de Caballero)
  shield() {
    return this.special('special')
  }

  // Habilidad 2: Poder Sísmico (Hendidura Telúrica Terrestre)
  seismic() {
    // Si está en el aire, se bufferea para detonar al aterrizar
    if (this.isJumping) {
      this.bufferedSkill = 'seismic'
      return true
    }

    if (!this._canCancelIntoSkill()) return false

    // Cancela limpiamente cualquier ataque o dash previo
    if (this.actionTimer) clearTimeout(this.actionTimer)
    if (this.comboGraceTimer) clearTimeout(this.comboGraceTimer)
    if (this.dashLaunchTimer) clearTimeout(this.dashLaunchTimer)
    this.isDashing = false
    this.dashVelocity = 0
    this.comboStep = 0
    this.comboChain = []
    this.canBufferCombo = false

    const duration = this.config?.durations?.attack2 || 742
    this._playActionAnimation('attack2', 'attack2', '🌋 ¡Golpe Sísmico!', duration, 0.4, () => {
      this._resetCombo()
      this.attackCooldownUntil = Date.now() + 140
    })
    return true
  }

  // Habilidad 3 / Definitiva: Super Skill (SS)
  superSkill() {
    return this.special('special2')
  }

  // Generic locked action executor
  _executeLockedAction(actionName, duration, bannerText, soundKey) {
    this.isActionLocked = true
    this.animNonce = Date.now()
    this.setAnim(actionName, false)
    this.playSound(soundKey || actionName)
    this.showBanner(bannerText, actionName, 750, false)

    if (this.actionTimer) clearTimeout(this.actionTimer)
    this.actionTimer = setTimeout(() => {
      this.actionTimer = null
      this.isActionLocked = false
      if (this.isCrouching) {
        this.setAnim(this.isGuarding ? 'defend_down' : 'down')
      } else if (this.isGuarding) {
        this.setAnim('defend')
      } else {
        this.setAnim(this.moveDirection !== 0 ? (this.isRunning ? 'run' : 'walk') : 'idle')
      }
      this._emitChange()
    }, duration)

    this._emitChange()
  }

  // Set animation state with notification
  setAnim(newAnim, emit = true) {
    if (this.anim !== newAnim) {
      this.anim = newAnim
      if (emit) this._emitChange()
    }
  }

  // Physical Step Update (call inside requestAnimationFrame)
  // Physical Step Update (framerate-independent with normalized delta-time dt where 1.0 = 60 FPS)
  update(dt = 1) {
    let changed = false
    const timeScale = Math.min(2.0, Math.max(0.05, dt))

    // 1. Jump Physics & Ground Sync (Kina tiene el salto 3D horneado + elevación física de +44px)
    if (this.isJumping && this.jumpStartTime && this.jumpDuration) {
      const elapsed = Date.now() - this.jumpStartTime
      const isKnight = this.classId === 'knight'

      if (isKnight) {
        // En Kina (Knight Hombre y Mujer), el sprite 3D ya tiene horneado el salto vertical de 48px.
        // Para permitir saltar con soltura sobre enemigos (slimes, murciélagos, esqueletos),
        // elevamos físicamente el nodo del campeón con un arco parabólico suave de +44px adicionales.
        const currentHeadRatio = getKnightJumpHeadRatio(elapsed, this.gender === 'female')
        if (Math.abs((this.jumpHeadRatio || 0) - currentHeadRatio) > 0.0005) {
          this.jumpHeadRatio = currentHeadRatio
        }

        let currentAir = 0
        let targetPosY = 0
        if (elapsed >= 110 && elapsed < 440) {
          const airProg = (elapsed - 110) / (440 - 110)
          const jumpArc = Math.sin(airProg * Math.PI)
          currentAir = Math.max(0, jumpArc * 48)
          targetPosY = Math.max(0, Math.round(jumpArc * 44))
        }

        if (Math.abs(this.posY - targetPosY) > 0.5) {
          this.posY = targetPosY
        }
        if (Math.abs((this.airElevation || 0) - (currentAir + targetPosY)) > 0.1) {
          this.airElevation = currentAir + targetPosY
        }
      } else {
        // Para otras clases sin salto físico pre-horneado en el sprite
        const progress = Math.min(1, Math.max(0, elapsed / this.jumpDuration))
        const targetY = Math.sin(progress * Math.PI) * 24
        if (Math.abs(this.posY - targetY) > 0.1) {
          this.posY = targetY
          this.airElevation = targetY
        }
        if (this.jumpHeadRatio !== 0) {
          this.jumpHeadRatio = 0
        }
      }
    } else {
      if (this.posY !== 0) {
        this.posY = 0
      }
      if (this.airElevation && this.airElevation !== 0) {
        this.airElevation = 0
      }
      if (this.jumpHeadRatio && this.jumpHeadRatio !== 0) {
        this.jumpHeadRatio = 0
      }
    }

    // 2. Dash & Momentum Physics (smooth framerate-independent deceleration)
    if (Math.abs(this.dashVelocity) > 0.01) {
      const wasDashing = this.isDashing
      let nextX = this.posX + (this.dashVelocity * timeScale)
      let clampedX = Math.max(this.minX, Math.min(this.maxX, nextX))

      if (typeof this.canMoveTo === 'function') {
        const allowedX = this.canMoveTo(clampedX, this.posX, this)
        // If dash was blocked by collision, halt horizontal dash velocity so Kina stops cleanly
        if (allowedX !== clampedX) {
          clampedX = allowedX
          this.dashVelocity = 0
          this.isDashing = false
        }
      }

      if (clampedX !== this.posX) {
        this.posX = clampedX
      }
      this.dashVelocity *= Math.pow(this.dashFriction, timeScale)
      if (Math.abs(this.dashVelocity) <= 0.01) {
        this.dashVelocity = 0
        this.isDashing = false
      }
      if (wasDashing && !this.isDashing) {
        changed = true
      }
    }

    // 3. Horizontal Walk & Run Movement (framerate-independent normalized speed)
    if (this.moveDirection !== 0 && !this.isCrouching && !this.isGuarding && (!this.isActionLocked || this.isJumping)) {
      const airMultiplier = this.isJumping ? 1.22 : 1.0
      const currentSpeed = (this.isRunning ? this.runSpeed : this.walkSpeed) * timeScale * airMultiplier
      let nextX = this.posX + (this.moveDirection * currentSpeed)
      let clampedX = Math.max(this.minX, Math.min(this.maxX, nextX))

      if (typeof this.canMoveTo === 'function') {
        clampedX = this.canMoveTo(clampedX, this.posX, this)
      }

      if (clampedX !== this.posX) {
        this.posX = clampedX
      }
    }

    if (changed) {
      this._emitChange()
    }
  }

  // Damage handler
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount)
    this.animNonce = Date.now()
    this.showBanner(`-${amount}`, 'damage')
    this._emitChange()
    return this.hp
  }

  // Heal handler
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount)
    this.showBanner(`+${amount} HP`, 'heal')
    this._emitChange()
    return this.hp
  }

  // Level Up handler
  setLevel(newLevel, maxHpBonus = 0) {
    this.level = newLevel
    if (maxHpBonus > 0) {
      this.maxHp = (this.maxHp || 850) + maxHpBonus
      this.hp = this.maxHp
      this.fury = 100
    }
    this._emitChange()
    return this.level
  }

  // Emit current state to external subscriber
  _emitChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState())
    }
  }

  // Export serializable representation for UI
  getState() {
    return {
      id: this.id,
      classId: this.classId,
      gender: this.gender,
      name: this.name,
      title: this.title,
      role: this.role,
      level: this.level,
      badge: this.badge,
      avatar: this.avatar,
      hp: this.hp,
      maxHp: this.maxHp,
      hpPercent: Math.round((this.hp / this.maxHp) * 100),
      fury: this.fury,
      maxFury: this.maxFury,
      posX: this.posX,
      posY: this.posY,
      x: this.posX,
      y: this.posY,
      airElevation: this.airElevation || 0,
      jumpHeadRatio: this.jumpHeadRatio || 0,
      facing: this.facing,
      anim: this.anim,
      animNonce: this.animNonce,
      sprite: this.getSprite(),
      isActionLocked: this.isActionLocked,
      isJumping: this.isJumping,
      isGuarding: this.isGuarding,
      isCrouching: this.isCrouching,
      isDashing: this.isDashing,
      comboStep: this.comboStep,
      comboChain: [...this.comboChain],
      isMoving: this.moveDirection !== 0,
      moveDirection: this.moveDirection,
      isRunning: this.isRunning,
      activeBanner: this.activeBanner,
    }
  }

  // Cleanup all timers and audio pools
  destroy() {
    if (this.dashLaunchTimer) clearTimeout(this.dashLaunchTimer)
    if (this.actionTimer) clearTimeout(this.actionTimer)
    if (this.bannerTimer) clearTimeout(this.bannerTimer)
    if (this.cancelWindowTimer) clearTimeout(this.cancelWindowTimer)
    if (this.comboGraceTimer) clearTimeout(this.comboGraceTimer)
    Object.values(this.audioPool).forEach((audio) => {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch {}
    })
    this.audioPool = {}
  }
}
