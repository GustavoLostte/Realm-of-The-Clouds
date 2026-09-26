import React from 'react'
import { Shield } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { formatCompactNumber, formatFullNumber } from '../utils/formatters'
import { useTranslation } from '../i18n'
import './RankingLateralButton.css'

export function RankingLateralButton({
  onOpenRanking,
  trophies = 0,
  peaceShieldUntil = 0,
  isTutorialActive = false,
}) {
  const { t } = useTranslation()
  const isShieldActive = peaceShieldUntil > Date.now()

  const handleTap = () => {
    if (isTutorialActive) return
    soundManager?.playClick?.()
    onOpenRanking?.('arena')
  }

  return (
    <aside className="ranking-lateral-container" aria-label="Ranking y Clasificación">
      <button
        id="lateral-btn-ranking"
        className="ranking-lateral-btn"
        onClick={handleTap}
        title={t('ranking.rankingTooltip') || `Ranking Global • ${formatFullNumber(trophies)} Coronas de Arena`}
        aria-label="Abrir Ranking de Comandantes"
      >
        <div className="ranking-glow-aura" />
        
        <div className="ranking-icon-wrapper">
          <img
            src="/assets/hud_icons/btn_ranking.webp"
            alt="Ranking"
            className="ranking-candy-icon"
            draggable="false"
          />
          {isShieldActive && (
            <span 
              className="ranking-shield-tag" 
              title={t('hud.peaceShieldActive') || 'Escudo de Paz Activo'}
            >
              <Shield size={12} className="shield-svg" />
            </span>
          )}
        </div>

        <div className="ranking-info-box">
          <span className="ranking-title-label">
            {t('ranking.ranking') || 'Ranking'}
          </span>
          <span className="ranking-score-pill">
            🏆 {formatCompactNumber(trophies)}
          </span>
        </div>
      </button>
    </aside>
  )
}
