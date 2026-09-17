import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Application, Container } from 'pixi.js'
import { PixiMapLayer } from './PixiMapLayer'
import { PixiBuildingsLayer } from './PixiBuildingsLayer'
import { PixiCitizensLayer } from './PixiCitizensLayer'
import { detectDevicePerformanceTier } from '../../utils/deviceTier'
import { getBuildingDef, BUILDING_TYPES } from '../../data/buildingsData'
import { useTranslation } from '../../i18n'
import { soundManager } from '../../utils/audio'

export function PixiGameWorld({
  slots = [],
  vipStatus = {},
  onSelectSlot,
  onOpenBuildMenu,
  onCollectFromSlot,
  onCitizenGift,
  isSuspended = false,
  soundEnabled = true,
  zoom = 1.0,
  pan = { x: 0, y: 0 },
  setPan,
  fpsMode = '60fps',
  characterShadows = true,
  onError,
}) {
  const { t } = useTranslation()
  const containerRef = useRef(null)
  const appRef = useRef(null)
  const worldContainerRef = useRef(null)
  const layersRef = useRef(null)

  const [hoveredSlot, setHoveredSlot] = useState(null)
  const [containerSize, setContainerSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  })

  // Resize handling with full hardware resolution retention
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth || window.innerWidth
        const h = containerRef.current.clientHeight || window.innerHeight
        setContainerSize({ width: w, height: h })
        if (appRef.current && appRef.current.renderer) {
          const tierInfo = detectDevicePerformanceTier()
          const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
          const res = fpsMode === 'eco' ? 1.0 : Math.min(dpr, tierInfo.maxDpr)
          appRef.current.renderer.resize(w, h, res)
        }
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : null
    if (ro && containerRef.current) {
      ro.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateSize)
      ro?.disconnect()
    }
  }, [fpsMode])

  // Cover Scale calculation
  const coverScale = Math.max(containerSize.width / 1920, containerSize.height / 1080)
  const currentScale = coverScale * zoom
  const scaledWidth = 1920 * currentScale
  const scaledHeight = 1080 * currentScale
  const maxPanX = Math.max(0, (scaledWidth - containerSize.width) / 2)
  const maxPanY = Math.max(0, (scaledHeight - containerSize.height) / 2)

  // Re-clamp pan within bounds
  useEffect(() => {
    setPan?.((prev) => {
      const clampedX = Math.max(-maxPanX, Math.min(maxPanX, prev.x))
      const clampedY = Math.max(-maxPanY, Math.min(maxPanY, prev.y))
      if (clampedX !== prev.x || clampedY !== prev.y) {
        return { x: clampedX, y: clampedY }
      }
      return prev
    })
  }, [maxPanX, maxPanY, setPan])

  // Update worldContainer transform in Pixi
  useEffect(() => {
    if (!worldContainerRef.current) return
    const wc = worldContainerRef.current
    wc.scale.set(currentScale)
    wc.position.set(containerSize.width / 2 + pan.x, containerSize.height / 2 + pan.y)
  }, [currentScale, containerSize, pan])

  // Handle building clicks
  const handleBuildingClick = useCallback((e, slot) => {
    soundManager.playClick()
    if (!slot.buildingId) {
      onOpenBuildMenu?.(slot)
    } else {
      soundManager.playBuildingSound?.(slot.buildingId, slot.isConstructing)
      onSelectSlot?.(slot)
    }
  }, [onOpenBuildMenu, onSelectSlot])

  // Handle building hover
  const handleHoverSlot = useCallback((slot) => {
    setHoveredSlot(slot)
  }, [])

  const onBuildingClickRef = useRef(handleBuildingClick)
  onBuildingClickRef.current = handleBuildingClick

  const onCollectRef = useRef(onCollectFromSlot)
  onCollectRef.current = onCollectFromSlot

  const onCitizenGiftRef = useRef(onCitizenGift)
  onCitizenGiftRef.current = onCitizenGift

  const onHoverRef = useRef(handleHoverSlot)
  onHoverRef.current = handleHoverSlot

  const isSuspendedRef = useRef(isSuspended)
  isSuspendedRef.current = isSuspended

  // Initialize Pixi Application safely with lifecycle and WebGL context loss protection
  useEffect(() => {
    let isCancelled = false
    let currentApp = null
    let initPromise = null
    let handleContextLost = null
    let handleContextRestored = null

    const initPixi = async () => {
      if (!containerRef.current) return

      try {
        const app = new Application()
        currentApp = app

        const tierInfo = detectDevicePerformanceTier()
        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
        
        // Intelligent Tier Resolution:
        // - High Tier (A56, Laptop, iPhone, modern Galaxy): maxDpr 2.0 (crisp Retina HD)
        // - Mid Tier (4GB RAM, Mali-G52): maxDpr 1.5
        // - Low/Budget Tier (Oppo A17, PowerVR GE8320, Helio G35): maxDpr 1.0 (quadruples fillrate headroom, locks 60 FPS)
        let targetResolution = Math.min(dpr, tierInfo.maxDpr)
        if (fpsMode === 'eco') {
          targetResolution = Math.min(targetResolution, 1.0)
        }

        initPromise = app.init({
          width: containerRef.current.clientWidth || containerSize.width,
          height: containerRef.current.clientHeight || containerSize.height,
          resolution: targetResolution,
          autoDensity: true,
          antialias: false, // 2D sprites do not need heavy MSAA
          useContextAlpha: false, // CRITICAL: disables framebuffer alpha, allows Android SurfaceFlinger direct hardware overlay
          backgroundAlpha: 1,
          backgroundColor: 0x070c14,
          preference: 'webgl',
          powerPreference: 'default', // CRITICAL: prevent context allocation failures on budget MediaTek SoCs
          roundPixels: false,
        })

        await initPromise

        // Validate that renderer and WebGL context are healthy
        const gl = app.renderer?.gl || app.renderer?.context?.gl
        if (!app.renderer || (gl && gl.isContextLost && gl.isContextLost())) {
          throw new Error('WebGL context is lost or unavailable')
        }

        if (isCancelled || !containerRef.current) {
          if (app.renderer && (!gl || !gl.isContextLost?.())) {
            app.destroy(false, { children: true, texture: false })
          }
          return
        }

        // Configure canvas element
        const canvas = app.canvas
        canvas.style.display = 'block'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.position = 'absolute'
        canvas.style.top = '0'
        canvas.style.left = '0'
        canvas.style.pointerEvents = 'auto'
        canvas.style.filter = 'brightness(1.06) contrast(1.04) saturate(1.08)'
        canvas.style.forcedColorAdjust = 'none'
        canvas.style.webkitForcedColorAdjust = 'none'
        canvas.style.colorScheme = 'only dark'

        // Register WebGL context loss listener to prevent browser crash & trigger DOM fallback
        handleContextLost = (e) => {
          e.preventDefault() // Required by WebGL specification
          console.warn('[PixiGameWorld] WebGL context lost, falling back to DOM renderer')
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-active-engine', 'dom')
          }
          onError?.(new Error('WebGL context lost'))
        }
        canvas.addEventListener('webglcontextlost', handleContextLost)

        // Register WebGL context restored listener to automatically recover Pixi rendering
        const handleContextRestored = () => {
          console.log('[PixiGameWorld] WebGL context restored, resuming Pixi renderer')
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-active-engine', 'pixi')
          }
        }
        canvas.addEventListener('webglcontextrestored', handleContextRestored)

        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-active-engine', 'pixi')
          document.documentElement.setAttribute('data-engine-resolution', targetResolution.toFixed(1))
        }

        // Clean any existing canvas in container
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild)
        }
        containerRef.current.appendChild(canvas)

        // Root World Container with center pivot (960, 540)
        const worldContainer = new Container()
        worldContainer.label = 'world-viewport-container'
        worldContainer.pivot.set(960, 540)
        worldContainer.scale.set(currentScale)
        worldContainer.position.set(containerSize.width / 2 + pan.x, containerSize.height / 2 + pan.y)
        app.stage.addChild(worldContainer)
        worldContainerRef.current = worldContainer

        // 0. Map Layer (Base Animated Texture Atlas)
        const mapLayer = new PixiMapLayer()
        mapLayer.setSoundEnabled(soundEnabled)
        worldContainer.addChild(mapLayer.container)

        // 1. Buildings Layer (Static Posters + Level Tags + Collection Discs)
        const buildingsLayer = new PixiBuildingsLayer({
          onBuildingClick: (e, slot) => onBuildingClickRef.current?.(e, slot),
          onHoverSlot: (slot) => onHoverRef.current?.(slot),
          onCollectFromSlot: (slot, coords, resType) => {
            onCollectRef.current?.(slot, coords, resType)
          },
        })
        buildingsLayer.updateSlots(slots, vipStatus)
        worldContainer.addChild(buildingsLayer.container)

        // 2. Citizens Layer (Animated Sprites - rendered in front of buildings so citizens walk cleanly by structures)
        const citizensLayer = new PixiCitizensLayer({
          shadowsVisible: characterShadows,
          onCitizenClick: (_citizen) => {
            soundManager.playClick()
          },
          onCitizenGift: (citizen, gift) => {
            onCitizenGiftRef.current?.(citizen, gift)
          },
        })
        worldContainer.addChild(citizensLayer.container)

        layersRef.current = {
          mapLayer,
          citizensLayer,
          buildingsLayer,
        }

        appRef.current = app
        if (isSuspendedRef.current && app.ticker?.started) {
          app.ticker.stop()
        }

        // Main Render Loop Ticker
        app.ticker.add((ticker) => {
          const activeGl = app.renderer?.gl
          if (activeGl && activeGl.isContextLost && activeGl.isContextLost()) {
            onError?.(new Error('WebGL context lost during ticker'))
            return
          }
          if (isSuspendedRef.current) return
          const deltaSec = ticker.deltaMS / 1000

          citizensLayer.tick(deltaSec, isSuspendedRef.current)
          buildingsLayer.tick(deltaSec)
        })
      } catch (err) {
        console.error('[PixiGameWorld] Failed to initialize Pixi:', err)
        onError?.(err)
      }
    }

    initPixi()

    return () => {
      isCancelled = true
      const appToDestroy = currentApp
      currentApp = null

      const safeDestroy = () => {
        if (!appToDestroy) return
        try {
          if (appToDestroy.canvas) {
            if (handleContextLost) {
              appToDestroy.canvas.removeEventListener('webglcontextlost', handleContextLost)
            }
            if (handleContextRestored) {
              appToDestroy.canvas.removeEventListener('webglcontextrestored', handleContextRestored)
            }
            if (appToDestroy.canvas.parentNode) {
              appToDestroy.canvas.parentNode.removeChild(appToDestroy.canvas)
            }
          }
          if (layersRef.current) {
            layersRef.current.mapLayer?.destroy()
            layersRef.current.citizensLayer?.destroy()
            layersRef.current.buildingsLayer?.destroy()
            layersRef.current = null
          }
          const gl = appToDestroy.renderer?.gl
          if (appToDestroy.renderer && (!gl || !gl.isContextLost?.())) {
            appToDestroy.destroy(false, { children: true, texture: false })
          }
        } catch (e) {
          console.warn('[PixiGameWorld] Destroy error caught safely:', e)
        }
      }

      if (initPromise) {
        initPromise.then(safeDestroy).catch(() => {})
      } else {
        safeDestroy()
      }

      appRef.current = null
      worldContainerRef.current = null
      layersRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync slots updates into Pixi Buildings Layer
  useEffect(() => {
    if (layersRef.current?.buildingsLayer) {
      layersRef.current.buildingsLayer.updateSlots(slots, vipStatus)
    }
  }, [slots, vipStatus])

  // Sync suspended state into Pixi Map Layer & pause/resume Ticker to grant 100% GPU to modal
  useEffect(() => {
    if (appRef.current) {
      const app = appRef.current
      if (isSuspended) {
        if (app.ticker?.started) {
          app.ticker.stop()
        }
      } else {
        if (!app.ticker?.started) {
          app.ticker.start()
        }
      }
    }
    if (layersRef.current?.mapLayer) {
      layersRef.current.mapLayer.setSuspended(isSuspended)
    }
  }, [isSuspended])

  // Sync soundEnabled state into Pixi Map Layer
  useEffect(() => {
    if (layersRef.current?.mapLayer) {
      layersRef.current.mapLayer.setSoundEnabled(soundEnabled)
    }
  }, [soundEnabled])

  // Sync character shadows setting into Pixi Citizens Layer
  useEffect(() => {
    if (layersRef.current?.citizensLayer) {
      layersRef.current.citizensLayer.setShadowsVisible(characterShadows)
    }
  }, [characterShadows])

  // Compute screen coordinates for active hovered slot card
  const hoverCardPosition = useMemo(() => {
    if (!hoveredSlot || !hoveredSlot.buildingId) return null
    const worldX = (hoveredSlot.x / 100) * 1920
    const worldY = (hoveredSlot.y / 100) * 1080

    const screenX = containerSize.width / 2 + pan.x + (worldX - 960) * currentScale
    const screenY = containerSize.height / 2 + pan.y + (worldY - 540) * currentScale - (80 * currentScale)

    return { x: screenX, y: screenY }
  }, [hoveredSlot, containerSize, pan, currentScale])

  const hoveredDef = hoveredSlot?.buildingId 
    ? (getBuildingDef(hoveredSlot.buildingId) || BUILDING_TYPES[hoveredSlot.buildingId.toUpperCase()])
    : null

  return (
    <div 
      className="pixi-gameworld-wrapper" 
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Hover Info Card Rendered in HTML for crisp text and full i18n */}
      {hoverCardPosition && hoveredDef && (
        <div 
          className="building-hover-card pixi-hover-card"
          style={{
            position: 'absolute',
            left: `${hoverCardPosition.x}px`,
            top: `${hoverCardPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <div className="bld-hover-header">
            <h4>{t(`buildings.slots.${hoveredSlot.buildingId}.name`) || hoveredDef.name}</h4>
            <span className="bld-level">{t('common.levelShort')} {hoveredSlot.level || 1}</span>
          </div>
          <div className="bld-hover-stats">
            {hoveredDef.production?.gold > 0 && (
              <span className="bld-prod gold">
                +{hoveredDef.production.gold * (hoveredSlot.level || 1)} {t('resources.gold')}
              </span>
            )}
            {hoveredDef.production?.gems > 0 && (
              <span className="bld-prod gems">
                +{hoveredDef.production.gems * (hoveredSlot.level || 1)} {t('resources.gems')}
              </span>
            )}
            {hoveredDef.defense > 0 && (
              <span className="bld-prod defense">
                +{hoveredDef.defense} {t('common.defense')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
