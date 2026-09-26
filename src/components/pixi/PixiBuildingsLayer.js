import { Container, Sprite, Graphics, Text, TextStyle, AnimatedSprite } from 'pixi.js'
import { loadPixiTexture, loadPixiSpritesheet } from './PixiTextureLoader'
import { 
  getSharedShadowTexture, 
  getSharedBadgeTexture, 
  getSharedHarvestDiscTexture 
} from './PixiSharedTextures'
import { BUILDING_TYPES, getBuildingDef, getMaxProductionBatches } from '../../data/buildingsData'

const BUILDING_DIMENSIONS = {
  archer_tower: { width: 160, height: 190 },
  casa_molino: { width: 200, height: 210 },
  mina_piedra: { width: 185, height: 140 },
  portal: { width: 180, height: 195 },
  cuartel: { width: 220, height: 180 },
  casa: { width: 170, height: 135 },
  castillo: { width: 312, height: 304 },
  ayuntamiento: { width: 312, height: 304 },
  molino: { width: 200, height: 210 },
  gold_mine: { width: 185, height: 140 },
  almacen: { width: 205, height: 205 },
  aserradero: { width: 185, height: 145 },
}

const BUILDING_BASE_OFFSETS = {
  ayuntamiento: 0.5,
  castillo: 0.5,
  cuartel: 2.0,
  casa_molino: 2.0,
  archer_tower: 2.0,
  gold_mine: 1.5,
  mina_piedra: 1.5,
  portal: 1.5,
  casa: 1.5,
  molino: 1.5,
  almacen: 1.5,
  aserradero: 1.5,
}

// Pixel Y offset adjustments to ground structures perfectly on island tiles
const BUILDING_Y_OFFSETS = {
  ayuntamiento: 18,
  castillo: 18,
}

const RESOURCE_ICONS = {
  gold: '/assets/hud_icons/icon_gold.webp',
  wood: '/assets/hud_icons/icon_wood.webp',
  stone: '/assets/hud_icons/icon_stone.webp',
  food: '/assets/hud_icons/icon_food.webp',
  gems: '/assets/hud_icons/icon_gem.webp',
}

function getProducedResources(buildingDef) {
  if (!buildingDef?.production) return []
  const order = ['gems', 'food', 'wood', 'stone', 'gold']
  const list = []
  order.forEach((key) => {
    if (buildingDef.production[key] > 0) {
      list.push({
        type: key,
        rate: buildingDef.production[key],
        icon: RESOURCE_ICONS[key],
      })
    }
  })
  return list
}

export class PixiBuildingsLayer {
  constructor(callbacks = {}) {
    this.callbacks = callbacks
    this.container = new Container()
    this.container.label = 'buildings-layer'
    this.container.sortableChildren = true

    this.slotNodes = new Map()
    this.elapsedTime = 0
  }

  updateSlots(slots = [], vipStatus = {}) {
    // Keep track of current slots
    const seenIds = new Set()

    slots.forEach((slot) => {
      seenIds.add(slot.id)
      let slotNode = this.slotNodes.get(slot.id)

      if (!slotNode) {
        slotNode = new BuildingSlotNode(slot, this.callbacks)
        this.slotNodes.set(slot.id, slotNode)
        this.container.addChild(slotNode.container)
      }

      slotNode.update(slot, vipStatus)
    })

    // Remove obsolete slots if any
    for (const [id, node] of this.slotNodes.entries()) {
      if (!seenIds.has(id)) {
        this.container.removeChild(node.container)
        node.destroy()
        this.slotNodes.delete(id)
      }
    }
  }

  tick(deltaSec) {
    this.elapsedTime += deltaSec
    for (const node of this.slotNodes.values()) {
      node.tick(this.elapsedTime, deltaSec)
    }
  }

  destroy() {
    for (const node of this.slotNodes.values()) {
      node.destroy()
    }
    this.slotNodes.clear()
    this.container.destroy({ children: true })
  }
}

/**
 * Individual Slot Container in Pixi
 */
class BuildingSlotNode {
  constructor(slot, callbacks) {
    this.slot = slot
    this.callbacks = callbacks
    this.container = new Container()
    this.container.label = `slot-${slot.id}`

    // Position in 1920x1080 space
    this.x = (slot.x / 100) * 1920
    this.y = (slot.y / 100) * 1080
    const yOffset = BUILDING_Y_OFFSETS[slot.buildingId] || 0
    this.container.position.set(this.x, this.y + yOffset)

    // Interactive root
    this.container.eventMode = 'static'
    this.container.cursor = 'pointer'

    this.buildingSprite = null
    this.shadowSprite = null
    this.levelBadgeSprite = null
    this.harvestDisc = null

    this.currentBuildingId = null
    this.isHarvestReady = false

    this.setupInteractions()
  }

