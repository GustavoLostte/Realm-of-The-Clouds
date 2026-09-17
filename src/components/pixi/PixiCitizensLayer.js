import { Container, Sprite, Graphics, AnimatedSprite } from 'pixi.js'
import { loadPixiTexture, loadPixiSpritesheet } from './PixiTextureLoader'
import { getSharedShadowTexture } from './PixiSharedTextures'

const ISOMETRIC_AVENUE = [
  { x: 26.0, y: 21.0 },
  { x: 32.0, y: 27.2 },
  { x: 36.0, y: 31.5 },
  { x: 44.5, y: 40.5 },
  { x: 53.0, y: 49.5 },
  { x: 61.5, y: 58.5 },
  { x: 70.0, y: 67.5 },
  { x: 73.5, y: 71.3 },
  { x: 79.0, y: 77.0 },
]

const DOWN_ROUTE = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const UP_ROUTE = [8, 7, 6, 5, 4, 3, 2, 1, 0]
const WALKING_SPEED = 2.1
const LANE_OFFSET_DOWN = { x: -0.70, y: 0.60 }
const LANE_OFFSET_UP = { x: 0.70, y: -0.60 }

function buildRouteData(route, laneOffset) {
  const points = route.map((wpIdx) => ({
    x: ISOMETRIC_AVENUE[wpIdx].x + laneOffset.x,
    y: ISOMETRIC_AVENUE[wpIdx].y + laneOffset.y,
  }))

  const cumDists = [0]
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x
    const dy = (points[i + 1].y - points[i].y) * 1.35
    const segLen = Math.sqrt(dx * dx + dy * dy)
    cumDists.push(cumDists[i] + segLen)
  }

  const totalLength = cumDists[cumDists.length - 1]
  return { points, cumDists, totalLength }
}

const ROUTE_DATA_DOWN = buildRouteData(DOWN_ROUTE, LANE_OFFSET_DOWN)
const ROUTE_DATA_UP = buildRouteData(UP_ROUTE, LANE_OFFSET_UP)

const CYCLE_LENGTH = 108.0
const FADE_IN_DIST = 2.5
const FADE_OUT_DIST = 2.5

