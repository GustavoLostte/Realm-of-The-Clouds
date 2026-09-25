import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  Shield, 
  Swords, 
  Sparkles, 
  Crown, 
  Dices, 
  Trash2, 
  Plus, 
  Check, 
  Globe, 
  ChevronLeft, 
  ChevronRight,
  User,
  Scale
} from 'lucide-react'
import { useTranslation } from '../i18n/index.jsx'
import { soundManager } from '../utils/audio'
import { generateRandomNobleName } from '../utils/nobleNameGenerator'
import { ChampionsScaleWorkbenchModal } from './ChampionsScaleWorkbenchModal'
import { getSavedClassScales, getClassScale } from '../data/classesData'
import './ChampionSelectScreen.css'

// 4 Official Classes with Knight first by default, each with Male & Female idle animations
const HERO_CLASSES = [
  {
    id: 'knight',
    alias: 'Knight',
    nameKey: 'championSelect.classKnight',
    fallbackName: 'Knight',
    roleKey: 'championSelect.classKnightRole',
    fallbackRole: 'Tanque de Vanguardia',
    descKey: 'championSelect.classKnightDesc',
    fallbackDesc: 'Guerrero pesado impenetrable. Domina la armadura de placas, los escudos sagrados y el combate en primera línea para absorber el mayor daño enemigo.',
    passiveKey: 'championSelect.classKnightPassive',
    fallbackPassive: 'Muro Inquebrantable (+25% Absorción de Daño Físico)',
    icon: Shield,
    color: '#38bdf8',
    stats: { attack: 88, defense: 98, speed: 82, magic: 50 },
    genders: {
      male: {
        id: 'knight_male',
        name: 'Knight',
        gender: 'male',
        genderLabelKey: 'championSelect.genderMale',
        fallbackGenderLabel: 'Hombre',
        avatar: '/CHAMPIONS/KINA_MALE/avatar.webp',
        idleAnim: '/CHAMPIONS/KINA_MALE/idle.webp',
        poster: '/CHAMPIONS/KINA_MALE/idle_poster.webp',
        quote: '¡Mi escudo defenderá el reino hasta el último aliento!',
      },
      female: {
        id: 'knight_female',
        name: 'Knight',
        gender: 'female',
        genderLabelKey: 'championSelect.genderFemale',
        fallbackGenderLabel: 'Mujer',
        avatar: '/CHAMPIONS/KINA_FEMALE/avatar.webp',
        idleAnim: '/CHAMPIONS/KINA_FEMALE/idle.webp',
        poster: '/CHAMPIONS/KINA_FEMALE/idle_poster.webp',
        quote: '¡La fortaleza celestial no cederá ante nadie!',
      },
    },
  },
  {
    id: 'paladin',
    alias: 'Paladin',
    nameKey: 'championSelect.classPaladin',
    fallbackName: 'Paladin',
    roleKey: 'championSelect.classPaladinRole',
    fallbackRole: 'Tirador a Distancia',
    descKey: 'championSelect.classPaladinDesc',
    fallbackDesc: 'Tirador consagrado de precisión milimétrica. Emplea el arco y flechas imbuidas en luz sagrada a gran distancia.',
    passiveKey: 'championSelect.classPaladinPassive',
    fallbackPassive: 'Lluvia Sagrada (+20% Daño Crítico y Rango)',
    icon: Swords,
    color: '#f59e0b',
    stats: { attack: 96, defense: 80, speed: 98, magic: 65 },
    genders: {
      male: {
        id: 'paladin_male',
        name: 'Paladin',
        gender: 'male',
        genderLabelKey: 'championSelect.genderMale',
        fallbackGenderLabel: 'Hombre',
        avatar: '/CHAMPIONS/PALADIN_MALE/avatar.webp',
        idleAnim: '/CHAMPIONS/PALADIN_MALE/idle.webp',
        poster: '/CHAMPIONS/PALADIN_MALE/idle_poster.webp',
        quote: '¡Ningún objetivo escapa a la flecha bendecida!',
      },
      female: {
        id: 'paladin_female',
        name: 'Paladin',
        gender: 'female',
        genderLabelKey: 'championSelect.genderFemale',
        fallbackGenderLabel: 'Mujer',
        avatar: '/CHAMPIONS/PALADIN_FEMALE/avatar.webp',
        idleAnim: '/CHAMPIONS/PALADIN_FEMALE/idle.webp',
        poster: '/CHAMPIONS/PALADIN_FEMALE/idle_poster.webp',
        quote: '¡Rápida como el viento y certera como la luz!',
      },
    },
  },
  {
    id: 'mage',
    alias: 'Mage',
    nameKey: 'championSelect.classMage',
    fallbackName: 'Mage',
    roleKey: 'championSelect.classMageRole',
    fallbackRole: 'Hechicero Ofensivo',
    descKey: 'championSelect.classMageDesc',
    fallbackDesc: 'Canalizador supremo de la energía arcana y elemental con hechizos destructivos de maná.',
    passiveKey: 'championSelect.classMagePassive',
    fallbackPassive: 'Tormenta Arcana (+20% Daño Mágico Explosivo)',
    icon: Sparkles,
    color: '#a855f7',
    stats: { attack: 100, defense: 72, speed: 88, magic: 100 },
    genders: {
      male: {
        id: 'mage_male',
        name: 'Mage',
        gender: 'male',
        genderLabelKey: 'championSelect.genderMale',
        fallbackGenderLabel: 'Hombre',
        avatar: '/CHAMPIONS/MAGE_MALE/avatar.webp',
        idleAnim: '/CHAMPIONS/MAGE_MALE/idle.webp',
        poster: '/CHAMPIONS/MAGE_MALE/idle_poster.webp',
        quote: '¡El poder de los cosmos arde bajo mi llamado!',
      },
      female: {
        id: 'mage_female',
        name: 'Mage',
        gender: 'female',
        genderLabelKey: 'championSelect.genderFemale',
        fallbackGenderLabel: 'Mujer',
        avatar: '/CHAMPIONS/MAGE_FEMALE/avatar.webp',
        idleAnim: '/CHAMPIONS/MAGE_FEMALE/idle.webp',
        poster: '/CHAMPIONS/MAGE_FEMALE/idle_poster.webp',
        quote: '¡Que los astros sellen tu destino en la batalla!',
      },
    },
  },
  {
    id: 'healer',
    alias: 'Healer',
    nameKey: 'championSelect.classHealer',
    fallbackName: 'Healer',
    roleKey: 'championSelect.classHealerRole',
    fallbackRole: 'Soporte y Sanación',
    descKey: 'championSelect.classHealerDesc',
    fallbackDesc: 'Canalizador benévolo de la vida divina, consagrado a la regeneración vital y protección de tropas.',
    passiveKey: 'championSelect.classHealerPassive',
    fallbackPassive: 'Gracia Restauradora (+25% Curación de Tropas)',
    icon: Crown,
    color: '#10b981',
    stats: { attack: 84, defense: 86, speed: 88, magic: 94 },
    genders: {
      male: {
        id: 'healer_male',
        name: 'Healer',
        gender: 'male',
        genderLabelKey: 'championSelect.genderMale',
        fallbackGenderLabel: 'Hombre',
        avatar: '/CHAMPIONS/HEALER_MALE/avatar.webp',
        idleAnim: '/CHAMPIONS/HEALER_MALE/idle.webp',
        poster: '/CHAMPIONS/HEALER_MALE/idle_poster.webp',
        quote: '¡La luz sagrada renueva toda vida y disipa las sombras!',
      },
      female: {
        id: 'healer_female',
        name: 'Healer',
        gender: 'female',
        genderLabelKey: 'championSelect.genderFemale',
        fallbackGenderLabel: 'Mujer',
        avatar: '/CHAMPIONS/HEALER_FEMALE/avatar.webp',
        idleAnim: '/CHAMPIONS/HEALER_FEMALE/idle.webp',
        poster: '/CHAMPIONS/HEALER_FEMALE/idle_poster.webp',
        quote: '¡Mientras quede esperanza, la luz de la sanación no se extinguirá!',
      },
    },
  },
]

