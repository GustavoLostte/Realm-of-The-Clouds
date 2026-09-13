// Find all static translation keys used in code that are missing from locale files
import { us } from '../src/i18n/locales/us.js'
import { es } from '../src/i18n/locales/es.js'
import { execSync } from 'child_process'

function getNestedValue(obj, keyPath) {
  const keys = keyPath.split('.')
  let val = obj
  for (const k of keys) {
    if (val && typeof val === 'object' && k in val) {
      val = val[k]
    } else {
      return undefined
    }
  }
  return val
}

// Extract all static t('key') calls from source
const grepResult = execSync(
  `grep -roh "t('[^']*')" src/App.jsx src/components/*.jsx 2>/dev/null`,
  { cwd: '/Users/wizzard/Desktop/TOC FOE', encoding: 'utf-8' }
)

const usedKeys = [...new Set(
  grepResult.split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(m => m.replace(/^t\('/, '').replace(/'\)$/, ''))
    .filter(k => !k.includes('${') && !k.includes('+') && k.includes('.')) // Skip template literals and non-paths
)]

console.log(`Total unique static keys used in code: ${usedKeys.length}`)

const missingUS = usedKeys.filter(k => getNestedValue(us, k) === undefined)
const missingES = usedKeys.filter(k => getNestedValue(es, k) === undefined)

console.log(`\nMissing from US (${missingUS.length}):`)
missingUS.forEach(k => console.log(`  - ${k}`))

console.log(`\nMissing from ES (${missingES.length}):`)
missingES.forEach(k => console.log(`  - ${k}`))
