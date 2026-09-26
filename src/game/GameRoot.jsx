import React, { useState, useEffect } from 'react'
import { LauncherApp } from '../launcher/index'
import { DungeonDemoScene } from '../components/DungeonDemoScene'
import { CustomContextMenu } from '../components/CustomContextMenu'
import OrientationNotice from '../components/OrientationNotice'
import { gameTelemetry } from '../services/gameTelemetryService'
import '../App.css'

export function GameRoot() {
  const [currentScene, setCurrentScene] = useState('launcher') // 'launcher' | 'world'

  // Initialize Authoritative Telemetry & Analytics
  useEffect(() => {
    gameTelemetry.init()
  }, [])

  return (
    <div className="game-container toc-game-app" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 1. Official Realm of Kingdoms MMORPG Launcher */}
      {currentScene === 'launcher' ? (
        <LauncherApp 
          onEnterWorld={() => {
            gameTelemetry.trackEvent('game_started_from_launcher')
            setCurrentScene('world')
          }} 
        />
      ) : (
        /* 2. MMORPG Game World & Combat */
        <DungeonDemoScene 
          onBack={() => setCurrentScene('launcher')} 
        />
      )}

      {/* 3. Orientation Lock Notice for Mobile Devices */}
      <OrientationNotice />

      {/* 4. Global Custom Context Menu */}
      <CustomContextMenu />
    </div>
  )
}

export default GameRoot
