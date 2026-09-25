import React, { useState } from 'react'
import './App.css'
import { StartScreen } from './components/StartScreen'
import { StudioIntroSplash } from './components/StudioIntroSplash'
import { CustomContextMenu } from './components/CustomContextMenu'

export default function AppTeaser() {
  const [showStudioSplash, setShowStudioSplash] = useState(true)

  const handleEnterGame = () => {
    console.log('[AppTeaser] Player passed startup gate')
  }

  return (
    <div className="game-container teaser-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <StartScreen onEnterGame={handleEnterGame} />
      <CustomContextMenu />
      {showStudioSplash && (
        <StudioIntroSplash onComplete={() => setShowStudioSplash(false)} />
      )}
    </div>
  )
}
