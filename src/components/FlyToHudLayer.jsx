import React from 'react'

const RES_ICONS = {
  gold: '/assets/hud_icons/icon_gold.webp',
  wood: '/assets/hud_icons/icon_wood.webp',
  stone: '/assets/hud_icons/icon_stone.webp',
  food: '/assets/hud_icons/icon_food.webp',
  gems: '/assets/hud_icons/icon_gem.webp',
}

export function FlyToHudLayer({ particles, onParticleComplete }) {
  if (!particles || particles.length === 0) return null

  return (
    <div className="fly-to-hud-container" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`flying-hud-particle res-${p.type}`}
          style={{
            '--start-x': `${p.startX}px`,
            '--start-y': `${p.startY}px`,
            '--mid-x': `${p.midX}px`,
            '--mid-y': `${p.midY}px`,
            '--end-x': `${p.endX}px`,
            '--end-y': `${p.endY}px`,
            animationDelay: `${p.delay}ms`,
          }}
          onAnimationEnd={() => onParticleComplete?.(p)}
        >
          <img 
            src={RES_ICONS[p.type] || RES_ICONS.gold} 
            alt={p.type} 
            className="flying-hud-particle-img"
            draggable="false"
          />
        </div>
      ))}
    </div>
  )
}
