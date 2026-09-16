import React from 'react'
import { Swords, Sparkles, X, Flame } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './CombatModeModal.css'

export function CombatModeModal({
  isOpen,
  onClose,
  onOpenPvE,
  onOpenPvP,
  arenaTickets = 0,
}) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const handleSelect = (action) => {
    soundManager?.playClick?.()
    onClose?.()
    action?.()
  }

  return (
    <div className="combat-mode-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="combat-mode-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="combat-mode-header">
          <div className="combat-mode-title-box">
            <div className="combat-header-icon-wrap">
              <Swords size={28} className="combat-header-icon" />
            </div>
            <div>
              <h2 className="combat-mode-title">{t('combatModal.title') || 'Centro de Combate'}</h2>
              <p className="combat-mode-subtitle">
                {t('combatModal.subtitle') || 'Elige tu modo de enfrentamiento por turnos con tus héroes'}
              </p>
            </div>
          </div>
          <button 
            className="combat-mode-close-btn" 
            onClick={() => {
              soundManager?.playClick?.()
              onClose?.()
            }}
            aria-label={t('common.close') || 'Cerrar'}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2 Big Mode Cards */}
        <div className="combat-mode-grid">
          {/* Card 1: Single Player (PvE) */}
          <div 
            className="combat-card pve-card"
            onClick={() => handleSelect(onOpenPvE)}
            role="button"
            tabIndex={0}
          >
            <div className="combat-card-badge pve">
              <Sparkles size={14} />
              <span>{t('combatModal.pveBadge') || 'Single Player (PvE)'}</span>
            </div>

            <div className="combat-card-visual">
              <img 
                src="/assets/hud_icons/btn_expedition.webp" 
                alt="PvE Mazmorras" 
                className="combat-card-icon-img pve-glow" 
                draggable="false" 
              />
            </div>

            <div className="combat-card-info">
              <h3 className="combat-card-title">{t('combatModal.pveTitle') || 'Campaña y Mazmorras'}</h3>
              <p className="combat-card-desc">
                {t('combatModal.pveDesc') || 'Avanza por las mazmorras celestiales enfrentando monstruos y jefes supremos por turnos.'}
              </p>

              <div className="combat-card-features">
                <span className="feature-tag">⚔️ Jefes Abisales</span>
                <span className="feature-tag">💎 Botín Épico</span>
                <span className="feature-tag">📜 Modo Historia</span>
              </div>
            </div>

            <button className="combat-card-action-btn pve-btn">
              <span>{t('combatModal.pveBtn') || 'Iniciar Mazmorra'}</span>
            </button>
          </div>

          {/* Card 2: Multiplayer (PvP) */}
          <div 
            className="combat-card pvp-card"
            onClick={() => handleSelect(onOpenPvP)}
            role="button"
            tabIndex={0}
          >
            <div className="combat-card-badge pvp">
              <Flame size={14} />
              <span>{t('combatModal.pvpBadge') || 'Multijugador (PvP)'}</span>
            </div>

            <div className="combat-card-visual">
              <img 
                src="/assets/hud_icons/btn_arena.webp" 
                alt="PvP Arena" 
                className="combat-card-icon-img pvp-glow" 
                draggable="false" 
              />
              {arenaTickets > 0 && (
                <div className="combat-ticket-badge" title={`${arenaTickets} Asaltos Disponibles`}>
                  {arenaTickets} {t('resources.tickets') || 'Entradas'}
                </div>
              )}
            </div>

            <div className="combat-card-info">
              <h3 className="combat-card-title">{t('combatModal.pvpTitle') || 'Arena de Campeones'}</h3>
              <p className="combat-card-desc">
                {t('combatModal.pvpDesc') || 'Reta a escuadrones de otros soberanos en duelos de estrategia y escala en la clasificación.'}
              </p>

              <div className="combat-card-features">
                <span className="feature-tag">🏆 Ligas & Coronas</span>
                <span className="feature-tag">🛡️ Duelos Tácticos</span>
                <span className="feature-tag">👑 Rango Global</span>
              </div>
            </div>

            <button className="combat-card-action-btn pvp-btn">
              <span>{t('combatModal.pvpBtn') || 'Desafiar en Arena'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
