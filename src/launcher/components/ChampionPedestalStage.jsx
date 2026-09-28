import React, { useMemo } from 'react'
import { Sparkles, Compass } from 'lucide-react'
import { getClassScale } from '../../data/classesData'

/**
 * ChampionPedestalStage
 * Center stage displaying the dynamic vocation aura, ground shadow,
 * and the 60 FPS animated champion sprite with anatomical scale calibration.
 */
export const ChampionPedestalStage = React.memo(function ChampionPedestalStage({
  activeClass,
  gender,
  onExploreCity = null,
}) {
  const currentSpritePath = `/CHAMPIONS/${activeClass.folder}_${gender}/idle.webp`
  const currentPosterPath = `/CHAMPIONS/${activeClass.folder}_${gender}/idle_poster.webp`

  const { scale, translateX, translateY } = useMemo(() => {
    const s = getClassScale(activeClass.id, 'idle', gender?.toLowerCase?.() || 'male')
    // All champions are stance-centered to X=512 and grounded to Y=574 directly in master assets
    const tx = 0
    const ty = 0

    return { scale: s, translateX: tx, translateY: ty }
  }, [activeClass.id, gender])

  return (
    <section className="char-center-stage">
      {/* Dynamic Vocation Light Aura */}
      <div className="char-pedestal-light" />

      {/* Natural Ground Contact Shadow under Champion */}
      <div className="char-contact-shadow" />

      {/* Champion Animated Character Model */}
      <div className="char-sprite-wrap">
        <img
          key={`${activeClass.id}_${gender}`}
          src={currentSpritePath}
          alt={activeClass.name}
          className="char-sprite-img"
          draggable={false}
          style={{
            transform: `translate(${translateX}%, ${translateY}%) scale(${scale})`,
            transformOrigin: 'bottom center',
            transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onError={(e) => {
            e.currentTarget.src = currentPosterPath
          }}
        />
      </div>

      {/* Quick Action Pill: Click to explore city directly */}
      <button 
        type="button" 
        className="char-pedestal-explore-pill"
        onClick={onExploreCity}
        title={`Explorar la Ciudad con ${activeClass.name}`}
      >
        <Sparkles size={14} className="pill-icon" />
        <span>Recorrer Ciudad con: <strong>{activeClass.name}</strong> ({gender === 'FEMALE' ? '♀' : '♂'})</span>
      </button>
    </section>
  )
})
