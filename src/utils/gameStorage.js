import { BUILDING_TYPES } from '../data/buildingsData.js'
import { 
  saveKingdomToCloud, 
  scheduleCloudSave, 
  loadKingdomFromCloud, 
  loadKingdomByEmail,
  checkSupabaseConnection,
  getPlayerEmail,
  setPlayerEmail,
  getPlayerId,
  setActivePlayer,
  setActiveGuestPlayer,
  clearActivePlayer,
  flushCloudSave,
  supabase
} from './supabaseClient.js'

const LEGACY_STORAGE_KEY = 'toc_foe_kingdom_save_v1'
const GUEST_STORAGE_KEY = 'toc_foe_save_guest_v2'
const KNOWN_ACCOUNTS_KEY = 'toc_known_accounts_v2'

function getStorageKeyForEmail(email) {
  if (email && email.trim()) {
    return `toc_foe_save_email_${email.trim().toLowerCase()}`
  }
  return GUEST_STORAGE_KEY
}

/**
 * Detects whether a save object contains actual, meaningful player progress.
 * If true, this save represents an established kingdom and must NEVER be wiped,
 * auto-reset, or forced through a new-player tutorial.
 */
export function hasMeaningfulProgress(save) {
  if (!save || typeof save !== 'object') return false
  const slots = save.slots || []
  const occupiedCount = slots.filter((s) => s && s.buildingId).length
  const hasMultipleBuildings = occupiedCount > 1
  const hasUpgradedCastle = slots.some(
    (s) => s && s.id === 'slot-1' && s.buildingId && (s.level > 1 || s.buildingId !== 'ayuntamiento')
  )
  const hasOtherBuildings = slots.some((s) => s && s.id !== 'slot-1' && s.buildingId)
  const hasLevel = (save.kingdomLevel || 1) > 1
  const hasXp = (save.kingdomXp || 0) > 0
  const hasNodes = (save.completedNodes || []).length > 0
  const hasQuests = (save.claimedQuestIds || []).length > 0
  const hasTroops =
    save.troops &&
    ((save.troops.archers || 0) > 0 ||
      (save.troops.mages || 0) > 0 ||
      (save.troops.commander || 0) > 0 ||
      (save.troops.infantry || 0) > 1)
  const hasTutorialSeen = Boolean(save.tutorialSeen)

  return (
    hasMultipleBuildings ||
    hasUpgradedCastle ||
    hasOtherBuildings ||
    hasLevel ||
    hasXp ||
    hasNodes ||
    hasQuests ||
    hasTroops ||
    hasTutorialSeen
  )
}

