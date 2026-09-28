/**
 * server/src/engine/authoritativeEngine.js
 * Realm of Kingdoms — Authoritative Server Engine
 * WizzarDev Studios
 */

export const ENEMY_BALANCE_TABLE = {
  slime_green: {
    name: 'Slime Verde',
    baseExp: 25,
    goldMin: 12,
    goldMax: 28,
    maxHp: 80,
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
    maxHp: 120,
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
    maxHp: 1200,
    dropTable: [
      { id: 'potion_hp_full', type: 'potion_hp', name: 'Elixir de Vida Real', chance: 1.0, count: 2 },
      { id: 'potion_mp_full', type: 'potion_mp', name: 'Elixir de Maná Real', chance: 1.0, count: 2 },
      { id: 'mat_royal_crown_shard', type: 'material', name: 'Fragmento de Corona Real', chance: 0.85, count: 1 },
    ],
  },
}

export class AuthoritativeEngine {
  /**
   * Authoritative EXP curve: calculates exp needed to advance from level to level + 1
   */
  calculateExpNeededForLevel(level) {
    const lvl = Math.max(1, Number(level) || 1)
    return Math.round(50 + Math.pow(lvl, 1.65) * 12)
  }

  /**
   * Validate and resolve enemy kill
   */
  resolveEnemyKill({ enemyType = 'slime_green', currentLevel = 1, currentExp = 0 }) {
    const config = ENEMY_BALANCE_TABLE[enemyType] || ENEMY_BALANCE_TABLE.slime_green

    const expGained = config.baseExp
    const goldGained = Math.floor(Math.random() * (config.goldMax - config.goldMin + 1)) + config.goldMin

    const lootDrops = []
    for (const item of config.dropTable) {
      if (Math.random() <= item.chance) {
        lootDrops.push({
          id: item.id,
          type: item.type,
          name: item.name,
          count: item.count || 1,
          rarity: item.chance <= 0.1 ? 'rare' : 'common',
        })
      }
    }

    let lvl = Math.max(1, Number(currentLevel) || 1)
    let exp = Math.max(0, Number(currentExp) || 0) + expGained
    let expNeeded = this.calculateExpNeededForLevel(lvl)
    let leveledUp = false
    let levelsGained = 0

    while (exp >= expNeeded) {
      exp -= expNeeded
      lvl += 1
      levelsGained += 1
      leveledUp = true
      expNeeded = this.calculateExpNeededForLevel(lvl)
    }

    return {
      enemyType,
      expGained,
      goldGained,
      lootDrops,
      progression: {
        level: lvl,
        exp,
        expNeeded,
      },
      leveledUp,
      levelsGained,
    }
  }

  /**
   * Validate player combat damage output against impossible values (anti-cheat)
   */
  validateDamage({ playerLevel = 1, reportedDamage = 0 }) {
    // Max theoretical damage at level N: base (50) + level * 25 + crit bonus (2.5x)
    const maxPermitted = (50 + playerLevel * 25) * 2.5
    if (reportedDamage > maxPermitted * 1.5) {
      return { valid: false, reason: 'DAMAGE_EXCEEDS_AUTHORITATIVE_CAP' }
    }
    return { valid: true }
  }
}

export const authoritativeEngine = new AuthoritativeEngine()
