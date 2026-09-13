import React, { useEffect } from 'react'
import { 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert,
  Award,
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n/index.jsx'
import './SeasonEndModal.css'

export function SeasonEndModal({
  isOpen,
  onClose,
  seasonNumber = 1,
  seasonTitle = 'El Despertar de los Reyes',
  league = {},
  chestName = 'Cofre Dorado de Asedio',
  rewards = {},
  trophiesBefore = 400,
  trophiesAfter = 400,
  onClaimRewards,
}) {
  const { t } = useTranslation()

  useEffect(() => {
    if (isOpen) {
      soundManager.playVictory?.()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClaim = () => {
    soundManager.playClick?.()
    soundManager.playLevelUp?.()
    onClaimRewards?.()
    onClose?.()
  }

  const bonusItems = rewards?.bonusItems || {}

  return (
    <div className="season-modal-overlay">
      <div className="season-end-card">
        {/* Crest */}
        <div className="season-end-crest-wrap">
          <img 
            src="/assets/hud_icons/btn_ranking.webp" 
            alt="Corona de Temporada" 
            className="season-end-crest" 
          />
        </div>

        {/* Title */}
        <h2 className="season-end-title">
          {t('arena.seasonEndModalTitle') || '¡Conclusión de Temporada!'}
        </h2>

        {/* Season subtitle pill */}
        <div className="season-end-subtitle-bar">
          <Award size={14} />
          <span>{seasonTitle} (T{seasonNumber})</span>
        </div>

        <p className="season-end-desc">
          {t('arena.seasonEndModalSubtitle') || 'Los clarines de guerra proclaman el fin del ciclo competitivo. ¡Reclama tu botín y tus honores imperiales!'}
        </p>

        {/* Chest Showcase */}
        <div className="season-chest-showcase">
          <div className="season-league-badge-strip">
            <span>{t('arena.seasonEndLeagueAchieved') || 'Liga Alcanzada'}:</span>
            <span 
              className="league-badge-pill" 
              style={{ background: league?.gradient || 'rgba(30, 41, 59, 0.8)', borderColor: league?.color || '#eab308' }}
            >
              {league?.icon && <img src={league.icon} alt={league.name} style={{ width: 16, height: 16 }} />}
              <span>{t(`arena.leagues.${league?.id}`) || league?.name || 'Liga Imperial'}</span>
            </span>
          </div>

          <div className="chest-visual-box">
            <div className="chest-glow-ring" />
            <img 
              src="/assets/hud_icons/btn_inventory.webp" 
              alt={chestName} 
              className="chest-icon-img" 
            />
          </div>

          <h3 className="chest-name-heading">{chestName}</h3>

          {/* Rewards Grid */}
          <div className="season-rewards-grid">
            <div className="season-reward-card">
              <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" className="season-reward-icon" />
              <span className="season-reward-val">+{Number(rewards?.gold || 0).toLocaleString()}</span>
              <span className="season-reward-lbl">{t('resources.gold') || 'Oro'}</span>
            </div>

            <div className="season-reward-card">
              <img src="/assets/hud_icons/icon_gem.webp" alt="Gemas" className="season-reward-icon" />
              <span className="season-reward-val">+{Number(rewards?.gems || 0).toLocaleString()}</span>
              <span className="season-reward-lbl">{t('resources.gems') || 'Gemas'}</span>
            </div>

            <div className="season-reward-card">
              <img src="/assets/hud_icons/btn_ranking.webp" alt="Honor" className="season-reward-icon" />
              <span className="season-reward-val">+{Number(rewards?.honor || 0).toLocaleString()}</span>
              <span className="season-reward-lbl">{t('arena.honorPointsLabel') || 'Honor'}</span>
            </div>
          </div>
        </div>

        {/* Trophy Soft Reset Box */}
        <div className="season-reset-box">
          <div className="season-reset-header">
            <Trophy size={14} />
            <span>{t('arena.seasonEndTrophyReset') || 'Ajuste Suave de Copas'}</span>
          </div>

          <div className="season-reset-values">
            <span className="trophies-old">{trophiesBefore}</span>
            <ArrowRight size={16} className="reset-arrow" />
            <span className="trophies-new">
              <img src="/assets/hud_icons/btn_ranking.webp" alt="Copas" style={{ width: 16, height: 16 }} />
              {trophiesAfter}
            </span>
          </div>

          <p className="season-reset-hint">
            {t('arena.seasonSoftResetNotice') || 'Reinicio suave para igualar la contienda en la nueva temporada sin penalizar a los nuevos señores.'}
          </p>
        </div>

        {/* Claim Action */}
        <button 
          className="btn-claim-season"
          onClick={handleClaim}
        >
          <Sparkles size={18} />
          <span>{t('arena.seasonEndClaimBtn') || 'Reclamar Botín & Entrar a Nueva Temporada'}</span>
        </button>
      </div>
    </div>
  )
}
