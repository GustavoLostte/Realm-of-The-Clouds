import React, { useRef, useState, useEffect, useCallback } from 'react'
import './VirtualJoystick.css'

/**
 * VirtualJoystick - High performance, zero-latency 60 FPS analog touch joystick
 * Supports horizontal navigation (left/right), jump on flick up, and guard on pull down.
 */
export function VirtualJoystick({
  onMoveX,
  onJump,
  onDefend,
  disabled = false,
  size = 118,
}) {
  const baseRef = useRef(null)
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 })
  const [isActive, setIsActive] = useState(false)
  const isPointerDownRef = useRef(false)
  const rectRef = useRef(null)
  const pointerIdRef = useRef(null)
  const lastDirXRef = useRef(0)
  const isGuardingRef = useRef(false)
  const jumpTriggeredRef = useRef(false)

  const radius = size / 2
  const maxDistance = radius * 0.72

  // Reset state to neutral
  const resetJoystick = useCallback(() => {
    isPointerDownRef.current = false
    pointerIdRef.current = null
    setIsActive(false)
    setKnobPos({ x: 0, y: 0 })

    if (lastDirXRef.current !== 0) {
      lastDirXRef.current = 0
      onMoveX?.(0)
    }

    if (isGuardingRef.current) {
      isGuardingRef.current = false
      onDefend?.(false)
    }

    jumpTriggeredRef.current = false
  }, [onMoveX, onDefend])

  const handlePointerDown = (e) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()

    if (!baseRef.current) return
    rectRef.current = baseRef.current.getBoundingClientRect()
    pointerIdRef.current = e.pointerId

    try {
      baseRef.current.setPointerCapture(e.pointerId)
    } catch {}

    isPointerDownRef.current = true
    setIsActive(true)
    handlePointerMove(e)
  }

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current || e.pointerId !== pointerIdRef.current) return
    if (!rectRef.current) return

    const centerX = rectRef.current.left + rectRef.current.width / 2
    const centerY = rectRef.current.top + rectRef.current.height / 2

    const rawDx = e.clientX - centerX
    const rawDy = e.clientY - centerY

    const dist = Math.hypot(rawDx, rawDy)
    const angle = Math.atan2(rawDy, rawDx)

    // Clamp distance to joystick circle boundary
    const clampedDist = Math.min(dist, maxDistance)
    const knobX = Math.cos(angle) * clampedDist
    const knobY = Math.sin(angle) * clampedDist

    setKnobPos({ x: knobX, y: knobY })

    // Normalized coordinates (-1 to 1)
    const normX = clampedDist > 0 ? (knobX / maxDistance) : 0
    const normY = clampedDist > 0 ? (knobY / maxDistance) : 0

    // Horizontal Movement with Deadzone (0.18)
    let dirX = 0
    if (normX < -0.18) dirX = -1
    else if (normX > 0.18) dirX = 1

    if (dirX !== lastDirXRef.current) {
      lastDirXRef.current = dirX
      onMoveX?.(dirX)
    }

    // Vertical gestures:
    // Flick up (normY < -0.55) triggers Jump once
    if (normY < -0.55) {
      if (!jumpTriggeredRef.current) {
        jumpTriggeredRef.current = true
        onJump?.()
      }
    } else {
      jumpTriggeredRef.current = false
    }

    // Pull down (normY > 0.55) triggers Defend / Guard
    if (normY > 0.55) {
      if (!isGuardingRef.current) {
        isGuardingRef.current = true
        onDefend?.(true)
      }
    } else {
      if (isGuardingRef.current) {
        isGuardingRef.current = false
        onDefend?.(false)
      }
    }
  }

  const handlePointerUp = (e) => {
    if (e.pointerId === pointerIdRef.current) {
      try {
        baseRef.current?.releasePointerCapture(e.pointerId)
      } catch {}
      resetJoystick()
    }
  }

  useEffect(() => {
    return () => {
      resetJoystick()
    }
  }, [resetJoystick])

  return (
    <div
      ref={baseRef}
      className={`virtual-joystick-base ${isActive ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="group"
      aria-label="Joystick de combate táctil"
    >
      {/* Background Directional Crosshair & Runes */}
      <div className="joystick-crosshair-h" />
      <div className="joystick-crosshair-v" />
      <div className="joystick-outer-ring" />

      {/* Direction Guide Icons */}
      <div className="joystick-marker marker-up" title="Deslizar arriba: Saltar">▲</div>
      <div className="joystick-marker marker-left" title="Deslizar izquierda: Correr">◀</div>
      <div className="joystick-marker marker-right" title="Deslizar derecha: Correr">▶</div>
      <div className="joystick-marker marker-down" title="Deslizar abajo: Cubrirse">▼</div>

      {/* Movable Active Thumb Knob */}
      <div
        className="joystick-thumb-knob"
        style={{
          transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
        }}
      >
        <div className="joystick-knob-core">
          <div className="knob-inner-pip" />
        </div>
      </div>
    </div>
  )
}
