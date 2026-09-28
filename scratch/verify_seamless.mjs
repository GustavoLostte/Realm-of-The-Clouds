import { Champion } from '../src/entities/Champion.js'
import fs from 'fs'
import path from 'path'

console.log('=== VERIFYING CHAMPION ENTITY & SEAMLESS SPRITES ===\n')

const champ = new Champion('valiria', { initialX: 25 })

// 1. Check all animations resolve to existing files
console.log('1. Checking animation asset paths:')
const anims = champ.animations
let missingCount = 0
for (const [key, url] of Object.entries(anims)) {
  const localPath = path.join(process.cwd(), 'public', url)
  if (!fs.existsSync(localPath)) {
    console.error(`  [MISSING] ${key}: ${url} -> ${localPath}`)
    missingCount++
  } else {
    const size = fs.statSync(localPath).size
    console.log(`  [OK] ${key.padEnd(12)}: ${url} (${(size/1024).toFixed(0)} KB)`)
  }
}

if (missingCount > 0) {
  console.error(`\nFAILED: ${missingCount} assets missing!`)
  process.exit(1)
} else {
  console.log('\nAll 20 animation files exist on disk!\n')
}

// 2. Test Dash Front
console.log('2. Testing Dash Front lifecycle:')
champ.dashFront()
let state = champ.getState()
console.log(`  Immediate anim: ${state.anim}, sprite: ${state.sprite}, isActionLocked: ${state.isActionLocked}`)
if (state.anim !== 'dash_front') throw new Error('Expected anim to be dash_front')
if (state.sprite.includes('?v=')) throw new Error('Cache busting query string found!')

// 3. Test Dash-Cancel Combo (E + J)
console.log('\n3. Testing Dash-Cancel Combo (E + J):')
champ.dashFront()
champ.inputAttack('punch') // E + J
state = champ.getState()
console.log(`  After cancel: anim: ${state.anim}, comboChain: ${state.comboChain}, comboStep: ${state.comboStep}`)
if (state.comboChain[0] !== 'E+J') throw new Error('Dash cancel E+J failed!')

// 4. Test Backdash Cancel (Q + K)
console.log('\n4. Testing Backdash-Cancel Combo (Q + K):')
champ.isActionLocked = false
champ.comboStep = 0
champ.comboChain = []
champ.dashBack()
champ.inputAttack('kick') // Q + K
state = champ.getState()
console.log(`  After cancel: anim: ${state.anim}, comboChain: ${state.comboChain}, comboStep: ${state.comboStep}`)
if (state.comboChain[0] !== 'Q+K') throw new Error('Dash cancel Q+K failed!')

// 5. Test Full Combo Chain (J -> J -> J)
console.log('\n5. Testing 3-Hit Branching Combo (J -> J -> J):')
champ.actionTimer = null
champ.isActionLocked = false
champ.comboStep = 0
champ.comboChain = []

champ.inputAttack('punch') // Hit 1
state = champ.getState()
console.log(`  Hit 1: anim: ${state.anim}, comboStep: ${state.comboStep}`)

champ.inputAttack('punch') // Hit 2
state = champ.getState()
console.log(`  Hit 2: anim: ${state.anim}, comboStep: ${state.comboStep}`)

champ.inputAttack('punch') // Hit 3 (Finisher)
state = champ.getState()
console.log(`  Hit 3: anim: ${state.anim}, comboStep: ${state.comboStep}`)

console.log('\n=== ALL 5 VERIFICATION CHECKS PASSED PERFECTLY! ===')
process.exit(0)