const MAX_SLOTS = 4

export function ChampionSelectScreen({
  server = { id: 'global', name: 'Servidor Global', type: 'pvp' },
  accountEmail = null,
  pendingEnterGameData = null,
  onEnterGame,
  onChangeServer,
  onBackToStart,
}) {
  const { t, currentLang } = useTranslation()
  const serverId = typeof server === 'string' ? server : (server?.id || 'global')
  const isHarmonia = serverId === 'harmonia'
  const serverTheme = isHarmonia ? 'harmonia-theme' : 'global-theme'
  const serverDisplayName = isHarmonia 
    ? (t('serverSelect.harmoniaName') || 'Harmonia') 
    : (t('serverSelect.globalName') || 'Servidor Global')
  const serverTypeLabel = isHarmonia ? 'OPCIONAL PVP' : 'OPEN PVP'

  // Storage key isolated per account and server
  const accountKey = accountEmail ? accountEmail.toLowerCase().trim() : 'guest'
  const storageKey = `toc_champions_${accountKey}_${serverId}`

  // Load champions from storage (filter out any legacy placeholder with 'reina')
  const [champions, setChampions] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.filter(c => !String(c.name || '').toLowerCase().includes('reina'))
          if (sanitized.length > 0) return sanitized
        }
      }
    } catch {}
    return []
  })

  // View state: creation mode vs selection mode
  const [isCreationMode, setIsCreationMode] = useState(() => champions.length === 0)
  const [selectedChampionId, setSelectedChampionId] = useState(() => champions[0]?.id || null)

  // Creation form state: Default class is KNIGHT (Kina) and Male
  const [selectedClassId, setSelectedClassId] = useState('knight')
  const [selectedGender, setSelectedGender] = useState('male')
  const [championNameInput, setChampionNameInput] = useState(() => generateRandomNobleName(currentLang, '', 'male'))
  const [nameError, setNameError] = useState('')
  const [isScaleWorkbenchOpen, setIsScaleWorkbenchOpen] = useState(false)

  // Sync selection when champions list changes
  useEffect(() => {
    if (champions.length === 0) {
      setIsCreationMode(true)
      setSelectedChampionId(null)
    } else if (!selectedChampionId || !champions.some(c => c.id === selectedChampionId)) {
      setSelectedChampionId(champions[0].id)
    }
  }, [champions, selectedChampionId])

  // Save champions to storage
  const persistChampions = useCallback((updatedList) => {
    setChampions(updatedList)
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedList))
    } catch {}
  }, [storageKey])

  // Active champion (in selection mode)
  const currentChampion = useMemo(() => {
    return champions.find(c => c.id === selectedChampionId) || champions[0]
  }, [champions, selectedChampionId])

  // Active class definition (in creation mode or from selected champion)
  const currentClassDef = useMemo(() => {
    const targetClassId = isCreationMode ? selectedClassId : (currentChampion?.classId || 'knight')
    return HERO_CLASSES.find(c => c.id === targetClassId) || HERO_CLASSES[0]
  }, [isCreationMode, selectedClassId, currentChampion])

  // Active variant (gender)
  const currentHeroVariant = useMemo(() => {
    const gKey = isCreationMode ? selectedGender : (currentChampion?.gender || 'male')
    return currentClassDef.genders[gKey] || currentClassDef.genders.male
  }, [currentClassDef, isCreationMode, selectedGender, currentChampion])

  // Animation tester state ('idle' | 'walk' | 'run' | 'jump' | 'dash_front' | 'dash_back')
  const [previewAnim, setPreviewAnim] = useState('idle')
  const previewTimerRef = useRef(null)

  // Reactive class scale overrides from Laboratory (Scale Workbench)
  const [classScales, setClassScales] = useState(() => getSavedClassScales())

  useEffect(() => {
    const handleScalesUpdated = (e) => {
      if (e.detail) {
        setClassScales(e.detail)
      } else {
        setClassScales(getSavedClassScales())
      }
    }
    window.addEventListener('toc_champion_scales_updated', handleScalesUpdated)
    return () => window.removeEventListener('toc_champion_scales_updated', handleScalesUpdated)
  }, [])

  // Calculate active champion scale with class ID normalization, gender, and animation key
  const activeHeroScale = useMemo(() => {
    const rawClassId = isCreationMode 
      ? selectedClassId 
      : (currentChampion?.classId || currentChampion?.className || currentClassDef?.id || 'knight')
    const rawGender = isCreationMode
      ? selectedGender
      : (currentChampion?.gender || 'male')
    return getClassScale(rawClassId, previewAnim, rawGender)
  }, [classScales, isCreationMode, selectedClassId, selectedGender, currentChampion, currentClassDef, previewAnim])

  // Reset animation when changing class or gender or selection
  useEffect(() => {
    setPreviewAnim('idle')
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
  }, [selectedClassId, selectedGender, selectedChampionId, isCreationMode])

  const handleTriggerAnim = (animKey) => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }
    soundManager.playClick?.()

    // If clicking the currently active non-idle animation, toggle back to idle
    if (previewAnim === animKey && animKey !== 'idle') {
      setPreviewAnim('idle')
      return
    }

    setPreviewAnim(animKey)
    setSpriteNonce(Date.now())

    // Play corresponding OGG sound effect
    try {
      const champFolder = currentHeroVariant.avatar.replace('/avatar.webp', '')
      let soundFile = null
      if (animKey === 'jump') soundFile = `${champFolder}/sounds/jump.ogg`
      else if (animKey === 'dash_front') soundFile = `${champFolder}/sounds/dash_front.ogg`
      else if (animKey === 'dash_back') soundFile = `${champFolder}/sounds/dash_back.ogg`
      else if (animKey === 'run') soundFile = `${champFolder}/sounds/run.ogg`
      else if (animKey === 'walk') soundFile = `${champFolder}/sounds/walk.ogg`

      if (soundFile) {
        const audio = new Audio(soundFile)
        audio.volume = 0.85
        audio.play().catch(() => {})
      }
    } catch {}
  }

  const [spriteNonce, setSpriteNonce] = useState(() => Date.now())

  const activeDisplaySprite = useMemo(() => {
    const champFolder = currentHeroVariant.avatar.replace('/avatar.webp', '')
    let url = currentHeroVariant.idleAnim
    if (previewAnim === 'walk') url = `${champFolder}/walk.webp`
    else if (previewAnim === 'run') url = `${champFolder}/run.webp`
    else if (previewAnim === 'jump') url = `${champFolder}/jump.webp`
    else if (previewAnim === 'dash_front') url = `${champFolder}/dash_front.webp`
    else if (previewAnim === 'dash_back') url = `${champFolder}/dash_back.webp`
    return `${url}?v=${spriteNonce}`
  }, [currentHeroVariant, previewAnim, spriteNonce])

  const hasRunAnim = (isCreationMode ? selectedClassId : (currentChampion?.classId || 'knight')) === 'knight' || 
                     (isCreationMode ? selectedClassId : (currentChampion?.classId || 'knight')) === 'paladin'

  // Cycle to previous class with Left Arrow
  const handlePrevClass = () => {
    soundManager.playClick?.()
    const currentIndex = HERO_CLASSES.findIndex(c => c.id === selectedClassId)
    const prevIndex = (currentIndex - 1 + HERO_CLASSES.length) % HERO_CLASSES.length
    setSelectedClassId(HERO_CLASSES[prevIndex].id)
  }

  // Cycle to next class with Right Arrow
  const handleNextClass = () => {
    soundManager.playClick?.()
    const currentIndex = HERO_CLASSES.findIndex(c => c.id === selectedClassId)
    const nextIndex = (currentIndex + 1) % HERO_CLASSES.length
    setSelectedClassId(HERO_CLASSES[nextIndex].id)
  }

  // Sync selectedGender when changing active champion in selection mode
  useEffect(() => {
    if (!isCreationMode && currentChampion?.gender) {
      setSelectedGender(currentChampion.gender)
    }
  }, [currentChampion?.id, currentChampion?.gender, isCreationMode])

  // Switch Gender (Hombre / Mujer) - Works in both Creation and Selection Mode
  const handleSelectGender = (gender) => {
    const currentActiveGender = isCreationMode 
      ? selectedGender 
      : (currentChampion?.gender || selectedGender || 'male')
    if (gender === currentActiveGender && (!isCreationMode || gender === selectedGender)) return
    
    soundManager.playClick?.()
    setSelectedGender(gender)
    setSpriteNonce(Date.now())

    if (isCreationMode) {
      // Refresh noble name if it was untouched or default
      const freshName = generateRandomNobleName(currentLang, championNameInput, gender)
      setChampionNameInput(freshName)
      if (nameError) setNameError('')
    } else if (currentChampion) {
      // In selection mode: update selected champion's gender, avatar and idle assets in-place!
      const classId = currentChampion.classId || 'knight'
      const classDef = HERO_CLASSES.find(cls => cls.id === classId) || HERO_CLASSES[0]
      const variant = classDef.genders[gender] || classDef.genders.male

      const updatedList = champions.map(c => {
        if (c.id === currentChampion.id) {
          return {
            ...c,
            gender: gender,
            avatar: variant.avatar,
            idleAnim: variant.idleAnim,
            poster: variant.poster,
            quote: variant.quote || c.quote,
          }
        }
        return c
      })
      persistChampions(updatedList)
    }
  }

  // Generate random heroic name with dice
  const handleRandomName = () => {
    soundManager.playReroll?.() || soundManager.playClick?.()
    const heroName = generateRandomNobleName(currentLang, championNameInput, selectedGender)
    setChampionNameInput(heroName)
    setNameError('')
  }

  // Enter Game with selected champion
  const handleEnterWithChampion = (champ) => {
    if (!champ) return
    soundManager.playButtonClick?.()
    try {
      localStorage.setItem('toc_selected_server', serverId)
      localStorage.setItem('toc_player_name', champ.name)
      localStorage.setItem('toc_player_avatar', champ.avatar)
      localStorage.setItem('toc_active_champion', JSON.stringify(champ))
      if (accountEmail) {
        localStorage.setItem(`toc_player_name_${accountEmail}`, champ.name)
        localStorage.setItem(`toc_server_${accountEmail}`, serverId)
      }
    } catch {}

    const profilePayload = {
      name: champ.name,
      avatar: champ.avatar,
      championClass: champ.classId,
      gender: champ.gender || 'male',
      level: champ.level || 1,
      stats: champ.stats,
    }

    if (pendingEnterGameData) {
      const { email, result, extra } = pendingEnterGameData
      onEnterGame?.(email, { ...(result || {}), server: serverId }, {
        ...(extra || {}),
        ...profilePayload,
      })
    } else {
      onEnterGame?.(accountEmail, { success: true, server: serverId }, profilePayload)
    }
  }

  // Create Champion and enter world
  const handleCreateChampion = (e) => {
    if (e) e.preventDefault()
    const trimmed = championNameInput.trim()
    if (!trimmed || trimmed.length < 3) {
      setNameError(t('championSelect.nameMinError') || 'El nombre debe tener al menos 3 caracteres.')
      return
    }
    if (trimmed.length > 16) {
      setNameError(t('championSelect.nameMaxError') || 'El nombre no puede exceder los 16 caracteres.')
      return
    }

    // Check duplicate name in this server
    if (champions.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('Ya existe un héroe con este nombre en este servidor.')
      return
    }

    soundManager.playLevelUp?.() || soundManager.playButtonClick?.()
    const newHero = {
      id: 'champ_' + Date.now(),
      name: trimmed,
      classId: currentClassDef.id,
      className: t(currentClassDef.nameKey) || currentClassDef.fallbackName,
      gender: selectedGender,
      avatar: currentHeroVariant.avatar,
      idleAnim: currentHeroVariant.idleAnim,
      poster: currentHeroVariant.poster,
      level: 1,
      createdAt: Date.now(),
      stats: { ...currentClassDef.stats },
      role: t(currentClassDef.roleKey) || currentClassDef.fallbackRole,
      quote: currentHeroVariant.quote,
    }

    const updated = [...champions, newHero]
    persistChampions(updated)
    setSelectedChampionId(newHero.id)
    setIsCreationMode(false)

    // Launch game with this champion!
    handleEnterWithChampion(newHero)
  }

  // Delete champion
  const handleDeleteChampion = (champId) => {
    if (!champId) return
    const target = champions.find(c => c.id === champId)
    const confirmText = `${t('championSelect.confirmDelete') || '¿Deseas eliminar permanentemente a este campeón?'} (${target?.name})`
    if (!window.confirm(confirmText)) return

    soundManager.playClick?.()
    const remaining = champions.filter(c => c.id !== champId)
    persistChampions(remaining)
    if (remaining.length === 0) {
      setIsCreationMode(true)
    } else {
      setSelectedChampionId(remaining[0].id)
    }
  }

  // Keyboard navigation: Enter to enter game, Left/Right arrows in creation mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleCreateChampion()
        }
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        if (isCreationMode) {
          handleCreateChampion()
        } else if (currentChampion) {
          handleEnterWithChampion(currentChampion)
        }
      } else if (isCreationMode) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          handlePrevClass()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          handleNextClass()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCreationMode, currentChampion, currentClassDef, championNameInput, selectedGender, selectedClassId])

  return (
    <div className="champion-screen-container">
      {/* Ambient Cosmic Background */}
      <div className="champion-screen-bg-overlay" />
      <div className="champion-aether-light" />

      {/* Top Realm Navigation Bar */}
      <header className="champion-top-bar">
        <div className="champion-server-pill-wrap">
          <div className={`champion-server-badge ${serverTheme}`}>
            {isHarmonia ? (
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Swords className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{serverDisplayName} • {serverTypeLabel}</span>
          </div>

          <div className="champion-ping-meta">
            <span className="champion-ping-dot" />
            <span>{isHarmonia ? '18 ms' : '24 ms'} • ONLINE</span>
          </div>

          <button
            type="button"
            className="champion-btn-change-server"
            onClick={() => {
              soundManager.playClick?.()
              onChangeServer?.()
            }}
            title="Cambiar Servidor"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('championSelect.changeServer') || 'Cambiar Servidor'}</span>
          </button>

          <button
            type="button"
            className="champion-btn-change-server"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.38) 100%)',
              borderColor: 'rgba(245, 158, 11, 0.6)',
              color: '#fde68a',
            }}
            onClick={() => {
              soundManager.playClick?.()
              setIsScaleWorkbenchOpen(true)
            }}
            title="Abrir Laboratorio de Escalas y Habilidades (4 Clases en Vivo en el Mercado)"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>⚖️ Comparador de 4 Clases (Mercado)</span>
          </button>
        </div>

        <div className="champion-top-account">
          <span>Cuenta:</span>
          <span className="champion-top-account-pill">
            {accountEmail || 'Invitado'}
          </span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="champion-main-layout">
        {/* Left Column: Character Slots Panel */}
        <aside className="champion-slots-panel">
          <div className="champion-slots-header">
            <h3 className="champion-slots-title">
              {t('championSelect.title') || 'CAMPEONES'}
            </h3>
            <span className="champion-slots-counter">
              {champions.length} / {MAX_SLOTS}
            </span>
          </div>

          <div className="champion-slots-list">
            {/* Existing Characters */}
            {champions.map((champ) => {
              const isSelected = !isCreationMode && selectedChampionId === champ.id
              const classObj = HERO_CLASSES.find(c => c.id === champ.classId) || HERO_CLASSES[0]

              return (
                <div
                  key={champ.id}
                  className={`champion-slot-card ${isSelected ? 'is-active' : ''}`}
                  onClick={() => {
                    soundManager.playClick?.()
                    setSelectedChampionId(champ.id)
                    setIsCreationMode(false)
                  }}
                  onDoubleClick={() => handleEnterWithChampion(champ)}
                >
                  <div className="champion-slot-avatar">
                    <img src={`${champ.avatar}?v=${spriteNonce}`} alt={champ.name} />
                  </div>
                  <div className="champion-slot-info">
                    <span className="champion-slot-name">{champ.name}</span>
                    <div className="champion-slot-meta">
                      <span className="champion-slot-level-badge">
                        Lv. {champ.level || 1}
                      </span>
                      <span className="champion-slot-role">
                        {t(classObj.nameKey) || champ.className || classObj.fallbackName}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, MAX_SLOTS - champions.length) }).map((_, index) => {
              const isSlotActive = isCreationMode && champions.length === index
              return (
                <div
                  key={`empty-slot-${index}`}
                  className={`champion-slot-card is-empty ${isSlotActive ? 'is-active' : ''}`}
                  onClick={() => {
                    soundManager.playClick?.()
                    setIsCreationMode(true)
                    setSelectedChampionId(null)
                    setSelectedClassId('knight')
                    setSelectedGender('male')
                    setChampionNameInput(generateRandomNobleName(currentLang, '', 'male'))
                  }}
                >
                  <div className="champion-empty-prompt">
                    <Plus className="w-4 h-4" />
                    <span>{t('championSelect.createPrompt') || '+ Crear Campeón'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Right Column: Stage Panel (Hero Showcase with Idle Animation & Gender Selector) */}
        <section className="champion-stage-panel">
          {isCreationMode ? (
            /* ================= MODE: CREATION ================= */
            <div className="champion-stage-content">
              {/* Header Title & Gender Switch Row */}
              <div className="champion-class-header-row">
                <div className="champion-class-title-block">
                  <h2 className="champion-class-main-title">
                    {t(currentClassDef.nameKey) || currentClassDef.fallbackName}
                  </h2>
                  <span className="champion-class-alias-pill">
                    {t(currentClassDef.roleKey) || currentClassDef.fallbackRole}
                  </span>
                </div>

                {/* Gender Toggle Buttons: Hombre (♂) vs Mujer (♀) */}
                <div className="champion-gender-selector" role="group" aria-label="Seleccionar Sexo">
                  <button
                    type="button"
                    className={`champion-gender-btn ${selectedGender === 'male' ? 'is-active' : ''}`}
                    onClick={() => handleSelectGender('male')}
                  >
                    <span className="champion-gender-sym">♂</span>
                    <span>{t('championSelect.genderMale') || 'Hombre'}</span>
                  </button>
                  <button
                    type="button"
                    className={`champion-gender-btn ${selectedGender === 'female' ? 'is-active' : ''}`}
                    onClick={() => handleSelectGender('female')}
                  >
                    <span className="champion-gender-sym">♀</span>
                    <span>{t('championSelect.genderFemale') || 'Mujer'}</span>
                  </button>
                </div>
              </div>

              {/* Central Pedestal Stage with Idle Animation & Navigation Arrows */}
              <div className="champion-stage-hero-showcase">
                {/* Left Navigation Arrow */}
                <button
                  type="button"
                  className="champion-nav-arrow prev"
                  onClick={handlePrevClass}
                  title="Clase Anterior (←)"
                >
                  <ChevronLeft size={32} />
                </button>

                {/* Pedestal & Standing Idle Character Sprite */}
                <div className="champion-character-stage">
                  <div className="champion-pedestal-platform">
                    <div 
                      className="champion-pedestal-glow" 
                      style={{ background: `radial-gradient(circle, ${currentClassDef.color}45 0%, transparent 70%)` }} 
                    />
                    <div className="champion-pedestal-rune-ring" />
                  </div>

                  <img
                    key={`${currentClassDef.id}_${selectedGender}_${previewAnim}`}
                    src={activeDisplaySprite}
                    alt={currentHeroVariant.name}
                    className="champion-standing-idle-img"
                    style={{
                      '--hero-scale': activeHeroScale,
                      scale: `${activeHeroScale}`,
                      transformOrigin: 'bottom center',
                    }}
                  />
                </div>

                {/* Right Navigation Arrow */}
                <button
                  type="button"
                  className="champion-nav-arrow next"
                  onClick={handleNextClass}
                  title="Siguiente Clase (→)"
                >
                  <ChevronRight size={32} />
                </button>
              </div>

              {/* Class Selector Pills (Knight / Paladin / Mage / Healer) */}
              <div className="champion-class-pills-nav">
                {HERO_CLASSES.map((cls) => {
                  const isSelected = selectedClassId === cls.id
                  const Icon = cls.icon
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      className={`champion-class-pill-btn ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        soundManager.playClick?.()
                        setSelectedClassId(cls.id)
                      }}
                    >
                      <Icon size={14} className="champion-pill-icon" />
                      <span>{t(cls.nameKey) || cls.fallbackName}</span>
                    </button>
                  )
                })}
              </div>

              {/* Champion Animation & Audio Tester Bar */}
              <div className="champion-anim-tester-bar">
                <span className="champion-anim-tester-label">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Probar Animaciones & Audios:</span>
                </span>
                <div className="champion-anim-tester-btns">
                  <button
                    type="button"
                    className={`champion-anim-btn ${previewAnim === 'idle' ? 'is-active' : ''}`}
                    onClick={() => handleTriggerAnim('idle')}
                    title="Animación de Reposo"
                  >
                    <span>🧍 Reposo</span>
                  </button>
                  <button
                    type="button"
                    className={`champion-anim-btn ${previewAnim === 'walk' ? 'is-active' : ''}`}
                    onClick={() => handleTriggerAnim('walk')}
                    title="Caminar con audio de pasos"
                  >
                    <span>🚶 Caminar</span>
                  </button>
                  {hasRunAnim && (
                    <button
                      type="button"
                      className={`champion-anim-btn ${previewAnim === 'run' ? 'is-active' : ''}`}
                      onClick={() => handleTriggerAnim('run')}
                      title="Correr con audio de pasos rápidos"
                    >
                      <span>🏃 Correr</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={`champion-anim-btn ${previewAnim === 'jump' ? 'is-active' : ''}`}
                    onClick={() => handleTriggerAnim('jump')}
                    title="Saltar con sonido celestial"
                  >
                    <span>⬆️ Saltar</span>
                  </button>
                  <button
                    type="button"
                    className={`champion-anim-btn ${previewAnim === 'dash_front' ? 'is-active' : ''}`}
                    onClick={() => handleTriggerAnim('dash_front')}
                    title="Dash hacia adelante con sonido de ráfaga"
                  >
                    <span>💨 Dash Front</span>
                  </button>
                  <button
                    type="button"
                    className={`champion-anim-btn ${previewAnim === 'dash_back' ? 'is-active' : ''}`}
                    onClick={() => handleTriggerAnim('dash_back')}
                    title="Dash hacia atrás con sonido de ráfaga"
                  >
                    <span>🛡️ Dash Back</span>
                  </button>
                </div>
              </div>


              {/* Attribute Stat Bars */}
              <div className="champion-stats-grid">
                <div className="champion-stat-item">
                  <div className="champion-stat-header">
                    <span>{t('championSelect.statAttack') || 'Ataque'}</span>
                    <span>{currentClassDef.stats.attack} / 100</span>
                  </div>
                  <div className="champion-stat-bar-track">
                    <div className="champion-stat-bar-fill attack" style={{ width: `${currentClassDef.stats.attack}%` }} />
                  </div>
                </div>

                <div className="champion-stat-item">
                  <div className="champion-stat-header">
                    <span>{t('championSelect.statDefense') || 'Defensa'}</span>
                    <span>{currentClassDef.stats.defense} / 100</span>
                  </div>
                  <div className="champion-stat-bar-track">
                    <div className="champion-stat-bar-fill defense" style={{ width: `${currentClassDef.stats.defense}%` }} />
                  </div>
                </div>

                <div className="champion-stat-item">
                  <div className="champion-stat-header">
                    <span>{t('championSelect.statSpeed') || 'Velocidad'}</span>
                    <span>{currentClassDef.stats.speed} / 100</span>
                  </div>
                  <div className="champion-stat-bar-track">
                    <div className="champion-stat-bar-fill speed" style={{ width: `${currentClassDef.stats.speed}%` }} />
                  </div>
                </div>

                <div className="champion-stat-item">
                  <div className="champion-stat-header">
                    <span>{t('championSelect.statMagic') || 'Magia'}</span>
                    <span>{currentClassDef.stats.magic} / 100</span>
                  </div>
                  <div className="champion-stat-bar-track">
                    <div className="champion-stat-bar-fill magic" style={{ width: `${currentClassDef.stats.magic}%` }} />
                  </div>
                </div>
              </div>

              {/* Name Input & Create Actions */}
              <div className="champion-creation-footer">
                <div className="champion-name-input-group">
                  <label className="champion-name-field-label">
                    Nombre de tu Campeón:
                  </label>
                  <div className="champion-name-field-wrap">
                    <input
                      type="text"
                      className="champion-name-text-input"
                      value={championNameInput}
                      onChange={(e) => {
                        setChampionNameInput(e.target.value)
                        if (nameError) setNameError('')
                      }}
                      placeholder={t('championSelect.namePlaceholder') || 'Escribe el nombre de tu campeón...'}
                      maxLength={16}
                    />
                    <button
                      type="button"
                      className="champion-dice-roll-btn"
                      onClick={handleRandomName}
                      title={t('championSelect.nobleRandom') || 'Generar Nombre Heroico'}
                    >
                      <Dices size={20} />
                    </button>
                  </div>
                  {nameError && (
                    <span className="champion-name-error-msg">{nameError}</span>
                  )}
                </div>

                <div className="champion-create-buttons-row">
                  {champions.length > 0 && (
                    <button
                      type="button"
                      className="champion-btn-cancel-create"
                      onClick={() => {
                        soundManager.playClick?.()
                        setIsCreationMode(false)
                      }}
                    >
                      {t('championSelect.cancelCreate') || 'Volver a Selección'}
                    </button>
                  )}

                  <button
                    type="button"
                    className="champion-btn-confirm-enter"
                    onClick={handleCreateChampion}
                  >
                    <Check size={18} />
                    <span>{t('championSelect.confirmCreate') || 'Crear y Entrar al Reino'}</span>
                    <span className="champion-key-hint">ENTER ↵</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= MODE: SELECTION ================= */
            <div className="champion-stage-content">
              {currentChampion && (
                <>
                  <div className="champion-class-header-row">
                    <div className="champion-class-title-block">
                      <h2 className="champion-class-main-title">{currentChampion.name}</h2>
                      <span className="champion-class-alias-pill">
                        Lv. {currentChampion.level || 1} • {t(currentClassDef.nameKey) || currentClassDef.fallbackName} • {t(currentClassDef.roleKey) || currentClassDef.fallbackRole}
                      </span>
                    </div>

                    {/* Gender Toggle Buttons: Hombre (♂) vs Mujer (♀) */}
                    <div className="champion-gender-selector" role="group" aria-label="Cambiar Sexo">
                      <button
                        type="button"
                        className={`champion-gender-btn ${(currentChampion.gender || selectedGender) === 'male' ? 'is-active' : ''}`}
                        onClick={() => handleSelectGender('male')}
                        title="Cambiar a Hombre (♂)"
                      >
                        <span className="champion-gender-sym">♂</span>
                        <span>{t('championSelect.genderMale') || 'Hombre'}</span>
                      </button>
                      <button
                        type="button"
                        className={`champion-gender-btn ${(currentChampion.gender || selectedGender) === 'female' ? 'is-active' : ''}`}
                        onClick={() => handleSelectGender('female')}
                        title="Cambiar a Mujer (♀)"
                      >
                        <span className="champion-gender-sym">♀</span>
                        <span>{t('championSelect.genderFemale') || 'Mujer'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Standing Hero Sprite with Idle Animation */}
                  <div className="champion-stage-hero-showcase">
                    <div className="champion-character-stage">
                      <div className="champion-pedestal-platform">
                        <div 
                          className="champion-pedestal-glow" 
                          style={{ background: `radial-gradient(circle, ${currentClassDef.color}45 0%, transparent 70%)` }} 
                        />
                        <div className="champion-pedestal-rune-ring" />
                      </div>

                      <img
                        key={`${currentChampion.id}_${currentChampion.gender || selectedGender}_${previewAnim}`}
                        src={activeDisplaySprite}
                        alt={currentChampion.name}
                        className="champion-standing-idle-img"
                        style={{
                          '--hero-scale': activeHeroScale,
                          scale: `${activeHeroScale}`,
                          transformOrigin: 'bottom center',
                        }}
                      />
                    </div>
                  </div>

                  {/* Champion Animation & Audio Tester Bar */}
                  <div className="champion-anim-tester-bar">
                    <span className="champion-anim-tester-label">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>Probar Animaciones & Audios:</span>
                    </span>
                    <div className="champion-anim-tester-btns">
                      <button
                        type="button"
                        className={`champion-anim-btn ${previewAnim === 'idle' ? 'is-active' : ''}`}
                        onClick={() => handleTriggerAnim('idle')}
                        title="Animación de Reposo"
                      >
                        <span>🧍 Reposo</span>
                      </button>
                      <button
                        type="button"
                        className={`champion-anim-btn ${previewAnim === 'walk' ? 'is-active' : ''}`}
                        onClick={() => handleTriggerAnim('walk')}
                        title="Caminar con audio de pasos"
                      >
                        <span>🚶 Caminar</span>
                      </button>
                      {hasRunAnim && (
                        <button
                          type="button"
                          className={`champion-anim-btn ${previewAnim === 'run' ? 'is-active' : ''}`}
                          onClick={() => handleTriggerAnim('run')}
                          title="Correr con audio de pasos rápidos"
                        >
                          <span>🏃 Correr</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className={`champion-anim-btn ${previewAnim === 'jump' ? 'is-active' : ''}`}
                        onClick={() => handleTriggerAnim('jump')}
                        title="Saltar con sonido celestial"
                      >
                        <span>⬆️ Saltar</span>
                      </button>
                      <button
                        type="button"
                        className={`champion-anim-btn ${previewAnim === 'dash_front' ? 'is-active' : ''}`}
                        onClick={() => handleTriggerAnim('dash_front')}
                        title="Dash hacia adelante con sonido de ráfaga"
                      >
                        <span>💨 Dash Front</span>
                      </button>
                      <button
                        type="button"
                        className={`champion-anim-btn ${previewAnim === 'dash_back' ? 'is-active' : ''}`}
                        onClick={() => handleTriggerAnim('dash_back')}
                        title="Dash hacia atrás con sonido de ráfaga"
                      >
                        <span>🛡️ Dash Back</span>
                      </button>
                    </div>
                  </div>


                  {/* Stat Attributes */}
                  <div className="champion-stats-grid">
                    <div className="champion-stat-item">
                      <div className="champion-stat-header">
                        <span>{t('championSelect.statAttack') || 'Ataque'}</span>
                        <span>{currentClassDef.stats.attack} / 100</span>
                      </div>
                      <div className="champion-stat-bar-track">
                        <div className="champion-stat-bar-fill attack" style={{ width: `${currentClassDef.stats.attack}%` }} />
                      </div>
                    </div>

                    <div className="champion-stat-item">
                      <div className="champion-stat-header">
                        <span>{t('championSelect.statDefense') || 'Defensa'}</span>
                        <span>{currentClassDef.stats.defense} / 100</span>
                      </div>
                      <div className="champion-stat-bar-track">
                        <div className="champion-stat-bar-fill defense" style={{ width: `${currentClassDef.stats.defense}%` }} />
                      </div>
                    </div>

                    <div className="champion-stat-item">
                      <div className="champion-stat-header">
                        <span>{t('championSelect.statSpeed') || 'Velocidad'}</span>
                        <span>{currentClassDef.stats.speed} / 100</span>
                      </div>
                      <div className="champion-stat-bar-track">
                        <div className="champion-stat-bar-fill speed" style={{ width: `${currentClassDef.stats.speed}%` }} />
                      </div>
                    </div>

                    <div className="champion-stat-item">
                      <div className="champion-stat-header">
                        <span>{t('championSelect.statMagic') || 'Magia'}</span>
                        <span>{currentClassDef.stats.magic} / 100</span>
                      </div>
                      <div className="champion-stat-bar-track">
                        <div className="champion-stat-bar-fill magic" style={{ width: `${currentClassDef.stats.magic}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="champion-showcase-actions-row">
                    <button
                      type="button"
                      className="champion-btn-delete"
                      onClick={() => handleDeleteChampion(currentChampion.id)}
                      title={t('championSelect.deleteChampion') || 'Eliminar'}
                    >
                      <Trash2 size={16} />
                      <span>{t('championSelect.deleteChampion') || 'Eliminar'}</span>
                    </button>

                    <button
                      type="button"
                      className="champion-btn-create-another"
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(3, 105, 161, 0.35) 100%)',
                        border: '1.5px solid rgba(56, 189, 248, 0.45)',
                        color: '#38bdf8',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onClick={() => {
                        soundManager.playClick?.()
                        setIsCreationMode(true)
                        setSelectedChampionId(null)
                        setSelectedClassId('knight')
                        setSelectedGender('male')
                        setChampionNameInput(generateRandomNobleName(currentLang, '', 'male'))
                      }}
                    >
                      <Plus size={16} />
                      <span>{t('championSelect.createNew') || 'Probar Otra Clase'}</span>
                    </button>

                    <button
                      type="button"
                      className="champion-btn-create-another"
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(180, 83, 9, 0.32) 100%)',
                        border: '1.5px solid rgba(245, 158, 11, 0.45)',
                        color: '#fde68a',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onClick={() => {
                        soundManager.playClick?.()
                        setIsScaleWorkbenchOpen(true)
                      }}
                      title="Comparar las 4 clases juntas en el Mercado con animaciones simultáneas"
                    >
                      <Scale size={16} />
                      <span>Comparar 4 Clases (Mercado)</span>
                    </button>

                    <button
                      type="button"
                      className="champion-btn-confirm-enter"
                      onClick={() => handleEnterWithChampion(currentChampion)}
                    >
                      <Check size={18} />
                      <span>{t('championSelect.enterWorld') || 'Entrar al Reino'}</span>
                      <span className="champion-key-hint">ENTER ↵</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      {/* 4 Classes Scale & Synchronized Actions Workbench Modal */}
      <ChampionsScaleWorkbenchModal
        isOpen={isScaleWorkbenchOpen}
        onClose={() => {
          setIsScaleWorkbenchOpen(false)
          setClassScales(getSavedClassScales())
        }}
      />
    </div>
  )
}
