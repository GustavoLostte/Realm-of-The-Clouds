import React, { useState, useRef } from 'react'
import { X, ChevronLeft } from 'lucide-react'
import { soundManager } from '../utils/audio'

export function SwipeableToast({ toast, onDismiss }) {
  const [offsetX, setOffsetX] = useState(0)
  const [isDismissing, setIsDismissing] = useState(false)
  const isPointerDownRef = useRef(false)
  const startXRef = useRef(0)
  const startTimeRef = useRef(0)

  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    isPointerDownRef.current = true
    startXRef.current = e.clientX
    startTimeRef.current = Date.now()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
  }

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return
    const diff = e.clientX - startXRef.current
    // Only allow displacing to the left
    if (diff <= 0) {
      setOffsetX(diff)
    } else {
      // Elastic resistance if pulled to the right
      setOffsetX(diff * 0.12)
    }
  }

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return
    isPointerDownRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    const diff = e.clientX - startXRef.current
    const duration = Math.max(1, Date.now() - startTimeRef.current)
    const velocity = diff / duration

    // If dragged left past 35px or flicked left quickly (< -0.3px/ms)
    if (diff < -35 || (diff < -15 && velocity < -0.3)) {
      setIsDismissing(true)
      soundManager?.playClick?.()
      setTimeout(() => {
        onDismiss?.(toast.id)
      }, 160)
    } else {
      // Snap back smoothly
      setOffsetX(0)
    }
  }

  const handleManualClose = (e) => {
    e.stopPropagation()
    setIsDismissing(true)
    soundManager?.playClick?.()
    setTimeout(() => {
      onDismiss?.(toast.id)
    }, 150)
  }

  const isHarvest = toast.id === 'toast-harvest'
  const opacity = isDismissing ? 0 : Math.max(0.15, 1 - Math.abs(Math.min(0, offsetX)) / 130)
  const translateX = isDismissing ? -120 : offsetX

  return (
    <div
      className={`game-toast ${toast.type || 'info'} ${isHarvest ? 'harvest-toast' : ''} ${isDismissing ? 'is-dismissing' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translateX(${translateX}${isDismissing ? '%' : 'px'})`,
        opacity,
        transition: isPointerDownRef.current 
          ? 'none' 
          : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease',
        touchAction: 'pan-y',
      }}
      role="alert"
    >
      <div className="toast-swipe-hint" title="Desliza a la izquierda para descartar">
        <ChevronLeft size={13} className="toast-hint-chevron" />
      </div>

      <span className="toast-message-text">{toast.message}</span>

      <button
        type="button"
        className="toast-close-btn"
        onClick={handleManualClose}
        title="Cerrar notificación"
        aria-label="Cerrar notificación"
      >
        <X size={13} />
      </button>
    </div>
  )
}
