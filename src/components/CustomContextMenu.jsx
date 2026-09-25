import React, { useState, useEffect, useRef } from 'react'
import { ExternalLink, Globe, Sparkles, X } from 'lucide-react'
import './CustomContextMenu.css'
import { openExternalUrl } from '../utils/openExternalUrl'

const STUDIO_URL = 'https://wizzardev.com/'

export function CustomContextMenu() {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef(null)

  const lastPointerTypeRef = useRef('mouse')

  useEffect(() => {
    // Helper to detect touch-centric or mobile devices
    const isTouchOrMobileDevice = () => {
      try {
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(
          navigator.userAgent || navigator.vendor || window.opera || ''
        )
        const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
        const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
        return isMobileUA || (hasTouch && isCoarse)
      } catch (err) {
        return false
      }
    }

    const handlePointerDown = (e) => {
      lastPointerTypeRef.current = e.pointerType || (e.touches ? 'touch' : 'mouse')
    }

    const handleTouchStart = () => {
      lastPointerTypeRef.current = 'touch'
    }

    const handleContextMenu = (e) => {
      // In local development, allow native right-click for DevTools inspection
      if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return
      }

      // 1. ALWAYS prevent default browser context menu, iOS callout preview, and link preview
      e.preventDefault()

      // 2. CRITICAL: NEVER show this custom menu on mobile devices or via touch long-press!
      const isMobile = isTouchOrMobileDevice()
      const isTouchPointer =
        lastPointerTypeRef.current === 'touch' ||
        lastPointerTypeRef.current === 'pen' ||
        e.pointerType === 'touch'

      if (isMobile || isTouchPointer) {
        e.stopPropagation()
        setVisible(false)
        return
      }

      // 3. Only show if it is an actual desktop mouse right-click with fine pointer
      const isFinePointer = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : true
      if (!isFinePointer) {
        e.stopPropagation()
        setVisible(false)
        return
      }

      const clickX = e.clientX
      const clickY = e.clientY

      // Dimensions estimate for clamping within viewport
      const menuWidth = 245
      const menuHeight = 90

      const screenW = window.innerWidth || document.documentElement.clientWidth
      const screenH = window.innerHeight || document.documentElement.clientHeight

      let x = clickX
      let y = clickY

      // Clamp horizontally
      if (x + menuWidth > screenW - 12) {
        x = Math.max(12, screenW - menuWidth - 12)
      }
      // Clamp vertically
      if (y + menuHeight > screenH - 12) {
        y = Math.max(12, screenH - menuHeight - 12)
      }

      setPosition({ x, y })
      setVisible(true)
    }

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setVisible(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setVisible(false)
      }
    }

    const handleScroll = () => {
      setVisible(false)
    }

    window.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true })
    window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true })
    window.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false })
    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      window.removeEventListener('touchstart', handleTouchStart, { capture: true })
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true })
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleOpenLink = (e) => {
    openExternalUrl(STUDIO_URL, e)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      className="custom-context-menu"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      role="menu"
      aria-label="Menú WizzarDev Studios"
    >
      <div className="custom-context-header">
        <div className="custom-context-brand">
          <Sparkles size={14} className="brand-icon" />
          <span className="brand-name">WizzarDev Studios</span>
        </div>
        <button
          className="custom-context-close"
          onClick={() => setVisible(false)}
          title="Cerrar"
          aria-label="Cerrar"
        >
          <X size={13} />
        </button>
      </div>

      <div className="custom-context-content">
        <button
          className="custom-context-btn primary-link"
          onClick={handleOpenLink}
          role="menuitem"
        >
          <div className="btn-left">
            <Globe size={16} className="item-icon" />
            <div className="btn-labels">
              <span className="btn-title">WizzarDev Studios</span>
              <span className="btn-url">wizzardev.com</span>
            </div>
          </div>
          <ExternalLink size={14} className="item-arrow" />
        </button>
      </div>
    </div>
  )
}
