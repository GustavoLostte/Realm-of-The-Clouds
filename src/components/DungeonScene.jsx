import React, { useState, useEffect, useRef } from 'react'
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  Navigation 
} from 'lucide-react'
import { soundManager } from '../utils/audio'
import { CAVES_DATA } from '../data/cavesData'
import { ChampionActor } from './ChampionActor'
import './DungeonScene.css'

export function DungeonScene({ 
  cave, 
  onBack, 
  onSelectCave, 
  championId = 'valiria' 
}) {
  const [soundActive, setSoundActive] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const dungeonAudioRef = useRef(null)

  // Strict audio isolation: stop all kingdom sounds on mount and resume on unmount
  useEffect(() => {
    // 1. Completely silence kingdom BGM, ambient, buildings, citizens
    soundManager.stopKingdomMusic()

    // 2. Play dedicated dungeon atmosphere audio
    try {
      const audio = new Audio('/assets/audio/battle_scene.ogg')
      audio.loop = true
      audio.volume = 0.4
      audio.play().catch(() => {})
      dungeonAudioRef.current = audio
    } catch {}

    // 3. Cleanup on leaving dungeon scene
    return () => {
      if (dungeonAudioRef.current) {
        try {
          dungeonAudioRef.current.pause()
          dungeonAudioRef.current.currentTime = 0
        } catch {}
      }
      // Resume kingdom audio when returning
      soundManager.resumeKingdomAudio()
    }
  }, [])

  // Keyboard shortcut: Escape to return to Kingdom
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        soundManager.playClick?.()
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  // Sound toggle
  const toggleSound = () => {
    soundManager.playClick?.()
    setSoundActive((prev) => {
      const next = !prev
      if (dungeonAudioRef.current) {
        dungeonAudioRef.current.muted = !next
      }
      return next
    })
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    soundManager.playClick?.()
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const currentIndex = CAVES_DATA.findIndex((c) => c.id === cave.id)
  const prevCave = currentIndex > 0 ? CAVES_DATA[currentIndex - 1] : null
  const nextCave = currentIndex < CAVES_DATA.length - 1 ? CAVES_DATA[currentIndex + 1] : null

  return (
    <div 
      className="dungeon-scene-root"
      style={{ backgroundImage: `url(${cave.bg})` }}
    >
      <div className="dungeon-scene-vignette" />

      {/* Top Bar Navigation */}
      <header className="dungeon-scene-topbar">
        <button 
          className="dungeon-back-btn" 
          onClick={() => {
            soundManager.playClick?.()
            onBack()
          }}
          title="Regresar al Reino sin costo (Esc)"
        >
          <ArrowLeft size={18} />
          <span>Volver al Reino</span>
        </button>

        <div className="dungeon-center-info">
          <div className="dungeon-title-badge">
            <Navigation size={18} color="#f6d365" />
            <span>{cave.name}</span>
            <span className="dungeon-level-badge">{cave.level}</span>
          </div>
          <div className="dungeon-subtitle-text">
            {cave.description}
          </div>
        </div>

        <div className="dungeon-top-right">
          {/* Quick Cave Switcher */}
          <select 
            className="dungeon-cave-dropdown"
            value={cave.id}
            onChange={(e) => {
              const selected = CAVES_DATA.find((c) => c.id === Number(e.target.value))
              if (selected) {
                soundManager.playClick?.()
                onSelectCave(selected)
              }
            }}
          >
            {CAVES_DATA.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>

          {/* Quick Previous / Next Buttons */}
          <button
            className="dungeon-icon-btn"
            disabled={!prevCave}
            onClick={() => {
              if (prevCave) {
                soundManager.playClick?.()
                onSelectCave(prevCave)
              }
            }}
            title="Cueva Anterior"
            style={{ opacity: prevCave ? 1 : 0.4 }}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            className="dungeon-icon-btn"
            disabled={!nextCave}
            onClick={() => {
              if (nextCave) {
                soundManager.playClick?.()
                onSelectCave(nextCave)
              }
            }}
            title="Siguiente Cueva"
            style={{ opacity: nextCave ? 1 : 0.4 }}
          >
            <ChevronRight size={18} />
          </button>

          {/* Sound Toggle */}
          <button 
            className="dungeon-icon-btn" 
            onClick={toggleSound}
            title={soundActive ? 'Silenciar audio' : 'Activar audio'}
          >
            {soundActive ? <Volume2 size={18} /> : <VolumeX size={18} color="#f87171" />}
          </button>

          {/* Fullscreen Toggle */}
          <button 
            className="dungeon-icon-btn" 
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      {/* 
        UNIVERSAL CHAMPION ACTOR:
        Automatically handles movement, jump, audio, animations, and controls!
        Zero configuration required: just assign the champion!
      */}
      <ChampionActor 
        champion={championId}
        initialX={25}
        bottomOffset={68}
        minX={7}
        maxX={93}
        enableKeyboard={true}
        showHud={true}
        showControls={false}
        showHint={false}
      />
    </div>
  )
}
