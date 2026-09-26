import React from 'react'
import { CloudCityScene } from '../components/CloudCityScene'

/**
 * BlankScene is now the Official Hub City Scene (Reino de las Nubes)
 * Triggered seamlessly after character creation when the player clicks "Siguiente".
 */
export function BlankScene({ championData, onBack, onGoHome }) {
  const resolvedChampion = championData || (() => {
    try {
      const saved = localStorage.getItem('rok_selected_champion')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })()

  // Key guarantees clean instantiation with the exact selected champion and gender
  const championKey = `${resolvedChampion?.classId || 'knight'}_${resolvedChampion?.gender || 'male'}_${resolvedChampion?.player_name || 'hero'}`

  return (
    <CloudCityScene 
      key={championKey}
      championData={resolvedChampion}
      onBack={onBack}
      onGoHome={onGoHome}
    />
  )
}

export default BlankScene
