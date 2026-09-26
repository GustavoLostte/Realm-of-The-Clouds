import { us } from '../src/i18n/locales/us.js'
import { es } from '../src/i18n/locales/es.js'
import { br } from '../src/i18n/locales/br.js'
import { kr } from '../src/i18n/locales/kr.js'
import { cn } from '../src/i18n/locales/cn.js'
import fs from 'fs'

const locales = { us, es, br, kr, cn }

function checkComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const matches = [...content.matchAll(/\bt\(['"]([a-zA-Z0-9_.]+)['"]/g)].map(m => m[1])
  const uniqueKeys = [...new Set(matches)]

  console.log(`Checking ${uniqueKeys.length} keys in ${filePath}:`)

  let hasError = false
  for (const key of uniqueKeys) {
    const parts = key.split('.')
    for (const [lang, loc] of Object.entries(locales)) {
      let val = loc
      for (const p of parts) {
        val = val?.[p]
      }
      if (!val) {
        console.error(`  ❌ Missing key "${key}" in ${lang.toUpperCase()}`)
        hasError = true
      }
    }
  }

  if (!hasError) {
    console.log(`  ✅ All ${uniqueKeys.length} keys exist in all 5 languages!\n`)
  } else {
    process.exit(1)
  }
}

checkComponent('src/components/MenuModal.jsx')
checkComponent('src/components/DungeonCampaignWindow.jsx')
checkComponent('src/components/ArenaBattleView.jsx')
