import { useState, useEffect, useMemo, useCallback } from 'react'
import { CLASSES_DATA, DEFAULT_CLASS } from '../data/championClassesData'
import { soundManager } from '../../utils/audio'

/**
 * Custom hook to encapsulate all logic and state for Character Creation
 */
export function useChampionCreation({ onEnterWorld } = {}) {
  const [selectedClassId, setSelectedClassId] = useState('knight')
  const [gender, setGender] = useState('MALE') // 'MALE' | 'FEMALE'
  const [charName, setCharName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeClass = useMemo(() => {
    return CLASSES_DATA.find((c) => c.id === selectedClassId) || DEFAULT_CLASS
  }, [selectedClassId])

  // Preload all 8 idle animations & avatars on mount for 0ms lag-free switching
  useEffect(() => {
    CLASSES_DATA.forEach((c) => {
      ;['MALE', 'FEMALE'].forEach((g) => {
        const img = new Image()
        img.src = `/CHAMPIONS/${c.folder}_${g}/idle.webp`
        const av = new Image()
        av.src = `/CHAMPIONS/${c.folder}_${g}/avatar.webp`
        const poster = new Image()
        poster.src = `/CHAMPIONS/${c.folder}_${g}/idle_poster.webp`
      })
    })
  }, [])

  const handleSelectClass = useCallback((id) => {
    setSelectedClassId(id)
    soundManager?.playClick?.()
  }, [])

  const handleSelectGender = useCallback((g) => {
    setGender(g)
    soundManager?.playClick?.()
  }, [])

  const handleNameChange = useCallback((e) => {
    setCharName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
  }, [])

  const isNameValid = charName.trim().length >= 3 && charName.trim().length <= 16

  const handleCreateAndEnter = useCallback(async () => {
    if (!isNameValid || isSubmitting) return

    setIsSubmitting(true)
    soundManager?.playClick?.()

    const payload = {
      playerId: `p_${Date.now().toString(36)}`,
      player_name: charName.trim(),
      classId: activeClass.id,
      gender: gender.toLowerCase(),
      level: 1,
      exp: 0,
      stats: activeClass.base,
    }

    try {
      // Connect / Sync with local authoritative server
      await fetch('http://127.0.0.1:3001/api/player/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    } catch {}

    // Store in localStorage for instant offline access
    try {
      localStorage.setItem('rok_active_player', JSON.stringify(payload))
    } catch {}

    // Launch player directly into the game world
    if (onEnterWorld) {
      onEnterWorld(payload)
    } else {
      setIsSubmitting(false)
    }
  }, [isNameValid, isSubmitting, charName, activeClass, gender, onEnterWorld])

  return {
    classes: CLASSES_DATA,
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
  }
}