function getCitizenVisualState(routeData, cyclePos) {
  const { points, cumDists, totalLength } = routeData
  const posInCycle = ((cyclePos % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH

  if (posInCycle >= totalLength) {
    const startPos = points[0]
    return {
      x: startPos.x,
      y: startPos.y,
      opacity: 0,
      isVisible: false,
    }
  }

  const dist = posInCycle
  let segIdx = 0
  for (let i = 0; i < cumDists.length - 1; i++) {
    if (dist >= cumDists[i] && dist <= cumDists[i + 1]) {
      segIdx = i
      break
    }
  }

  const pStart = points[segIdx]
  const pEnd = points[segIdx + 1]
  const segLen = cumDists[segIdx + 1] - cumDists[segIdx]
  const t = segLen > 0 ? (dist - cumDists[segIdx]) / segLen : 0

  const x = pStart.x + (pEnd.x - pStart.x) * t
  const y = pStart.y + (pEnd.y - pStart.y) * t

  let opacity = 1.0
  if (dist < FADE_IN_DIST) {
    opacity = Math.max(0, dist / FADE_IN_DIST)
  } else if (dist > totalLength - FADE_OUT_DIST) {
    opacity = Math.max(0, (totalLength - dist) / FADE_OUT_DIST)
  }

  return {
    x,
    y,
    opacity,
    isVisible: opacity > 0.05,
  }
}

const BASE_CITIZENS = [
  {
    id: 'citizen-baker',
    type: 'angel_chica',
    name: 'Ángel Celeste',
    scale: 0.85,
    sheetFront: '/assets/npcs/spritesheets/angel_chica_walk_front.json',
    sheetBack: '/assets/npcs/spritesheets/angel_chica_walk_back.json',
    routeType: 'down',
    cycleOffset: 0.0,
  },
  {
    id: 'citizen-guard',
    type: 'soldado',
    name: 'Guardia Real',
    scale: 0.92,
    sheetFront: '/assets/npcs/spritesheets/soldado_walk_front.json',
    sheetBack: '/assets/npcs/spritesheets/soldado_walk_back.json',
    routeType: 'down',
    cycleOffset: 36.0,
  },
  {
    id: 'citizen-worker',
    type: 'worker',
    name: 'Artesano de la Nube',
    scale: 0.88,
    sheetFront: '/assets/npcs/spritesheets/worker_walk_front.json',
    sheetBack: '/assets/npcs/spritesheets/worker_walk_back.json',
    routeType: 'down',
    cycleOffset: 72.0,
  },
  {
    id: 'citizen-sergeant',
    type: 'soldado',
    name: 'Sargento de la Guardia',
    scale: 0.92,
    sheetFront: '/assets/npcs/spritesheets/soldado_walk_front.json',
    sheetBack: '/assets/npcs/spritesheets/soldado_walk_back.json',
    routeType: 'up',
    cycleOffset: 18.0,
  },
  {
    id: 'citizen-barmaid',
    type: 'angel_chica',
    name: 'Doncella Alada',
    scale: 0.85,
    sheetFront: '/assets/npcs/spritesheets/angel_chica_walk_front.json',
    sheetBack: '/assets/npcs/spritesheets/angel_chica_walk_back.json',
    routeType: 'up',
    cycleOffset: 72.0,
  },
]

export class PixiCitizensLayer {
  constructor(callbacks = {}) {
    this.callbacks = callbacks
    this.container = new Container()
    this.container.label = 'citizens-layer'
    this.container.sortableChildren = true

    this.baseProgress = 0
    this.walkerNodes = []
    this.guards = []
    this.shadowsVisible = callbacks.shadowsVisible !== false

    this.initWalkers()
    this.initGuards()
    if (!this.shadowsVisible) {
      this.setShadowsVisible(false)
    }
  }

  setShadowsVisible(visible) {
    this.shadowsVisible = visible
    this.walkerNodes.forEach((node) => node.setShadowVisible?.(visible))
    this.guards.forEach((guard) => guard.setShadowVisible?.(visible))
  }

  initWalkers() {
    BASE_CITIZENS.forEach((cfg) => {
      const node = new CitizenWalkerNode(cfg, this.callbacks)
      this.walkerNodes.push(node)
      this.container.addChild(node.container)
    })
  }

  initGuards() {
    // 1. Sky Commander
    const commander = new SkyCommanderNode(this.callbacks)
    this.guards.push(commander)
    this.container.addChild(commander.container)

    // 2. Sentry Guard (West Balcony)
    const sentry = new SentryGuardNode(this.callbacks)
    this.guards.push(sentry)
    this.container.addChild(sentry.container)
  }

  tick(deltaSec, isSuspended = false) {
    if (isSuspended !== this._lastSuspended) {
      this._lastSuspended = isSuspended
      this.walkerNodes.forEach((node) => node.setSuspended(isSuspended))
      this.guards.forEach((g) => g.setSuspended(isSuspended))
    }
    if (isSuspended) return

    // Advance conveyor progress
    this.baseProgress = (this.baseProgress + WALKING_SPEED * deltaSec) % CYCLE_LENGTH

    // Update walkers
    this.walkerNodes.forEach((node) => {
      node.update(this.baseProgress)
    })

    // Update guards
    this.guards.forEach((g) => {
      g.tick(deltaSec)
    })
  }

  destroy() {
    this.walkerNodes.forEach((n) => n.destroy())
    this.guards.forEach((g) => g.destroy())
    this.walkerNodes = []
    this.guards = []
    this.container.destroy({ children: true })
  }
}

class CitizenWalkerNode {
  constructor(cfg, callbacks) {
    this.cfg = cfg
    this.callbacks = callbacks
    this.container = new Container()
    this.container.label = `citizen-${cfg.id}`
    this.container.eventMode = 'static'
    this.container.cursor = 'pointer'

    this.routeData = cfg.routeType === 'down' ? ROUTE_DATA_DOWN : ROUTE_DATA_UP
    this.useBack = cfg.routeType === 'up'
    this.sheetUrl = this.useBack ? cfg.sheetBack : cfg.sheetFront
    this.spriteHeight = Math.round(56 * (cfg.scale || 1.0))
    this.shadowWidth = Math.round(26 * (cfg.scale || 1.0))
    this.shadowHeight = Math.round(9 * (cfg.scale || 1.0))

    // Ground Shadow (batched sprite)
    const shadowTex = getSharedShadowTexture()
    this.shadow = new Sprite(shadowTex)
    this.shadow.anchor.set(0.5, 0.5)
    this.shadow.width = this.shadowWidth
    this.shadow.height = this.shadowHeight
    this.container.addChild(this.shadow)

    // Animated Sprite
    this.animSprite = null
    this.staticSprite = null
    this.loadSprite()

    this.container.on('pointertap', (e) => {
      e.stopPropagation()
      if (this.callbacks.onCitizenClick) {
        this.callbacks.onCitizenClick(this.cfg)
      }
      if (this.callbacks.onCitizenGift && Math.random() < 0.35) {
        const isGem = Math.random() < 0.2
        const gift = isGem
          ? { type: 'gems', amount: 1, text: '+1 Gema' }
          : { type: 'gold', amount: 20, text: '+20 Oro' }
        this.callbacks.onCitizenGift(this.cfg, gift)
      }
    })
  }

  async loadSprite() {
    try {
      const sheet = await loadPixiSpritesheet(this.sheetUrl)
      if (sheet && sheet.animations?.play && sheet.animations.play.length > 0) {
        const anim = new AnimatedSprite(sheet.animations.play)
        anim.anchor.set(0.5, 0.95)
        anim.height = this.spriteHeight
        anim.scale.x = Math.abs(anim.scale.y)
        anim.animationSpeed = 0.35
        anim.play()
        this.animSprite = anim
        this.container.addChild(anim)
        return
      }
    } catch (err) {
      console.warn(`[CitizenWalkerNode] Spritesheet failed for ${this.cfg.id}`, err)
    }
  }

  setSuspended(isSuspended) {
    if (!this.animSprite) return
    if (isSuspended) {
      if (this.animSprite.playing) this.animSprite.stop()
    } else {
      if (!this.animSprite.playing) this.animSprite.play()
    }
  }

  setShadowVisible(visible) {
    if (this.shadow) {
      this.shadow.visible = visible
    }
  }

  update(baseProgress) {
    const cyclePos = baseProgress + this.cfg.cycleOffset
    const visual = getCitizenVisualState(this.routeData, cyclePos)

    // Map percentage to 1920x1080 stage
    const stageX = (visual.x / 100) * 1920
    const stageY = (visual.y / 100) * 1080

    this.container.position.set(stageX, stageY)
    this.container.alpha = visual.opacity
    this.container.visible = visual.isVisible
    this.container.zIndex = Math.round(visual.y * 10) + 1
  }

  destroy() {
    if (this.animSprite) {
      this.animSprite.stop()
    }
    this.container.destroy({ children: true })
  }
}

class SkyCommanderNode {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.container = new Container()
    this.container.label = 'sky-commander'
    this.container.eventMode = 'static'
    this.container.cursor = 'pointer'

    // Position: 78.5%, 51.5%
    const stageX = (78.5 / 100) * 1920
    const stageY = (51.5 / 100) * 1080
    this.container.position.set(stageX, stageY)
    this.container.zIndex = 515

    // Shadow (batched sprite)
    const shadowTex = getSharedShadowTexture()
    this.shadow = new Sprite(shadowTex)
    this.shadow.anchor.set(0.5, 0.5)
    this.shadow.width = 52
    this.shadow.height = 18
    this.container.addChild(this.shadow)

    // Animated Spritesheet management
    this.animSprite = null
    this.idleSheet = null
    this.actionSheet = null
    this.isPlayingAction = false
    this.actionTimer = 0
    this.idleTimer = 16

    this.loadAnimations()

    this.container.on('pointertap', (e) => {
      e.stopPropagation()
      this.triggerAction()
      if (this.callbacks.onCitizenClick) {
        this.callbacks.onCitizenClick({ id: 'sky-commander', name: 'Comandante del Cielo' })
      }
      if (this.callbacks.onCitizenGift && Math.random() < 0.40) {
        const isGem = Math.random() < 0.35
        const gift = isGem
          ? { type: 'gems', amount: 2, text: '+2 Gemas' }
          : { type: 'gold', amount: 50, text: '+50 Oro' }
        this.callbacks.onCitizenGift({ id: 'sky-commander', name: 'Comandante del Cielo' }, gift)
      }
    })
  }

  async loadAnimations() {
    try {
      const [idleSheet, actionSheet] = await Promise.all([
        loadPixiSpritesheet('/assets/npcs/spritesheets/comandante_idle.json'),
        loadPixiSpritesheet('/assets/npcs/spritesheets/comandante_action.json'),
      ])
      this.idleSheet = idleSheet
      this.actionSheet = actionSheet

      if (idleSheet?.animations?.play) {
        const anim = new AnimatedSprite(idleSheet.animations.play)
        anim.anchor.set(0.5, 0.95)
        anim.height = 75
        anim.width = 88
        anim.animationSpeed = 0.30
        anim.play()
        this.animSprite = anim
        this.container.addChild(anim)
        return
      }
    } catch (err) {
      console.warn('[SkyCommanderNode] Spritesheet failed', err)
    }
  }

  setSuspended(isSuspended) {
    if (!this.animSprite) return
    if (isSuspended) {
      if (this.animSprite.playing) this.animSprite.stop()
    } else {
      if (!this.animSprite.playing) this.animSprite.play()
    }
  }

  setShadowVisible(visible) {
    if (this.shadow) {
      this.shadow.visible = visible
    }
  }

  triggerAction() {
    if (this.isPlayingAction) return
    this.isPlayingAction = true
    this.actionTimer = 5.08

    if (this.animSprite && this.actionSheet?.animations?.play) {
      this.animSprite.textures = this.actionSheet.animations.play
      this.animSprite.loop = false
      this.animSprite.gotoAndPlay(0)
      this.animSprite.onComplete = () => {
        if (this.isPlayingAction) {
          this.isPlayingAction = false
          if (this.idleSheet?.animations?.play) {
            this.animSprite.textures = this.idleSheet.animations.play
            this.animSprite.loop = true
            this.animSprite.play()
          }
        }
      }
    }
  }

  tick(deltaSec) {
    if (this.isPlayingAction) {
      this.actionTimer -= deltaSec
      if (this.actionTimer <= 0) {
        this.isPlayingAction = false
        if (this.animSprite && this.idleSheet?.animations?.play) {
          this.animSprite.textures = this.idleSheet.animations.play
          this.animSprite.loop = true
          this.animSprite.play()
        }
      }
    } else {
      this.idleTimer -= deltaSec
      if (this.idleTimer <= 0) {
        this.idleTimer = 16 + Math.random() * 10
        this.triggerAction()
      }
    }
  }

  destroy() {
    if (this.animSprite) {
      this.animSprite.stop()
    }
    this.container.destroy({ children: true })
  }
}

class SentryGuardNode {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.container = new Container()
    this.container.label = 'sentry-west-balcony'
    this.container.eventMode = 'static'
    this.container.cursor = 'pointer'

    // Position: 21.8%, 49.8%
    const stageX = (21.8 / 100) * 1920
    const stageY = (49.8 / 100) * 1080
    this.container.position.set(stageX, stageY)
    this.container.zIndex = Math.round(49.8 * 10)

    // Shadow (batched sprite)
    const shadowTex = getSharedShadowTexture()
    this.shadow = new Sprite(shadowTex)
    this.shadow.anchor.set(0.5, 0.5)
    this.shadow.width = 38
    this.shadow.height = 12
    this.container.addChild(this.shadow)

    // Animated Sprite
    this.animSprite = null
    this.loadAnimations()

    this.container.on('pointertap', (e) => {
      e.stopPropagation()
      if (this.callbacks.onCitizenClick) {
        this.callbacks.onCitizenClick({ id: 'sentry-west-balcony', name: 'Soldado Vigía' })
      }
      if (this.callbacks.onCitizenGift && Math.random() < 0.35) {
        const isGem = Math.random() < 0.25
        const gift = isGem
          ? { type: 'gems', amount: 1, text: '+1 Gema' }
          : { type: 'gold', amount: 25, text: '+25 Oro' }
        this.callbacks.onCitizenGift({ id: 'sentry-west-balcony', name: 'Soldado Vigía' }, gift)
      }
    })
  }

  async loadAnimations() {
    try {
      const sheet = await loadPixiSpritesheet('/assets/npcs/spritesheets/soldado_vigia_idle.json')
      if (sheet?.animations?.play) {
        const anim = new AnimatedSprite(sheet.animations.play)
        anim.anchor.set(0.5, 0.95)
        anim.height = 56
        anim.width = 80
        anim.animationSpeed = 0.30
        anim.play()
        this.animSprite = anim
        this.container.addChild(anim)
        return
      }
    } catch (err) {
      console.warn('[SentryGuardNode] Spritesheet failed', err)
    }
  }

  setSuspended(isSuspended) {
    if (!this.animSprite) return
    if (isSuspended) {
      if (this.animSprite.playing) this.animSprite.stop()
    } else {
      if (!this.animSprite.playing) this.animSprite.play()
    }
  }

  setShadowVisible(visible) {
    if (this.shadow) {
      this.shadow.visible = visible
    }
  }

  tick() {}

  destroy() {
    if (this.animSprite) {
      this.animSprite.stop()
    }
    this.container.destroy({ children: true })
  }
}

