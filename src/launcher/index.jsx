import React, { useState } from 'react'
import { StudioSplash } from './StudioSplash'
import { LauncherHome } from './LauncherHome'

export function LauncherApp({ onEnterWorld }) {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <div className="launcher-app-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 1. Cinematic Splash Intro with Brand Sound */}
      {showSplash && (
        <StudioSplash onComplete={() => setShowSplash(false)} />
      )}

      {/* 2. Recycled & Clean Start Page */}
      <LauncherHome onPlayGame={() => onEnterWorld?.()} />
    </div>
  )
}

export default LauncherApp
