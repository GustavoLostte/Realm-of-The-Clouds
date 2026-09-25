import React, { useState, useEffect, lazy, Suspense } from 'react'
import { StartScreen } from '../components/StartScreen'
import { StudioIntroSplash } from '../components/StudioIntroSplash'
import { CustomContextMenu } from '../components/CustomContextMenu'
import OrientationNotice from '../components/OrientationNotice'
import { DungeonDemoScene } from '../components/DungeonDemoScene'
import { gameTelemetry } from '../services/gameTelemetryService'
import '../App.css'

export function GameRoot() {
  const [showStudioSplash, setShowStudioSplash] = useState(true)
  const [currentScene, setCurrentScene] = useState('dungeon') // 'dungeon'

  // Initialize Authoritative Telemetry & Analytics
  useEffect(() => {
    gameTelemetry.init()
  }, [])

  return (
    <div className="game-container toc-game-app" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 1. Start Screen Entry (1-Click Play & Guest Auth) */}
      <StartScreen
        onEnterGame={() => {
          gameTelemetry.trackEvent('game_started_from_start_screen')
          setCurrentScene('dungeon')
        }}
      />

      {/* 2. Orientation Lock Notice for Mobile Devices */}
      <OrientationNotice />

      {/* 3. Global Custom Context Menu for WizzarDev Studios */}
      <CustomContextMenu />

      {/* 4. Cinematic Studio Splash on App Startup */}
      {showStudioSplash && (
        <StudioIntroSplash onComplete={() => setShowStudioSplash(false)} />
      )}
    </div>
  )
}

export default GameRoot
