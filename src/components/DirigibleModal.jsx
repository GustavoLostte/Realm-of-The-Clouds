import React, { useEffect } from 'react'
import { X, Navigation, Sparkles, ChevronRight } from 'lucide-react'
import { CAVES_DATA } from '../data/cavesData'
import { soundManager } from '../utils/audio'
import './DirigibleModal.css'

export function DirigibleModal({ isOpen, onClose, onSelectCave }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCardClick = (cave) => {
    soundManager.playClick?.()
    onSelectCave(cave)
  }

  return (
    <div className="dirigible-modal-overlay" onClick={onClose}>
      <div 
        className="dirigible-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dirigible-title"
      >
        {/* Header */}
        <div className="dirigible-modal-header">
          <div className="dirigible-header-left">
            <div className="dirigible-header-icon">
              <Navigation size={24} />
            </div>
            <div>
              <h2 id="dirigible-title" className="dirigible-modal-title">
                DIRIGIBLE CELESTIAL
              </h2>
              <div className="dirigible-modal-subtitle">
                Selecciona una cueva para viajar inmediatamente
              </div>
            </div>
          </div>
          <button 
            className="dirigible-modal-close-btn" 
            onClick={() => {
              soundManager.playClick?.()
              onClose()
            }}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* 10 Cuadritos Grid */}
        <div className="dirigible-modal-body">
          <div className="dirigible-caves-grid">
            {CAVES_DATA.map((cave) => (
              <div
                key={cave.id}
                className="dirigible-cave-card"
                onClick={() => handleCardClick(cave)}
                title={`Ir a ${cave.name}`}
              >
                <div 
                  className="dirigible-cave-card-bg"
                  style={{ backgroundImage: `url(${cave.bg})` }}
                />
                <div className="dirigible-cave-card-overlay" />

                <div className="dirigible-card-top">
                  <span className="dirigible-card-badge">{cave.level}</span>
                  <span className="dirigible-card-number">{cave.id}</span>
                </div>

                <div className="dirigible-card-bottom">
                  <div className="dirigible-card-name">{cave.name}</div>
                  <div className="dirigible-card-action">
                    <span>Ir ahora</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