  setupInteractions() {
    this.container.on('pointertap', (e) => {
      if (this.slot?.buildingId && this.callbacks.onBuildingClick) {
        this.callbacks.onBuildingClick(e, this.slot)
      }
    })

    this.container.on('pointerenter', () => {
      if (this.buildingSprite) {
        this.buildingSprite.scale.set(this.baseScaleX * 1.04, this.baseScaleY * 1.04)
      }
      if (this.callbacks.onHoverSlot && this.slot?.buildingId) {
        this.callbacks.onHoverSlot(this.slot)
      }
    })

    this.container.on('pointerleave', () => {
      if (this.buildingSprite) {
        this.buildingSprite.scale.set(this.baseScaleX, this.baseScaleY)
      }
      if (this.callbacks.onHoverSlot) {
        this.callbacks.onHoverSlot(null)
      }
    })
  }

  update(slot, vipStatus) {
    this.slot = slot
    const buildingDef = slot.buildingId 
      ? (getBuildingDef(slot.buildingId) || BUILDING_TYPES[slot.buildingId.toUpperCase()]) 
      : null

    // Empty or non-existing building: hide completely (no empty markers in progressive mode)
    if (!slot.buildingId || !buildingDef) {
      this.clearBuildingContent()
      this.container.visible = false
      this.container.eventMode = 'none'
      this.container.cursor = 'default'
      return
    }

    const yOffset = BUILDING_Y_OFFSETS[slot.buildingId] || 0
    this.x = (slot.x / 100) * 1920
    this.y = (slot.y / 100) * 1080
    this.container.position.set(this.x, this.y + yOffset)

    const baseOffset = BUILDING_BASE_OFFSETS[slot.buildingId] || 3.5
    this.container.zIndex = Math.round((slot.y + baseOffset) * 10)
    this.container.visible = true
    this.container.eventMode = 'static'
    this.container.cursor = 'pointer'

    this.renderCompletedBuilding(buildingDef, slot, vipStatus)
  }

  async renderCompletedBuilding(buildingDef, slot, vipStatus) {
    const dim = BUILDING_DIMENSIONS[slot.buildingId] || { width: 175, height: 140 }

    // Ground Shadow under building (shared batchable sprite)
    // El usuario solicitó explícitamente: "quitale esa sombra el molino y al castillo"
    const noShadowBuildings = ['castillo', 'ayuntamiento', 'casa_molino', 'molino']
    const hasShadow = !noShadowBuildings.includes(slot.buildingId)

    if (hasShadow) {
      if (!this.shadowSprite) {
        const shadowTex = getSharedShadowTexture()
        this.shadowSprite = new Sprite(shadowTex)
        this.shadowSprite.anchor.set(0.5, 0.5)
        this.shadowSprite.width = dim.width * 0.95
        this.shadowSprite.height = Math.round(dim.height * 0.16)
        this.shadowSprite.position.set(0, 5)
        this.container.addChildAt(this.shadowSprite, 0)
      } else {
        this.shadowSprite.visible = true
      }
    } else {
      if (this.shadowSprite) {
        this.container.removeChild(this.shadowSprite)
        this.shadowSprite.destroy()
        this.shadowSprite = null
      }
    }

    // Building Sprite (Animated if atlasIdle is available, else static sprite)
    if (buildingDef.atlasIdle) {
      if (this.currentBuildingUrl !== buildingDef.atlasIdle || !this.buildingAnimSprite) {
        this.currentBuildingUrl = buildingDef.atlasIdle
        try {
          const sheet = await loadPixiSpritesheet(buildingDef.atlasIdle)
          if (sheet?.animations?.play?.length > 0) {
            if (this.buildingSprite) {
              this.container.removeChild(this.buildingSprite)
              this.buildingSprite.destroy()
              this.buildingSprite = null
            }
            if (!this.buildingAnimSprite) {
              this.buildingAnimSprite = new AnimatedSprite(sheet.animations.play)
              this.buildingAnimSprite.anchor.set(0.5, 0.75)
              this.container.addChild(this.buildingAnimSprite)
            } else {
              this.buildingAnimSprite.textures = sheet.animations.play
            }
            this.buildingAnimSprite.width = dim.width
            this.buildingAnimSprite.height = dim.height
            this.buildingAnimSprite.animationSpeed = 0.40
            this.buildingAnimSprite.loop = true
            this.buildingAnimSprite.play()
            this.baseScaleX = this.buildingAnimSprite.scale.x
            this.baseScaleY = this.buildingAnimSprite.scale.y
            this.buildingAnimSprite.tint = 0xffffff
            this.buildingAnimSprite.alpha = 1.0
          }
        } catch (err) {
          console.warn('[PixiBuildingsLayer] Failed to load atlasIdle:', err)
        }
      }
    } else {
      if (this.buildingAnimSprite) {
        this.buildingAnimSprite.stop()
        this.container.removeChild(this.buildingAnimSprite)
        this.buildingAnimSprite.destroy()
        this.buildingAnimSprite = null
      }
      const spriteUrl = buildingDef.poster || buildingDef.image || buildingDef.animIdle
      if (this.currentBuildingUrl !== spriteUrl || !this.buildingSprite) {
        this.currentBuildingUrl = spriteUrl
        const texture = await loadPixiTexture(spriteUrl)

        if (!this.buildingSprite) {
          this.buildingSprite = new Sprite(texture)
          this.buildingSprite.anchor.set(0.5, 0.75)
          this.container.addChild(this.buildingSprite)
        } else {
          this.buildingSprite.texture = texture
        }

        this.buildingSprite.width = dim.width
        this.buildingSprite.height = dim.height
        this.baseScaleX = this.buildingSprite.scale.x
        this.baseScaleY = this.buildingSprite.scale.y
        this.buildingSprite.tint = 0xffffff
        this.buildingSprite.alpha = 1.0
      }
    }

    // Level Badge Tag (batched sprite)
    this.renderLevelBadge(slot.level || 1, dim)

    // Harvest Floating Disc
    this.renderHarvestDisc(buildingDef, slot, vipStatus, dim)
  }

