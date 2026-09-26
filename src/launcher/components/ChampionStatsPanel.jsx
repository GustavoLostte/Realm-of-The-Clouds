import React from 'react'
import { User } from 'lucide-react'

/**
 * ChampionStatsPanel
 * Right column panel: Gender toggle, synopsis, weapon badge, and 4 stat bars
 */
export const ChampionStatsPanel = React.memo(function ChampionStatsPanel({
  activeClass,
  gender,
  onSelectGender,
}) {
  return (
    <section className="char-stats-col">
      <div className="char-info-panel">
        {/* Gender Switch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="char-section-label">
            <User size={12} />
            Género
          </span>
          <div className="char-gender-group">
            <button
              type="button"
              className={`char-gender-btn ${gender === 'MALE' ? 'is-selected' : ''}`}
              onClick={() => onSelectGender('MALE')}
            >
              <span>♂ Masculino</span>
            </button>
            <button
              type="button"
              className={`char-gender-btn ${gender === 'FEMALE' ? 'is-selected' : ''}`}
              onClick={() => onSelectGender('FEMALE')}
            >
              <span>♀ Femenino</span>
            </button>
          </div>
        </div>

        {/* Quick Class Synopsis */}
        <p className="char-synopsis">{activeClass.description}</p>

        {/* Weapon & Playstyle Badge */}
        <div className="char-weapon-tag">
          <span className="char-weapon-label">Armamento</span>
          <span className="char-weapon-name">{activeClass.weapon}</span>
        </div>

        {/* 4 Graphic Stat Bars */}
        <div className="char-stat-list">
          <span className="char-section-label">Atributos Base</span>

          <div className="char-stat-item">
            <div className="char-stat-header">
              <span>Ataque</span>
              <span className="char-stat-val">{activeClass.stats.attack}%</span>
            </div>
            <div className="char-stat-track">
              <div
                className="char-stat-fill"
                style={{ width: `${activeClass.stats.attack}%` }}
              />
            </div>
          </div>

          <div className="char-stat-item">
            <div className="char-stat-header">
              <span>Defensa</span>
              <span className="char-stat-val">{activeClass.stats.defense}%</span>
            </div>
            <div className="char-stat-track">
              <div
                className="char-stat-fill"
                style={{ width: `${activeClass.stats.defense}%` }}
              />
            </div>
          </div>

          <div className="char-stat-item">
            <div className="char-stat-header">
              <span>Velocidad</span>
              <span className="char-stat-val">{activeClass.stats.speed}%</span>
            </div>
            <div className="char-stat-track">
              <div
                className="char-stat-fill"
                style={{ width: `${activeClass.stats.speed}%` }}
              />
            </div>
          </div>

          <div className="char-stat-item">
            <div className="char-stat-header">
              <span>Magia / Maná</span>
              <span className="char-stat-val">{activeClass.stats.magic}%</span>
            </div>
            <div className="char-stat-track">
              <div
                className="char-stat-fill"
                style={{ width: `${activeClass.stats.magic}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})
