import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import './MarketInteriorView.css'
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Store, 
  Sparkles, 
  Heart, 
  MessageCircle, 
  RotateCcw, 
  Check,
  Sliders,
  ExternalLink
} from 'lucide-react'
import { MARKET_AISLES } from '../data/marketAislesData'
import { soundManager } from '../utils/audio'
import { ChampionActor } from './ChampionActor'
import { getActivePlayerChampion } from '../data/championsData'

export function MarketInteriorView({ isOpen, onClose }) {
  const [activeAisleIndex, setActiveAisleIndex] = useState(0)

  // Character control mode: 'player' | 'healer_female' | 'healer_male'
  const [explorerMode, setExplorerMode] = useState('player')
  
  // Healer NPC configuration
  const [healerNpcGender, setHealerNpcGender] = useState('female')
  const [showNpcHealer, setShowNpcHealer] = useState(true)
  
  // Interactive Dialogue & Blessing States
  const [dialogOpen, setDialogOpen] = useState(false)
  const [blessingActive, setBlessingActive] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)
  const toastTimeoutRef = useRef(null)

  // Retrieve player's created / active champion with guest account name support
  const playerChampion = useMemo(() => {
    return getActivePlayerChampion()
  }, [isOpen])

  // Resolve currently active controlled champion
  const activeChampionProp = useMemo(() => {
    if (explorerMode === 'healer_female') return 'healer_female'
    if (explorerMode === 'healer_male') return 'healer_male'
    return playerChampion
  }, [explorerMode, playerChampion])

  const currentAisle = MARKET_AISLES[activeAisleIndex] || MARKET_AISLES[0]

  const handlePrev = useCallback(() => {
    soundManager.playClick?.()
    setActiveAisleIndex((prev) => (prev > 0 ? prev - 1 : MARKET_AISLES.length - 1))
  }, [])

  const handleNext = useCallback(() => {
    soundManager.playClick?.()
    setActiveAisleIndex((prev) => (prev < MARKET_AISLES.length - 1 ? prev + 1 : 0))
  }, [])

  const handleClose = useCallback(() => {
    soundManager.playClick?.()
    onClose?.()
  }, [onClose])

  // Trigger Divine Celestial Healing Blessing
  const handleReceiveBlessing = () => {
    try {
      soundManager.playLevelUp?.()
    } catch {}
    setBlessingActive(true)
    setToastMsg('¡Luz Celestial! Salud, Maná y Vitalidad restauradas al 100%')
    
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => {
      setBlessingActive(false)
      setToastMsg(null)
    }, 3800)
    setDialogOpen(false)
  }

  // Switch explorer mode to Healer
  const handleSelectExplorerHealer = (gender = 'female') => {
    soundManager.playClick?.()
    setExplorerMode(`healer_${gender}`)
    setDialogOpen(false)
  }

  // Pause main kingdom scene audio & environmental loops while inside the Market to save CPU/Memory
  useEffect(() => {
    if (isOpen) {
      soundManager.stopKingdomMusic?.()
      return () => {
        soundManager.resumeKingdomAudio?.()
      }
    }
  }, [isOpen])

  // Keyboard navigation: ESC to close, PageUp/PageDown or brackets for aisles (preserving A/D/Arrows for champion walking)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (dialogOpen) {
          setDialogOpen(false)
        } else {
          handleClose()
        }
      } else if (e.key === 'PageUp' || e.key === '[') {
        handlePrev()
      } else if (e.key === 'PageDown' || e.key === ']') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, dialogOpen, handleClose, handlePrev, handleNext])

  if (!isOpen) return null

  const isHealerNpcFemale = healerNpcGender === 'female'
  const healerNpcId = isHealerNpcFemale ? 'healer_female' : 'healer_male'
  const healerNpcName = isHealerNpcFemale ? 'Sacerdotisa Celestia' : 'Sanador Sagrado'
  const healerAvatarUrl = isHealerNpcFemale ? '/CHAMPIONS/HEALER_FEMALE/avatar.webp' : '/CHAMPIONS/HEALER_MALE/avatar.webp'

  return (
    <div className="market-interior-overlay" role="dialog" aria-modal="true" aria-label="Interior del Gran Mercado Celestial">
      {/* Top Floating Navigation Bar */}
      <header className="market-interior-topbar">
        {/* Exit Button - Placed below HUD Avatar frame on the left */}
        <button 
          type="button" 
          className="market-exit-btn" 
          onClick={handleClose}
          title="Volver a la Ciudad Imperial (ESC)"
        >
          <X size={16} />
          <span>Volver a la Ciudad</span>
        </button>

        {/* Scene / Dungeon Nameplate in the Center */}
        <div className="market-brand-block">
          <div className="market-brand-icon">
            <Store size={22} />
          </div>
          <div className="market-brand-text">
            <h2>Gran Mercado Celestial</h2>
            <p>{currentAisle.name} ({activeAisleIndex + 1}/{MARKET_AISLES.length})</p>
          </div>
        </div>

        {/* Healer & Explorer Quick Switcher Controls */}
        <div className="market-topbar-healer-controls">
          <div className="market-pill-group" role="group" aria-label="Explorador en Mercado">
            <button
              type="button"
              className={`market-pill-btn ${explorerMode === 'player' ? 'is-active' : ''}`}
              onClick={() => {
                soundManager.playClick?.()
                setExplorerMode('player')
              }}
              title="Explorar con tu personaje principal"
            >
              <span>👤 Mi Campeón</span>
            </button>

            <button
              type="button"
              className={`market-pill-btn ${explorerMode === 'healer_female' ? 'is-emerald-active' : ''}`}
              onClick={() => {
                soundManager.playClick?.()
                setExplorerMode('healer_female')
              }}
              title="Controlar directamente a la Sanadora (Mujer)"
            >
              <span>⚕️ Sanadora ♀</span>
            </button>

            <button
              type="button"
              className={`market-pill-btn ${explorerMode === 'healer_male' ? 'is-emerald-active' : ''}`}
              onClick={() => {
                soundManager.playClick?.()
                setExplorerMode('healer_male')
              }}
              title="Controlar directamente al Sanador (Hombre)"
            >
              <span>⚕️ Sanador ♂</span>
            </button>
          </div>

          {/* Talk to Sanctuary Healer button */}
          <button
            type="button"
            className="market-pill-btn is-talk-btn"
            onClick={() => {
              soundManager.playClick?.()
              setDialogOpen(true)
            }}
            title="Interactuar con el Santuario de la Sanadora"
          >
            <Sparkles size={14} className="market-sparkle-icon" />
            <span>Santuario Sanador</span>
          </button>

          {/* Open Dual-Screen Scale Workbench in a New Tab / Window */}
          <button
            type="button"
            className="market-pill-btn is-dual-screen-btn"
            onClick={() => {
              soundManager.playClick?.()
              window.open(`${window.location.origin}${window.location.pathname}?workbench=true`, '_blank')
            }}
            title="Abrir Calibrador en una 2ª pantalla/pestaña para ajustar escalas en vivo (0ms) mientras caminas y juegas aquí"
          >
            <Sliders size={13} />
            <span>⚖️ Escalar en 2ª Pantalla</span>
            <ExternalLink size={12} style={{ opacity: 0.7 }} />
          </button>
        </div>
      </header>

      {/* Main Viewport Stage */}
      <main className="market-stage-viewport">
        {/* Background 2.5D Artwork with smooth crossfade */}
        <picture>
          <source srcSet={currentAisle.bg} type="image/webp" />
          <img
            key={currentAisle.id}
            src={currentAisle.bgJpg || currentAisle.bg}
            alt={currentAisle.name}
            className="market-bg-image"
          />
        </picture>

        {/* Atmospheric Lighting Vignette */}
        <div className="market-stage-vignette" />

        {/* Divine Blessing Sparkles Screen FX */}
        {blessingActive && (
          <div className="market-blessing-screen-fx">
            <div className="market-blessing-glow-beam" />
          </div>
        )}

        {/* Floating Blessing Toast Notification */}
        {toastMsg && (
          <div className="market-blessing-toast">
            <Heart size={18} color="#10b981" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Interactive Controlled Champion Actor */}
        <ChampionActor
          champion={activeChampionProp}
          initialX={explorerMode === 'player' ? 36 : 48}
          bottomOffset={42}
          minX={8}
          maxX={92}
          enableKeyboard={isOpen && !dialogOpen}
          showHud={true}
          showControls={false}
          showHint={false}
        />

        {/* Ambient Resident Healer NPC in the Market (Stationed at X=74) */}
        {showNpcHealer && explorerMode === 'player' && (
          <div 
            className="market-healer-npc-wrap"
            onClick={() => {
              soundManager.playClick?.()
              setDialogOpen(true)
            }}
            title="Hablar con la Sanadora Celestial"
          >
            {/* Glowing Holy Pedestal */}
            <div className="market-healer-ground-pedestal" />
            
            {/* Floating Interaction Speech Tag */}
            <div className="market-healer-talk-tag">
              <Sparkles size={12} className="market-tag-sparkle" />
              <span>💬 Hablar</span>
            </div>

            <ChampionActor
              champion={healerNpcId}
              initialX={74}
              bottomOffset={42}
              enableKeyboard={false}
              showHud={false}
              showOverhead={true}
              showControls={false}
              showHint={false}
              name={healerNpcName}
              badge="HEALER"
              level={1000}
            />
          </div>
        )}

        {/* Alternate Companion if playing as Healer (Stationed companion at X=74) */}
        {explorerMode !== 'player' && (
          <div 
            className="market-healer-npc-wrap"
            onClick={() => {
              soundManager.playClick?.()
              setDialogOpen(true)
            }}
            title="Santuario Celestial de Curación"
          >
            <div className="market-healer-ground-pedestal is-shrine" />
            <div className="market-healer-talk-tag">
              <Sparkles size={12} className="market-tag-sparkle" />
              <span>⚕️ Altar Sagrado</span>
            </div>

            <ChampionActor
              champion={explorerMode === 'healer_female' ? 'healer_male' : 'healer_female'}
              initialX={74}
              bottomOffset={42}
              enableKeyboard={false}
              showHud={false}
              showOverhead={true}
              showControls={false}
              showHint={false}
              name={explorerMode === 'healer_female' ? 'Sanador Aris' : 'Sacerdotisa Celestia'}
              badge="HEALER"
              level={1000}
            />
          </div>
        )}

        {/* Previous Navigation Arrow */}
        <button
          type="button"
          className="market-nav-arrow prev"
          onClick={handlePrev}
          title="Pasillo Anterior (← / [)"
          aria-label="Pasillo Anterior"
        >
          <ChevronLeft size={34} />
        </button>

        {/* Next Navigation Arrow */}
        <button
          type="button"
          className="market-nav-arrow next"
          onClick={handleNext}
          title="Pasillo Siguiente (→ / ])"
          aria-label="Pasillo Siguiente"
        >
          <ChevronRight size={34} />
        </button>
      </main>

      {/* Interactive Healer Dialogue & Blessing Modal */}
      {dialogOpen && (
        <div className="market-healer-dialog-backdrop" onClick={() => setDialogOpen(false)}>
          <div className="market-healer-dialog-card" onClick={(e) => e.stopPropagation()}>
            {/* Header with Close */}
            <div className="market-healer-dialog-header">
              <div className="market-healer-avatar-wrap">
                <img src={healerAvatarUrl} alt={healerNpcName} className="market-healer-dialog-avatar" />
                <div className="market-healer-avatar-halo" />
              </div>
              <div className="market-healer-dialog-titles">
                <div className="market-healer-role-badge">
                  <Heart size={12} />
                  <span>Santuario de Sanación • Gran Mercado</span>
                </div>
                <h3>{healerNpcName}</h3>
                <p>Custodia de la Luz Celestial y Restauración</p>
              </div>
              <button 
                type="button" 
                className="market-healer-dialog-close"
                onClick={() => setDialogOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Lore Dialogue Message */}
            <div className="market-healer-dialog-body">
              <p className="market-healer-quote">
                «Que la sagrada luz del cosmos alivie tus fatigas, noble caminante. En este mercado confluyen viajeros de todos los reinos. He consagrado este pasillo para purificar tus heridas y devolver la gloria a tu espíritu.»
              </p>
            </div>

            {/* Interactive Action Buttons */}
            <div className="market-healer-dialog-actions">
              <button
                type="button"
                className="market-healer-action-btn is-heal"
                onClick={handleReceiveBlessing}
              >
                <Sparkles size={16} />
                <div className="market-action-btn-text">
                  <strong>Recibir Bendición de Vida</strong>
                  <small>Restaura Salud, Maná y Furia al 100%</small>
                </div>
              </button>

              <button
                type="button"
                className="market-healer-action-btn is-switch"
                onClick={() => handleSelectExplorerHealer('female')}
              >
                <Heart size={16} />
                <div className="market-action-btn-text">
                  <strong>Controlar Sanadora (Mujer)</strong>
                  <small>Caminar, saltar y explorar como Healer ♀</small>
                </div>
              </button>

              <button
                type="button"
                className="market-healer-action-btn is-switch"
                onClick={() => handleSelectExplorerHealer('male')}
              >
                <Heart size={16} />
                <div className="market-action-btn-text">
                  <strong>Controlar Sanador (Hombre)</strong>
                  <small>Caminar, saltar y explorar como Healer ♂</small>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
