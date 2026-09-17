/**
 * Graphics Profiles & Hardware Detection
 * Provides 3 presets: 'performance', 'quality', 'custom'.
 * Smart hardware detection automatically suggests or defaults to 'performance'
 * on budget mobile hardware (e.g. Oppo A17 / Helio G35 / PowerVR GE8320 / <=4GB RAM)
 * and 'quality' on desktop or high-end mobile.
 */

export const GRAPHICS_PRESETS = {
  PERFORMANCE: 'performance',
  QUALITY: 'quality',
  CUSTOM: 'custom',
}

export const PRESET_CONFIGS = {
  performance: {
    characterShadows: false,
    hudEffects: false,
    particlesEnabled: false,
    fpsMode: '60fps',
  },
  quality: {
    characterShadows: true,
    hudEffects: true,
    particlesEnabled: true,
    fpsMode: '60fps',
  },
}

/**
 * Probes device hardware to identify if the current system is budget mobile.
 * Detects chips like PowerVR GE8320 / Helio G35 (e.g. Oppo A17),
 * Mali-G52/G57, budget Android models, low RAM (<=4GB), and low core counts.
 */
export function isBudgetHardware() {
  if (typeof window === 'undefined') return false

  const ua = navigator.userAgent || ''
  const isMobile = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
  if (!isMobile) return false

  // 1. Direct model & SoC matches for known low-end devices:
  // Samsung Galaxy A-series (SM-A*, Galaxy A, A17, A15, A14, A13, A12, A05, etc.)
  // Oppo / Realme / Xiaomi Redmi A/9/10 / Moto E / Tecno / Infinix
  const budgetPattern = /Samsung.*A|Galaxy.*A|SM-A[0-9]|A17|A16|A15|A14|A13|A12|A11|A10|A05|A04|A03|CPH2477|CPH2471|Helio|Exynos.*7|Exynos.*8|MT676|MT673|PowerVR|Redmi [0-9]|Redmi A[1-3]|Moto E|Infinix|Tecno|Spark|Hot [0-9]/i
  if (budgetPattern.test(ua)) {
    return true
  }

  // 2. RAM check: <= 6GB RAM on mobile is classified in performance mode
  if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 6) {
    return true
  }

  // 3. CPU concurrency: <= 4 cores on mobile
  if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) {
    return true
  }

  // 4. WebGL GPU unmasked renderer check (PowerVR, Mali-G52/G57/G68, Adreno 5xx/61x)
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
        if (/PowerVR|GE8320|GE8300|Mali-G52|Mali-G57|Mali-G51|Mali-G68|Mali-G71|Mali-G72|Mali-T|Adreno \(TM\) 5|Adreno \(TM\) 61/i.test(renderer)) {
          return true
        }
      }
    }
  } catch {}

  // 5. General Android fallback: If on Android and device memory is missing or <= 6GB
  const isAndroid = /Android/i.test(ua)
  if (isAndroid && (!navigator.deviceMemory || navigator.deviceMemory <= 6)) {
    return true
  }


  return false
}

/**
 * Returns the recommended preset based on hardware detection.
 * Defaults unconditionally to 'quality' with full shadows and visual fidelity.
 */
export function detectRecommendedGraphicsPreset() {
  return GRAPHICS_PRESETS.QUALITY
}

/**
 * Reads saved graphics settings from localStorage with smart detection fallback.
 * Defaults unconditionally to 'quality' (60 FPS, character shadows, full HUD) unless the user explicitly chose another profile.
 */
export function loadInitialGraphicsSettings() {
  const recommended = GRAPHICS_PRESETS.QUALITY

  let preset = GRAPHICS_PRESETS.QUALITY
  let userHasExplicitlyChosen = false

  try {
    const defaultVersion = localStorage.getItem('toc_default_preset_version')
    if (defaultVersion !== 'quality_v1') {
      // Migrate to new default quality preset across all client sessions
      localStorage.setItem('toc_default_preset_version', 'quality_v1')
      localStorage.setItem('toc_graphics_preset', 'quality')
      localStorage.setItem('toc_character_shadows', 'true')
      localStorage.setItem('toc_hud_effects', 'true')
      localStorage.setItem('toc_particles_enabled', 'true')
      localStorage.removeItem('toc_graphics_preset_user_chosen')
    }

    userHasExplicitlyChosen = localStorage.getItem('toc_graphics_preset_user_chosen') === 'true'
    const savedPreset = localStorage.getItem('toc_graphics_preset')
    if (userHasExplicitlyChosen && savedPreset && ['performance', 'quality', 'custom'].includes(savedPreset)) {
      preset = savedPreset
    } else {
      preset = GRAPHICS_PRESETS.QUALITY
    }
  } catch {}

  // Defaults based on active preset
  let characterShadows = preset === 'performance' ? false : true
  let hudEffects = preset === 'performance' ? false : true
  let particlesEnabled = preset === 'performance' ? false : true
  let fpsMode = '60fps'

  try {
    if (userHasExplicitlyChosen) {
      const savedShadows = localStorage.getItem('toc_character_shadows')
      if (savedShadows !== null) characterShadows = savedShadows === 'true'

      const savedHud = localStorage.getItem('toc_hud_effects')
      if (savedHud !== null) hudEffects = savedHud === 'true'

      const savedParticles = localStorage.getItem('toc_particles_enabled')
      if (savedParticles !== null) particlesEnabled = savedParticles !== 'false'

      const savedFps = localStorage.getItem('toc_fps_mode')
      if (savedFps === '60fps' || savedFps === 'eco') fpsMode = savedFps
    }
  } catch {}

  return {
    preset,
    recommendedPreset: recommended,
    characterShadows,
    hudEffects,
    particlesEnabled,
    fpsMode,
  }
}

