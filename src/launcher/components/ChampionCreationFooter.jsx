import React from 'react'
import { User, ArrowRight, Compass, Sparkles } from 'lucide-react'

/**
 * ChampionCreationFooter
 * Bottom action bar with player name input and explicit 'Recorrer Ciudad' CTA
 */
export const ChampionCreationFooter = React.memo(function ChampionCreationFooter({
  charName,
  isNameValid,
  isSubmitting,
  onNameChange,
  onCreate,
  onNext,
  activeClass,
  gender,
}) {
  const handleProceed = () => {
    if (onNext) {
      onNext()
    } else if (onCreate) {
      onCreate()
    }
  }

  const championDisplayName = charName.trim() || activeClass?.name || 'tu Campeón'
  const genderLabel = gender === 'FEMALE' ? 'Femenino ♀' : 'Masculino ♂'

  return (
    <footer className="char-footer">
      <div className="char-input-cta-group">
        <div className="char-name-input-wrap">
          <User size={18} className="char-name-icon" />
          <input
            type="text"
            id="char-name-input"
            className="char-name-input"
            placeholder={`Nombre para tu ${activeClass?.name || 'campeón'} (opcional)...`}
            maxLength={16}
            value={charName}
            onChange={onNameChange}
            onKeyDown={(e) => e.key === 'Enter' && handleProceed()}
          />
        </div>

        <button
          type="button"
          id="btn-siguiente-escena"
          className="char-cta-btn char-cta-explore-city"
          disabled={isSubmitting}
          onClick={handleProceed}
          title={`Recorrer la Ciudad de las Nubes con ${championDisplayName}`}
        >
          <div className="char-cta-content">
            <span className="char-cta-title">
              {isSubmitting ? 'Cargando Ciudad...' : `Recorrer Ciudad con ${championDisplayName}`}
            </span>
            <span className="char-cta-subtitle">
              <Compass size={11} style={{ display: 'inline', marginRight: 4 }} />
              {genderLabel} • Centro y 6 Pasillos
            </span>
          </div>
          <ArrowRight size={20} className="char-cta-arrow" />
        </button>
      </div>
    </footer>
  )
})

