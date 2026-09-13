// Script to compare US (source of truth) locale keys vs other locales
import { us } from '../src/i18n/locales/us.js'
import { es } from '../src/i18n/locales/es.js'
import { br } from '../src/i18n/locales/br.js'
import { kr } from '../src/i18n/locales/kr.js'
import { cn } from '../src/i18n/locales/cn.js'

function flattenKeys(obj, prefix = '') {
  let keys = []
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys = keys.concat(flattenKeys(val, path))
    } else {
      keys.push(path)
    }
  }
  return keys
}

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

const usKeys = flattenKeys(us)
console.log(`Total US (English) keys: ${usKeys.length}\n`)

const locales = { es, br, kr, cn }

for (const [code, locale] of Object.entries(locales)) {
  const missing = usKeys.filter(k => getNestedValue(locale, k) === undefined)
  const localeKeys = flattenKeys(locale)
  const extra = localeKeys.filter(k => getNestedValue(us, k) === undefined)
  
  console.log(`=== ${code.toUpperCase()} ===`)
  console.log(`  Total keys: ${localeKeys.length}`)
  console.log(`  Missing keys (${missing.length}):`)
  for (const k of missing) {
    console.log(`    - ${k}`)
  }
  if (extra.length > 0) {
    console.log(`  Extra keys not in US (${extra.length}):`)
    for (const k of extra) {
      console.log(`    + ${k}`)
    }
  }
  console.log()
}