  renderLevelBadge(level, dim) {
    const badgeTex = getSharedBadgeTexture(level)
    if (!this.levelBadgeSprite) {
      this.levelBadgeSprite = new Sprite(badgeTex)
      this.levelBadgeSprite.anchor.set(0.5, 0.5)
      this.levelBadgeSprite.position.set(0, -dim.height * 0.75 + 18)
      this.container.addChild(this.levelBadgeSprite)
    } else {
      this.levelBadgeSprite.texture = badgeTex
      this.levelBadgeSprite.position.set(0, -dim.height * 0.75 + 18)
    }
  }

  renderHarvestDisc(buildingDef, slot, vipStatus, dim) {
    const produced = getProducedResources(buildingDef)
    if (produced.length === 0) {
      this.clearHarvestDisc()
      return
    }

    const primaryRes = produced[0]
    const cycleSec = (buildingDef.productionCycleSec || 120) * (vipStatus?.hasEngineering ? 0.75 : 1)
    const now = Date.now()
    const lastHarvest = slot.lastHarvestAt || (now - 60000)
    const elapsed = Math.max(0, (now - lastHarvest) / 1000)
    const maxBatches = getMaxProductionBatches(vipStatus?.hasOneClickHarvest || vipStatus?.hasEngineering)
    const batchRatio = Math.min(maxBatches, elapsed / cycleSec)
    const isReady = batchRatio >= 0.25

    if (!isReady) {
      this.clearHarvestDisc()
      return
    }

    if (!this.harvestDisc) {
      this.harvestDisc = new Container()
      this.harvestBaseY = -dim.height * 0.75 - 24
      this.harvestDisc.y = this.harvestBaseY
      this.harvestDisc.eventMode = 'static'
      this.harvestDisc.cursor = 'pointer'

      // Disc background (batched sprite)
      const discBg = new Sprite(getSharedHarvestDiscTexture())
      discBg.anchor.set(0.5, 0.5)
      discBg.width = 40
      discBg.height = 40
      this.harvestDisc.addChild(discBg)

      // Resource Icon
      loadPixiTexture(primaryRes.icon).then((tex) => {
        const icon = new Sprite(tex)
        icon.width = 24
        icon.height = 24
        icon.anchor.set(0.5, 0.5)
        this.harvestDisc.addChild(icon)
      })

      // Click to harvest
      this.harvestDisc.on('pointertap', (e) => {
        e.stopPropagation()
        if (this.callbacks.onCollectFromSlot) {
          this.callbacks.onCollectFromSlot(this.slot, { clientX: e.clientX, clientY: e.clientY }, primaryRes.type)
        }
      })

      this.container.addChild(this.harvestDisc)
    }
  }

  clearHarvestDisc() {
    if (this.harvestDisc) {
      this.container.removeChild(this.harvestDisc)
      this.harvestDisc.destroy({ children: true })
      this.harvestDisc = null
    }
  }

  clearBuildingContent() {
    this.clearHarvestDisc()
    if (this.buildingAnimSprite) {
      this.buildingAnimSprite.stop()
      this.container.removeChild(this.buildingAnimSprite)
      this.buildingAnimSprite.destroy()
      this.buildingAnimSprite = null
      this.currentBuildingUrl = null
    }
    if (this.buildingSprite) {
      this.container.removeChild(this.buildingSprite)
      this.buildingSprite.destroy()
      this.buildingSprite = null
      this.currentBuildingUrl = null
    }
    if (this.shadowSprite) {
      this.container.removeChild(this.shadowSprite)
      this.shadowSprite.destroy()
      this.shadowSprite = null
    }
    if (this.levelBadgeSprite) {
      this.container.removeChild(this.levelBadgeSprite)
      this.levelBadgeSprite.destroy()
      this.levelBadgeSprite = null
    }
  }

  tick(elapsedTime, _deltaSec) {
    // Pulse harvest disc up/down
    if (this.harvestDisc && this.harvestBaseY) {
      this.harvestDisc.y = this.harvestBaseY + Math.sin(elapsedTime * 3.5) * 5
    }
  }

  destroy() {
    this.clearBuildingContent()
    this.clearEmptyMarker()
    this.container.destroy({ children: true })
  }
}
