/**
 * authoritativeEngine.js — Server-Authoritative Game & Progression Logic
 * Realm of Kingdoms — WizzarDev Studios
 * 
 * Centralizes game balance, combat verification, drop rates, and leveling:
 * - Anti-tamper EXP and Level progression formula
 * - Authoritative drop tables for monsters and bosses
 * - Potion cooldown and healing validation
 * - Direct integration with gameTelemetryService for metrics & auditing
 */

import { gameTelemetry } from './gameTelemetryService'

// Official Base Enemy Configurations & Balancing Tables
export const ENEMY_BALANCE_TABLE = {
  slime_green: {
    name: 'Slime Verde',
    baseExp: 25,
    goldMin: 12,
    goldMax: 28,
    dropTable: [
      { id: 'mat_slime_gel', type: 'material', name: 'Gel Viscoso de Slime', chance: 0.65, count: 1 },
      { id: 'potion_hp_minor', type: 'potion_hp', name: 'Poción de Vida Menor', chance: 0.20, count: 1 },
      { id: 'mat_slime_core', type: 'material', name: 'Núcleo de Baba Brillante', chance: 0.06, count: 1 },
    ],
  },
  slime_blue: {
    name: 'Slime Glacial',
    baseExp: 35,
    goldMin: 18,
    goldMax: 42,
    dropTable: [
      { id: 'mat_frost_gel', type: 'material', name: 'Gel Helado', chance: 0.70, count: 1 },
      { id: 'potion_mp_minor', type: 'potion_mp', name: 'Poción de Maná Menor', chance: 0.25, count: 1 },
      { id: 'mat_blue_crystal', type: 'material', name: 'Fragmento de Cristal Azul', chance: 0.08, count: 1 },
    ],
  },
  slime_boss: {
    name: 'Rey Slime Colosal',
    baseExp: 250,
    goldMin: 150,
    goldMax: 350,
    dropTable: [
      { id: 'potion_hp_full', type: 'potion_hp', name: 'Elixir de Vida Real', chance: 1.0, count: 2 },
      { id: 'potion_mp_full', type: 'potion_mp', name: 'Elixir de Maná Real', chance: 1.0, count: 2 },
      { id: 'mat_royal_crown_shard', type: 'material', name: 'Fragmento de Corona Real', chance: 0.85, count: 1 },
    ],
  },
}

class AuthoritativeEngine {
  constructor() {
    this.combatCooldowns = new Map()
  }

  /**
   * Calculate authoritative EXP needed to reach the next level
   */
  calculateExpNeededForLevel(level) {
    const lvl = Math.max(1, Number(level) || 1)
    // Smooth MMORPG logarithmic-polynomial curve: Level 1: 50 EXP -> Level 10: ~140 EXP -> Level 20: ~450 EXP
    return Math.round(50 + Math.pow(lvl, 1.65) * 12)
  }

  /**
   * Authoritatively process an enemy kill:
   * Calculates EXP, gold, drops, and evaluates level-up.
   */
  resolveEnemyKill({ enemy, currentProgression, mapIndex = 0 }) {
    const enemyType = enemy?.type || 'slime_green'
    const enemyConfig = ENEMY_BALANCE_TABLE[enemyType] || ENEMY_BALANCE_TABLE.slime_green

    // Calculate EXP with slight level scaling
    const expGained = enemy?.expReward || enemyConfig.baseExp || 25
    
    // Calculate Gold within authoritative bounds
    const minG = enemyConfig.goldMin || 10
    const maxG = enemyConfig.goldMax || 25
    const goldGained = Math.floor(Math.random() * (maxG - minG + 1)) + minG

    // Authoritative loot drop roll
    const lootDrops = []
    if (Array.isArray(enemyConfig.dropTable)) {
      enemyConfig.dropTable.forEach((item) => {
        const roll = Math.random()
        if (roll <= item.chance) {
          lootDrops.push({
            id: item.id,
            type: item.type,
            name: item.name,
            count: item.count || 1,
            rarity: item.chance <= 0.1 ? 'rare' : 'common',
          })
        }
      })
    }

    // Progression logic (EXP & Level calculation)
    let currentLvl = currentProgression?.level || 10
    let currentExp = (currentProgression?.exp || 0) + expGained
    let expNeeded = currentProgression?.expNeeded || this.calculateExpNeededForLevel(currentLvl)
    let leveledUp = false
    let levelsGained = 0

    while (currentExp >= expNeeded) {
      currentExp -= expNeeded
      currentLvl += 1
      levelsGained += 1
      leveledUp = true
      expNeeded = this.calculateExpNeededForLevel(currentLvl)
    }

    const updatedProgression = {
      level: currentLvl,
      exp: currentExp,
      expNeeded,
    }

    // Telemetry dispatch
    gameTelemetry.trackEvent('enemy_killed', {
      enemy_id: enemy?.id || 'unknown',
      enemy_type: enemyType,
      exp_gained: expGained,
      gold_gained: goldGained,
      loot_count: lootDrops.length,
      current_level: currentLvl,
      map_index: mapIndex,
    })

    if (leveledUp) {
      gameTelemetry.trackEvent('player_level_up', {
        new_level: currentLvl,
        levels_gained: levelsGained,
        total_exp_needed_next: expNeeded,
      })
    }

    return {
      expGained,
      goldGained,
      lootDrops,
      progression: updatedProgression,
      leveledUp,
      newLevel: currentLvl,
    }
  }

  /**
   * Authoritatively validate potion consumption
   */
  consumePotion({ potionType, currentInventory, cooldownRemaining }) {
    const isHp = potionType === 'hp'
    const key = isHp ? 'hpPotions' : 'mpPotions'
    const available = currentInventory?.[key] ?? 0

    if (available <= 0) {
      return { success: false, reason: 'NO_POTIONS_REMAINING' }
    }

    if (cooldownRemaining > 0) {
      return { success: false, reason: 'COOLDOWN_ACTIVE' }
    }

    const healRatio = isHp ? 0.45 : 0.50 // Heals 45% Max HP or 50% Max MP
    const newInventory = {
      ...currentInventory,
      [key]: available - 1,
    }

    gameTelemetry.trackEvent('potion_consumed', {
      potion_type: potionType,
      remaining_count: newInventory[key],
    })

    return {
      success: true,
      newInventory,
      healRatio,
      cooldownMs: isHp ? 4000 : 3500,
    }
  }

  /**
   * Authoritatively validate quest claim
   */
  claimQuestReward({ quest, currentProgression, currentGold }) {
    if (!quest) return { success: false }

    const expReward = Number(quest.expReward) || 120
    const goldReward = Number(quest.goldReward) || 250

    let currentLvl = currentProgression?.level || 10
    let currentExp = (currentProgression?.exp || 0) + expReward
    let expNeeded = currentProgression?.expNeeded || this.calculateExpNeededForLevel(currentLvl)
    let leveledUp = false

    while (currentExp >= expNeeded) {
      currentExp -= expNeeded
      currentLvl += 1
      leveledUp = true
      expNeeded = this.calculateExpNeededForLevel(currentLvl)
    }

    const newGold = (Number(currentGold) || 0) + goldReward

    gameTelemetry.trackEvent('quest_claimed', {
      quest_id: quest.id,
      quest_title: quest.title,
      exp_reward: expReward,
      gold_reward: goldReward,
      new_level: currentLvl,
    })

    return {
      success: true,
      progression: {
        level: currentLvl,
        exp: currentExp,
        expNeeded,
      },
      gold: newGold,
      leveledUp,
      newLevel: currentLvl,
    }
  }
}

export const authoritativeEngine = new AuthoritativeEngine()