export const gameStorage = {
  /**
   * Save kingdom state strictly scoped to the active email or guest
   */
  save(state, immediateCloud = false) {
    if (typeof window === 'undefined' || !state) return
    try {
      const activeEmail = getPlayerEmail()
      const storageKey = getStorageKeyForEmail(activeEmail)

      const resolvedName = 
        state.profile?.name || 
        (activeEmail && localStorage.getItem(`toc_player_name_${activeEmail}`)) ||
        localStorage.getItem('toc_player_name') || 
        'Comandante'

      const resolvedAvatar = 
        state.profile?.avatar || 
        (activeEmail && localStorage.getItem(`toc_player_avatar_${activeEmail}`)) ||
        localStorage.getItem('toc_player_avatar') || 
        '/assets/avatars/avatar_king.webp'

      const payload = {
        resources: state.resources,
        slots: state.slots,
        troops: state.troops,
        kingdomLevel: state.kingdomLevel || 1,
        kingdomXp: state.kingdomXp || 0,
        completedNodes: state.completedNodes || [],
        unlockedBiomes: state.unlockedBiomes || ['biome-1'],
        activeChapter: state.activeChapter || 1,
        claimedQuestIds: state.claimedQuestIds || [],
        claimedDailyIds: state.claimedDailyIds || [],
        claimedEpicIds: state.claimedEpicIds || [],
        lastDailyReset: state.lastDailyReset || Date.now(),
        unlockedTechIds: state.unlockedTechIds || [],
        ownedRelicIds: state.ownedRelicIds || [],
        equippedRelics: state.equippedRelics || { head: null, weapon: null, accessory: null },
        consumables: state.consumables || { potion_heal: 1, potion_focus: 1, bomb_dwarf: 0 },
        speedups: state.speedups || { speedup_1m: 4, speedup_5m: 2, speedup_15m: 1, speedup_60m: 0 },
        vipStatus: state.vipStatus || {},
        lastWheelFreeSpinTime: state.lastWheelFreeSpinTime || 0,
        arenaData: state.arenaData || { trophies: 400, leagueId: 'league_bronze' },
        totalHarvests: state.totalHarvests || 0,
        tutorialSeen: state.tutorialSeen,
        trainingQueue: state.trainingQueue || [],
        profile: {
          name: resolvedName,
          avatar: resolvedAvatar,
          email: activeEmail || null,
        },
        lastSavedTime: Date.now(),
      }

      // 1. Save to account-isolated localStorage key
      localStorage.setItem(storageKey, JSON.stringify(payload))

      // 2. Remember account profile if email is present
      if (activeEmail) {
        localStorage.setItem(`toc_player_name_${activeEmail}`, resolvedName)
        localStorage.setItem(`toc_player_avatar_${activeEmail}`, resolvedAvatar)
        this.recordAccount({
          email: activeEmail,
          name: resolvedName,
          level: payload.kingdomLevel,
          avatar: resolvedAvatar,
          lastPlayed: Date.now(),
        })
      }

      // 3. Trigger Supabase Cloud Sync (Immediate or Guaranteed Throttled)
      if (immediateCloud) {
        saveKingdomToCloud(payload)
      } else {
        scheduleCloudSave(payload)
      }
    } catch (e) {
      console.warn('Error saving game state to isolated storage:', e)
    }
  },

  async saveCloud(state) {
    return await saveKingdomToCloud(state)
  },

  async flushCloud() {
    return await flushCloudSave()
  },

  async loadCloud() {
    return await loadKingdomFromCloud()
  },

  async loadByEmail(email) {
    return await loadKingdomByEmail(email)
  },

  getEmail() {
    return getPlayerEmail()
  },

  setEmail(email) {
    setPlayerEmail(email)
  },

  getPlayerId() {
    return getPlayerId()
  },

  setActive(email, id = null) {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('toc_session_disconnected') } catch {}
    }
    if (email) {
      setActivePlayer(email, id)
    } else {
      setActiveGuestPlayer()
    }
  },

  purgeSession() {
    clearActivePlayer()
  },

  /**
   * Returns the currently remembered account if the user has not explicitly disconnected
   */
  getRememberedAccount() {
    if (typeof window === 'undefined') return null
    try {
      if (localStorage.getItem('toc_session_disconnected') === 'true') {
        return null
      }
      const activeEmail = this.getEmail()
      const accounts = this.getKnownAccounts()
      if (activeEmail) {
        const found = accounts.find(a => a.email.toLowerCase() === activeEmail.toLowerCase())
        if (found) return found
        const sName = localStorage.getItem(`toc_player_name_${activeEmail}`) || localStorage.getItem('toc_player_name') || activeEmail.split('@')[0]
        const sAvatar = localStorage.getItem(`toc_player_avatar_${activeEmail}`) || '/assets/avatars/avatar_king.webp'
        const sSave = this.load(activeEmail)
        return {
          email: activeEmail,
          name: sName,
          avatar: sAvatar,
          level: sSave?.kingdomLevel || 1,
          lastPlayed: Date.now()
        }
      }
      if (accounts.length > 0) {
        return accounts[0]
      }
      return null
    } catch (e) {
      return null
    }
  },

  /**
   * Explicitly disconnects and logs out the active account
   */
  async disconnectAccount() {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('toc_session_disconnected', 'true') } catch {}
    }
    this.purgeSession()
    try {
      if (supabase && supabase.auth) {
        await supabase.auth.signOut()
      }
    } catch (e) {
      console.warn('Could not signOut Supabase on disconnect:', e)
    }
  },

  async checkCloud() {
    return await checkSupabaseConnection()
  },

  /**
   * Load local game state strictly for the given email (or active email/guest)
   */
  load(targetEmail = null) {
    if (typeof window === 'undefined') return null
    try {
      const emailToUse = targetEmail !== null ? targetEmail : getPlayerEmail()
      const storageKey = getStorageKeyForEmail(emailToUse)
      let data = localStorage.getItem(storageKey)

      // Fallback migration: if guest save is requested and v2 doesn't exist, check legacy key
      if (!data && !emailToUse) {
        const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY)
        if (legacyData) {
          localStorage.setItem(GUEST_STORAGE_KEY, legacyData)
          localStorage.removeItem(LEGACY_STORAGE_KEY)
          data = legacyData
        }
      }

      if (!data) return null
      const parsed = JSON.parse(data)
      if (parsed.trainingQueue && parsed.trainingQueue.length > 0) {
        const { updatedQueue, updatedTroops } = this.resolveOfflineTraining(parsed.trainingQueue, parsed.troops)
        parsed.trainingQueue = updatedQueue
        parsed.troops = updatedTroops
      }
      return parsed
    } catch (e) {
      console.warn('Error loading game state from isolated storage:', e)
      return null
    }
  },

  loadGuestSave() {
    if (typeof window === 'undefined') return null
    try {
      const data = localStorage.getItem(GUEST_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
      if (!data) return null
      return JSON.parse(data)
    } catch (e) {
      return null
    }
  },

  clear(email = null) {
    if (typeof window === 'undefined') return
    try {
      const emailToUse = email !== null ? email : getPlayerEmail()
      const storageKey = getStorageKeyForEmail(emailToUse)
      localStorage.removeItem(storageKey)
      if (!emailToUse) {
        localStorage.removeItem(GUEST_STORAGE_KEY)
        localStorage.removeItem(LEGACY_STORAGE_KEY)
      }
    } catch (e) {
      console.warn('Error clearing game storage:', e)
    }
  },

  /**
   * Returns remembered accounts that have played on this device
   */
  getKnownAccounts() {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(KNOWN_ACCOUNTS_KEY)
      if (!raw) return []
      const list = JSON.parse(raw)
      if (!Array.isArray(list)) return []
      return list.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
    } catch (e) {
      return []
    }
  },

  /**
   * Record or update account in the remembered accounts list
   */
  recordAccount(accountInfo) {
    if (typeof window === 'undefined' || !accountInfo?.email) return
    try {
      const cleanEmail = accountInfo.email.trim().toLowerCase()
      let accounts = this.getKnownAccounts()
      const existingIdx = accounts.findIndex(a => a.email.toLowerCase() === cleanEmail)

      const entry = {
        email: cleanEmail,
        name: accountInfo.name || 'Comandante',
        level: accountInfo.level || 1,
        avatar: accountInfo.avatar || '/assets/avatars/avatar_king.webp',
        lastPlayed: accountInfo.lastPlayed || Date.now(),
      }

      if (existingIdx >= 0) {
        accounts[existingIdx] = { ...accounts[existingIdx], ...entry }
      } else {
        accounts.unshift(entry)
      }

      // Keep at most 6 recent accounts
      accounts = accounts.slice(0, 6)
      localStorage.setItem(KNOWN_ACCOUNTS_KEY, JSON.stringify(accounts))
    } catch (e) {
      console.warn('Could not record known account:', e)
    }
  },

  /**
   * Remove an account from remembered accounts on this device
   */
  removeKnownAccount(email) {
    if (typeof window === 'undefined' || !email) return
    try {
      const cleanEmail = email.trim().toLowerCase()
      const accounts = this.getKnownAccounts().filter(a => a.email.toLowerCase() !== cleanEmail)
      localStorage.setItem(KNOWN_ACCOUNTS_KEY, JSON.stringify(accounts))
      // Clean isolated local save
      localStorage.removeItem(`toc_foe_save_email_${cleanEmail}`)
      localStorage.removeItem(`toc_player_name_${cleanEmail}`)
      localStorage.removeItem(`toc_player_avatar_${cleanEmail}`)
    } catch (e) {
      console.warn('Could not remove known account:', e)
    }
  },

  /**
   * Resolves constructing slots that have completed while player was offline or away
   */
  resolveOfflineConstructions(slots) {
    if (!slots || !Array.isArray(slots)) return { updatedSlots: slots || [], completedBuildings: [] }
    const now = Date.now()
    const completedBuildings = []

    const updatedSlots = slots.map((slot) => {
      if (slot && slot.isConstructing) {
        const finalLevel = slot.targetLevel || slot.level || 1
        return {
          ...slot,
          isConstructing: false,
          progress: 100,
          level: finalLevel,
          targetLevel: undefined,
          constructionStartedAt: undefined,
          constructionDurationSec: undefined,
        }
      }
      return slot
    })

    return { updatedSlots, completedBuildings }
  },

  /**
   * Resolves training queue units that finished while offline or away
   */
  resolveOfflineTraining(queue, troops) {
    if (!queue || !Array.isArray(queue) || queue.length === 0) {
      return { updatedQueue: [], updatedTroops: troops || {}, completedTroops: {} }
    }
    const now = Date.now()
    let updatedTroops = { ...(troops || {}) }
    let completedTroops = {}
    let remainingQueue = [...queue]

    while (remainingQueue.length > 0) {
      const currentJob = remainingQueue[0]
      const duration = currentJob.durationPerUnit || 15
      const startedAt = currentJob.unitStartedAt || now
      const elapsed = Math.max(0, (now - startedAt) / 1000)

      if (elapsed < duration) {
        break
      }

      const unitsNeeded = currentJob.count - (currentJob.completedCount || 0)
      const unitsFinished = Math.min(unitsNeeded, Math.floor(elapsed / duration))

      if (unitsFinished > 0) {
        const uId = currentJob.unitId
        updatedTroops[uId] = (updatedTroops[uId] || 0) + unitsFinished
        completedTroops[uId] = (completedTroops[uId] || 0) + unitsFinished

        const newCompletedCount = (currentJob.completedCount || 0) + unitsFinished
        if (newCompletedCount >= currentJob.count) {
          const timeUsed = unitsFinished * duration * 1000
          remainingQueue.shift()
          if (remainingQueue.length > 0) {
            remainingQueue[0] = {
              ...remainingQueue[0],
              unitStartedAt: startedAt + timeUsed,
            }
          }
        } else {
          remainingQueue[0] = {
            ...currentJob,
            completedCount: newCompletedCount,
            unitStartedAt: startedAt + (unitsFinished * duration * 1000),
          }
          break
        }
      } else {
        break
      }
    }

    return { updatedQueue: remainingQueue, updatedTroops, completedTroops }
  },

  calculateOfflineEarnings(lastSavedTime, slots) {
    if (!lastSavedTime) return null
    const now = Date.now()
    const elapsedSec = Math.floor((now - lastSavedTime) / 1000)

    // Resolve any constructions completed offline
    const { updatedSlots, completedBuildings } = this.resolveOfflineConstructions(slots)

    // Only grant earnings if away for more than 45 seconds
    if (elapsedSec < 45 && completedBuildings.length === 0) return null

    // Cap offline earnings to a maximum of 8 hours (28,800 seconds)
    const effectiveSec = Math.min(Math.max(1, elapsedSec), 28800)

    let goldPerSec = 0
    let woodPerSec = 0
    let stonePerSec = 0
    let foodPerSec = 0
    let gemsPerSec = 0

    const slotList = updatedSlots || []
    slotList.forEach((slot) => {
      if (slot.buildingId) {
        const bDef = Object.values(BUILDING_TYPES).find((b) => b.id === slot.buildingId) || BUILDING_TYPES[slot.buildingId.toUpperCase()]
        const lvl = slot.level || 1
        const cycleSec = bDef?.productionCycleSec || 120
        if (bDef?.production?.gold) goldPerSec += (bDef.production.gold / cycleSec) * lvl
        if (bDef?.production?.wood) woodPerSec += (bDef.production.wood / cycleSec) * lvl
        if (bDef?.production?.stone) stonePerSec += (bDef.production.stone / cycleSec) * lvl
        if (bDef?.production?.food) foodPerSec += (bDef.production.food / cycleSec) * lvl
        if (bDef?.production?.gems) gemsPerSec += (bDef.production.gems / cycleSec) * lvl
      }
    })

    // Offline yield: 70% efficiency to encourage active play
    const efficiency = 0.70
    const earnedGold = Math.floor(goldPerSec * effectiveSec * efficiency)
    const earnedWood = Math.floor(woodPerSec * effectiveSec * efficiency)
    const earnedStone = Math.floor(stonePerSec * effectiveSec * efficiency)
    const earnedFood = Math.floor(foodPerSec * effectiveSec * efficiency)
    const earnedGems = Math.floor(gemsPerSec * effectiveSec * efficiency)

    return {
      elapsedSec,
      effectiveSec,
      gold: earnedGold,
      wood: earnedWood,
      stone: earnedStone,
      food: earnedFood,
      gems: earnedGems,
      completedBuildings,
      updatedSlots,
    }
  },
}
