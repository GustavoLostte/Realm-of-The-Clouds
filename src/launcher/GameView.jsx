import React from 'react'
import { useChampionCreation } from './hooks/useChampionCreation'
import { ChampionBackgroundLayer } from './components/ChampionBackgroundLayer'
import { ChampionHeader } from './components/ChampionHeader'
import { ClassSelectorList } from './components/ClassSelectorList'
import { ChampionPedestalStage } from './components/ChampionPedestalStage'
import { ChampionStatsPanel } from './components/ChampionStatsPanel'
import { ChampionCreationFooter } from './components/ChampionCreationFooter'
import { soundManager } from '../utils/audio'
import './GameView.css'

/**
 * GameView — Official Realm of Kingdoms Character Creation Screen
 * Ultra-optimized, modular root view orchestrator
 */
export function GameView({ onBack, onEnterWorld, onNext, customBackground = null }) {
  const {
    classes,
    selectedClassId,
    activeClass,
    gender,
    charName,
    isNameValid,
    isSubmitting,
    handleSelectClass,
    handleSelectGender,
    handleNameChange,
    handleCreateAndEnter,
  } = useChampionCreation({ onEnterWorld })

  const handleNext = () => {
    soundManager?.playClick?.()
    const chosenName = charName.trim() || activeClass.name
    const championPayload = {
      playerId: `p_${Date.now().toString(36)}`,
      player_name: chosenName,
      classId: activeClass.id,
      className: activeClass.name,
      gender: gender.toLowerCase(),
      genderUpper: gender,
      activeClass,
      stats: activeClass.base,
    }

    // Persist immediately in localStorage so it is 100% immune to state drops
    try {
      localStorage.setItem('rok_selected_champion', JSON.stringify(championPayload))
    } catch {}

    if (onNext) {
      onNext(championPayload)
    } else {
      handleCreateAndEnter()
    }
  }

  return (
    <div
      className="char-creation-root"
      style={{
        '--active-class-color': activeClass.color,
        '--active-class-glow': activeClass.glow,
      }}
    >
      {/* 1. Pluggable Background Layer (Ready for custom visual art) */}
      <ChampionBackgroundLayer customBackground={customBackground} />

      {/* 2. Top Header Navigation */}
      <ChampionHeader onBack={onBack} />

      {/* 3. Main 3-Column Studio Grid */}
      <main className="char-layout-body">
        <ClassSelectorList
          classes={classes}
          activeClassId={selectedClassId}
          gender={gender}
          onSelectClass={handleSelectClass}
        />

        <ChampionPedestalStage
          activeClass={activeClass}
          gender={gender}
          onExploreCity={handleNext}
        />

        <ChampionStatsPanel
          activeClass={activeClass}
          gender={gender}
          onSelectGender={handleSelectGender}
        />
      </main>

      {/* 4. Bottom Action Bar */}
      <ChampionCreationFooter
        charName={charName}
        isNameValid={isNameValid}
        isSubmitting={isSubmitting}
        onNameChange={handleNameChange}
        onCreate={handleCreateAndEnter}
        onNext={handleNext}
        activeClass={activeClass}
        gender={gender}
      />
    </div>
  )
}

export default GameView
