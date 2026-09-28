import React, { useState, useEffect } from 'react'
import { LauncherApp } from '../launcher/index'
import { DungeonDemoScene } from '../components/DungeonDemoScene'
import { CustomContextMenu } from '../components/CustomContextMenu'
import { gameTelemetry } from '../services/gameTelemetryService'
import '../App.css'

export function GameRoot() {
  const [currentScene, setCurrentScene] = useState('launcher') // 'launcher' | 'world'
  const [activePlayer, setActivePlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('rok_active_player')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Initialize Authoritative Telemetry & Analytics
  useEffect(() => {
    gameTelemetry.init()
  }, [])

  return (
    <div className="game-container toc-game-app" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 1. Official Realm of Kingdoms MMORPG Launcher */}
      {currentScene === 'launcher' ? (
        <LauncherApp 
          onEnterWorld={(playerData) => {
            if (playerData) setActivePlayer(playerData)
            gameTelemetry.trackEvent('game_started_from_launcher', { classId: playerData?.classId })
            setCurrentScene('world')
          }} 
        />
      ) : (
        /* 2. MMORPG Game World & Combat */
        <DungeonDemoScene 
          initialPlayer={activePlayer}
          onBack={() => setCurrentScene('launcher')} 
        />
      )}

      {/* 4. Global Custom Context Menu */}
      <CustomContextMenu />
    </div>
  )
}

export default GameRoot
