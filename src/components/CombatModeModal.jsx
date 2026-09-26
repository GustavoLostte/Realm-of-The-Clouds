import React from 'react'
import { Swords, Lock, X, Flame, Shield, Trophy, Compass, Target, Sparkles } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'
import './CombatModeModal.css'

export function CombatModeModal({
  isOpen,
  onClose,
  onOpenPvE,
  onOpenPvP,
  onOpenTraining,
  arenaTickets = 0,
  showNotification,
}) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const handlePvESelect = () => {
    soundManager?.playClick?.()
    onClose?.()
    onOpenPvE?.()
  }

  const handlePvPSelect = () => {
    soundManager?.playClick?.()
    onClose?.()
    onOpenPvP?.()
  }

  const handleTrainingSelect = () => {
    soundManager?.playClick?.()
    onClose?.()
    onOpenTraining?.()
  }

  const handleCampaignComingSoon = (e) => {
    e?.stopPropagation?.()
    soundManager?.playClick?.()
    if (showNotification) {
      showNotification(
        t('combatModal.campaignNotice') || '¡Próximamente! La Campaña Celestial estará disponible en la próxima actualización de Realm of Kingdom.',
        'info'
      )
    }
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
                {t('combatModal.subtitle') || 'Elige tu modo de enfrentamiento: ¡Duelos tácticos de campeones y Vórtice Astral!'}
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

        {/* Content Body */}
        <div className="combat-mode-body">
          {/* 1. PvE: Campaign & Dungeons */}
          <div 
            className="combat-card pve-card featured-active"
            onClick={handlePvESelect}
            role="button"
            tabIndex={0}
          >
            <div className="combat-card-badge pve">
              <Compass size={14} />
              <span>{t('combatModal.pveBadge') || 'Single Player (PvE)'}</span>
            </div>

            <div className="combat-card-visual">
              <img 
                src="/assets/hud_icons/btn_expedition.webp" 
                alt="PvE Campaign" 
                className="combat-card-icon-img" 
                draggable="false" 
              />
            </div>

            <div className="combat-card-info">
              <h3 className="combat-card-title">{t('combatModal.pveTitle') || 'Campaña y Mazmorras'}</h3>
              <p className="combat-card-desc">
                {t('combatModal.pveDesc') || 'La senda celestial de Realm of Kingdom se abrirá con nuevas mazmorras épicas, jefes supremos y reliquias arcanas.'}
              </p>

              <div className="combat-card-features">
                <span className="feature-tag"><Shield size={12} /> Árbol de Nodos</span>
                <span className="feature-tag"><Compass size={12} /> Mazmorras de Boss</span>
                <span className="feature-tag"><Trophy size={12} /> Botín de Campaña</span>
              </div>
            </div>

            <button className="combat-card-action-btn pve-btn">
              <span>{t('combatModal.pveBtn') || 'Iniciar Campaña'}</span>
            </button>
          </div>

          {/* 2. PvP: Vórtice Astral de Comandantes */}
          <div 
            className="combat-card pvp-card featured-active"
            onClick={handlePvPSelect}
            role="button"
            tabIndex={0}
          >
            <div className="combat-card-badge pvp active-badge">
              <Flame size={14} className="active-flame-icon" />
              <span>{t('combatModal.pvpBadge') || '⭐ Duelo de Comandantes (PvP Activo)'}</span>
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
              <h3 className="combat-card-title">{t('combatModal.pvpTitle') || 'Vórtice Astral de Comandantes'}</h3>
              <p className="combat-card-desc">
                {t('combatModal.pvpDesc') || 'Despliega a tu campeón en duelos tácticos por turnos contra otros comandantes celestiales para ganar Coronas y Fragmentos.'}
              </p>

              <div className="combat-card-features">
                <span className="feature-tag active-tag"><Swords size={12} /> Duelos por Turnos</span>
                <span className="feature-tag active-tag"><Trophy size={12} /> Ligas & Coronas</span>
                <span className="feature-tag active-tag"><Shield size={12} /> Fragmentos Divinos</span>
              </div>
            </div>

            <button className="combat-card-action-btn pvp-btn pulse-action">
              <span>{t('combatModal.pvpBtn') || '¡Entrar al Vórtice Astral!'}</span>
            </button>
          </div>

          {/* 3. Modo Entrenamiento: Dojo de Campeones (Valiria) */}
          <div 
            className="combat-card training-card featured-active"
            onClick={handleTrainingSelect}
            role="button"
            tabIndex={0}
          >
            <div className="combat-card-badge training active-badge">
              <Target size={14} />
              <span>{t('combatModal.trainingBadge') || '🎯 Dojo de Campeones (Práctica)'}</span>
            </div>

            <div className="combat-card-visual">
              <img 
                src="/assets/champions/valiria_avatar.webp" 
                alt="Dojo de Campeones" 
                className="combat-card-icon-img training-glow" 
                draggable="false" 
              />
            </div>

            <div className="combat-card-info">
              <h3 className="combat-card-title">{t('combatModal.trainingTitle') || 'Dojo de Campeones (Valiria)'}</h3>
              <p className="combat-card-desc">
                {t('combatModal.trainingDesc') || 'Práctica libre de combate 2D con Valiria (Ángel Valquiria). Domina desplazamientos, combos, habilidades especiales, saltos y bloqueos sin límite ni riesgo.'}
              </p>

              <div className="combat-card-features">
                <span className="feature-tag training-tag active-tag"><Swords size={12} /> Valiria • Ángel Valquiria</span>
                <span className="feature-tag training-tag active-tag"><Sparkles size={12} /> Movimientos & Combate</span>
                <span className="feature-tag training-tag active-tag"><Shield size={12} /> IA Configurable & Práctica</span>
              </div>
            </div>

            <button className="combat-card-action-btn training-btn pulse-action">
              <span>{t('combatModal.trainingBtn') || '¡Entrar al Dojo!'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



