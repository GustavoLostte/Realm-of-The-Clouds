import React, { useState } from 'react'
import { 
  Compass, 
  Swords, 
  Trophy, 
  ShieldAlert, 
  Flame, 
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { useTranslation } from '../i18n'

export function ExpeditionModal({ isOpen, onClose, onLaunchExpedition, onOpenDungeonCombat, troops }) {
  const { t } = useTranslation()
  const [selectedExpedition, setSelectedExpedition] = useState(null)
  const [inBattleReport, setInBattleReport] = useState(null)

  if (!isOpen) return null

  const expeditions = [
    {
      id: 'exp-1',
      name: t('expeditions.items.exp-1.name') || 'Criptas de la Legión del Caos',
      region: t('expeditions.items.exp-1.region') || 'Frontera Occidental',
      difficulty: t('expeditions.difficulties.easy') || 'Fácil',
      difficultyClass: 'easy',
      difficultyStars: 1,
      recommendedTroops: 3,
      duration: t('expeditions.items.exp-1.duration') || '3 Salas',
      rewards: { gold: 1200, wood: 720, stone: 520, gems: 36 },
      description: t('expeditions.items.exp-1.description') || 'Avanza por 3 salas subterráneas derrotando goblins, orcos y al Caudillo del Caos.',
      enemySquad: t('expeditions.items.exp-1.enemySquad') || 'Goblin -> Orco Berserker -> Caudillo Vorgath [BOSS]',
      victoryChance: '98%',
    },
    {
      id: 'exp-2',
      name: t('expeditions.items.exp-2.name') || 'Ruinas del Santuario Ancestral',
      region: t('expeditions.items.exp-2.region') || 'Tierras Altas Místicas',
      difficulty: t('expeditions.difficulties.medium') || 'Media',
      difficultyClass: 'medium',
      difficultyStars: 2,
      recommendedTroops: 6,
      duration: t('expeditions.items.exp-2.duration') || '3 Salas',
      rewards: { gold: 1600, wood: 950, stone: 800, gems: 50 },
      description: t('expeditions.items.exp-2.description') || 'Antiguas estatuas vivientes despiertan para proteger un templo en ruinas.',
      enemySquad: t('expeditions.items.exp-2.enemySquad') || '6 Guardianes Pétreos Arcanos',
      victoryChance: '85%',
    },
    {
      id: 'exp-3',
      name: t('expeditions.items.exp-3.name') || 'Fortaleza del Volcán de Obsidiana',
      region: t('expeditions.items.exp-3.region') || 'Garganta de Fuego',
      difficulty: t('expeditions.difficulties.hard') || 'Difícil',
      difficultyClass: 'hard',
      difficultyStars: 3,
      recommendedTroops: 10,
      duration: t('expeditions.items.exp-3.duration') || '4 Salas',
      rewards: { gold: 2400, wood: 1200, stone: 1100, gems: 80 },
      description: t('expeditions.items.exp-3.description') || 'Bastión fortificado de la Legión del Caos que acecha la meseta flotante.',
      enemySquad: t('expeditions.items.exp-3.enemySquad') || '12 Guerreros Demoníacos de Élite',
      victoryChance: '70%',
    },
    {
      id: 'exp-4',
      name: t('expeditions.items.exp-4.name') || 'Nido del Dragón de Jade (Jefe de Élite)',
      region: t('expeditions.items.exp-4.region') || 'Cúspide de las Tormentas',
      difficulty: t('expeditions.difficulties.boss') || 'Élite',
      difficultyClass: 'boss',
      difficultyStars: 5,
      recommendedTroops: 14,
      duration: t('expeditions.items.exp-4.duration') || '5 Salas',
      rewards: { gold: 4500, gems: 150 },
      description: t('expeditions.items.exp-4.description') || 'Antigua criatura legendaria de los cielos que custodia la Reliquia del Caos.',
      enemySquad: t('expeditions.items.exp-4.enemySquad') || 'Gran Dragón de Jade Ancestral [BOSS]',
      victoryChance: '55%',
    },
  ]

  const totalTroops = 
    (troops.infantry || 0) + 
    (troops.archers || 0) + 
    (troops.mages || 0) + 
    (troops.commander || 0)

  const handleLaunch = (exp) => {
    soundManager.playBuild()
    if (onOpenDungeonCombat) {
      onClose()
      onOpenDungeonCombat(exp)
    } else {
      setInBattleReport(exp)
    }
  }

  const handleClaimVictory = () => {
    soundManager.playCollect()
    if (inBattleReport) {
      onLaunchExpedition(inBattleReport)
    }
    setInBattleReport(null)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="game-modal expedition-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with candy compass and close icon */}
        <div className="modal-header candy-header">
          <div className="modal-title-wrap">
            <img 
              src="/assets/hud_icons/btn_expedition.webp" 
              alt={t('expeditions.modalTitle') || 'Expedición'} 
              className="modal-candy-header-icon" 
              draggable="false" 
            />
            <div>
              <h3>{t('expeditions.modalTitle') || 'Expediciones & Mazmorras de Campaña'}</h3>
              <p className="modal-subtitle">{t('expeditions.modalSubtitle') || 'Envía tus regimientos más allá de la meseta flotante a reclamar botines'}</p>
            </div>
          </div>
          <button 
            className="modal-close-candy-btn" 
            onClick={() => { soundManager.playClick(); onClose() }}
            aria-label={t('common.close') || 'Cerrar'}
          >
            <img src="/assets/hud_icons/btn_close.webp" alt="Cerrar" draggable="false" />
          </button>
        </div>

        {/* Garrison Status Strip */}
        <div className="expedition-garrison-strip">
          <div className="garrison-troops-info">
            <ShieldAlert size={18} className="text-amber-400" />
            <span>{t('expeditions.forcesReady') || 'Fuerzas listas para combate:'} <strong>{totalTroops} {t('expeditions.soldiers') || 'soldados'}</strong></span>
          </div>

          <div className="garrison-combat-readiness">
            <span className="readiness-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              {totalTroops >= 8 ? (
                <>
                  <img src="/assets/hud_icons/btn_army.webp" alt="Óptima" className="mini-res-icon" />
                  <span>{t('expeditions.readinessOptimal') || 'Preparación Óptima'}</span>
                </>
              ) : totalTroops >= 3 ? (
                <>
                  <img src="/assets/hud_icons/icon_shield.webp" alt="Básicas" className="mini-res-icon" />
                  <span>{t('expeditions.readinessBasic') || 'Fuerzas Básicas'}</span>
                </>
              ) : (
                <>
                  <img src="/assets/hud_icons/icon_warning.webp" alt="Escasa" className="mini-res-icon" />
                  <span>{t('expeditions.readinessLow') || 'Guarnición Escasa'}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Mazmorras del Caos Hero Action Banner */}
        <div 
          style={{
            margin: '0.75rem 1.25rem 0',
            background: 'linear-gradient(90deg, rgba(180, 83, 9, 0.45) 0%, rgba(217, 119, 6, 0.2) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.55)',
            borderRadius: '14px',
            padding: '0.85rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img 
              src="/assets/hud_icons/btn_army.webp" 
              alt="Combate" 
              style={{ width: '38px', height: '38px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.8))' }} 
              draggable="false" 
            />
            <div>
              <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1rem' }}>
                {t('expeditions.heroBannerTitle') || '¡Mazmorras del Caos: Duelo de Golpe Crítico!'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                {t('expeditions.heroBannerDesc') || 'Combate sala por sala con el medidor de timing y vence al Caudillo del Caos.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick()
              onClose()
              if (onOpenDungeonCombat) onOpenDungeonCombat()
            }}
            style={{
              cursor: 'pointer',
              border: 'none',
              background: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.88rem',
              padding: '0.65rem 1.3rem',
              borderRadius: '9px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <img src="/assets/hud_icons/btn_expedition.webp" alt="Mazmorra" className="mini-res-icon" />
              <span>{t('expeditions.heroBannerBtn') || '¡Entrar a la Mazmorra!'}</span>
            </span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-scroll-content">
          {inBattleReport ? (
            /* Battle Report Screen */
            <div className="battle-victory-screen">
              <div className="victory-crown-box">
                <Trophy size={48} className="text-amber-400" />
              </div>
              <h3 className="victory-title">{t('expeditions.victoryTitle') || '¡Victoria Gloriosa!'}</h3>
              <p className="victory-subtitle">
                {t('expeditions.victorySubtitle', { name: inBattleReport.name }) || `Tus tropas han asegurado la región: ${inBattleReport.name}`}
              </p>

              <div className="victory-spoils-card">
                <h5 className="spoils-title">{t('expeditions.spoilsTitle') || 'Tesoros y Botín Rescatado:'}</h5>
                <div className="spoils-pills-row">
                  {inBattleReport.rewards.gold && (
                    <div className="candy-reward-pill gold">
                      <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" className="reward-icon-tiny" />
                      <span>+{inBattleReport.rewards.gold} {t('resources.gold') || 'Oro'}</span>
                    </div>
                  )}
                  {inBattleReport.rewards.wood && (
                    <div className="candy-reward-pill wood">
                      <img src="/assets/hud_icons/icon_wood.webp" alt="Madera" className="reward-icon-tiny" />
                      <span>+{inBattleReport.rewards.wood} {t('resources.wood') || 'Madera'}</span>
                    </div>
                  )}
                  {inBattleReport.rewards.stone && (
                    <div className="candy-reward-pill stone">
                      <img src="/assets/hud_icons/icon_stone.webp" alt="Piedra" className="reward-icon-tiny" />
                      <span>+{inBattleReport.rewards.stone} {t('resources.stone') || 'Piedra'}</span>
                    </div>
                  )}
                  {inBattleReport.rewards.gems && (
                    <div className="candy-reward-pill gems">
                      <img src="/assets/hud_icons/icon_gem.webp" alt="Cristales" className="reward-icon-tiny" />
                      <span>+{inBattleReport.rewards.gems} {t('resources.gems') || 'Cristales'}</span>
                    </div>
                  )}
                </div>
              </div>

              <button className="btn-claim-spoils-candy" onClick={handleClaimVictory}>
                <Sparkles size={18} /> {t('expeditions.claimSpoilsBtn') || 'Reclamar Botín y Regresar al Trono'}
              </button>
            </div>
          ) : (
            /* Expeditions List */
            <div className="expeditions-candy-list">
              {expeditions.map((exp) => {
                const hasEnoughTroops = totalTroops >= exp.recommendedTroops

                return (
                  <div key={exp.id} className={`expedition-candy-card ${exp.difficultyClass}`}>
                    <div className="exp-tier-badge-col">
                      <span className={`exp-diff-badge ${exp.difficultyClass}`}>
                        {exp.difficulty}
                      </span>
                      <span className="exp-region-name">{exp.region}</span>
                    </div>

                    <div className="exp-candy-info-col">
                      <div className="exp-title-row">
                        <h4>{exp.name}</h4>
                      </div>
                      <p className="exp-desc-text">{exp.description}</p>

                      <div className="exp-intel-row">
                        <span className="intel-item">
                          <Swords size={12} /> {t('expeditions.suggestedTroops', { count: exp.recommendedTroops }) || `Sugerido: ${exp.recommendedTroops} tropas`}
                        </span>
                        <span className="intel-item">
                          <Flame size={12} /> {t('expeditions.enemyLabel') || 'Enemigo:'} {exp.enemySquad}
                        </span>
                        <span className="intel-item text-emerald-400">
                          {t('expeditions.winChanceLabel') || 'Probabilidad:'} {hasEnoughTroops ? exp.victoryChance : (t('expeditions.highRisk') || 'Riesgo Alto (<30%)')}
                        </span>
                      </div>

                      {/* Loot Preview */}
                      <div className="exp-loot-preview-row">
                        <span className="loot-label">{t('expeditions.lootLabel') || 'Botín:'}</span>
                        {exp.rewards.gold && (
                          <div className="candy-reward-pill gold">
                            <img src="/assets/hud_icons/icon_gold.webp" alt="Oro" className="reward-icon-tiny" />
                            <span>+{exp.rewards.gold}</span>
                          </div>
                        )}
                        {exp.rewards.wood && (
                          <div className="candy-reward-pill wood">
                            <img src="/assets/hud_icons/icon_wood.webp" alt="Madera" className="reward-icon-tiny" />
                            <span>+{exp.rewards.wood}</span>
                          </div>
                        )}
                        {exp.rewards.stone && (
                          <div className="candy-reward-pill stone">
                            <img src="/assets/hud_icons/icon_stone.webp" alt="Piedra" className="reward-icon-tiny" />
                            <span>+{exp.rewards.stone}</span>
                          </div>
                        )}
                        {exp.rewards.gems && (
                          <div className="candy-reward-pill gems">
                            <img src="/assets/hud_icons/icon_gem.webp" alt="Cristales" className="reward-icon-tiny" />
                            <span>+{exp.rewards.gems}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="exp-candy-action-col">
                      <button 
                        className={`btn-dispatch-candy ${hasEnoughTroops ? 'primary' : 'disabled'}`}
                        disabled={!hasEnoughTroops}
                        onClick={() => handleLaunch(exp)}
                        title={hasEnoughTroops ? (t('expeditions.dispatchTooltip') || 'Despachar batallón a la batalla') : (t('expeditions.dispatchDisabledTooltip') || 'Se requieren más soldados')}
                      >
                        <Compass size={16} />
                        <span>{t('expeditions.dispatchBtn') || 'Despachar'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
