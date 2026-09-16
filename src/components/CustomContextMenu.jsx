import React, { useState, useEffect, useRef } from 'react'
import { ExternalLink, Globe, Sparkles, X } from 'lucide-react'
import './CustomContextMenu.css'

const STUDIO_URL = 'https://wizzardev.com/'

export function CustomContextMenu() {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef(null)

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault()

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

    window.addEventListener('contextmenu', handleContextMenu, { capture: true })
    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true })
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleOpenLink = () => {
    window.open(STUDIO_URL, '_blank', 'noopener,noreferrer')
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
