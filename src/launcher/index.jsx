import React, { useState } from 'react'
import { StudioSplash } from './StudioSplash'
import { LauncherHome } from './LauncherHome'
import { GameView } from './GameView'
import { BlankScene } from './BlankScene'

export function LauncherApp({ onEnterWorld }) {
  const [showSplash, setShowSplash] = useState(true)
  const [currentView, setCurrentView] = useState('home') // 'home' | 'create_char' | 'blank_scene'
  const [selectedChampion, setSelectedChampion] = useState(() => {
    try {
      const saved = localStorage.getItem('rok_selected_champion')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const handleNextToBlank = (championData) => {
    if (championData) {
      setSelectedChampion(championData)
      try {
        localStorage.setItem('rok_selected_champion', JSON.stringify(championData))
      } catch {}
    }
    if (typeof document !== 'undefined' && document.startViewTransition) {
      try {
        document.startViewTransition(() => {
          setCurrentView('blank_scene')
        })
      } catch {
        setCurrentView('blank_scene')
      }
    } else {
      setCurrentView('blank_scene')
    }
  }

  const handleBackToCreator = () => {
    if (typeof document !== 'undefined' && document.startViewTransition) {
      try {
        document.startViewTransition(() => {
          setCurrentView('create_char')
        })
      } catch {
        setCurrentView('create_char')
      }
    } else {
      setCurrentView('create_char')
    }
  }

  return (
    <div className="launcher-app-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 1. Cinematic Splash Intro with Brand Sound */}
      {showSplash && (
        <StudioSplash onComplete={() => setShowSplash(false)} />
      )}

      {/* 2. Seamless Flow: Launcher Home <-> Character Creation View <-> Blank Scene */}
      {currentView === 'home' && (
        <LauncherHome onPlayGame={() => setCurrentView('create_char')} />
      )}

      {currentView === 'create_char' && (
        <GameView
          onBack={() => setCurrentView('home')}
          onNext={handleNextToBlank}
          onEnterWorld={(playerData) => onEnterWorld?.(playerData)}
        />
      )}

      {currentView === 'blank_scene' && (
        <BlankScene 
          championData={selectedChampion}
          onBack={handleBackToCreator}
          onGoHome={() => setCurrentView('home')}
        />
      )}
    </div>
  )
}

export default LauncherApp

