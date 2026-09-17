import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { us } from './locales/us'
import { es } from './locales/es'
import { br } from './locales/br'
import { kr } from './locales/kr'
import { cn } from './locales/cn'

export const LOCALES = {
  us,
  es,
  br,
  kr,
  cn,
}

export const SUPPORTED_LANGUAGES = [
  { code: 'us', name: 'English', flag: '🇺🇸', region: 'US' },
  { code: 'es', name: 'Español', flag: '🇪🇸', region: 'ES' },
  { code: 'br', name: 'Português', flag: '🇧🇷', region: 'BR' },
  { code: 'kr', name: '한국어', flag: '🇰🇷', region: 'KR' },
  { code: 'cn', name: '简体中文', flag: '🇨🇳', region: 'CN' },
]

export const DEFAULT_LANGUAGE = 'us'

/**
 * Normalizes URL path or code to supported language code
 */
export function normalizeLanguageCode(raw) {
  if (!raw) return null
  const clean = String(raw).toLowerCase().replace(/[^a-z]/g, '')
  if (clean === 'us' || clean === 'en') return 'us'
  if (clean === 'es') return 'es'
  if (clean === 'br' || clean === 'pt') return 'br'
  if (clean === 'kr' || clean === 'ko') return 'kr'
  if (clean === 'cn' || clean === 'zh') return 'cn'
  return null
}

/**
 * Extracts language code from the current URL pathname
 * e.g. "/us" -> "us", "/es" -> "es", "/kr" -> "kr"
 */
export function getLanguageFromPathname() {
  if (typeof window === 'undefined') return null
  const segments = window.location.pathname.split('/').filter(Boolean)
  if (segments.length > 0) {
    const matched = normalizeLanguageCode(segments[0])
    if (matched) return matched
  }
  return null
}

/**
 * Resolves initial language on startup:
 * 1. Explicit URL pathname e.g. "/es", "/us"
 * 2. Saved preference in localStorage
 * 3. Default fallback to "us" (English)
 */
export function resolveInitialLanguage() {
  const fromUrl = getLanguageFromPathname()
  if (fromUrl) return fromUrl

  if (typeof window !== 'undefined') {
    try {
      const saved = normalizeLanguageCode(localStorage.getItem('toc_game_lang'))
      if (saved) return saved
    } catch {
      // Ignore storage errors
    }
  }

  return DEFAULT_LANGUAGE
}

const LanguageContext = createContext({
  currentLang: DEFAULT_LANGUAGE,
  t: (key, vars) => key,
  changeLanguage: () => {},
  languages: SUPPORTED_LANGUAGES,
  activeLocale: us,
})

// Deduplicate DEV warnings to prevent flooding the console on rapid re-renders
const warnedMissingKeys = new Set()

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    const initial = resolveInitialLanguage()
    // Align URL immediately on mount
    if (typeof window !== 'undefined') {
      const currentInUrl = getLanguageFromPathname()
      if (!currentInUrl || currentInUrl !== initial) {
        window.history.replaceState(null, '', `/${initial}${window.location.search}${window.location.hash}`)
      }
      document.documentElement.lang = initial === 'us' ? 'en' : initial
    }
    return initial
  })

  // Synchronize on browser history navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const fromUrl = getLanguageFromPathname()
      if (fromUrl && fromUrl !== currentLang) {
        setCurrentLang(fromUrl)
        document.documentElement.lang = fromUrl === 'us' ? 'en' : fromUrl
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentLang])

  const changeLanguage = useCallback((newLang) => {
    const normalized = normalizeLanguageCode(newLang) || DEFAULT_LANGUAGE
    setCurrentLang(normalized)

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('toc_game_lang', normalized)
      } catch {
        // Storage failover
      }

      // Update URL without reloading page
      const currentPathLang = getLanguageFromPathname()
      if (currentPathLang !== normalized) {
        window.history.pushState(null, '', `/${normalized}`)
      }

      document.documentElement.lang = normalized === 'us' ? 'en' : normalized
    }
  }, [])

  const activeLocale = useMemo(() => {
    return LOCALES[currentLang] || LOCALES[DEFAULT_LANGUAGE]
  }, [currentLang])

  /**
   * Main translation accessor with dot-notation and variable interpolation
   * e.g. t('buildings.slots.castle.name')
   * e.g. t('common.levelShort') + ' ' + t('buildings.levelLabel', { level: 5 })
   */
  const t = useCallback(
    (keyPath, variables = {}, fallback = '') => {
      if (!keyPath || typeof keyPath !== 'string') return ''

      // Allow calling t(key, 'Default fallback text')
      let vars = variables
      let explicitFallback = fallback
      if (typeof variables === 'string') {
        explicitFallback = variables
        vars = {}
      }

      const keys = keyPath.split('.')
      let value = activeLocale
      let fallbackValue = LOCALES[DEFAULT_LANGUAGE]

      // Traverse active locale
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          value = undefined
          break
        }
      }

      // Fallback to English if key is missing in active locale
      if (value === undefined) {
        for (const k of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && k in fallbackValue) {
            fallbackValue = fallbackValue[k]
          } else {
            fallbackValue = undefined
            break
          }
        }
        value = fallbackValue
      }

      // If missing in both active locale and English fallback locale:
      if (value === undefined) {
        if (explicitFallback) {
          return explicitFallback
        } else {
          if (import.meta.env?.DEV && !warnedMissingKeys.has(keyPath)) {
            warnedMissingKeys.add(keyPath)
            console.warn(`[i18n] Missing translation key: "${keyPath}"`)
          }
          return ''
        }
      }

      // Safety shield: Never return an object to React JSX as children
      if (typeof value !== 'string') {
        if (typeof value === 'number') {
          value = String(value)
        } else {
          if (explicitFallback) {
            return explicitFallback
          }
          if (import.meta.env?.DEV && !warnedMissingKeys.has(keyPath)) {
            warnedMissingKeys.add(keyPath)
            console.warn(`[i18n] Translation key is not a string (found ${typeof value}): "${keyPath}"`)
          }
          return ''
        }
      }

      // Variable interpolation {varName}
      let result = value
      if (vars && typeof vars === 'object') {
        for (const [varKey, varVal] of Object.entries(vars)) {
          const regex = new RegExp(`\\{${varKey}\\}`, 'g')
          result = result.replace(regex, String(varVal))
        }
      }

      return result
    },
    [activeLocale]
  )

  const contextValue = useMemo(
    () => ({
      currentLang,
      t,
      changeLanguage,
      languages: SUPPORTED_LANGUAGES,
      activeLocale,
    }),
    [currentLang, t, changeLanguage, activeLocale]
  )

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  return useContext(LanguageContext)
}
