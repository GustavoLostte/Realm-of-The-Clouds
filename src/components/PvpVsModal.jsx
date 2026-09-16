import React from 'react'
import './PvpVsModal.css'
import { Swords, Trophy, Shield, Flame, X, Percent, Award, ArrowRight, Sparkles } from 'lucide-react'
import { soundManager } from '../utils/audio'
import { getLeagueForTrophies } from '../data/arenaData'

export function PvpVsModal({
  isOpen,
  onClose,
  onFight,
  playerStats = {},
  rival = null,
}) {
  if (!isOpen || !rival) return null

  const pName = playerStats.name || 'Lord King'
  const pAvatar = playerStats.avatar || '/assets/avatars/avatar_king.webp'
  const pLevel = playerStats.level || 1
  const pTrophies = playerStats.trophies ?? 250
  const pWins = playerStats.wins ?? 14
  const pLosses = playerStats.losses ?? 4
  const pTotal = pWins + pLosses
  const pWinRate = pTotal > 0 ? Math.round((pWins / pTotal) * 100) : 100
  const pLeague = getLeagueForTrophies(pTrophies)
  const pPower = Math.round(520 + pLevel * 95 + (playerStats.troopsTotal || 8) * 35)

  // Rival stats
  const rName = rival.name || 'Soberano Rival'
  const rAvatar = rival.avatar || '/assets/avatars/avatar_valkyrie.webp'
  const rLevel = rival.level || 2
  const rTrophies = rival.trophies ?? 280
  const rLeague = rival.league || getLeagueForTrophies(rTrophies)
  const rPower = rival.defense?.damagePerHit ? Math.round(rival.defense.damagePerHit * 22 + rival.defense.hp * 1.5) : (rival.power || 480)
  const winTrophies = rival.rewards?.trophies || 28
  const lossTrophies = rival.rewards?.lossTrophies || 12
  const winGold = rival.rewards?.gold || 450

  const handleFightClick = () => {
    soundManager?.playButtonClick?.()
    soundManager?.playSwordSwing?.()
    onFight?.(rival)
  }

  const handleCancelClick = () => {
    soundManager?.playClick?.()
    onClose?.()
  }

  return (
    <div className="pvp-vs-modal-backdrop" onClick={handleCancelClick}>
      <div className="pvp-vs-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Glowing atmospheric flare */}
        <div className="pvp-vs-flare" />

        {/* Modal Top Header */}
        <div className="pvp-vs-header">
          <div className="pvp-vs-header-badge">
            <Swords size={16} className="pvp-vs-badge-icon" />
            <span>ENFRENTAMIENTO DE SALA</span>
          </div>
          <button 
            className="pvp-vs-close-btn" 
            onClick={handleCancelClick}
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* Versus Arena Dual Board */}
        <div className="pvp-vs-board">
          {/* LEFT: PLAYER STATS */}
          <div className="pvp-vs-fighter pvp-vs-player">
            <div className="pvp-fighter-side-tag">TÚ (DESAFIANTE)</div>
            
            <div className="pvp-fighter-avatar-wrap">
              <img src={pAvatar} alt={pName} className="pvp-fighter-avatar" />
              <div className="pvp-fighter-level-pill">NV.{pLevel}</div>
            </div>

            <h3 className="pvp-fighter-name">{pName}</h3>
            <div className="pvp-fighter-league">
              <img src={pLeague.icon} alt={pLeague.name} className="pvp-league-mini-icon" />
              <span>{pLeague.name}</span>
            </div>

            <div className="pvp-vs-stat-grid">
              <div className="pvp-vs-stat-box">
                <span className="stat-label">PODER</span>
                <span className="stat-val stat-power">{pPower}</span>
              </div>
              <div className="pvp-vs-stat-box">
                <span className="stat-label">TROFEOS</span>
                <span className="stat-val stat-trophies">{pTrophies} 🏆</span>
              </div>
              <div className="pvp-vs-stat-box">
                <span className="stat-label">VICTORIAS</span>
                <span className="stat-val stat-wins">{pWins}V - {pLosses}D</span>
              </div>
              <div className="pvp-vs-stat-box">
                <span className="stat-label">WINRATE</span>
                <span className="stat-val stat-rate">{pWinRate}%</span>
              </div>
            </div>
          </div>

          {/* CENTER: VS EMBLEM & REWARDS */}
          <div className="pvp-vs-center-col">
            <div className="pvp-vs-insignia">
              <span className="pvp-vs-v">V</span>
              <span className="pvp-vs-s">S</span>
              <div className="pvp-vs-bolt" />
            </div>

            <div className="pvp-vs-bounty-card">
              <div className="pvp-bounty-title">
                <Sparkles size={13} className="bounty-star" />
                <span>BOTÍN EN JUEGO</span>
              </div>
              <div className="pvp-bounty-row victory-row">
                <span className="bounty-lbl">Si Vences:</span>
                <span className="bounty-val positive">+{winTrophies} 🏆  +{winGold} 💰</span>
              </div>
              <div className="pvp-bounty-row defeat-row">
                <span className="bounty-lbl">Si Caes:</span>
                <span className="bounty-val negative">-{lossTrophies} 🏆</span>
              </div>
            </div>
          </div>

          {/* RIGHT: RIVAL STATS */}
          <div className="pvp-vs-fighter pvp-vs-rival">
            <div className="pvp-fighter-side-tag rival-tag">RIVAL DEFENSOR</div>
            
            <div className="pvp-fighter-avatar-wrap rival-avatar-wrap">
              <img src={rAvatar} alt={rName} className="pvp-fighter-avatar" />
              <div className="pvp-fighter-level-pill rival-pill">NV.{rLevel}</div>
            </div>

            <h3 className="pvp-fighter-name rival-name">{rName}</h3>
            <div className="pvp-fighter-league">
              <img src={rLeague.icon} alt={rLeague.name} className="pvp-league-mini-icon" />
              <span>{rLeague.name}</span>
            </div>

            <div className="pvp-vs-stat-grid">
              <div className="pvp-vs-stat-box">
                <span className="stat-label">DEFENSA</span>
                <span className="stat-val stat-rival-power">{rPower}</span>
              </div>
              <div className="pvp-vs-stat-box">
                <span className="stat-label">TROFEOS</span>
                <span className="stat-val stat-trophies">{rTrophies} 🏆</span>
              </div>
              <div className="pvp-vs-stat-box">
                <span className="stat-label">SALUD BASE</span>
                <span className="stat-val">{rival.defense?.hp || 280} HP</span>
              </div>
              <div className="pvp-vs-stat-box">
                <span className="stat-label">DIFICULTAD</span>
                <span className="stat-val stat-diff">{rival.difficulty?.label || 'Normal'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="pvp-vs-actions">
          <button 
            type="button" 
            className="pvp-vs-btn-cancel" 
            onClick={handleCancelClick}
          >
            Elegir Otra Sala
          </button>
          <button 
            type="button" 
            className="pvp-vs-btn-fight" 
            onClick={handleFightClick}
          >
            <Swords size={20} className="fight-icon-swords" />
            <span className="fight-btn-txt">¡PELEAR!</span>
            <ArrowRight size={18} className="fight-icon-arrow" />
          </button>
        </div>
      </div>
    </div>
  )
}
