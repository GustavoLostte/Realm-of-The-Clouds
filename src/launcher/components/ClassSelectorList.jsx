import React from 'react'
import { Swords } from 'lucide-react'

/**
 * ClassSelectorList
 * Left column class selection cards
 */
export const ClassSelectorList = React.memo(function ClassSelectorList({
  classes,
  activeClassId,
  gender,
  onSelectClass,
}) {
  return (
    <section className="char-classes-col">
      <span className="char-section-label">
        <Swords size={12} />
        Selecciona tu Vocación
      </span>

      {classes.map((c) => {
        const isActive = c.id === activeClassId
        const cardAvatar = `/CHAMPIONS/${c.folder}_${gender}/avatar.webp`

        return (
          <button
            key={c.id}
            type="button"
            className={`char-class-card ${isActive ? 'is-active' : ''}`}
            onClick={() => onSelectClass(c.id)}
          >
            <div className="char-class-card-avatar">
              <img
                src={cardAvatar}
                alt={c.name}
                className="char-class-avatar-img"
                draggable={false}
                onError={(e) => {
                  e.currentTarget.src = `/champions/${c.folder}_${gender}/avatar.webp`
                }}
              />
            </div>

            <div className="char-class-info">
              <span className="char-class-name">{c.name}</span>
              <span className="char-class-role">{c.role}</span>
            </div>

            <div className="char-class-indicator" />
          </button>
        )
      })}
    </section>
  )
})
