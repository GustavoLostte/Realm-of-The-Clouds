// Sound & Background Music Controller

const BUILDING_SOUND_MAP = {
  ayuntamiento: '/assets/sounds/castle_build.ogg',
}

const BUILDING_IDLE_MAP = {
  ayuntamiento: '/assets/sounds/castle_build.ogg',
}

class SFXChannelPool {
  constructor(size = 6) {
    this.size = size
    this.channels = []
    this.currentIndex = 0
    if (typeof window !== 'undefined') {
      for (let i = 0; i < size; i++) {
        try {
          const a = new Audio()
          a.preload = 'auto'
          this.channels.push(a)
        } catch {}
      }
    }
  }

  play(src, volume = 0.85, playbackRate = 1) {
    if (!this.channels || this.channels.length === 0 || !src) return
    const channel = this.channels[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.channels.length

    try {
      if (channel.src !== src && !channel.src.endsWith(src)) {
        channel.src = src
      }
      channel.volume = Math.max(0, Math.min(1, volume))
      channel.playbackRate = playbackRate
      channel.currentTime = 0
      const p = channel.play()
      if (p !== undefined) {
        p.catch(() => {})
      }
    } catch {}
  }
}

class SoundController {
  constructor() {
    this.enabled = true
    this.gameStarted = false
    this.audioCtx = null
    this.clickAudio = null
    this.bgmAudio = null
    this.hasUserInteracted = false
    this.bgmVolume = 0.35
    this.sfxVolume = 0.85
    this.ambientVolume = 0.55
    this.ambientAudio = null
    this.battleAudio = null
    this.isBattleMusicPlaying = false
    this.isMusicInBreak = false
    this.activeConstructions = new Map() // slotId -> HTMLAudioElement
    this.currentBuildingAudio = null
    this.soundCache = {}
    this.sfxPool = new SFXChannelPool(6)
    this.collectChainCount = 0
    this.lastCollectTime = 0
    this.lastPopChimeTime = 0
    this.noiseBuffer = null

    if (typeof window !== 'undefined') {
      try {
        this.clickAudio = new Audio('/assets/click_sound.ogg')
        this.clickAudio.volume = 0.45
      } catch {
        // ignore
      }

      try {
        this.heroAttackAudio = new Audio('/assets/audio/hero_attack.ogg')
        this.heroAttackAudio.volume = 0.85
        this.heroAttackAudio.preload = 'auto'
        this.heroAttackAudio.addEventListener('error', () => {
          if (this.heroAttackAudio && this.heroAttackAudio.src.includes('.ogg')) {
            this.heroAttackAudio.src = '/assets/mazmorras/hero_attack.mp3'
          }
        })
      } catch {
        // ignore
      }

      // Preload building sounds
      Object.entries(BUILDING_SOUND_MAP).forEach(([key, src]) => {
        try {
          const a = new Audio(src)
          a.preload = 'auto'
          this.soundCache[key] = a
        } catch {
          // ignore
        }
      })

      // 1. Theme BGM: The Keep at First Light
      try {
        this.bgmAudio = new Audio('/assets/audio/The_Keep_at_First_Light.ogg')
        this.bgmAudio.loop = true
        this.bgmAudio.volume = this.bgmVolume
        this.bgmAudio.preload = 'auto'

        // Detect musical cut / loop boundary and swell map ambient sounds during the break
        this.bgmAudio.addEventListener('timeupdate', () => {
          if (!this.bgmAudio) return
          // The song cadences at 169s, silence/pause is from ~171.2s to 174s (loop restart)
          const inBreak = this.bgmAudio.currentTime >= 169.5 && this.bgmAudio.currentTime <= 174.0
          if (this.isMusicInBreak !== inBreak) {
            this.isMusicInBreak = inBreak
            this.updateAmbientVolume()
          }
        })

        this.bgmAudio.addEventListener('pause', () => {
          if (this.isBattleMusicPlaying) return
          this.isMusicInBreak = true
          this.updateAmbientVolume()
        })

        this.bgmAudio.addEventListener('play', () => {
          if (this.isBattleMusicPlaying) {
            try { this.bgmAudio.pause() } catch {}
            return
          }
          this.isMusicInBreak = false
          this.updateAmbientVolume()
          if (this.canPlayGameSound() && this.ambientAudio && this.ambientAudio.paused) {
            this.ambientAudio.play().catch(() => {})
          }
        })

        // Fallback error listener
        this.bgmAudio.addEventListener('error', () => {
          if (this.bgmAudio && this.bgmAudio.src.includes('The_Keep_at_First_Light.ogg')) {
            this.bgmAudio.src = '/assets/audio/The_Keep_at_First_Light.ogg'
            if (this.enabled && this.hasUserInteracted && this.gameStarted && !this.isBattleMusicPlaying) {
              this.bgmAudio.play().catch(() => {})
            }
          }
        })
      } catch {
        // ignore
      }

      // 2. Ambient FX: Environmental waterfall, cloud breeze, birds & celestial chimes
      try {
        this.ambientAudio = new Audio('/assets/audio/background_ambient.ogg')
        this.ambientAudio.loop = true
        this.ambientAudio.volume = this.ambientVolume
        this.ambientAudio.preload = 'auto'

        // Resilient loop recovery for mobile / safari tab backgrounding
        this.ambientAudio.addEventListener('ended', () => {
          if (this.canPlayGameSound() && !this.isBattleMusicPlaying) {
            this.ambientAudio.currentTime = 0
            this.ambientAudio.play().catch(() => {})
          }
        })

        this.ambientAudio.addEventListener('error', () => {
          if (this.ambientAudio && this.ambientAudio.src.includes('background_ambient.ogg')) {
            this.ambientAudio.src = '/assets/audio/background_ambient_vorbis.ogg'
            if (this.enabled && this.hasUserInteracted && this.gameStarted && !this.isBattleMusicPlaying) {
              this.ambientAudio.play().catch(() => {})
            }
          }
        })
      } catch {
        // ignore
      }

      // 3. Battle BGM: battle_scene.ogg (optimized OGG Vorbis)
      try {
        this.battleAudio = new Audio('/assets/audio/battle_scene.ogg')
        this.battleAudio.loop = true
        this.battleAudio.volume = this.bgmVolume
        this.battleAudio.preload = 'auto'
        this.battleAudio.addEventListener('error', () => {
          if (this.battleAudio && !this.battleAudio.src.includes('battle_scene.ogg')) {
            this.battleAudio.src = '/assets/audio/battle_scene.ogg'
            if (this.enabled && this.hasUserInteracted && this.isBattleMusicPlaying) {
              this.battleAudio.play().catch(() => {})
            }
          }
        })
      } catch {
        // ignore
      }

      // Auto-unlock audio playback on first user gesture
      const unlockAudio = () => {
        if (!this.hasUserInteracted) {
          this.hasUserInteracted = true
          this.initCtx()
          if (this.enabled && this.gameStarted) {
            if (this.isBattleMusicPlaying) {
              this.playBattleMusic()
            } else {
              this.playAmbient()
              this.playBGM()
            }
          }
          window.removeEventListener('pointerdown', unlockAudio)
          window.removeEventListener('keydown', unlockAudio)
        }
      }

      window.addEventListener('pointerdown', unlockAudio, { passive: true })
      window.addEventListener('keydown', unlockAudio, { passive: true })

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.canPlayGameSound()) {
          this.initCtx()
        }
      })
    }
  }

  setGameStarted(started) {
    this.gameStarted = !!started
    if (!this.gameStarted) {
      this.pauseBGM(true)
      this.stopBuildingSound()
      this.activeConstructions.forEach((audio) => {
        try {
          audio.pause()
          audio.currentTime = 0
        } catch {}
      })
      this.activeConstructions.clear()
    } else {
      if (this.isBattleMusicPlaying) {
        this.playBattleMusic()
      } else {
        this.playAmbient()
        this.playBGM()
      }
    }
  }

  canPlayGameSound() {
    return !!(this.enabled && this.gameStarted && this.hasUserInteracted)
  }

  initCtx() {
    if (!this.hasUserInteracted) return
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {})
    }
  }

  updateAmbientVolume() {
    if (!this.ambientAudio) return
    if (this.isBattleMusicPlaying) {
      this.ambientAudio.volume = 0
      try {
        this.ambientAudio.pause()
      } catch {}
      return
    }

    const base = this.ambientVolume
    
    // Map ambient sound effects play continuously alongside music with dynamic acoustic balance
    // During musical breaks, pauses, or cuts, swell the nature sounds so the map breathes!
    const targetVol = (this.isMusicInBreak || !this.bgmAudio || this.bgmAudio.paused)
      ? Math.min(1.0, base * 1.25)
      : base * 0.85

    this.ambientAudio.volume = Math.max(0, Math.min(1, targetVol))
    if (this.canPlayGameSound() && this.ambientAudio.paused && targetVol > 0) {
      this.ambientAudio.play().catch(() => {})
    }
  }

  playAmbient() {
    if (this.isBattleMusicPlaying) return
    if (!this.canPlayGameSound() || !this.ambientAudio) return
    this.updateAmbientVolume()
    const ambientPromise = this.ambientAudio.play()
    if (ambientPromise !== undefined) {
      ambientPromise.catch(() => {})
    }
  }

  playBGM() {
    if (this.isBattleMusicPlaying) return
    if (!this.canPlayGameSound()) return
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.activeConstructions.size > 0 
        ? Math.max(0.05, this.bgmVolume * 0.35) 
        : this.bgmVolume
      const playPromise = this.bgmAudio.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {})
      }
    }
    this.playAmbient()
  }

  pauseBGM(pauseAmbient = false) {
    if (this.bgmAudio) {
      this.bgmAudio.pause()
    }
    if (pauseAmbient && this.ambientAudio) {
      this.ambientAudio.pause()
    } else {
      if (this.isBattleMusicPlaying) return
      // If only music is paused/cut, keep playing map sound effects!
      this.isMusicInBreak = true
      this.updateAmbientVolume()
      if (this.canPlayGameSound() && this.ambientAudio && this.ambientAudio.paused) {
        this.ambientAudio.play().catch(() => {})
      }
    }
  }

  stopBGM(stopAmbient = false) {
    if (this.bgmAudio) {
      this.bgmAudio.pause()
      this.bgmAudio.currentTime = 0
    }
    if (stopAmbient && this.ambientAudio) {
      this.ambientAudio.pause()
      this.ambientAudio.currentTime = 0
    } else {
      if (this.isBattleMusicPlaying) return
      this.isMusicInBreak = true
      this.updateAmbientVolume()
      if (this.canPlayGameSound() && this.ambientAudio && this.ambientAudio.paused) {
        this.ambientAudio.play().catch(() => {})
      }
    }
  }

  playBattleMusic() {
    this.isBattleMusicPlaying = true

    // 1. Immediately pause and mute Kingdom BGM
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause()
        this.bgmAudio.currentTime = 0
      } catch {}
    }

    // 2. Immediately pause, mute and reset Kingdom Ambient (birds, waterfall, chimes)
    if (this.ambientAudio) {
      try {
        this.ambientAudio.volume = 0
        this.ambientAudio.pause()
        this.ambientAudio.currentTime = 0
      } catch {}
    }

    // 3. Immediately pause and mute all kingdom construction audio loops
    this.activeConstructions.forEach((audio) => {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch {}
    })

    // 4. Immediately stop any current building audio
    this.stopBuildingSound()

    // 5. Play Battle BGM
    if (!this.canPlayGameSound()) return
    this.initCtx()

    if (this.battleAudio) {
      this.battleAudio.volume = this.bgmVolume
      const p = this.battleAudio.play()
      if (p !== undefined) {
        p.catch(() => {})
      }
    }
  }

  stopBattleMusic(resumeKingdom = true) {
    this.isBattleMusicPlaying = false
    if (this.battleAudio) {
      try {
        this.battleAudio.pause()
        this.battleAudio.currentTime = 0
      } catch {}
    }
    if (resumeKingdom && this.canPlayGameSound()) {
      // Restore active kingdom construction audio loops if any are still in progress
      this.activeConstructions.forEach((audio) => {
        try {
          audio.play().catch(() => {})
        } catch {}
      })
      this.playAmbient()
      this.playBGM()
    }
  }

  setBGMVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, vol))
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.activeConstructions.size > 0 
        ? Math.max(0.05, this.bgmVolume * 0.35) 
        : this.bgmVolume
    }
    if (this.battleAudio) {
      this.battleAudio.volume = this.bgmVolume
    }
    this.updateAmbientVolume()
  }

  setSFXVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol))
    this.activeConstructions.forEach((audio) => {
      audio.volume = Math.min(1, this.sfxVolume * 0.95)
    })
    if (this.clickAudio) {
      this.clickAudio.volume = Math.min(1, this.sfxVolume * 0.5)
    }
  }

  setAmbientVolume(vol) {
    this.ambientVolume = Math.max(0, Math.min(1, vol))
    this.updateAmbientVolume()
    if (this.canPlayGameSound() && this.ambientAudio && this.ambientVolume > 0 && this.ambientAudio.paused) {
      this.ambientAudio.play().catch(() => {})
    }
  }

  getRandomPitch(amount = 0.12) {
    return 1 + (Math.random() - 0.5) * (amount * 2)
  }

  getNoiseBuffer(duration = 0.5) {
    if (!this.audioCtx) return null
    if (!this.noiseBuffer) {
      const bufferSize = Math.floor(this.audioCtx.sampleRate * 1.0)
      this.noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate)
      const data = this.noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
    }
    return this.noiseBuffer
  }

  playClick() {
    if (!this.enabled) return
    this.hasUserInteracted = true
    this.initCtx()
    if (!this.audioCtx) {
      if (this.clickAudio) {
        this.clickAudio.currentTime = 0
        this.clickAudio.volume = Math.min(1, this.sfxVolume * 0.5)
        this.clickAudio.play().catch(() => {})
      }
      return
    }

    try {
      const now = this.audioCtx.currentTime
      const pitchMod = this.getRandomPitch(0.10)

      // Organic tactile click (medieval wood/parchment snap)
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(620 * pitchMod, now)
      osc.frequency.exponentialRampToValueAtTime(140 * pitchMod, now + 0.04)

      gain.gain.setValueAtTime(0.20 * this.sfxVolume, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045)

      osc.connect(gain)
      gain.connect(this.audioCtx.destination)
      osc.start(now)
      osc.stop(now + 0.045)
    } catch {
      if (this.clickAudio) {
        this.clickAudio.currentTime = 0
        this.clickAudio.play().catch(() => {})
      }
    }
  }

  playButtonClick() {
    this.playClick()
  }

  // Starts continuous looping audio during construction
  startConstructionAudio(buildingId, slotId = 'default') {
    if (!this.canPlayGameSound() || this.isBattleMusicPlaying) return
    this.initCtx()

    // Stop any existing construction audio for this slot
    this.stopConstructionAudio(slotId)

    const normalizedId = (buildingId || '').toLowerCase()
    const src = BUILDING_SOUND_MAP[normalizedId] || '/assets/sounds/castle_build.ogg'

    try {
      const audio = new Audio(src)
      audio.loop = true
      audio.volume = Math.min(1, this.sfxVolume * 0.95)

      // Duck BGM so construction sound is prominent
      if (this.bgmAudio) {
        this.bgmAudio.volume = Math.max(0.05, this.bgmVolume * 0.35)
      }

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn(`Autoplay prevented for ${buildingId} construction sound`, err)
        })
      }

      this.activeConstructions.set(slotId, audio)
    } catch (e) {
      console.error('Error starting construction audio:', e)
    }
  }

  // Stops construction looping audio when construction finishes or is demolished
  stopConstructionAudio(slotId = 'default') {
    if (this.activeConstructions.has(slotId)) {
      const audio = this.activeConstructions.get(slotId)
      try {
        audio.pause()
        audio.currentTime = 0
      } catch {
        // ignore
      }
      this.activeConstructions.delete(slotId)
    }

    // Restore BGM if no more buildings are under construction
    if (this.activeConstructions.size === 0 && this.bgmAudio && this.enabled) {
      this.bgmAudio.volume = this.bgmVolume
    }
  }

  // Celebratory fanfare when construction completes (100%)
  playBuildComplete() {
    if (!this.canPlayGameSound() || this.isBattleMusicPlaying) return
    this.initCtx()
    if (!this.audioCtx) return

    try {
      const now = this.audioCtx.currentTime
      const notes = [
        { freq: 523.25, time: 0.00, dur: 0.15 }, // C5
        { freq: 659.25, time: 0.10, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.20, dur: 0.18 }, // G5
        { freq: 1046.50, time: 0.32, dur: 0.50 }, // C6
      ]

      notes.forEach(({ freq, time, dur }) => {
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + time)
        gain.gain.setValueAtTime(0.20 * this.sfxVolume, now + time)
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur)
        osc.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start(now + time)
        osc.stop(now + time + dur)
      })
    } catch {
      // ignore
    }
  }

  playBuild(buildingId = null) {
    if (!this.canPlayGameSound() || this.isBattleMusicPlaying) return
    if (buildingId) {
      this.playBuildingSound(buildingId, true)
      return
    }
    this.initCtx()
    if (!this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(260, now)
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.15)
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
      osc.connect(gain)
      gain.connect(this.audioCtx.destination)
      osc.start(now)
      osc.stop(now + 0.25)
    } catch {
      // AudioContext blocked
    }
  }

  playBuildingSound(buildingId, isConstructing = false) {
    if (!this.canPlayGameSound() || this.isBattleMusicPlaying) return
    this.stopBuildingSound()

    const normalizedId = (buildingId || '').toLowerCase()
    let src
    if (isConstructing) {
      src = BUILDING_SOUND_MAP[normalizedId] || '/assets/sounds/castle_build.ogg'
    } else {
      src = BUILDING_IDLE_MAP[normalizedId] || BUILDING_SOUND_MAP[normalizedId] || '/assets/sounds/castle_build.ogg'
    }

    if (src) {
      try {
        if (!this.combatSoundCache) this.combatSoundCache = {}
        if (!this.combatSoundCache[src]) {
          const audio = new Audio(src)
          audio.preload = 'auto'
          this.combatSoundCache[src] = audio
        }
        const sound = this.combatSoundCache[src]
        sound.currentTime = 0
        sound.volume = Math.min(1, this.sfxVolume * 0.90)
        sound.play().catch(() => {})
        this.currentBuildingAudio = sound
      } catch {}
    }
  }

  stopBuildingSound() {
    if (this.currentBuildingAudio) {
      try {
        this.currentBuildingAudio.pause()
        this.currentBuildingAudio.currentTime = 0
      } catch {}
      this.currentBuildingAudio = null
    }
  }

  playCollect(resourceType = 'gold') {
    if (!this.canPlayGameSound() || this.isBattleMusicPlaying) return
    this.initCtx()
    if (!this.audioCtx) return

    try {
      const now = this.audioCtx.currentTime
      // Reset combo chain if more than 1.4s has elapsed since last collect
      if (Date.now() - this.lastCollectTime > 1400) {
        this.collectChainCount = 0
      }
      this.lastCollectTime = Date.now()
      const step = this.collectChainCount % 7
      this.collectChainCount++

      // Ascending pentatonic chord sequence (C5, D5, E5, G5, A5, C6, E6)
      const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1318.51]
      const baseFreq = scale[step] || 523.25
      const pitchMod = this.getRandomPitch(0.05)
      const freq = baseFreq * pitchMod

      const normType = (resourceType || '').toLowerCase()

      if (normType.includes('wood') || normType.includes('madera')) {
        // Resonant wooden marimba strike
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq * 0.75, now)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + 0.18)
        gain.gain.setValueAtTime(0.28 * this.sfxVolume, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
        osc.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start(now)
        osc.stop(now + 0.18)
      } else if (normType.includes('stone') || normType.includes('piedra')) {
        // Granite mineral strike
        const osc1 = this.audioCtx.createOscillator()
        const osc2 = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc1.type = 'square'
        osc2.type = 'sine'
        osc1.frequency.setValueAtTime(freq * 0.9, now)
        osc2.frequency.setValueAtTime(freq * 1.5, now)
        gain.gain.setValueAtTime(0.20 * this.sfxVolume, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc1.start(now)
        osc2.start(now)
        osc1.stop(now + 0.14)
        osc2.stop(now + 0.14)
      } else if (normType.includes('gem') || normType.includes('cristal')) {
        // Celestial glass bell chime (smooth dual sine waves, gentle harmonics)
        const bell1 = this.audioCtx.createOscillator()
        const bell2 = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        bell1.type = 'sine'
        bell2.type = 'sine'
        bell1.frequency.setValueAtTime(freq * 1.25, now)
        bell2.frequency.setValueAtTime(freq * 1.5, now)
        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
        bell1.connect(gain)
        bell2.connect(gain)
        gain.connect(this.audioCtx.destination)
        bell1.start(now)
        bell2.start(now)
        bell1.stop(now + 0.35)
        bell2.stop(now + 0.35)
      } else {
        // Gold / Default: Double bell chime (root + fifth overtone, pure warm sine)
        const osc1 = this.audioCtx.createOscillator()
        const osc2 = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc1.type = 'sine'
        osc2.type = 'sine'
        osc1.frequency.setValueAtTime(freq, now)
        osc2.frequency.setValueAtTime(freq * 1.5, now)
        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc1.start(now)
        osc2.start(now)
        osc1.stop(now + 0.22)
        osc2.stop(now + 0.22)
      }
    } catch {}
  }

  playPopChime(pitchMultiplier = 1) {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return

    // Throttle chimes to at most once every 110ms to prevent overlapping oscillator interference
    const nowMs = Date.now()
    if (this.lastPopChimeTime && nowMs - this.lastPopChimeTime < 110) {
      return
    }
    this.lastPopChimeTime = nowMs

    try {
      const now = this.audioCtx.currentTime
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      osc.type = 'sine' // Warm, smooth sine wave instead of harsh triangle
      const baseFreq = 659.25 * pitchMultiplier * this.getRandomPitch(0.03) // E5 soft chime
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.18, now + 0.08)
      gain.gain.setValueAtTime(0.08 * this.sfxVolume, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
      osc.connect(gain)
      gain.connect(this.audioCtx.destination)
      osc.start(now)
      osc.stop(now + 0.12)
    } catch {}
  }

  playSynthTone(freq, duration, type = 'sine') {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq * this.getRandomPitch(0.04), now)
      gain.gain.setValueAtTime(0.14 * this.sfxVolume, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
      osc.connect(gain)
      gain.connect(this.audioCtx.destination)
      osc.start(now)
      osc.stop(now + duration)
    } catch {}
  }

  playPurchaseFanfare() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51] // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator()
        const oscSub = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc.type = 'triangle'
        oscSub.type = 'sine'
        const t = now + idx * 0.09
        osc.frequency.setValueAtTime(freq, t)
        oscSub.frequency.setValueAtTime(freq * 0.5, t)
        gain.gain.setValueAtTime(0.01, t)
        gain.gain.linearRampToValueAtTime(0.24 * this.sfxVolume, t + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
        osc.connect(gain)
        oscSub.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start(t)
        oscSub.start(t)
        osc.stop(t + 0.45)
        oscSub.stop(t + 0.45)
      })
    } catch {}
  }

  playWheelTick() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      const pitchMod = this.getRandomPitch(0.12)
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(1250 * pitchMod, now)
      gain.gain.setValueAtTime(0.10 * this.sfxVolume, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)
      osc.connect(gain)
      gain.connect(this.audioCtx.destination)
      osc.start(now)
      osc.stop(now + 0.025)
    } catch {}
  }

  playSpeedup() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      // Time-warp rush: rising filtered whoosh + sparkling harmonic glissando
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(280, now)
      osc.frequency.exponentialRampToValueAtTime(1550, now + 0.28)
      gain.gain.setValueAtTime(0.20 * this.sfxVolume, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32)
      osc.connect(gain)
      gain.connect(this.audioCtx.destination)
      osc.start(now)
      osc.stop(now + 0.32)

      const sparkle = this.audioCtx.createOscillator()
      const sGain = this.audioCtx.createGain()
      sparkle.type = 'sine'
      sparkle.frequency.setValueAtTime(800, now + 0.05)
      sparkle.frequency.exponentialRampToValueAtTime(2400, now + 0.32)
      sGain.gain.setValueAtTime(0.15 * this.sfxVolume, now + 0.05)
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      sparkle.connect(sGain)
      sGain.connect(this.audioCtx.destination)
      sparkle.start(now + 0.05)
      sparkle.stop(now + 0.35)
    } catch {}
  }

  playRevival() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      // Celestial revival blooming chord
      const freqs = [330.0, 440.0, 554.37, 659.25, 880.0]
      freqs.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc.type = 'sine'
        const t = now + idx * 0.06
        osc.frequency.setValueAtTime(freq, t)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.45)
        gain.gain.setValueAtTime(0.01, t)
        gain.gain.linearRampToValueAtTime(0.22 * this.sfxVolume, t + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
        osc.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start(t)
        osc.stop(t + 0.55)
      })
    } catch {}
  }

  playArenaVictory() {
    this.playVictory()
  }

  playArenaDefeat() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      // Solemn minor descent: E4 -> C4 -> G#3 -> E3
      const notes = [
        { freq: 329.63, time: 0.00, dur: 0.35 },
        { freq: 261.63, time: 0.28, dur: 0.35 },
        { freq: 207.65, time: 0.56, dur: 0.45 },
        { freq: 164.81, time: 0.90, dur: 0.85 },
      ]
      notes.forEach((n) => {
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(n.freq, now + n.time)
        osc.frequency.linearRampToValueAtTime(n.freq * 0.96, now + n.time + n.dur)
        gain.gain.setValueAtTime(0.18 * this.sfxVolume, now + n.time)
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur)
        osc.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start(now + n.time)
        osc.stop(now + n.time + n.dur)
      })
    } catch {}
  }

  playRankUp() {
    this.playLevelUp()
  }

  playHeroAttack() {
    if (!this.canPlayGameSound()) return
    const rate = 0.94 + Math.random() * 0.12
    const vol = 0.85 * this.sfxVolume
    if (this.sfxPool) {
      this.sfxPool.play('/assets/audio/hero_attack.ogg', vol, rate)
    }
    this.playSwordSwing()
  }

  playCombatSound(src, volume = 0.9, randomizePitch = true) {
    if (!this.canPlayGameSound() || !src) return
    const rate = randomizePitch ? (0.94 + Math.random() * 0.12) : 1
    const vol = Math.min(1, this.sfxVolume * volume)
    if (this.sfxPool) {
      this.sfxPool.play(src, vol, rate)
    }
  }

  playHeroAttackEnemy(enemyType = 'orc') {
    const soundMap = {
      orc: '/assets/sounds/hero_attack_orc.ogg',
      mino: '/assets/sounds/hero_attack_minotaur.ogg',
      miniboss: '/assets/sounds/hero_attack_miniboss.ogg',
      boss: '/assets/sounds/hero_attack_boss.ogg',
    }
    const src = soundMap[enemyType] || soundMap.orc
    this.playCombatSound(src, 0.95, true)
    this.playSwordSwing()
  }

  playEnemyAttack(enemyType = 'orc') {
    const soundMap = {
      orc: '/assets/sounds/orc_attack.ogg',
      mino: '/assets/sounds/minotaur_attack.ogg',
      miniboss: '/assets/sounds/miniboss_attack.ogg',
      boss: '/assets/sounds/boss_attack.ogg',
    }
    const src = soundMap[enemyType] || soundMap.orc
    this.playCombatSound(src, 0.95, true)
    this.playMonsterRoar(enemyType)
  }

  playMonsterRoar(type = 'orc') {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return

    try {
      const now = this.audioCtx.currentTime
      const pitchMod = this.getRandomPitch(0.15)
      const norm = (type || '').toLowerCase()

      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      const filter = this.audioCtx.createBiquadFilter()

      if (norm.includes('boss') || norm.includes('miniboss')) {
        // Demonic Abyssal Roar
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(140 * pitchMod, now)
        osc.frequency.linearRampToValueAtTime(75 * pitchMod, now + 0.35)
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(650, now)
        gain.gain.setValueAtTime(0.35 * this.sfxVolume, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
      } else if (norm.includes('mino')) {
        // Guttural Bull Bellow
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(95 * pitchMod, now)
        osc.frequency.linearRampToValueAtTime(55 * pitchMod, now + 0.3)
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(450, now)
        gain.gain.setValueAtTime(0.32 * this.sfxVolume, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
      } else {
        // Orc Snarl
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(220 * pitchMod, now)
        osc.frequency.exponentialRampToValueAtTime(90 * pitchMod, now + 0.22)
        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(520, now)
        gain.gain.setValueAtTime(0.28 * this.sfxVolume, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      }

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.audioCtx.destination)
      osc.start(now)
      osc.stop(now + 0.45)
    } catch {}
  }

  playSwordSwing(variant = null) {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return

    try {
      const now = this.audioCtx.currentTime
      const pitchMod = this.getRandomPitch(0.14)
      const v = variant !== null ? variant : Math.floor(Math.random() * 4)

      // Layer 1: Modulated air whoosh (white noise passed through resonant bandpass)
      const noiseBuf = this.getNoiseBuffer(0.3)
      if (noiseBuf) {
        const noiseSrc = this.audioCtx.createBufferSource()
        noiseSrc.buffer = noiseBuf

        const filter = this.audioCtx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.Q.setValueAtTime(3.2, now)

        const startFreq = [3200, 2400, 2800, 1900][v] * pitchMod
        const endFreq = [500, 320, 420, 260][v] * pitchMod
        const duration = [0.15, 0.19, 0.16, 0.22][v]

        filter.frequency.setValueAtTime(startFreq, now)
        filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration)

        const noiseGain = this.audioCtx.createGain()
        noiseGain.gain.setValueAtTime(0.01, now)
        noiseGain.gain.linearRampToValueAtTime(0.32 * this.sfxVolume, now + 0.035)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration)

        noiseSrc.connect(filter)
        filter.connect(noiseGain)
        noiseGain.connect(this.audioCtx.destination)

        noiseSrc.start(now)
        noiseSrc.stop(now + duration)
      }

      // Layer 2: Steel blade whistle / cleave harmonic
      const bladeOsc = this.audioCtx.createOscillator()
      const bladeGain = this.audioCtx.createGain()
      bladeOsc.type = v % 2 === 0 ? 'triangle' : 'sine'

      const bladeStart = [880, 680, 780, 560][v] * pitchMod
      const bladeEnd = [180, 120, 150, 95][v] * pitchMod

      bladeOsc.frequency.setValueAtTime(bladeStart, now)
      bladeOsc.frequency.exponentialRampToValueAtTime(bladeEnd, now + 0.16)

      bladeGain.gain.setValueAtTime(0.18 * this.sfxVolume, now)
      bladeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)

      bladeOsc.connect(bladeGain)
      bladeGain.connect(this.audioCtx.destination)
      bladeOsc.start(now)
      bladeOsc.stop(now + 0.16)
    } catch {}
  }

  playHit(typeOrEnemy = 'default') {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return

    try {
      const now = this.audioCtx.currentTime
      const pitchMod = this.getRandomPitch(0.18) // Natural acoustic variation
      const v = Math.floor(Math.random() * 5)

      // 1. Sub-bass body thump (adds visceral weight to every strike)
      const subOsc = this.audioCtx.createOscillator()
      const subGain = this.audioCtx.createGain()
      subOsc.type = 'sine'
      const subStart = [120, 105, 135, 95, 115][v] * pitchMod
      subOsc.frequency.setValueAtTime(subStart, now)
      subOsc.frequency.exponentialRampToValueAtTime(32 * pitchMod, now + 0.14)
      subGain.gain.setValueAtTime(0.42 * this.sfxVolume, now)
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      subOsc.connect(subGain)
      subGain.connect(this.audioCtx.destination)
      subOsc.start(now)
      subOsc.stop(now + 0.15)

      // 2. Flesh/Armor/Bone impact transient crunch
      const noiseBuf = this.getNoiseBuffer(0.18)
      if (noiseBuf) {
        const noiseSrc = this.audioCtx.createBufferSource()
        noiseSrc.buffer = noiseBuf

        const filter = this.audioCtx.createBiquadFilter()
        filter.type = v === 1 || v === 3 ? 'bandpass' : 'lowpass'
        filter.frequency.setValueAtTime((1100 + v * 280) * pitchMod, now)
        filter.frequency.exponentialRampToValueAtTime(160, now + 0.12)

        const noiseGain = this.audioCtx.createGain()
        noiseGain.gain.setValueAtTime(0.36 * this.sfxVolume, now)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

        noiseSrc.connect(filter)
        filter.connect(noiseGain)
        noiseGain.connect(this.audioCtx.destination)
        noiseSrc.start(now)
        noiseSrc.stop(now + 0.12)
      }

      // 3. Resonant strike tone (metallic armor clank or blunt force)
      const strikeOsc = this.audioCtx.createOscillator()
      const strikeGain = this.audioCtx.createGain()
      strikeOsc.type = v === 1 ? 'sawtooth' : v === 2 ? 'triangle' : 'square'

      const midFreq = [320, 540, 260, 480, 390][v] * pitchMod
      strikeOsc.frequency.setValueAtTime(midFreq, now)
      strikeOsc.frequency.exponentialRampToValueAtTime(80 * pitchMod, now + 0.14)

      strikeGain.gain.setValueAtTime(0.25 * this.sfxVolume, now)
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)

      strikeOsc.connect(strikeGain)
      strikeGain.connect(this.audioCtx.destination)
      strikeOsc.start(now)
      strikeOsc.stop(now + 0.14)
    } catch {}
  }

  playCriticalHit() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return

    try {
      const now = this.audioCtx.currentTime
      const pitchMod = this.getRandomPitch(0.12)

      // 1. Time-dilation energy whoosh
      const whooshOsc = this.audioCtx.createOscillator()
      const whooshGain = this.audioCtx.createGain()
      whooshOsc.type = 'sine'
      whooshOsc.frequency.setValueAtTime(160 * pitchMod, now)
      whooshOsc.frequency.exponentialRampToValueAtTime(980 * pitchMod, now + 0.12)
      whooshGain.gain.setValueAtTime(0.01, now)
      whooshGain.linearRampToValueAtTime(0.30 * this.sfxVolume, now + 0.1)
      whooshGain.exponentialRampToValueAtTime(0.001, now + 0.2)
      whooshOsc.connect(whooshGain)
      whooshGain.connect(this.audioCtx.destination)
      whooshOsc.start(now)
      whooshOsc.stop(now + 0.2)

      // 2. Earth-shaking sub-bass shockwave
      const sub = this.audioCtx.createOscillator()
      const subGain = this.audioCtx.createGain()
      sub.type = 'sine'
      sub.frequency.setValueAtTime(160 * pitchMod, now + 0.05)
      sub.frequency.exponentialRampToValueAtTime(26 * pitchMod, now + 0.48)
      subGain.gain.setValueAtTime(0.65 * this.sfxVolume, now + 0.05)
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      sub.connect(subGain)
      subGain.connect(this.audioCtx.destination)
      sub.start(now + 0.05)
      sub.stop(now + 0.5)

      // 3. Heavy cleave crunch
      const crunchBuf = this.getNoiseBuffer(0.25)
      if (crunchBuf) {
        const src = this.audioCtx.createBufferSource()
        src.buffer = crunchBuf
        const filter = this.audioCtx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(1400 * pitchMod, now + 0.06)
        filter.Q.setValueAtTime(2.0, now + 0.06)
        const gain = this.audioCtx.createGain()
        gain.gain.setValueAtTime(0.48 * this.sfxVolume, now + 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32)
        src.connect(filter)
        filter.connect(gain)
        gain.connect(this.audioCtx.destination)
        src.start(now + 0.06)
        src.stop(now + 0.32)
      }

      // 4. Shimmering glass/steel cleave harmonics
      const harmonics = [1174.66, 1760.0, 2349.32] // D6, A6, D7
      harmonics.forEach((f, idx) => {
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(f * pitchMod, now + 0.06 + idx * 0.015)
        gain.gain.setValueAtTime((0.22 / (idx + 1)) * this.sfxVolume, now + 0.06 + idx * 0.015)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        osc.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start(now + 0.06 + idx * 0.015)
        osc.stop(now + 0.4)
      })
    } catch {}
  }

  playShieldBlock() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return

    try {
      const now = this.audioCtx.currentTime
      const pitchMod = this.getRandomPitch(0.12)

      // Ringing high steel parry
      const bell = this.audioCtx.createOscillator()
      const bellGain = this.audioCtx.createGain()
      bell.type = 'sine'
      bell.frequency.setValueAtTime(2150 * pitchMod, now)
      bellGain.gain.setValueAtTime(0.35 * this.sfxVolume, now)
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      bell.connect(bellGain)
      bellGain.connect(this.audioCtx.destination)
      bell.start(now)
      bell.stop(now + 0.35)

      // Iron deflection thud
      const thud = this.audioCtx.createOscillator()
      const thudGain = this.audioCtx.createGain()
      thud.type = 'triangle'
      thud.frequency.setValueAtTime(180 * pitchMod, now)
      thud.frequency.exponentialRampToValueAtTime(60 * pitchMod, now + 0.12)
      thudGain.gain.setValueAtTime(0.30 * this.sfxVolume, now)
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
      thud.connect(thudGain)
      thudGain.connect(this.audioCtx.destination)
      thud.start(now)
      thud.stop(now + 0.12)
    } catch {}
  }

  playHammer() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return

    try {
      const now = this.audioCtx.currentTime
      const pitchMod = this.getRandomPitch(0.14)

      // Anvil high metallic ring
      const ring = this.audioCtx.createOscillator()
      const ringGain = this.audioCtx.createGain()
      ring.type = 'sine'
      ring.frequency.setValueAtTime(1450 * pitchMod, now)
      ringGain.gain.setValueAtTime(0.24 * this.sfxVolume, now)
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
      ring.connect(ringGain)
      ringGain.connect(this.audioCtx.destination)
      ring.start(now)
      ring.stop(now + 0.22)

      // Heavy hammer impact
      const strike = this.audioCtx.createOscillator()
      const strikeGain = this.audioCtx.createGain()
      strike.type = 'triangle'
      strike.frequency.setValueAtTime(320 * pitchMod, now)
      strikeGain.gain.setValueAtTime(0.28 * this.sfxVolume, now)
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
      strike.connect(strikeGain)
      strikeGain.connect(this.audioCtx.destination)
      strike.start(now)
      strike.stop(now + 0.09)
    } catch {}
  }

  playVictory() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return

    try {
      const now = this.audioCtx.currentTime
      // Regal celebratory fanfare: D4, F#4, A4, D5, F#5, A5
      const notes = [
        { freq: 293.66, time: 0.00, dur: 0.14 }, // D4
        { freq: 369.99, time: 0.12, dur: 0.14 }, // F#4
        { freq: 440.00, time: 0.24, dur: 0.16 }, // A4
        { freq: 587.33, time: 0.38, dur: 0.22 }, // D5
        { freq: 739.99, time: 0.58, dur: 0.28 }, // F#5
        { freq: 880.00, time: 0.84, dur: 0.85 }, // Triumphant high A5 hold
      ]

      notes.forEach(({ freq, time, dur }) => {
        const osc = this.audioCtx.createOscillator()
        const oscSub = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()

        osc.type = 'triangle'
        oscSub.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + time)
        oscSub.frequency.setValueAtTime(freq * 0.5, now + time)

        gain.gain.setValueAtTime(0.01, now + time)
        gain.gain.linearRampToValueAtTime(0.35 * this.sfxVolume, now + time + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur)

        osc.connect(gain)
        oscSub.connect(gain)
        gain.connect(this.audioCtx.destination)

        osc.start(now + time)
        oscSub.start(now + time)
        osc.stop(now + time + dur)
        oscSub.stop(now + time + dur)
      })
    } catch {}
  }

  playLevelUp() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return

    try {
      const now = this.audioCtx.currentTime
      // Majestic ascending harp glissando + triumphant golden chord
      const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51]
      arpeggio.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc.type = 'sine'
        const t = now + idx * 0.07
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0.26 * this.sfxVolume, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
        osc.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start(t)
        osc.stop(t + 0.4)
      })

      // Sustained chord on finale (C5 + E5 + G5 + C6)
      const chordTime = now + arpeggio.length * 0.07
      const chord = [523.25, 659.25, 783.99, 1046.50]
      chord.forEach((freq) => {
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, chordTime)
        gain.gain.setValueAtTime(0.25 * this.sfxVolume, chordTime)
        gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 1.2)
        osc.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start(chordTime)
        osc.stop(chordTime + 1.2)
      })
    } catch {}
  }

  playQuestSuccess() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      const notes = [
        { freq: 587.33, time: 0.00, dur: 0.14 }, // D5
        { freq: 739.99, time: 0.12, dur: 0.14 }, // F#5
        { freq: 880.00, time: 0.24, dur: 0.18 }, // A5
        { freq: 1174.66, time: 0.38, dur: 0.55 }, // D6
      ]
      notes.forEach(({ freq, time, dur }) => {
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq * this.getRandomPitch(0.04), now + time)
        gain.gain.setValueAtTime(0.35 * this.sfxVolume, now + time)
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur)
        osc.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start(now + time)
        osc.stop(now + time + dur)
      })
    } catch {}
  }

  playHorn() {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx || this.audioCtx.state === 'suspended') return

    try {
      const now = this.audioCtx.currentTime
      // Royal herald war horn call: F3, C4, F4, A4
      const notes = [
        { freq: 174.61, time: 0.00, dur: 0.18 }, // F3
        { freq: 261.63, time: 0.16, dur: 0.18 }, // C4
        { freq: 349.23, time: 0.32, dur: 0.24 }, // F4
        { freq: 440.00, time: 0.54, dur: 0.75 }, // A4 hold
      ]

      notes.forEach(({ freq, time, dur }) => {
        const osc1 = this.audioCtx.createOscillator()
        const osc2 = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        const filter = this.audioCtx.createBiquadFilter()

        osc1.type = 'sawtooth'
        osc2.type = 'triangle'
        osc1.frequency.setValueAtTime(freq, now + time)
        osc2.frequency.setValueAtTime(freq * 1.005, now + time) // Warm chorus

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(freq * 2.8, now + time)
        filter.frequency.linearRampToValueAtTime(freq * 3.5, now + time + 0.08)
        filter.frequency.exponentialRampToValueAtTime(freq * 1.8, now + time + dur)

        gain.gain.setValueAtTime(0.01, now + time)
        gain.gain.linearRampToValueAtTime(0.32 * this.sfxVolume, now + time + 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur)

        osc1.connect(filter)
        osc2.connect(filter)
        filter.connect(gain)
        gain.connect(this.audioCtx.destination)

        osc1.start(now + time)
        osc2.start(now + time)
        osc1.stop(now + time + dur)
        osc2.stop(now + time + dur)
      })
    } catch {}
  }

  playSpellCast(school = 'arcane') {
    if (!this.canPlayGameSound()) return
    this.initCtx()
    if (!this.audioCtx) return

    try {
      const now = this.audioCtx.currentTime
      const pitchMod = this.getRandomPitch(0.12)
      // Enchanted magic arpeggio with sweeping high resonance
      const notes = [659.25, 880.00, 1174.66, 1760.00]
      notes.forEach((f, idx) => {
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc.type = 'sine'
        const t = now + idx * 0.05
        osc.frequency.setValueAtTime(f * pitchMod, t)
        gain.gain.setValueAtTime(0.22 * this.sfxVolume, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
        osc.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start(t)
        osc.stop(t + 0.25)
      })
    } catch {}
  }

  playGoldJingle() {
    this.playCollect('gold')
  }

  playWoodChop() {
    this.playCollect('wood')
  }

  playStoneMine() {
    this.playCollect('stone')
  }

  playGemChime() {
    this.playCollect('gems')
  }

  toggleSound() {
    this.enabled = !this.enabled
    if (this.enabled && this.gameStarted) {
      if (this.isBattleMusicPlaying) {
        this.playBattleMusic()
      } else {
        this.playBGM()
      }
    } else {
      this.pauseBGM(true)
      if (this.battleAudio) {
        this.battleAudio.pause()
      }
      this.stopBuildingSound()
      this.activeConstructions.forEach((audio) => {
        try {
          audio.pause()
        } catch {}
      })
    }
    return this.enabled
  }
}

export const soundManager = new SoundController()

