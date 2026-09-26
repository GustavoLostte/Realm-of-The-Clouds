import React from 'react'
import { ArrowLeft, Swords } from 'lucide-react'

/**
 * ChampionHeader
 * Top navigation bar for Character Creation
 */
export const ChampionHeader = React.memo(function ChampionHeader({ onBack }) {
  return (
    <header className="char-header">
      <button type="button" className="char-back-btn" onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Volver al Launcher</span>
      </button>

      <div className="char-title-unit">
        <span className="char-badge-realm">
          <Swords size={12} />
          Reinos en Guerra
        </span>
        <span className="char-header-title">Creación de Campeón</span>
      </div>

      <div style={{ width: 140 }} />
    </header>
  )
})
